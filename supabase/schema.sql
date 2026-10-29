-- Alore BookTracker — Supabase schema, default-shelf seeding, and RLS policies.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  annual_goal int not null default 5,
  avatar_color text not null default '#6BA3D6',
  created_at timestamptz not null default now()
);

create table if not exists public.shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  kind text not null default 'custom' check (kind in ('status', 'favourite', 'custom')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shelf_id uuid references public.shelves (id) on delete set null,
  title text not null,
  authors text[] not null default '{}',
  cover_url text,
  page_count int,
  current_page int not null default 0,
  categories text[] not null default '{}',
  isbn text,
  source text check (source in ('openlibrary', 'google', 'manual')),
  source_id text,
  epub_available boolean not null default false,
  epub_download_url text,
  is_favourite boolean not null default false,
  rating smallint check (rating between 1 and 5),
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extra, non-exclusive shelves a book can also sit on (e.g. "Book Club 2026")
create table if not exists public.book_shelves (
  book_id uuid not null references public.books (id) on delete cascade,
  shelf_id uuid not null references public.shelves (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (book_id, shelf_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_user_id_idx on public.books (user_id);
create index if not exists books_shelf_id_idx on public.books (shelf_id);
create index if not exists notes_book_id_idx on public.notes (book_id);
create index if not exists shelves_user_id_idx on public.shelves (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_books_updated_at on public.books;
create trigger set_books_updated_at before update on public.books
  for each row execute function public.set_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New-user seed: profile row + the four default shelves, created dynamically
-- (not hard-coded in the UI) the moment someone signs up.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));

  insert into public.shelves (user_id, name, slug, kind, sort_order) values
    (new.id, 'Currently Reading', 'currently-reading', 'status', 0),
    (new.id, 'Want to Read', 'want-to-read', 'status', 1),
    (new.id, 'Read', 'read', 'status', 2),
    (new.id, 'Favourites', 'favourites', 'favourite', 3);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security — every table is scoped to auth.uid() = user_id
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.shelves enable row level security;
alter table public.books enable row level security;
alter table public.book_shelves enable row level security;
alter table public.notes enable row level security;

create policy "Profiles are self-readable" on public.profiles
  for select using (auth.uid() = id);
create policy "Profiles are self-updatable" on public.profiles
  for update using (auth.uid() = id);

create policy "Shelves are owned by their user" on public.shelves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Books are owned by their user" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Book-shelf links are owned by their user" on public.book_shelves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Notes are owned by their user" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
