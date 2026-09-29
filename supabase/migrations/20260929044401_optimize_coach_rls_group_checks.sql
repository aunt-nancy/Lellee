-- Tracks the live Supabase migration already applied.
-- Performance-only rewrite: direct auth.uid() calls are wrapped in SELECT.

alter policy coach_assignment_recipients_read on public.coach_assignment_recipients
  using (
    (relationship_id is not null and is_coach_relationship_participant(relationship_id))
    or (
      group_id is not null and exists (
        select 1 from public.coach_groups g
        where g.id = coach_assignment_recipients.group_id
          and (
            is_coach_business_member(g.business_id)
            or exists (
              select 1
              from public.coach_group_members gm
              join public.coach_client_relationships r on r.id = gm.relationship_id
              where gm.group_id = g.id
                and r.client_user_id = (select auth.uid())
                and gm.status = 'active'
            )
          )
      )
    )
  );

alter policy group_schedule_participants on public.coach_group_schedule
  using (
    exists (
      select 1 from public.coach_groups g
      where g.id = coach_group_schedule.group_id
        and (
          is_coach_business_member(g.business_id)
          or exists (
            select 1
            from public.coach_group_members gm
            join public.coach_client_relationships r on r.id = gm.relationship_id
            where gm.group_id = g.id
              and r.client_user_id = (select auth.uid())
              and gm.status = 'active'
          )
        )
    )
  );

alter policy group_announcement_participants on public.coach_group_announcements
  using (
    exists (
      select 1 from public.coach_groups g
      where g.id = coach_group_announcements.group_id
        and (
          is_coach_business_member(g.business_id)
          or exists (
            select 1
            from public.coach_group_members gm
            join public.coach_client_relationships r on r.id = gm.relationship_id
            where gm.group_id = g.id
              and r.client_user_id = (select auth.uid())
              and gm.status = 'active'
          )
        )
    )
  );

alter policy group_announcement_coach_write on public.coach_group_announcements
  with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1 from public.coach_groups g
      where g.id = coach_group_announcements.group_id
        and is_coach_business_member(g.business_id)
    )
  );
