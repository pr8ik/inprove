-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb
);
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text not null,
  icon text,
  created_at timestamptz default now()
);
alter table categories enable row level security;
create policy "Users can CRUD own categories" on categories for all using (auth.uid() = user_id);

-- TIME LOGS
create table time_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  category_id uuid references categories,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds int, -- Generated col or computed
  value_score int check (value_score >= 0 and value_score <= 100),
  energy_level int check (energy_level >= 1 and energy_level <= 10),
  note text,
  created_at timestamptz default now()
);
alter table time_logs enable row level security;
create policy "Users can CRUD own logs" on time_logs for all using (auth.uid() = user_id);

-- HABIT PROGRAMS
create table habit_programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  start_date date default current_date,
  end_date date,
  status text check (status in ('active', 'paused', 'completed')) default 'active',
  created_at timestamptz default now()
);
alter table habit_programs enable row level security;
create policy "Users can CRUD own programs" on habit_programs for all using (auth.uid() = user_id);

-- HABIT ITEMS
create table habit_items (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references habit_programs on delete cascade not null,
  name text not null,
  target_value int default 1,
  target_unit text default 'count',
  frequency jsonb default '["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]'::jsonb,
  created_at timestamptz default now()
);
alter table habit_items enable row level security;
create policy "Users can CRUD own items" on habit_items for all using (
  exists (select 1 from habit_programs where id = habit_items.program_id and user_id = auth.uid())
);

-- HABIT LOGS
create table habit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  habit_item_id uuid references habit_items on delete cascade not null,
  date date default current_date,
  value_achieved int default 0,
  is_completed boolean default false,
  created_at timestamptz default now(),
  unique(habit_item_id, date)
);
alter table habit_logs enable row level security;
create policy "Users can CRUD own habit logs" on habit_logs for all using (auth.uid() = user_id);
