-- Column, constraint and policy definitions captured read-only from canonical runtime, 2026-10-30.
-- Requires the synthetic fixture-schema.sql; no production data.
create table public.program_journey_stages (
  "id" uuid default gen_random_uuid() not null,
  "program_id" uuid not null,
  "stage_key" text not null,
  "name" text not null,
  "description" text,
  "sequence" integer default 1 not null,
  "start_day" integer,
  "end_day" integer,
  "status" text default 'draft'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "program_journey_stages_pkey" PRIMARY KEY (id),
  constraint "program_journey_stages_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  constraint "program_journey_stages_program_id_stage_key_key" UNIQUE (program_id, stage_key),
  constraint "program_journey_stages_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'published'::text, 'archived'::text])))
);
alter table public.program_journey_stages enable row level security;
grant select,insert,update,delete on public.program_journey_stages to authenticated;
grant select on public.program_journey_stages to anon;
create policy "journey_stages_admin_write" on public.program_journey_stages for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "journey_stages_authenticated_read" on public.program_journey_stages for SELECT to authenticated using (((status = 'published'::text) OR is_lellee_admin()));
create table public.program_content_items (
  "id" uuid default gen_random_uuid() not null,
  "program_id" uuid not null,
  "stage_id" uuid,
  "content_key" text not null,
  "content_type" text not null,
  "title" text not null,
  "intro_text" text,
  "body_text" text,
  "suggested_choices" text[] default '{}'::text[] not null,
  "reflection_prompt" text,
  "sequence" integer default 10 not null,
  "day_number" integer,
  "week_number" integer,
  "milestone_day" integer,
  "estimated_minutes" integer default 5 not null,
  "pathway" text default 'all'::text not null,
  "belief_tradition" text,
  "audience_tag" text,
  "language_code" text default 'en'::text not null,
  "tags" text[] default '{}'::text[] not null,
  "status" text default 'draft'::text not null,
  "version_number" integer default 1 not null,
  "editor_notes" text,
  "created_by" uuid,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  constraint "program_content_items_content_type_check" CHECK ((content_type = ANY (ARRAY['guided_action'::text, 'prompt'::text, 'tool'::text, 'learn'::text, 'milestone_review'::text, 'support'::text, 'resource_callout'::text]))),
  constraint "program_content_items_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id),
  constraint "program_content_items_pathway_check" CHECK ((pathway = ANY (ARRAY['all'::text, 'secular'::text, 'spiritual'::text, 'faith'::text, 'mixed'::text, 'exploring'::text]))),
  constraint "program_content_items_pkey" PRIMARY KEY (id),
  constraint "program_content_items_program_id_content_key_language_code__key" UNIQUE (program_id, content_key, language_code, pathway, version_number),
  constraint "program_content_items_program_id_fkey" FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  constraint "program_content_items_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id),
  constraint "program_content_items_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES program_journey_stages(id) ON DELETE SET NULL,
  constraint "program_content_items_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'review'::text, 'published'::text, 'archived'::text])))
);
alter table public.program_content_items enable row level security;
grant select,insert,update,delete on public.program_content_items to authenticated;
grant select on public.program_content_items to anon;
create policy "program_content_admin_write" on public.program_content_items for ALL to authenticated using (is_lellee_admin()) with check (is_lellee_admin());
create policy "program_content_read" on public.program_content_items for SELECT to authenticated using (((status = 'published'::text) OR is_lellee_admin()));
