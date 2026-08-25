-- CableFlow private workspaces (access by secret UUID via Edge Function only)
-- Direct table access is denied for anon/authenticated; service role used by Edge Function.

create table if not exists public.cableflow_workspaces (
  id uuid primary key,
  payload jsonb not null default '{}'::jsonb,
  payload_version integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_access_at timestamptz not null default now()
);

create index if not exists cableflow_workspaces_updated_at_idx
  on public.cableflow_workspaces (updated_at desc);

alter table public.cableflow_workspaces enable row level security;

-- No policies for anon/authenticated → no direct client access.
-- Edge Function uses service role (bypasses RLS).

comment on table public.cableflow_workspaces is
  'CableFlow AppData blobs. Access only via cableflow-workspace Edge Function with secret UUID.';
