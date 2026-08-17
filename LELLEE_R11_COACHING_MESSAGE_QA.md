# Lellee R11 — Coaching Message Consent QA

## Default state
`coaching.shared_messages` MUST remain OFF until this QA passes.

## Required checks
- [ ] No coaching message is shared automatically.
- [ ] User must explicitly choose a message or thread to share.
- [ ] Sharing consent belongs only to the signed-in user.
- [ ] User A cannot create or modify User B's share records.
- [ ] User A cannot read User B's coaching messages.
- [ ] Revoking a share immediately blocks future agent reads.
- [ ] Unshared threads return 403.
- [ ] Shared thread responses contain only coaching message fields.
- [ ] Journals, clinical notes, payments, IDs, housing notes remain unavailable.
- [ ] Both grant and revoke actions are audited by the agent enforcement layer.
- [ ] Shared-message capability has its own kill switch.
- [ ] Browser/public files contain no service-role secret.

## Activation rule
Only after every check passes should
`20260816_r11_enable_coaching_shared_messages_AFTER_QA.sql`
be executed.

## User-facing wording requirement
The sharing control should clearly say that the user is allowing the Lellee Coaching Agent
to read the selected message/thread for coaching support. It must not be bundled into
general Terms of Service or pre-checked by default.
