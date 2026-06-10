create table if not exists public.player_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_quest_ids text[] not null default '{}',
  walked_meters double precision not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.player_states enable row level security;

drop policy if exists "Players can read own state" on public.player_states;
create policy "Players can read own state"
on public.player_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Players can insert own state" on public.player_states;
create policy "Players can insert own state"
on public.player_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Players can update own state" on public.player_states;
create policy "Players can update own state"
on public.player_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
