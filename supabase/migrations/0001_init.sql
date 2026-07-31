-- ============================================================================
-- OrnGlobal Surgical Procedure Management — Initial Schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('nurse', 'shared_access', 'hospital_admin', 'higher_authority');
exception when duplicate_object then null; end $$;

do $$ begin
  create type permission_level as enum ('read', 'write');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Table: hospitals
-- ---------------------------------------------------------------------------
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  country text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: profiles (extends auth.users — "users" table from the spec)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  hospital_id uuid references public.hospitals(id) on delete set null,
  role user_role not null default 'nurse',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, hospital_id, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    nullif(new.raw_user_meta_data->>'hospital_id', '')::uuid,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'nurse')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Table: surgical_specialties (global)
-- ---------------------------------------------------------------------------
create table if not exists public.surgical_specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  global boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: surgeons (global, optionally scoped by specialty/hospital)
-- ---------------------------------------------------------------------------
create table if not exists public.surgeons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty_id uuid references public.surgical_specialties(id) on delete set null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  license_number text,
  global boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: surgical_procedures (global, linked to surgeon)
-- ---------------------------------------------------------------------------
create table if not exists public.surgical_procedures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  surgeon_id uuid references public.surgeons(id) on delete set null,
  description text,
  global boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: surgical_records (the main record a user creates)
-- ---------------------------------------------------------------------------
create table if not exists public.surgical_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  specialty_id uuid references public.surgical_specialties(id) on delete set null,
  surgeon_id uuid references public.surgeons(id) on delete set null,
  procedure_id uuid references public.surgical_procedures(id) on delete set null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  patient_reference text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_surgical_records_updated_at on public.surgical_records;
create trigger trg_surgical_records_updated_at
  before update on public.surgical_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: procedure_sections (Sections 4-13 + custom "Add More" sections)
-- ---------------------------------------------------------------------------
create table if not exists public.procedure_sections (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.surgical_records(id) on delete cascade,
  section_name text not null,
  section_type text not null default 'custom',
  sort_order int not null default 0,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: procedure_files (uploads attached to a section)
-- ---------------------------------------------------------------------------
create table if not exists public.procedure_files (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.procedure_sections(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_url text not null,
  file_size bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: voice_recordings (recorded in-app via Web Audio API)
-- ---------------------------------------------------------------------------
create table if not exists public.voice_recordings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.procedure_sections(id) on delete cascade,
  recording_url text not null,
  duration numeric,
  transcript text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: procedure_permissions (sharing / access control per record)
-- ---------------------------------------------------------------------------
create table if not exists public.procedure_permissions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.surgical_records(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  permission_level permission_level not null default 'read',
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (record_id, shared_with_user_id)
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql security definer stable set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_higher_authority()
returns boolean
language sql security definer stable set search_path = public
as $$
  select coalesce((select role = 'higher_authority' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_hospital_admin_for(target_hospital uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select coalesce((
    select role = 'hospital_admin' and hospital_id = target_hospital
    from public.profiles where id = auth.uid()
  ), false);
$$;

create or replace function public.record_permission_level(target_record uuid)
returns permission_level
language sql security definer stable set search_path = public
as $$
  select permission_level from public.procedure_permissions
  where record_id = target_record and shared_with_user_id = auth.uid();
$$;

create or replace function public.can_read_record(target_record uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.surgical_records r
    where r.id = target_record
      and (
        r.user_id = auth.uid()
        or public.is_higher_authority()
        or public.is_hospital_admin_for(r.hospital_id)
        or public.record_permission_level(target_record) is not null
      )
  );
$$;

create or replace function public.can_write_record(target_record uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.surgical_records r
    where r.id = target_record
      and (
        r.user_id = auth.uid()
        or public.is_higher_authority()
        or public.record_permission_level(target_record) = 'write'
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.surgical_specialties enable row level security;
alter table public.surgeons enable row level security;
alter table public.surgical_procedures enable row level security;
alter table public.surgical_records enable row level security;
alter table public.procedure_sections enable row level security;
alter table public.procedure_files enable row level security;
alter table public.voice_recordings enable row level security;
alter table public.procedure_permissions enable row level security;

-- hospitals: readable by all authenticated users; writable by admins/higher authority
drop policy if exists "hospitals_select" on public.hospitals;
create policy "hospitals_select" on public.hospitals for select
  to authenticated using (true);

drop policy if exists "hospitals_insert" on public.hospitals;
create policy "hospitals_insert" on public.hospitals for insert
  to authenticated with check (true);

drop policy if exists "hospitals_update" on public.hospitals;
create policy "hospitals_update" on public.hospitals for update
  to authenticated using (public.is_higher_authority());

-- profiles: user reads/updates own row; admins read their hospital; higher authority reads all
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  to authenticated using (
    id = auth.uid()
    or public.is_higher_authority()
    or public.is_hospital_admin_for(hospital_id)
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  to authenticated using (id = auth.uid() or public.is_higher_authority());

-- global lookup tables: any authenticated user can read and add; only higher authority edits/deletes
drop policy if exists "specialties_select" on public.surgical_specialties;
create policy "specialties_select" on public.surgical_specialties for select
  to authenticated using (true);
drop policy if exists "specialties_insert" on public.surgical_specialties;
create policy "specialties_insert" on public.surgical_specialties for insert
  to authenticated with check (true);
drop policy if exists "specialties_update" on public.surgical_specialties;
create policy "specialties_update" on public.surgical_specialties for update
  to authenticated using (public.is_higher_authority());
drop policy if exists "specialties_delete" on public.surgical_specialties;
create policy "specialties_delete" on public.surgical_specialties for delete
  to authenticated using (public.is_higher_authority());

drop policy if exists "surgeons_select" on public.surgeons;
create policy "surgeons_select" on public.surgeons for select
  to authenticated using (true);
drop policy if exists "surgeons_insert" on public.surgeons;
create policy "surgeons_insert" on public.surgeons for insert
  to authenticated with check (true);
drop policy if exists "surgeons_update" on public.surgeons;
create policy "surgeons_update" on public.surgeons for update
  to authenticated using (public.is_higher_authority());
drop policy if exists "surgeons_delete" on public.surgeons;
create policy "surgeons_delete" on public.surgeons for delete
  to authenticated using (public.is_higher_authority());

drop policy if exists "procedures_select" on public.surgical_procedures;
create policy "procedures_select" on public.surgical_procedures for select
  to authenticated using (true);
drop policy if exists "procedures_insert" on public.surgical_procedures;
create policy "procedures_insert" on public.surgical_procedures for insert
  to authenticated with check (true);
drop policy if exists "procedures_update" on public.surgical_procedures;
create policy "procedures_update" on public.surgical_procedures for update
  to authenticated using (public.is_higher_authority());
drop policy if exists "procedures_delete" on public.surgical_procedures;
create policy "procedures_delete" on public.surgical_procedures for delete
  to authenticated using (public.is_higher_authority());

-- surgical_records: owner full access; shared users per permission; higher authority full access
drop policy if exists "records_select" on public.surgical_records;
create policy "records_select" on public.surgical_records for select
  to authenticated using (public.can_read_record(id));

drop policy if exists "records_insert" on public.surgical_records;
create policy "records_insert" on public.surgical_records for insert
  to authenticated with check (user_id = auth.uid());

drop policy if exists "records_update" on public.surgical_records;
create policy "records_update" on public.surgical_records for update
  to authenticated using (public.can_write_record(id));

drop policy if exists "records_delete" on public.surgical_records;
create policy "records_delete" on public.surgical_records for delete
  to authenticated using (user_id = auth.uid() or public.is_higher_authority());

-- procedure_sections: inherit record permission
drop policy if exists "sections_select" on public.procedure_sections;
create policy "sections_select" on public.procedure_sections for select
  to authenticated using (public.can_read_record(record_id));

drop policy if exists "sections_insert" on public.procedure_sections;
create policy "sections_insert" on public.procedure_sections for insert
  to authenticated with check (public.can_write_record(record_id));

drop policy if exists "sections_update" on public.procedure_sections;
create policy "sections_update" on public.procedure_sections for update
  to authenticated using (public.can_write_record(record_id));

drop policy if exists "sections_delete" on public.procedure_sections;
create policy "sections_delete" on public.procedure_sections for delete
  to authenticated using (public.can_write_record(record_id));

-- procedure_files: inherit section's record permission
drop policy if exists "files_select" on public.procedure_files;
create policy "files_select" on public.procedure_files for select
  to authenticated using (
    public.can_read_record((select record_id from public.procedure_sections where id = section_id))
  );

drop policy if exists "files_insert" on public.procedure_files;
create policy "files_insert" on public.procedure_files for insert
  to authenticated with check (
    public.can_write_record((select record_id from public.procedure_sections where id = section_id))
  );

drop policy if exists "files_delete" on public.procedure_files;
create policy "files_delete" on public.procedure_files for delete
  to authenticated using (
    public.can_write_record((select record_id from public.procedure_sections where id = section_id))
  );

-- voice_recordings: inherit section's record permission
drop policy if exists "voice_select" on public.voice_recordings;
create policy "voice_select" on public.voice_recordings for select
  to authenticated using (
    public.can_read_record((select record_id from public.procedure_sections where id = section_id))
  );

drop policy if exists "voice_insert" on public.voice_recordings;
create policy "voice_insert" on public.voice_recordings for insert
  to authenticated with check (
    public.can_write_record((select record_id from public.procedure_sections where id = section_id))
  );

drop policy if exists "voice_delete" on public.voice_recordings;
create policy "voice_delete" on public.voice_recordings for delete
  to authenticated using (
    public.can_write_record((select record_id from public.procedure_sections where id = section_id))
  );

-- procedure_permissions: only the record owner (or higher authority) manages sharing;
-- a shared user may see their own grant row
drop policy if exists "permissions_select" on public.procedure_permissions;
create policy "permissions_select" on public.procedure_permissions for select
  to authenticated using (
    shared_with_user_id = auth.uid()
    or public.is_higher_authority()
    or exists (select 1 from public.surgical_records r where r.id = record_id and r.user_id = auth.uid())
  );

drop policy if exists "permissions_insert" on public.procedure_permissions;
create policy "permissions_insert" on public.procedure_permissions for insert
  to authenticated with check (
    exists (select 1 from public.surgical_records r where r.id = record_id and r.user_id = auth.uid())
    or public.is_higher_authority()
  );

drop policy if exists "permissions_update" on public.procedure_permissions;
create policy "permissions_update" on public.procedure_permissions for update
  to authenticated using (
    exists (select 1 from public.surgical_records r where r.id = record_id and r.user_id = auth.uid())
    or public.is_higher_authority()
  );

drop policy if exists "permissions_delete" on public.procedure_permissions;
create policy "permissions_delete" on public.procedure_permissions for delete
  to authenticated using (
    exists (select 1 from public.surgical_records r where r.id = record_id and r.user_id = auth.uid())
    or public.is_higher_authority()
  );

-- ---------------------------------------------------------------------------
-- Storage: bucket for procedure files & voice recordings
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('procedure-files', 'procedure-files', false)
on conflict (id) do nothing;

-- Authenticated users can upload into their own folder: procedure-files/{auth.uid()}/...
drop policy if exists "storage_insert_own_folder" on storage.objects;
create policy "storage_insert_own_folder" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'procedure-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_select_own_or_shared" on storage.objects;
create policy "storage_select_own_or_shared" on storage.objects for select
  to authenticated using (
    bucket_id = 'procedure-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_higher_authority()
      or exists (
        select 1 from public.procedure_permissions p
        where p.shared_with_user_id = auth.uid()
      )
    )
  );

drop policy if exists "storage_update_own_folder" on storage.objects;
create policy "storage_update_own_folder" on storage.objects for update
  to authenticated using (
    bucket_id = 'procedure-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_delete_own_folder" on storage.objects;
create policy "storage_delete_own_folder" on storage.objects for delete
  to authenticated using (
    bucket_id = 'procedure-files'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_higher_authority())
  );

-- ---------------------------------------------------------------------------
-- Seed a few common surgical specialties (idempotent)
-- ---------------------------------------------------------------------------
insert into public.surgical_specialties (name, description, global)
values
  ('Cardiology', 'Heart and cardiovascular procedures', true),
  ('Orthopedics', 'Bones, joints, and musculoskeletal procedures', true),
  ('Neurology', 'Brain and nervous system procedures', true),
  ('General Surgery', 'General surgical procedures', true),
  ('Ophthalmology', 'Eye procedures', true),
  ('ENT', 'Ear, nose, and throat procedures', true)
on conflict (name) do nothing;
