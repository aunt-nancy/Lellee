# Lellee R6 Security Test Gate

Do not enable production agents until every required item below passes.

- [ ] AUTH-01 unauthenticated requests are denied.
- [ ] AGENT-01 disabled agents are denied.
- [ ] CAP-01 disabled capabilities are denied.
- [ ] RLS-01 User A cannot read User B private data.
- [ ] CONSENT-01 sensitive coaching access fails without consent.
- [ ] CONSENT-02 consent allows only the approved capability and fields.
- [ ] CONSENT-03 revoking consent blocks access immediately.
- [ ] FIELD-01 Housing/Resources results contain no journal, coaching-private, clinical, or payment data.
- [ ] AUDIT-01 both allowed and denied requests create sanitized audit rows.
- [ ] SECRET-01 no service-role secret exists in browser/public assets.

## Release rule

R6 passes only when all ten checks pass. If any one fails, keep the affected agent disabled.

## Test-account rule

Use two dedicated test accounts:
- Test User A
- Test User B

Never use real member recovery data for the cross-user test.
