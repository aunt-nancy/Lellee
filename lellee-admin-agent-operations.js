(function(){
  'use strict';

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  async function request(endpoint, token, options = {}) {
    const res = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Admin operation failed');
    return body;
  }

  function capabilitiesByAgent(items) {
    const map = {};
    for (const item of items || []) {
      map[item.agent_key] ||= [];
      map[item.agent_key].push(item);
    }
    return map;
  }

  function render({ registry, capabilities, globalControls, recentActivity, alerts }) {
    const caps = capabilitiesByAgent(capabilities);
    const stop = (globalControls || []).find(x => x.control_key === 'emergency_stop')?.bool_value === true;

    return `
      <section class="agent-admin-shell">
        <div class="agent-admin-emergency ${stop ? 'active' : ''}">
          <div>
            <small>GLOBAL CONTROL</small>
            <h3>${stop ? 'Emergency stop is ACTIVE' : 'Emergency stop is off'}</h3>
            <p>${stop ? 'All Lellee agent requests should be denied by the server guard.' : 'Agents operate according to their individual permissions.'}</p>
          </div>
          <button data-admin-action="global-stop" data-enabled="${stop ? 'false' : 'true'}">
            ${stop ? 'Restore agent operations' : 'Stop all agents'}
          </button>
        </div>

        <div class="agent-admin-grid">
          ${(registry || []).map(agent => `
            <article class="agent-admin-card">
              <div class="agent-admin-card-head">
                <div>
                  <small>AGENT</small>
                  <h3>${esc(agent.display_name || agent.agent_key)}</h3>
                </div>
                <button
                  data-admin-action="agent-toggle"
                  data-agent="${esc(agent.agent_key)}"
                  data-enabled="${agent.is_enabled ? 'false' : 'true'}">
                  ${agent.is_enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
              <div class="agent-admin-status">${agent.is_enabled ? 'Enabled' : 'Disabled'}</div>
              <div class="agent-admin-cap-list">
                ${(caps[agent.agent_key] || []).map(cap => `
                  <div class="agent-admin-cap-row">
                    <span>${esc(cap.capability)}</span>
                    <button
                      data-admin-action="cap-toggle"
                      data-agent="${esc(agent.agent_key)}"
                      data-capability="${esc(cap.capability)}"
                      data-enabled="${cap.is_allowed ? 'false' : 'true'}">
                      ${cap.is_allowed ? 'Allowed' : 'Blocked'}
                    </button>
                  </div>
                `).join('')}
              </div>
            </article>
          `).join('')}
        </div>

        <section class="agent-admin-alerts">
          <span class="approved-kicker">SECURITY ALERTS</span>
          <h3>Abnormal agent activity</h3>
          ${(alerts || []).length ? (alerts || []).map(alert => `
            <div class="agent-admin-alert ${esc(alert.severity)}">
              <div>
                <b>${esc(alert.summary)}</b>
                <small>${esc(alert.alert_type)} · ${esc(alert.created_at)}</small>
              </div>
              <span>${esc(alert.status)}</span>
            </div>
          `).join('') : '<p>No current alerts.</p>'}
        </section>

        <section class="agent-admin-audit">
          <span class="approved-kicker">RECENT AGENT AUDIT</span>
          <h3>Latest allowed and denied requests</h3>
          ${(recentActivity || []).slice(0,50).map(row => `
            <div class="agent-admin-audit-row">
              <b>${esc(row.agent_key)}</b>
              <span>${esc(row.capability)}</span>
              <span class="${row.outcome === 'allowed' ? 'allowed' : 'denied'}">${esc(row.outcome)}</span>
              <time>${esc(new Date(row.created_at).toLocaleString())}</time>
            </div>
          `).join('')}
        </section>
      </section>
    `;
  }

  async function mount({ root, endpoint, token }) {
    if (!root || !endpoint || !token) return;

    const load = async () => {
      const data = await request(endpoint, token);
      root.innerHTML = render(data);
    };

    root.innerHTML = '<div class="agent-admin-loading">Loading agent operations…</div>';
    await load();

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-admin-action]');
      if (!button) return;

      const action = button.getAttribute('data-admin-action');
      button.disabled = true;

      try {
        if (action === 'global-stop') {
          await request(endpoint, token, {
            method: 'POST',
            body: {
              action: 'set_global_stop',
              enabled: button.getAttribute('data-enabled') === 'true'
            }
          });
        } else if (action === 'agent-toggle') {
          await request(endpoint, token, {
            method: 'POST',
            body: {
              action: 'set_agent_enabled',
              agentKey: button.getAttribute('data-agent'),
              enabled: button.getAttribute('data-enabled') === 'true'
            }
          });
        } else if (action === 'cap-toggle') {
          await request(endpoint, token, {
            method: 'POST',
            body: {
              action: 'set_capability',
              agentKey: button.getAttribute('data-agent'),
              capability: button.getAttribute('data-capability'),
              enabled: button.getAttribute('data-enabled') === 'true'
            }
          });
        }

        await load();
      } catch (error) {
        alert(error.message || 'Admin operation failed');
      } finally {
        button.disabled = false;
      }
    });
  }

  window.LelleeAdminAgentOperations = Object.freeze({ mount });
})();