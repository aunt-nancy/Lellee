(function(){
  'use strict';

  const POLICY_VERSION = '2026-08-16-r1';
  const DENY = 'deny';
  const SENSITIVE_KEYS = new Set([
    'journal_text','journal_entries','journal','private_messages','private_message','message_body',
    'crisis_activity','safety_selections','diagnosis','diagnoses','medical_record','password',
    'password_hash','secret','service_role_key','access_token','refresh_token','payment_credentials',
    'full_card_number','cvv','support_contacts_private'
  ]);

  const NEVER_AUTONOMOUS = new Set([
    'publish_public_content','send_cold_outreach','change_billing','change_user_permissions',
    'make_clinical_diagnosis','make_crisis_decision','read_private_journal_without_explicit_user_share',
    'read_private_messages_without_explicit_scope'
  ]);

  function normalize(value){ return String(value || '').trim().toLowerCase(); }

  function redact(value){
    if(Array.isArray(value)) return value.map(redact);
    if(!value || typeof value !== 'object') return value;
    const output = {};
    Object.entries(value).forEach(([key,val]) => {
      if(SENSITIVE_KEYS.has(normalize(key))) output[key] = '[REDACTED_BY_LELLEE_AGENT_POLICY]';
      else output[key] = redact(val);
    });
    return output;
  }

  function hasCapability(agent, capability){
    if(!agent || agent.status !== 'active') return false;
    const grants = Array.isArray(agent.capabilities) ? agent.capabilities.map(normalize) : [];
    return grants.includes(normalize(capability));
  }

  function authorize({agent, capability, humanApproved=false, explicitUserShare=false} = {}){
    const cap = normalize(capability);
    if(!agent || !agent.id) return {allowed:false, reason:'missing_agent_identity', policyVersion:POLICY_VERSION};
    if(agent.status !== 'active') return {allowed:false, reason:'agent_not_active', policyVersion:POLICY_VERSION};
    if(!hasCapability(agent, cap)) return {allowed:false, reason:'capability_not_granted', policyVersion:POLICY_VERSION};
    if(NEVER_AUTONOMOUS.has(cap) && !humanApproved) return {allowed:false, reason:'human_review_required', policyVersion:POLICY_VERSION};
    if((cap === 'read_private_journal_without_explicit_user_share' || cap === 'read_private_messages_without_explicit_scope') && !explicitUserShare){
      return {allowed:false, reason:'explicit_user_share_required', policyVersion:POLICY_VERSION};
    }
    return {allowed:true, reason:'granted', policyVersion:POLICY_VERSION};
  }

  function audit(event){
    const safe = redact(Object.assign({ts:new Date().toISOString(), policyVersion:POLICY_VERSION}, event || {}));
    try {
      const existing = JSON.parse(sessionStorage.getItem('lellee_agent_audit_buffer') || '[]');
      existing.push(safe);
      sessionStorage.setItem('lellee_agent_audit_buffer', JSON.stringify(existing.slice(-100)));
    } catch(_) {}
    document.dispatchEvent(new CustomEvent('lellee:agent-audit', {detail:safe}));
    return safe;
  }

  window.LelleeAgentAccess = Object.freeze({
    policyVersion: POLICY_VERSION,
    defaultDecision: DENY,
    sensitiveKeys: Object.freeze(Array.from(SENSITIVE_KEYS)),
    authorize,
    redact,
    audit
  });

  // Mark the browser session as consumer UI, never as an internal service identity.
  // Real internal agents must be authenticated server-side and must never rely on this marker for authorization.
  window.__LELLEE_BROWSER_AGENT_CONTEXT__ = Object.freeze({trustedInternalAgent:false, policyVersion:POLICY_VERSION});
})();
