(function(){
  'use strict';

  async function setCoachingAgentMessageShare({ endpoint, token, messageId, threadId, granted }) {
    if (!endpoint || !token) throw new Error('Missing endpoint or session token');
    if (!messageId && !threadId) throw new Error('Choose a message or thread to share');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messageId: messageId || null,
        threadId: threadId || null,
        granted: granted === true
      })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Sharing preference could not be updated');
    return body;
  }

  window.LelleeCoachingMessageConsent = Object.freeze({
    setShare: setCoachingAgentMessageShare,
    defaultShared: false,
    requiresUserGesture: true
  });
})();