-- Helpful Support Supabase API Lab v0.2
-- Reference schema for a clean environment. This is intentionally stored
-- outside supabase/migrations; create a real migration with the Supabase CLI
-- before applying it to another production project.

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.hs_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.hs_set_updated_at() from public, anon, authenticated;

create table public.hs_api_families (
  slug text primary key check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  summary text not null,
  search_text text not null,
  problems jsonb not null default '[]'::jsonb check (jsonb_typeof(problems) = 'array'),
  examples jsonb not null default '[]'::jsonb check (jsonb_typeof(examples) = 'array'),
  risks jsonb not null default '[]'::jsonb check (jsonb_typeof(risks) = 'array'),
  project_uses jsonb not null default '[]'::jsonb check (jsonb_typeof(project_uses) = 'array'),
  tags text[] not null default '{}',
  maturity smallint not null default 1 check (maturity between 1 and 5),
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  search_vector tsvector generated always as
    (to_tsvector('simple'::regconfig, search_text)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hs_api_families_search_vector_idx
  on public.hs_api_families using gin (search_vector);
create index hs_api_families_tags_idx
  on public.hs_api_families using gin (tags);

create trigger hs_api_families_set_updated_at
before update on public.hs_api_families
for each row execute function private.hs_set_updated_at();

alter table public.hs_api_families enable row level security;
revoke all on table public.hs_api_families from anon, authenticated;
grant select on table public.hs_api_families to anon, authenticated;

create policy "hs_families_public_read"
on public.hs_api_families for select
to anon, authenticated
using (status = 'published');

create table public.hs_api_examples (
  id uuid primary key default gen_random_uuid(),
  family_slug text not null references public.hs_api_families(slug) on delete cascade,
  name text not null,
  method text not null
    check (method in ('GET','POST','PATCH','PUT','DELETE','RPC','EVENT')),
  endpoint_template text not null,
  auth_type text not null
    check (auth_type in ('none','publishable_key','user_jwt','server_secret','oauth')),
  language text not null default 'http',
  code text not null,
  notes text,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create index hs_api_examples_family_idx on public.hs_api_examples(family_slug);
alter table public.hs_api_examples enable row level security;
revoke all on table public.hs_api_examples from anon, authenticated;
grant select on table public.hs_api_examples to anon, authenticated;

create policy "hs_examples_public_read"
on public.hs_api_examples for select
to anon, authenticated
using (is_public);

create table public.hs_learning_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  family_slug text references public.hs_api_families(slug) on delete set null,
  objective text not null,
  request_method text
    check (request_method is null or request_method in
      ('GET','POST','PATCH','PUT','DELETE','RPC','EVENT')),
  status text not null default 'planned'
    check (status in ('planned','running','succeeded','failed','reviewed')),
  response_status integer
    check (response_status is null or response_status between 100 and 599),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  succeeded boolean,
  notes text,
  evidence jsonb not null default '{}'::jsonb
    check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hs_learning_runs_user_created_idx
  on public.hs_learning_runs(user_id, created_at desc);
create index hs_learning_runs_family_idx
  on public.hs_learning_runs(family_slug);

create trigger hs_learning_runs_set_updated_at
before update on public.hs_learning_runs
for each row execute function private.hs_set_updated_at();

alter table public.hs_learning_runs enable row level security;
revoke all on table public.hs_learning_runs from anon, authenticated;
grant select, insert, update, delete on public.hs_learning_runs to authenticated;

create policy "hs_runs_select_own"
on public.hs_learning_runs for select to authenticated
using ((select auth.uid()) = user_id);
create policy "hs_runs_insert_own"
on public.hs_learning_runs for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "hs_runs_update_own"
on public.hs_learning_runs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "hs_runs_delete_own"
on public.hs_learning_runs for delete to authenticated
using ((select auth.uid()) = user_id);

create table public.hs_search_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  query text not null,
  result_slugs text[] not null default '{}',
  useful boolean,
  comment text,
  created_at timestamptz not null default now()
);

create index hs_search_feedback_user_created_idx
  on public.hs_search_feedback(user_id, created_at desc);

alter table public.hs_search_feedback enable row level security;
revoke all on table public.hs_search_feedback from anon, authenticated;
grant select, insert, update, delete on public.hs_search_feedback to authenticated;

create policy "hs_feedback_select_own"
on public.hs_search_feedback for select to authenticated
using ((select auth.uid()) = user_id);
create policy "hs_feedback_insert_own"
on public.hs_search_feedback for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "hs_feedback_update_own"
on public.hs_search_feedback for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "hs_feedback_delete_own"
on public.hs_search_feedback for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.hs_search_library(
  search_query text,
  result_limit integer default 10
)
returns table (slug text, name text, summary text, tags text[], rank real)
language sql
stable
security invoker
set search_path = ''
as $$
  with query_terms as (
    select to_tsquery(
      'simple'::regconfig,
      string_agg(quote_literal(term) || ':*', ' | ')
    ) as query
    from unnest(
      tsvector_to_array(
        to_tsvector('simple'::regconfig, coalesce(search_query, ''))
      )
    ) as term
  )
  select
    f.slug,
    f.name,
    f.summary,
    f.tags,
    ts_rank(f.search_vector, q.query)::real
  from public.hs_api_families as f
  cross join query_terms as q
  where f.status = 'published'
    and length(trim(coalesce(search_query, ''))) >= 2
    and q.query is not null
    and f.search_vector @@ q.query
  order by 5 desc, f.name
  limit greatest(1, least(coalesce(result_limit, 10), 50));
$$;

revoke all on function public.hs_search_library(text, integer) from public;
grant execute on function public.hs_search_library(text, integer) to anon, authenticated;

alter publication supabase_realtime add table public.hs_learning_runs;

commit;

-- Populate hs_api_families from catalog/api_families.json with:
-- python scripts/sync_catalog_supabase.py
