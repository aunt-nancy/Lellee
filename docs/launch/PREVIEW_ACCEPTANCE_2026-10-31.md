# Protected preview acceptance — October 31, 2026

The protected Vercel preview became accessible in the supported cloud Chrome
browser after the user's sign-in. The earlier connector alias/protection request
still returned 403; browser access is now independently confirmed. Do not request
the same team approval again as a prerequisite to continuing in this browser.

Tested deployment: `dpl_81tC9a5oC9UNgD8Q68X7m49mPp6X`.
Source commit: `a8c6b525af026d8e88033f4958bfa047e865d21f`.
Preview origin:
`https://lelleesupabaseconnectedstaticbuild-5p383a9h5-lellee.vercel.app`.
Actor: signed into Vercel protection, guest in Lellee. No Lellee account, saved
response, invitation, service, payment or database record was created or changed.

## User story and observed boundaries

A guest chooses Caregiving from the public landing page, keeps that selected
program through reload, and browses useful published resources without an account.

| Boundary | Result | Visible evidence |
|---|---|---|
| Protected preview → landing | Passed | `/landing.html` displays “Your journey. Your support. Your way.” and support-path links. |
| Caregiving selection → guest preview | Passed | `/app?browse=1&recommended=caregiving` displays “Explore Caregiving with Lellee,” “Caregiving,” and “No account required.” |
| Reload → selected program | Passed | After browser reload, the same Caregiving URL, heading and guest preview remain. No switch to Recovery was observed. |
| Browse Shared Resources → useful guest directory | Failed | The resource page opens with Caregiving still named in its header, but displays “Recovery News,” “All recovery paths,” recovery-specific categories and an empty list with “0 results.” |

Verification stops at the first broken story boundary. This is partial public
browse acceptance, not full authenticated application acceptance or actual-device
accessibility testing. Existing isolated database/Auth/course checks retain their
separate scope.

## Cause established from the exact source

`index.html` hard-codes Recovery-specific directory labels/options. The loaded
`lellee-v1.js` contains the resource runtime, including:

```js
async function loadResources(){
  if(!currentUser)return;
```

For a Lellee guest, this prevents the published-resource query and normal empty or
error rendering from running. The later query targets `local_resources`, with no
selected Lellee program predicate. `paths-resources.js` contains the same legacy
logic, but the tested `index.html` loads the bundled `lellee-v1.js`. Changing only
the unbundled file would not fix this observed route.

The visible “0 results” therefore does not establish that no Caregiving resources
exist in the database. No live directory record count or anonymous RLS behavior
was tested here. No resource publication, table grant or RLS change is authorized
or implied by this observation.

## Concrete correction to prepare

Preserve the selected program while allowing guests to load only published,
publicly accessible resources. Resolve program-specific and explicitly shared
resource scope using the canonical directory schema; do not silently fall back to
Recovery or expose private saved/referral information. Keep private Save and
referral operations behind sign-in. Give directory loading, failure and empty
states distinct messages, and show program-appropriate filters/news. Preserve the
approved Recovery experience and settled public layouts, branding and pricing.

Before implementation, confirm the canonical directory/table and published-row
anonymous policy read-only. Then prepare a narrow correction on the draft branch,
with guest/public/private and program-switch regression checks. Do not add a
permissive policy to hide a frontend failure. No application code was changed by
this acceptance report.

## Full account-flow prerequisite

The exact frontend source points `index.html`, `coach-auth.js` and
`coaching/index-runtime.js` to the existing runtime Supabase project
`hkrrxscyhtxmbvxevfkw`. A Vercel preview URL does not isolate that backend.
Use a dedicated frontend copy connected to an explicitly isolated canonical test
backend before synthetic signup, training, client invitations, scheduling or
privacy writes. The prior reduced local Auth fixture is not a full canonical
application environment.

Current remaining gates include this public resource correction, complete
authenticated flow acceptance, qualified course signoffs, program feature/content
acceptance and actual iPhone/Safari/assistive-technology checks. Launch remains
held. All settled approvals remain locked.

Follow-up after user approval: `PUBLIC_RESOURCE_CORRECTION_2026-10-31.md` records
the prepared correction, explicit public projection and 16 SQL/11 browser-fixture
checks. This original preview observation remains historical evidence of the
failure; it is not relabeled as live backend acceptance.
