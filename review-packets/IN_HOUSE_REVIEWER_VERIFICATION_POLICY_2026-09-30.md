# Lellee Professional Training — In-House Reviewer Verification Policy

Effective: 2026-09-30
Status: CANONICAL

## Policy
Reviewer verification for Lellee professional-training review is performed manually, in-house.

External verification services are not a release dependency.

## Required sequence
1. Register the reviewer in the Professional Training Reviewer Registry.
2. Record the reviewer name, qualification, approved review domain(s), organization if applicable, and supporting internal evidence/reference.
3. An authorized Lellee administrator manually reviews that information.
4. Mark the reviewer Verified In-House or Rejected.
5. Only an active Verified In-House reviewer may submit a course signoff that counts toward release.
6. A review decision must be Approved or Revisions Required and include reviewer attestation.
7. Where a course requires two scope domains, those domains must be signed by two different Verified In-House reviewers.

## Release protection
A reviewer who is Pending, Rejected, Inactive, or not registered cannot satisfy a release gate. Direct signoff without an in-house verified reviewer record is disabled.

Course publication and checkout remain blocked until every required review domain is approved.
