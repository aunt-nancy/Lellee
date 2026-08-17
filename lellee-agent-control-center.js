(function(){
  'use strict';

  const AGENTS = {
    resources: {
      name: 'Resources Agent',
      icon: '◈',
      description: 'Finds community, recovery, employment, food, transportation, education and support resources.',
      data: 'General location and resource preferences only.'
    },
    housing: {
      name: 'Housing Agent',
      icon: '⌂',
      description: 'Helps search for housing using approved housing preferences.',
      data: 'City/state/ZIP, budget, household size, accessibility and pet needs.'
    },
    reminders: {
      name: 'Reminder Agent',
      icon: '◷',
      description: 'Manages reminders you have approved.',
      data: 'Your reminder and calendar metadata only.'
    },
    coaching: {
      name: 'Coaching Agent',
      icon: '◎',
      description: 'Supports coaching scheduling and information you explicitly share.',
      data: 'Shared goals, appointments, and only messages/threads you choose to share.'
    }
  };

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function consentMap(consents) {
    const map = {};
    for (const item of consents || []) {
      map[item.agent_key] ||= [];
      map[item.agent_key].push(item);
    }
    return map;
  }

  function buildAgentCard(agentKey, agent, consents) {
    const active = (consents || []).filter(x => x.is_granted && !x.revoked_at);
    const status = active.length ? 'Consent active' : 'No sensitive consent active';

    const caps = active.length
      ? active.map(x => `<li>${esc(x.capability)}</li>`).join('')
      : '<li>No consent-gated capabilities currently active.</li>';

    return `
      <article class="agent-control-card" data-agent-card="${esc(agentKey)}">
        <div class="agent-control-card-head">
          <div class="agent-control-icon">${esc(agent.icon)}</div>
          <div>
            <small>LELLEE AGENT</small>
            <h3>${esc(agent.name)}</h3>
          </div>
          <span class="agent-control-status ${active.length ? 'active' : ''}">${esc(status)}</span>
        </div>
        <p>${esc(agent.description)}</p>
        <div class="agent-control-data"><b>Can use:</b> ${esc(agent.data)}</div>
        <div class="agent-control-capabilities">
          <b>Your active consent</b>
          <ul>${caps}</ul>
        </div>
        ${active.length ? `<button class="agent-control-revoke" data-revoke-agent="${esc(agentKey)}">Revoke this agent's consent</button>` : ''}
      </article>
    `;
  }

  function buildActivity(activity) {
    if (!activity?.length) return '<p class="agent-control-empty">No recent agent activity.</p>';
    return `
      <div class="agent-activity-list">
        ${activity.map(item => `
          <div class="agent-activity-row">
            <div>
              <b>${esc(AGENTS[item.agent_key]?.name || item.agent_key)}</b>
              <small>${esc(item.capability)}</small>
            </div>
            <span class="${item.outcome === 'allowed' ? 'allowed' : 'denied'}">${esc(item.outcome)}</span>
            <time>${esc(new Date(item.created_at).toLocaleString())}</time>
          </div>
        `).join('')}
      </div>
    `;
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
    if (!res.ok) throw new Error(body.error || 'Agent controls could not be updated');
    return body;
  }

  async function mount({ root, endpoint, token }) {
    if (!root || !endpoint || !token) return;

    root.innerHTML = `
      <section class="agent-control-shell">
        <div class="agent-control-intro">
          <span class="approved-kicker">PRIVACY &amp; AGENTS</span>
          <h2>Control what Lellee agents can use.</h2>
          <p>Agents do not receive your private information by default. You can review and revoke consent here.</p>
        </div>
        <div class="agent-control-loading">Loading agent access…</div>
      </section>
    `;

    const data = await request(endpoint, token);
    const center = data.controlCenter || {};
    const byAgent = consentMap(center.consents || []);

    root.innerHTML = `
      <section class="agent-control-shell">
        <div class="agent-control-intro">
          <span class="approved-kicker">PRIVACY &amp; AGENTS</span>
          <h2>Control what Lellee agents can use.</h2>
          <p>Public Lellee agents are blocked from private data unless the specific access rules allow it. Consent-gated access can be revoked here.</p>
        </div>

        <div class="agent-control-grid">
          ${Object.entries(AGENTS).map(([key, agent]) => buildAgentCard(key, agent, byAgent[key])).join('')}
        </div>

        <section class="agent-control-activity">
          <span class="approved-kicker">RECENT AGENT ACTIVITY</span>
          <h3>Your recent agent access history</h3>
          ${buildActivity(center.recent_activity || [])}
        </section>

        <div class="agent-control-note">
          <b>Platform security</b>
          <p>These controls manage your personal consent. Lellee's platform-wide agent kill switches and security settings are managed separately by authorized administrators.</p>
        </div>
      </section>
    `;

    root.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-revoke-agent]');
      if (!button) return;

      const agentKey = button.getAttribute('data-revoke-agent');
      if (!agentKey) return;

      button.disabled = true;
      button.textContent = 'Revoking…';

      try {
        await request(endpoint, token, {
          method: 'POST',
          body: { action: 'revoke_agent', agentKey }
        });
        await mount({ root, endpoint, token });
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Revoke this agent\'s consent';
        alert(error.message || 'Could not revoke agent access');
      }
    }, { once: true });
  }

  window.LelleeAgentControlCenter = Object.freeze({
    mount,
    agents: AGENTS
  });
})();