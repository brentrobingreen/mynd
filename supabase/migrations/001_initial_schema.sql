-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  name text,
  avatar text,
  created_at timestamptz default now() not null,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'premium', 'lifetime')),
  stripe_customer_id text unique,
  readwise_token text
);

-- Books
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  author text not null,
  cover_url text,
  source text not null check (source in ('kindle', 'readwise', 'manual')),
  date_added timestamptz default now() not null,
  date_read timestamptz,
  is_core boolean default false not null,
  resonance_score numeric(4,2) default 0 not null,
  tags text[] default '{}' not null
);

create index books_user_id_idx on public.books(user_id);

-- Highlights
create table public.highlights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  text text not null,
  note text,
  location text,
  date_highlighted timestamptz,
  embedding_id text,
  source text not null check (source in ('kindle', 'readwise', 'manual')),
  created_at timestamptz default now() not null
);

create index highlights_user_id_idx on public.highlights(user_id);
create index highlights_book_id_idx on public.highlights(book_id);

-- Brains
create table public.brains (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  description text,
  book_ids uuid[] default '{}' not null,
  created_at timestamptz default now() not null
);

create index brains_user_id_idx on public.brains(user_id);

-- Conversations
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  brain_id uuid references public.brains(id) on delete cascade not null,
  title text,
  created_at timestamptz default now() not null
);

create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_brain_id_idx on public.conversations(brain_id);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source_highlights jsonb default '[]' not null,
  created_at timestamptz default now() not null
);

create index messages_conversation_id_idx on public.messages(conversation_id);

-- Journal entries
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  linked_highlights uuid[] default '{}' not null,
  created_at timestamptz default now() not null
);

create index journal_entries_user_id_idx on public.journal_entries(user_id);

-- Daily digests
create table public.daily_digests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  source_highlights jsonb default '[]' not null,
  date date not null,
  opened_at timestamptz,
  created_at timestamptz default now() not null,
  unique(user_id, date)
);

create index daily_digests_user_id_idx on public.daily_digests(user_id);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------

alter table public.users enable row level security;
alter table public.books enable row level security;
alter table public.highlights enable row level security;
alter table public.brains enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.journal_entries enable row level security;
alter table public.daily_digests enable row level security;

-- Users: only own row
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Books: only own rows
create policy "Users manage own books" on public.books for all using (auth.uid() = user_id);

-- Highlights: only own rows
create policy "Users manage own highlights" on public.highlights for all using (auth.uid() = user_id);

-- Brains: only own rows
create policy "Users manage own brains" on public.brains for all using (auth.uid() = user_id);

-- Conversations: only own rows
create policy "Users manage own conversations" on public.conversations for all using (auth.uid() = user_id);

-- Messages: via conversation ownership
create policy "Users manage own messages" on public.messages for all using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- Journal entries: only own rows
create policy "Users manage own journal entries" on public.journal_entries for all using (auth.uid() = user_id);

-- Daily digests: only own rows
create policy "Users manage own daily digests" on public.daily_digests for all using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Function: auto-create user profile on signup
-- ---------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- Function: update resonance_score on highlight insert
-- ---------------------------------------------------------------

create or replace function public.update_resonance_score()
returns trigger as $$
declare
  total_highlights int;
  max_highlights int;
begin
  select count(*) into total_highlights
  from public.highlights
  where book_id = new.book_id;

  select max(sub.cnt) into max_highlights
  from (
    select count(*) as cnt
    from public.highlights
    where user_id = new.user_id
    group by book_id
  ) sub;

  if max_highlights > 0 then
    update public.books
    set resonance_score = round((total_highlights::numeric / max_highlights::numeric) * 10, 2)
    where id = new.book_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_highlight_inserted
  after insert on public.highlights
  for each row execute procedure public.update_resonance_score();
