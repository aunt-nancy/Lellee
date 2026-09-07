insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'lellee-document-vault',
  'lellee-document-vault',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault_storage_select_own" on storage.objects;
drop policy if exists "vault_storage_insert_own" on storage.objects;
drop policy if exists "vault_storage_update_own" on storage.objects;
drop policy if exists "vault_storage_delete_own" on storage.objects;

create policy "vault_storage_select_own"
on storage.objects for select to authenticated
using (bucket_id='lellee-document-vault' and split_part(name,'/',1)=auth.uid()::text);

create policy "vault_storage_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id='lellee-document-vault' and split_part(name,'/',1)=auth.uid()::text);

create policy "vault_storage_update_own"
on storage.objects for update to authenticated
using (bucket_id='lellee-document-vault' and split_part(name,'/',1)=auth.uid()::text)
with check (bucket_id='lellee-document-vault' and split_part(name,'/',1)=auth.uid()::text);

create policy "vault_storage_delete_own"
on storage.objects for delete to authenticated
using (bucket_id='lellee-document-vault' and split_part(name,'/',1)=auth.uid()::text);

create or replace function public.get_my_document_vault_summary()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return jsonb_build_object(
    'summary',jsonb_build_object(
      'documents',(select count(*) from public.document_vault_items where user_id=auth.uid() and status<>'archived'),
      'expiring',(select count(*) from public.document_vault_items where user_id=auth.uid() and expires_on between current_date and current_date+60 and status='current'),
      'shared',(select count(*) from public.document_vault_shares where user_id=auth.uid() and status='active'),
      'uploads_enabled',coalesce((select value='true' from public.app_public_settings where key='document_vault_file_uploads_enabled'),false)
    ),
    'documents',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,
        'label',d.label,
        'document_type',d.document_type,
        'status',d.status,
        'expires_on',d.expires_on,
        'expires_soon',d.expires_on between current_date and current_date+60,
        'share_status',case when exists(select 1 from public.document_vault_shares s where s.document_id=d.id and s.status='active') then 'shared' else 'private' end,
        'file_upload_status',d.file_upload_status,
        'file_storage_reference',d.file_storage_reference,
        'has_file',(d.file_upload_status='uploaded' and d.file_storage_reference is not null)
      ) order by d.expires_on nulls last,d.created_at desc)
      from public.document_vault_items d
      where d.user_id=auth.uid() and d.status<>'archived'
    ),'[]'::jsonb)
  );
end
$function$;

revoke execute on function public.get_my_document_vault_summary() from anon;
grant execute on function public.get_my_document_vault_summary() to authenticated;

insert into public.app_public_settings(key,value)
values ('document_vault_file_uploads_enabled','true')
on conflict(key) do update set value=excluded.value, updated_at=now();