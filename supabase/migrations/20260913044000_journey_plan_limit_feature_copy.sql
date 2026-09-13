update public.lellee_plan_catalog
set features = case plan_key
  when 'free' then '["Core guided support","Help Me Right Now","Journal","Meetings and resources","1 active journey at a time"]'::jsonb
  when 'plus' then '["Structured practices","Expanded organization","Additional reminders","Deeper personalization","Up to 2 active journeys at once"]'::jsonb
  when 'premium' then '["Advanced personalized guidance","Cross-pathway planning","Premium practices","Up to 4 active journeys at once"]'::jsonb
  when 'lellee_coach_addon' then '["Human Lellee Coach","Individual and group coaching","Accountability","Up to 6 active journeys with Premium + Lellee Coach"]'::jsonb
  else features
end,
updated_at=now()
where plan_key in ('free','plus','premium','lellee_coach_addon');
