# Lellee Professional Training — Key Administrator Dual-Review Override

Effective: 2026-09-30
Status: CANONICAL TEMPORARY STAFFING CONTROL

## Purpose
Until reviewer staffing is sufficient, the active key administrator may temporarily perform both required reviewer functions where the normal workflow requires two different reviewers.

## Default
The switch is OFF by default.

## Who may use it
Only the active administrator with role `admin` may enable or disable the switch. Editors and other users cannot control it.

## Preconditions
Before the switch can be enabled:
1. The key administrator must have a reviewer record in the In-House Reviewer Registry.
2. That reviewer record must be Verified In-House and active.
3. The reviewer record must be explicitly linked to the key administrator account.
4. The reviewer must be verified for each review domain they will perform.
5. A written reason is required when enabling the switch.

## What the switch changes
The switch waives only the rule requiring two different people for the two reviewer functions.

It does not waive:
- reviewer qualification/domain requirements;
- the need to complete both review slots separately;
- separate review notes and decisions;
- reviewer attestation;
- source, curriculum, assessment, scope/safety, or capstone requirements;
- publication or checkout release gates.

## Assignment and signoff
When enabled, the linked key-administrator reviewer may be assigned to both required Scope/Safety slots if verified for both domains. Each slot must still move through Assigned → In Review → Completed and receive its own Approved or Revisions Required decision.

## Audit
Enabling/disabling the switch and linking the reviewer record to the key administrator are written to the admin audit log.

## Turning the switch off
Turning the switch OFF immediately restores the normal two-person rule. Courses that depend on the temporary exception are re-evaluated; if they no longer satisfy review requirements, they return to Draft and checkout is disabled.

## Intended duration
This control is temporary and should be turned OFF when staffing supports separate qualified reviewers for the required functions.
