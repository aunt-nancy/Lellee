(function(){
  'use strict';

  const POLICY_VERSION = '2026-08-16-r4';
  const AGENT_CAPABILITIES = Object.freeze({
    housing: Object.freeze(['housing.search','housing.save','housing.preferences']),
    resources: Object.freeze(['resources.search','resources.save','resources.preferences']),
    coaching: Object.freeze(['coaching.schedule','coaching.shared_messages','coaching.shared_goals']),
    reminders: Object.freeze(['reminders.read','reminders.create','reminders.update'])
  });

  function normalizeAgentId(value){
    return String(value || '').trim().toLowerCase();
  }

  function hasAgentCapability(agentId, capability){
    const key = normalizeAgentId(agentId);
    const allowed = AGENT_CAPABILITIES[key] || [];
    return allowed.includes(String(capability || ''));
  }

  function requireAgentCapability(agentId, capability){
    if(!hasAgentCapability(agentId, capability)){
      const err = new Error('Agent capability denied');
      err.code = 'LELLEE_AGENT_CAPABILITY_DENIED';
      err.agentId = normalizeAgentId(agentId);
      err.capability = capability;
      throw err;
    }
    return true;
  }

  function sanitizeAgentPayload(payload){
    if(!payload || typeof payload !== 'object') return payload;
    const blocked = [
      'journal_entries','journal','private_messages','clinical_notes',
      'substance_use_history','mental_health_history','payment_details',
      'government_ids','service_role','service_role_key'
    ];
    const copy = Array.isArray(payload) ? [] : {};
    for(const [key,val] of Object.entries(payload)){
      const lower = String(key).toLowerCase();
      if(blocked.some(b => lower.includes(b))) continue;
      copy[key] = (val && typeof val === 'object')
        ? sanitizeAgentPayload(val)
        : val;
    }
    return copy;
  }

  function buildAgentAuditEvent(agentId, capability, outcome, metadata){
    return {
      policy_version: POLICY_VERSION,
      agent_id: normalizeAgentId(agentId),
      capability: String(capability || ''),
      outcome: outcome === 'allowed' ? 'allowed' : 'denied',
      occurred_at: new Date().toISOString(),
      metadata: sanitizeAgentPayload(metadata || {})
    };
  }

  window.LelleeAgentSecurity = Object.freeze({
    policyVersion: POLICY_VERSION,
    capabilities: AGENT_CAPABILITIES,
    hasAgentCapability,
    requireAgentCapability,
    sanitizeAgentPayload,
    buildAgentAuditEvent
  });
})();