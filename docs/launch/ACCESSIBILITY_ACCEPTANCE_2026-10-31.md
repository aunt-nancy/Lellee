# Device and accessibility acceptance — October 31, 2026

## Result

**Browser correction passed; physical-device acceptance remains pending.**

The protected PR #60 preview was checked in supported cloud Chrome. The guest
Caregiving preview exposed one blocking accessibility defect: the account overlay
was not announced as a modal dialog, focus stayed on the page behind it, the
background remained exposed to assistive technology, and several legal/guest
targets were below the 24 CSS pixel WCAG 2.2 floor.

The scoped correction adds dialog naming and description, programmatic field
labels, polite live feedback, focus entry/trapping/restoration, background
inertness, and 24/44 CSS pixel target floors. It does not change approved copy,
journey content, pricing, Recovery behavior, payment state, or production.

## Verified in the patched local preview

- Document language, title, responsive viewport and one main landmark present.
- Skip link moves focus to `#lelleeMain`.
- 32 visible focusable controls had accessible names; no positive tabindex.
- No visible image lacked alternative text; no duplicate IDs were found.
- Keyboard focus indicators rendered at 3 CSS pixels.
- Account overlay is a named `aria-modal` dialog described by the current message.
- Focus enters the email field, wraps from first to last control and back, and
  returns to the page when the overlay closes.
- Background content is inert and removed from the accessibility tree while the
  dialog is open.
- Email/password fields have programmatic labels and status text is live.
- No visible interactive target was below 24 CSS pixels after correction; coarse
  pointer/mobile rules use a 44 CSS pixel minimum for the corrected controls.
- No horizontal overflow occurred at the available desktop viewport.
- The existing reduced-motion media rule was present.

## Required physical-device handoff

This environment is Chrome, not physical iPhone/Safari or a real assistive
technology stack. Do not mark gate 9 complete until a reviewer records device,
OS/browser/assistive-technology versions and verifies:

1. Open the current PR #60 preview on an actual iPhone in Safari.
2. Browse Caregiving without an account, open Care Coordination, and open the
   sign-in dialog.
3. Confirm text reflows at 200% zoom with no clipped content or horizontal page
   scrolling, and every control is reachable with touch.
4. With VoiceOver enabled, confirm the dialog name/message are announced, focus
   starts on Email, background controls are skipped, field labels are announced,
   and closing returns focus to the page.
5. Repeat the core sign-in, navigation and save/reload path with approved
   synthetic credentials only. Record pass/fail and any defect; do not use a real
   customer account or approve production from this check alone.

Payments, marketplace activation, production migration and production rollout
remain outside this acceptance correction.
