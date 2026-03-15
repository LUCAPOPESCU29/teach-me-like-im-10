-- Run this in the Supabase SQL Editor to set up the database schema

-- Profiles table: extends Supabase Auth users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  avatar_url text,
  total_xp integer not null default 0,
  streak_count integer not null default 0,
  streak_last_date date,
  lang text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Topic progress table
create table public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  topic_name text not null,
  lang text not null default 'en',
  levels jsonb not null default '[]',
  max_level integer not null default 0,
  quiz_score integer,
  teach_back_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, slug, lang)
);

alter table public.topic_progress enable row level security;

create policy "Users can manage own progress"
  on public.topic_progress for all using (auth.uid() = user_id);

-- Flashcards table
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_slug text not null,
  lang text not null default 'en',
  front text not null,
  back text not null,
  difficulty text not null default 'medium',
  next_review timestamptz not null default now(),
  interval_days integer not null default 1,
  ease_factor real not null default 2.5,
  created_at timestamptz not null default now()
);

alter table public.flashcards enable row level security;

create policy "Users can manage own flashcards"
  on public.flashcards for all using (auth.uid() = user_id);

-- XP events table: tracks every XP gain for history and activity calendar
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  source text not null default 'level',
  topic_slug text,
  created_at timestamptz not null default now()
);

alter table public.xp_events enable row level security;

create policy "Users can manage own xp events"
  on public.xp_events for all using (auth.uid() = user_id);

-- Bookmarks table
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_slug text not null,
  topic_name text not null,
  lang text not null default 'en',
  created_at timestamptz not null default now(),
  unique(user_id, topic_slug)
);

alter table public.bookmarks enable row level security;

create policy "Users can manage own bookmarks"
  on public.bookmarks for all using (auth.uid() = user_id);

-- Indexes
create index idx_profiles_xp on public.profiles(total_xp desc);
create index idx_flashcards_review on public.flashcards(user_id, next_review);
create index idx_topic_progress_user on public.topic_progress(user_id);
create index idx_xp_events_user on public.xp_events(user_id, created_at desc);
create index idx_bookmarks_user on public.bookmarks(user_id);

-- Daily challenges table: one row per day, caches generated content
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  topic_name text not null,
  topic_slug text not null,
  level_content text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.daily_challenges enable row level security;

create policy "Daily challenges are viewable by everyone"
  on public.daily_challenges for select using (true);

create policy "Daily challenges can be inserted by anyone"
  on public.daily_challenges for insert with check (true);

create index idx_daily_challenges_date on public.daily_challenges(date desc);

-- Daily challenge completions
create table public.daily_challenge_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_date date not null,
  score integer not null,
  total integer not null default 5,
  xp_earned integer not null,
  completed_at timestamptz not null default now(),
  unique(user_id, challenge_date)
);

alter table public.daily_challenge_completions enable row level security;

create policy "Users can manage own daily completions"
  on public.daily_challenge_completions for all using (auth.uid() = user_id);

create index idx_daily_completions_user on public.daily_challenge_completions(user_id, challenge_date);

-- Friend challenges: shareable quiz challenges
create table public.friend_challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  creator_name text not null default 'Anonymous',
  topic_name text not null,
  topic_slug text not null,
  questions jsonb not null,
  lang text not null default 'en',
  max_participants integer not null default 4,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

alter table public.friend_challenges enable row level security;

create policy "Challenges are viewable by everyone"
  on public.friend_challenges for select using (true);

create policy "Anyone can create challenges"
  on public.friend_challenges for insert with check (true);

create index idx_friend_challenges_code on public.friend_challenges(code);

-- Challenge participants
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.friend_challenges(id) on delete cascade,
  participant_name text not null default 'Anonymous',
  score integer,
  total integer not null default 5,
  completed_at timestamptz,
  joined_at timestamptz not null default now(),
  unique(challenge_id, participant_name)
);

alter table public.challenge_participants enable row level security;

create policy "Participants are viewable by everyone"
  on public.challenge_participants for select using (true);

create policy "Anyone can join challenges"
  on public.challenge_participants for insert with check (true);

create policy "Anyone can update participants"
  on public.challenge_participants for update using (true);

create index idx_challenge_participants on public.challenge_participants(challenge_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Learner')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Shared topics: "Teach a Friend" shareable topic links
create table public.shared_topics (
  id uuid primary key default gen_random_uuid(),
  share_code text not null unique,
  sharer_user_id uuid references public.profiles(id) on delete set null,
  sharer_name text not null default 'A friend',
  topic_slug text not null,
  topic_name text not null,
  lang text not null default 'en',
  levels jsonb not null default '[]',
  max_level integer not null default 0,
  personal_message text,
  created_at timestamptz not null default now()
);

alter table public.shared_topics enable row level security;

create policy "Shared topics are viewable by everyone"
  on public.shared_topics for select using (true);

create policy "Anyone can create shared topics"
  on public.shared_topics for insert with check (true);

create index idx_shared_topics_code on public.shared_topics(share_code);
create index idx_shared_topics_user on public.shared_topics(sharer_user_id);
