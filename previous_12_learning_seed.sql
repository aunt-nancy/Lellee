-- LELLEE STARTER LEARNING LIBRARY
begin;

insert into public.content_items
(phase_key,phase_order,content_type,slug,title,summary,body_markdown,published,tags,tap21_domains,printable)
values
('stabilize',1,'lesson','understanding-cravings',
 'Understanding Cravings',
 'Learn what a craving is and why it can feel urgent without controlling your next choice.',
 '### What a craving is

A craving can involve thoughts, emotions, body sensations, memories, and a strong desire for relief.

### What helps

Notice it early. Change your environment when you can. Use support before the urge becomes overwhelming. Give the craving time to change.

### Remember

A craving is information. It is not a command.',
 true,array['cravings','addiction'],array['Client Education','Counseling'],false),

('build',2,'lesson','recognizing-trigger-patterns',
 'Recognizing Trigger Patterns',
 'Notice repeated people, places, emotions, and situations that raise risk.',
 '### Triggers are patterns

A trigger does not mean you are failing. It tells you something about where recovery may need support.

### Look for

People, places, conflict, stress, loneliness, money, celebrations, memories, and boredom.

### Your goal

Notice the pattern earlier so you have more choices.',
 true,array['cravings','relapse'],array['Assessment','Counseling'],false),

('understand',3,'lesson','thoughts-feelings-actions',
 'Thoughts, Feelings & Actions',
 'See how thoughts, emotions, and actions can influence each other.',
 '### A pattern can be interrupted

You may not control every thought or feeling, but you can often create space before your next action.

### Try this

Name the thought. Name the feeling. Notice the urge. Then choose the safest next step.',
 true,array['mental_health','addiction'],array['Counseling','Client Education'],false),

('strengthen',5,'worksheet','my-warning-sign-plan',
 'My Early Warning Plan',
 'Create a simple plan for what you will notice and what you will do sooner.',
 '### My early warning signs

Write the signs that tell you recovery needs more attention.

### What I will do

Choose people to contact, places to avoid, meetings or support to use, and professional help when appropriate.

### Keep it simple

The plan should be easy to remember when stress is high.',
 true,array['relapse'],array['Treatment Planning','Referral','Counseling'],true),

(null,null,'lesson','multiple-pathways-recovery',
 'There Is More Than One Path to Recovery',
 'Recovery can include peer support, therapy, medication, faith, skills-based approaches, or a combination.',
 '### Recovery can be individualized

People recover in different ways. Some use 12-Step groups. Some use skills-based programs. Some use medication, therapy, peer support, faith, or several approaches together.

### What matters

Choose supports that are safe, legitimate, and useful for your recovery.',
 true,array['addiction','life'],array['Client Education','Referral'],false),

(null,null,'lesson','sleep-and-recovery',
 'Sleep & Recovery',
 'Understand why sleep can affect mood, judgment, stress, and cravings.',
 '### Sleep matters

Poor sleep can make emotions harder to regulate and recovery decisions harder to protect.

### Start small

A consistent bedtime, less late caffeine, a calmer room, and professional help for persistent sleep problems can all matter.',
 true,array['health'],array['Client Education'],false)

on conflict (slug) do nothing;

commit;
