begin;
update public.professional_course_modules
 set content_md='# Recovery Orientation & Multiple Pathways

Recovery is not one fixed route. SAMHSA defines recovery as a process of change through which people improve health and wellness, live self-directed lives, and strive to reach their full potential. SAMHSA also emphasizes that recovery may include clinical treatment, medications, peer support, family support, faith or spirituality, self-care, community support, and other approaches.

Lellee''s Recovery Specialty teaches coaches to support the participant''s chosen pathway rather than impose a single ideology. Four broad dimensions can help organize recovery-support conversations: health, home, purpose, and community. These are not scores. They are areas a participant may choose to strengthen, and priorities can change over time.

Recovery-oriented coaching is hopeful, person-driven, strengths-based, culturally responsive, and noncoercive. A coach should not define recovery for the participant, demand abstinence as the only valid goal, dismiss medication-supported recovery, or present personal experience as the universal standard.

The participant may use terms such as recovery, remission, healing, sobriety, harm reduction, stability, wellness, or another preferred description. The coach should use respectful, person-first language unless the participant chooses another term for themselves.

Recovery coaching supports practical action: identifying strengths, clarifying goals, building routines, increasing connection, organizing appointments and supports, noticing risks, and linking to resources. It does not diagnose substance use disorders, recommend medical treatment, determine medication changes, or replace licensed treatment.

Lived experience can be valuable when used carefully. The purpose is to build hope and connection, not to prove that the participant should follow the coach''s path. The coach can ask what fits the participant instead of prescribing the coach''s own recovery story.',source_refs='[{"title":"SAMHSA About Recovery","url":"https://www.samhsa.gov/substance-use/recovery/about"},{"title":"SAMHSA Core Competencies for Peer Workers","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies"},{"title":"SAMHSA Peer Support Core Competencies FAQ","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies-faq"},{"title":"NIDA Words Matter","url":"https://nida.nih.gov/sites/default/files/nidamed_wordsmatter3_508.pdf"}]'::jsonb,practice_requirements='["Create a recovery-pathway map showing at least five legitimate supports a participant might combine without ranking one as universally superior.","Rewrite ten stigmatizing or overly prescriptive recovery statements into person-centered, noncoercive language."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='recovery_orientation'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_course_modules
 set content_md='# Substance-Use, Treatment, Medication & Harm-Reduction Awareness

Recovery coaches need enough substance-use literacy to communicate responsibly without drifting into clinical practice. Substance use disorder is a health condition that can be treated. Treatment may include counseling, behavioral therapies, medications, medical care, peer support, recovery support, and social services.

Medication-supported treatment is evidence-based. SAMHSA identifies methadone, buprenorphine, and naltrexone as medications used for opioid use disorder, and medications are also available for alcohol use disorder. A coach should not tell participants to start, stop, reduce, increase, or switch prescribed medication. Medication questions belong with qualified prescribers and treatment professionals.

Harm reduction is compatible with person-centered support. SAMHSA''s harm-reduction framework emphasizes autonomy, accessible and noncoercive support, safety, engagement, listening, and positive change as defined by the person. Harm reduction may include overdose-prevention education, connection to naloxone and other overdose-reversal resources, infectious-disease prevention, and low-barrier support.

A coach does not need to make a participant choose between recovery and harm reduction. A person may move through different goals and supports over time. The coaching task is to help the participant identify what matters, reduce preventable harm, stay connected to appropriate care, and make informed decisions.

Language matters. Avoid terms that reduce a person to a condition or imply moral failure. Person-first language, neutral descriptions of substance use, and participant-chosen identity language can reduce stigma and improve trust.

Coaches also need a clear emergency boundary. Suspected overdose, severe withdrawal, loss of consciousness, breathing difficulty, or other acute medical danger requires emergency medical response. A recovery coach should not try to medically manage those situations.',source_refs='[{"title":"SAMHSA Substance Use Disorder Treatment Options","url":"https://www.samhsa.gov/substance-use/treatment/options"},{"title":"SAMHSA Harm Reduction and Recovery Partnership Guidance","url":"https://library.samhsa.gov/sites/default/files/advancing-partnerships-report-pep25-08-003.pdf"},{"title":"SAMHSA Stigma and Language","url":"https://www.samhsa.gov/substance-use/treatment/stigma-language"},{"title":"NIDA Words Matter","url":"https://nida.nih.gov/sites/default/files/nidamed_wordsmatter3_508.pdf"},{"title":"SAMHSA RecoverMe Recovery Support Resources","url":"https://www.samhsa.gov/substance-use/recovery/recoverme/need-help"}]'::jsonb,practice_requirements='["Compare five recovery-support situations and identify which belong in coaching, treatment, medication management, harm-reduction referral, or emergency response.","Build a one-page medication-awareness guide that explains the coach''s role without giving prescribing advice."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='sud_harm_reduction_awareness'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_course_modules
 set content_md='# Readiness, Strengths & Recovery Capital

People rarely change in a straight line. Motivation can shift across days, settings, relationships, and goals. A recovery coach should avoid labeling a participant as unmotivated when the real picture may include fear, competing needs, low confidence, unstable housing, stigma, pain, transportation, family pressure, or uncertainty about what kind of change is desired.

Recovery capital is a practical way to think about the resources that can support recovery. It can include health, safe housing, transportation, income, employment, education, supportive relationships, community, cultural or spiritual connection, coping skills, routines, identity, and access to treatment or peer support. Lellee uses recovery capital as a planning lens, not a score or prediction.

Start with strengths as well as needs. Ask what has helped before, who is supportive, what the participant already knows how to do, and where even small stability exists. A strengths-based approach does not minimize risk; it gives the participant something real to build from.

Use readiness questions rather than pressure. Ask what the participant would like to be different, what feels possible now, what small change they are willing to try, and how confident they are. If confidence is low, make the step smaller or revisit whether the goal actually belongs to the participant.

Practical recovery goals may involve treatment attendance, support meetings, sleep, food, medication appointments, housing, employment, family boundaries, safer social activities, transportation, financial stability, spiritual practices, or rebuilding trust. The participant decides what matters.

A recovery coach can help connect goals across domains. Improving transportation may support treatment attendance and employment; safer housing may reduce exposure to high-risk environments; reconnecting with a trusted support person may make it easier to follow through on care.',source_refs='[{"title":"SAMHSA About Recovery","url":"https://www.samhsa.gov/substance-use/recovery/about"},{"title":"SAMHSA Core Competencies for Peer Workers","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies"},{"title":"SAMHSA Peer Support Core Competencies FAQ","url":"https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies-faq"}]'::jsonb,practice_requirements='["Complete a recovery-capital map for a fictional participant across health, home, purpose, community, practical resources, and personal strengths.","Turn four low-confidence goals into smaller participant-led actions with a confidence check and barrier plan."]'::jsonb,
     review_status='internal_review',updated_at=now()
 where module_key='readiness_recovery_capital'
   and course_id=(select id from public.professional_courses where course_key='specialty_recovery');
update public.professional_courses
set curriculum_review_status='internal_review',status='draft',checkout_enabled=false,updated_at=now()
where course_key='specialty_recovery';
commit;