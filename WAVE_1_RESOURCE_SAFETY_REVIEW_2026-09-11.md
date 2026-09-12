# Lellee Wave 1 — Consolidated Resource & Safety Review

Date: 2026-09-11  
Scope: Caregiving, Returning Home / Reentry, Housing Stability, Building Independence  
Status: INTERNAL REVIEW ONLY — nothing in this file authorizes public release.

## Resource candidates recommended for beta staging

All eight candidates below were verified from authoritative government sources and remain `published=false` until the program reaches its approved beta/public gate.

### Caregiving
1. **Eldercare Locator** — Administration for Community Living  
   Purpose: Connect older adults, families and caregivers to local aging and caregiving services.  
   URL: https://eldercare.acl.gov/home

2. **National Family Caregiver Support Program** — Administration for Community Living  
   Purpose: Information, access assistance, counseling/support groups, caregiver training, respite and limited supplemental services through state/local systems.  
   URL: https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program

### Returning Home / Reentry
3. **CareerOneStop — Find a Job After Incarceration** — U.S. Department of Labor-sponsored  
   Purpose: Employment, training, local resources, job-search preparation and applications for justice-impacted job seekers.  
   URL: https://cloudfront.careeronestop.org/JusticeImpacted/Help/ReEntry/reentry-intro.aspx

4. **USA.gov Benefit Finder** — U.S. government  
   Purpose: Explore government assistance across housing, food, health, disability, education, jobs and cash assistance.  
   Boundary: Lellee must not state that a user qualifies; final eligibility is determined by the responsible program/agency.  
   URL: https://www.usa.gov/benefit-finder

### Housing Stability
5. **HUD Find Shelter** — U.S. Department of Housing and Urban Development  
   Purpose: Find shelters, food pantries, health clinics, clothing resources and local homelessness assistance.  
   URL: https://www.hud.gov/findshelter

6. **HUD Housing Counseling** — U.S. Department of Housing and Urban Development  
   Purpose: Locate participating housing counseling agencies/certified counselors for rental, eviction, foreclosure, homeownership and other housing concerns.  
   URL: https://www.hud.gov/stat/sfh/housing-counseling

### Building Independence
7. **Disability Information and Access Locator (DIAL)** — Administration for Community Living  
   Purpose: Connect people with disabilities and families to state/local organizations supporting independent living.  
   URL: https://dial.acl.gov/home

8. **USA.gov Benefit Finder** — U.S. government  
   Purpose: Explore disability, health, housing, education, jobs and other support categories.  
   Boundary: Lellee must not state that a user qualifies; final eligibility is determined by the responsible program/agency.  
   URL: https://www.usa.gov/benefit-finder

## Draft safety routes recommended as working copy

These routes remain in `draft` status. Product approval does not replace specialist review where heightened review is required.

### Caregiving — heightened review
- **I’m overwhelmed or need a break** — Elevated — Support Contact  
  Guidance: Reduce the immediate load first. Identify what truly needs attention, what can wait, and whether a trusted person or caregiver resource can help.
- **The care situation changed suddenly** — Elevated — In-app Guidance  
  Guidance: Organize the change, upcoming instructions and follow-up questions. Lellee does not diagnose or change treatment instructions.
- **I am worried about immediate safety** — Emergency — Emergency Care  
  Guidance: If someone is in immediate danger or there is a medical emergency, contact 911 or local emergency services now.

### Returning Home / Reentry — heightened review
- **I do not have a safe place to stay** — Urgent — Resource Navigation  
  Guidance: Prioritize immediate safe housing and basic needs, then organize follow-up steps.
- **I am worried about a requirement or deadline** — Elevated — In-app Guidance  
  Guidance: Organize the requirement, date and questions. Lellee provides planning support, not individualized legal advice.
- **I am in immediate danger** — Emergency — Emergency Care  
  Guidance: If you are in immediate danger, contact 911 or local emergency services now.

### Housing Stability — heightened review
- **I may lose my housing soon** — Urgent — Resource Navigation  
  Guidance: Identify notices and deadlines, gather documents, and connect with qualified housing or legal resources as appropriate.
- **I have nowhere safe to stay** — Urgent — Resource Navigation  
  Guidance: Prioritize immediate shelter and basic-needs resources, then organize longer-term housing follow-up.
- **I am in immediate danger** — Emergency — Emergency Care  
  Guidance: If you are in immediate danger, contact 911 or local emergency services now.

### Building Independence — standard review + accessibility/privacy review
- **An access barrier is stopping me** — Elevated — Resource Navigation  
  Guidance: Identify the barrier and the accommodation, assistive technology, transportation, advocacy or community-living support that may help.
- **I need more or less support** — Routine — Support Contact  
  Guidance: Review what you want to do yourself, where support is useful, and who you choose to involve.
- **I am in immediate danger** — Emergency — Emergency Care  
  Guidance: If you are in immediate danger, contact 911 or local emergency services now.

## Privacy/RLS verification completed

The active app database has user-scoped policies for:
- `journey_account_intakes`
- `program_goals`
- `program_progress_checkins`
- `user_saved_resources`
- `resource_referrals`
- `program_enrollments` (read own)
- `user_program_state` (read own)

Trusted-circle recipient access is constrained to active, accepted relationships and specific allowed scopes (`shared_tasks` and `shared_appointments`) under program collaboration settings. Cross-program sharing remains off by default.

## Recommended consolidated approval

Approve all eight authoritative resource candidates for **beta staging only**, while keeping them unpublished until the applicable program enters beta.

Approve the 12 safety routes above as the **working product copy for review**, while keeping every route in draft status until the required human/specialist review has been completed.

No public launch status changes are authorized by this review.