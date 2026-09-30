begin;
update public.professional_course_modules
 set content_md='# Setbacks, Return to Use, Coping & Safety Planning

Recovery can include setbacks. A return to substance use does not erase previous progress and should not automatically be framed as failure. Stigmatizing or punitive reactions can increase shame and reduce willingness to seek help.

When a participant reports renewed or increased substance use, begin with safety and connection. Determine whether there is an immediate medical or behavioral-health crisis that requires emergency or crisis services. If there is no immediate emergency, support the participant in identifying what happened, what risks are present now, what support they want, and what next action feels realistic.

Avoid interrogation or demanding a confession. Use neutral language such as return to use, increased use, or the participant''s preferred term. Ask about warning signs, environments, relationships, stressors, access to support, and protective actions without pretending to perform a clinical relapse assessment.

A coping and support plan can include recognizing early warning signs, reducing isolation, contacting supportive people, reconnecting with treatment or peer support, planning transportation, avoiding high-risk settings when the participant chooses, using approved harm-reduction resources, and identifying emergency or crisis pathways.

The coach should not promise that a plan will prevent recurrence. The purpose is to improve awareness, connection, and response options. Plans should be revisited after new information or experience.

Shame is not an intervention. A coach can hold accountability while remaining respectful: ask what the participant wants to do next, what support would be easier to use earlier, what changed before the return to use, and which supports the participant wants back in place.',source_refs='[{"title":"SAMHSA About Recovery","url":"https://www.samhsa.gov/substance-use/recovery/about"},{"title":"SAMHSA Harm Reduction and Recovery Partnership Guidance","url":"https://library.samhsa.gov/sites/default/files/advancing-partnerships-report-pep25-08-003.pdf"},{"title":"SAMHSA Core Competencies for Peer Workers","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies"},{"title":"NIDA Words Matter","url":"https://nida.nih.gov/sites/default/files/nidamed_wordsmatter3_508.pdf"},{"title":"SAMHSA RecoverMe Recovery Support Resources","url":"https://www.samhsa.gov/substance-use/recovery/recoverme/need-help"}]'::jsonb,practice_requirements='["Rewrite eight punitive responses to return-to-use situations into recovery-oriented, safety-aware coaching language.","Create a participant-led warning-sign and support plan with early actions, support contacts, professional resources, and crisis escalation."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='recurrence_coping_support'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_course_modules
 set content_md='# Family, Peer, Mutual-Help & Community Support

Recovery is often strengthened by connection, but no single support system fits everyone. SAMHSA identifies community and supportive relationships as important dimensions of recovery and recognizes peer support, family support, mutual-help groups, treatment, faith communities, and other community resources as possible parts of a recovery pathway.

Peer support is built on shared understanding, respect, mutuality, and participant choice. Lived experience can increase hope and trust, but formal peer roles have their own competencies and expectations. Completing Lellee Recovery Specialty does not by itself make someone a certified peer support specialist.

Mutual-help and support groups differ in philosophy and structure. Examples may include 12-step fellowships, SMART Recovery, faith-based groups, secular groups, medication-friendly groups, family groups, culturally specific groups, online communities, and local peer programs. A coach should describe options accurately and let the participant decide what fits.

Family involvement can help, but it can also be complicated. The participant''s consent matters. A coach should not automatically contact relatives, share progress, or assume family involvement is safe or desired. When family members are included, clarify what may be shared, what remains private, and what role the family is being asked to play.

Community support can also involve employment, education, housing, recreation, volunteering, spirituality, cultural communities, and practical services. These supports can contribute to purpose and belonging.

A recovery coach is often a connector. That means knowing how to help someone find treatment, peer support, mutual-help, family resources, and community services while staying within scope. The coach should never imply that referral alone guarantees availability, eligibility, or outcome.',source_refs='[{"title":"SAMHSA About Recovery","url":"https://www.samhsa.gov/substance-use/recovery/about"},{"title":"SAMHSA Core Competencies for Peer Workers","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies"},{"title":"SAMHSA Helping Families Cope","url":"https://www.samhsa.gov/mental-health/children-and-families/coping-resources"},{"title":"SAMHSA Find a Support Group or Local Program","url":"https://www.samhsa.gov/find-support/health-care-or-support/support-group-or-local-program"},{"title":"SAMHSA National Helpline","url":"https://www.samhsa.gov/find-help/helplines/national-helpline"}]'::jsonb,practice_requirements='["Build a comparison chart of at least six support options that describes philosophy, access, possible benefits, and participant choice without ranking them.","Write a consent-based family involvement plan that specifies what can be shared, with whom, for what purpose, and how consent can be changed."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='family_peer_community'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_course_modules
 set content_md='# Recovery Specialty Applied Capstone

This capstone requires human review.

## Scenario

Taylor is an adult using Lellee after several years of unstable substance use. Taylor says they want better health, stable housing, and a job but are unsure whether abstinence is their current goal. They are taking medication prescribed for opioid use disorder, attend a support group irregularly, and have recently returned to substance use after several months of improvement. A relative insists that Taylor must stop the medication and attend a specific 12-step fellowship or the family will withdraw support. Taylor feels ashamed and is considering leaving treatment. Housing is also unstable, and Taylor asks the coach to tell the prescriber which medication dose to use.

## Required response

Prepare a recovery-coaching plan that demonstrates multiple-pathway recovery principles, person-centered language, medication and treatment boundaries, harm-reduction awareness, recovery-capital planning, return-to-use support, family and privacy boundaries, referral choices, and participant ownership.

Identify what belongs in coaching, what belongs with treatment or medical professionals, how you would respond to family pressure, what practical recovery-capital goals might be explored, what immediate safety issues would change the response, and how you would document the interaction.

The reviewer should not approve a response that gives medication instructions, treats one recovery pathway as mandatory, shames return to use, ignores participant autonomy, or fails to recognize emergency and professional-referral boundaries.',source_refs='[{"title":"SAMHSA About Recovery","url":"https://www.samhsa.gov/substance-use/recovery/about"},{"title":"SAMHSA Core Competencies for Peer Workers","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies"},{"title":"SAMHSA Harm Reduction and Recovery Partnership Guidance","url":"https://library.samhsa.gov/sites/default/files/advancing-partnerships-report-pep25-08-003.pdf"},{"title":"SAMHSA Substance Use Disorder Treatment Options","url":"https://www.samhsa.gov/substance-use/treatment/options"},{"title":"NIDA Words Matter","url":"https://nida.nih.gov/sites/default/files/nidamed_wordsmatter3_508.pdf"},{"title":"SAMHSA Helping Families Cope","url":"https://www.samhsa.gov/mental-health/children-and-families/coping-resources"},{"title":"SAMHSA RecoverMe Recovery Support Resources","url":"https://www.samhsa.gov/substance-use/recovery/recoverme/need-help"}]'::jsonb,practice_requirements='["Submit a structured response covering pathway choice, scope, safety, recovery capital, return-to-use support, family boundaries, and referrals.","Identify at least five places in the scenario where a coach could accidentally become directive, clinical, or coercive."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='recovery_capstone'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_recovery';
commit;