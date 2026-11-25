create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  role text not null default 'client' check (role in ('client','artisan','admin')),
  city text,
  specialty text,
  avatar text,
  gallery jsonb not null default '[]'::jsonb,
  bio text,
  experience_years integer not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.artisans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  name text not null,
  city text,
  category text,
  spec text,
  bio text,
  experience_years integer not null default 0,
  image text,
  rating numeric(3,2) not null default 0,
  verified boolean not null default false,
  is_elite boolean not null default false,
  status text not null default 'active',
  portfolio jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  category_label text,
  description text,
  price numeric(12,2) not null default 0,
  spec text,
  image text,
  badge text,
  stock integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid references public.artisans(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  artisan text,
  client text,
  service text,
  city text,
  location text,
  date date,
  notes text,
  price numeric(12,2),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  artisan_id uuid,
  sender_id uuid references public.profiles(id) on delete cascade,
  sender_name text,
  receiver_id uuid references public.profiles(id) on delete cascade,
  receiver_name text,
  content text not null,
  status text not null default 'unread',
  type text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  artisan_id uuid references public.artisans(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  client text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id bigint generated always as identity primary key,
  icon text,
  text text not null,
  time text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_city_allowed') then
    alter table public.profiles add constraint profiles_city_allowed
      check (city is null or city in ('taroudant', 'agadir', 'marrakech')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'artisans_city_allowed') then
    alter table public.artisans add constraint artisans_city_allowed
      check (city is null or city in ('taroudant', 'agadir', 'marrakech')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bookings_city_allowed') then
    alter table public.bookings add constraint bookings_city_allowed
      check (city is null or city in ('taroudant', 'agadir', 'marrakech')) not valid;
  end if;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data->>'role', 'client');
begin
  if requested_role not in ('client', 'artisan') then
    requested_role := 'client';
  end if;

  insert into public.profiles (
    id, email, name, phone, role, city, specialty, avatar
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    requested_role,
    new.raw_user_meta_data->>'city',
    coalesce(new.raw_user_meta_data->>'specialty', new.raw_user_meta_data->>'category'),
    new.raw_user_meta_data->>'avatar'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    phone = excluded.phone,
    role = excluded.role,
    city = excluded.city,
    specialty = excluded.specialty,
    avatar = excluded.avatar;

  if requested_role = 'artisan' then
    insert into public.artisans (user_id, name, city, category, spec, status)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'city',
      coalesce(new.raw_user_meta_data->>'specialty', 'general'),
      coalesce(new.raw_user_meta_data->>'specialty', 'general'),
      'active'
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.guard_profile_security_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.verified is distinct from old.verified)
     and not public.is_admin() then
    raise exception 'Only an administrator can change profile role or verification status.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_security_fields on public.profiles;
create trigger profiles_guard_security_fields
  before update on public.profiles
  for each row execute procedure public.guard_profile_security_fields();

alter table public.profiles enable row level security;
alter table public.artisans enable row level security;
alter table public.tools enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.activities enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (
  auth.uid() = id and role in ('client', 'artisan') and verified = false
);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles for delete using (public.is_admin());

drop policy if exists "artisans_public_read" on public.artisans;
create policy "artisans_public_read" on public.artisans for select using (true);
drop policy if exists "artisans_owner_write" on public.artisans;
create policy "artisans_owner_write" on public.artisans for insert with check (auth.uid() = user_id or public.is_admin());
drop policy if exists "artisans_owner_update" on public.artisans;
create policy "artisans_owner_update" on public.artisans for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
drop policy if exists "artisans_admin_delete" on public.artisans;
create policy "artisans_admin_delete" on public.artisans for delete using (public.is_admin());

drop policy if exists "tools_public_read" on public.tools;
create policy "tools_public_read" on public.tools for select using (true);
drop policy if exists "tools_admin_write" on public.tools;
create policy "tools_admin_write" on public.tools for insert with check (public.is_admin());
drop policy if exists "tools_admin_update" on public.tools;
create policy "tools_admin_update" on public.tools for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tools_admin_delete" on public.tools;
create policy "tools_admin_delete" on public.tools for delete using (public.is_admin());

drop policy if exists "bookings_read" on public.bookings;
create policy "bookings_read" on public.bookings for select using (
  auth.uid() = client_id
  or public.is_admin()
  or exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid())
);
drop policy if exists "bookings_client_insert" on public.bookings;
create policy "bookings_client_insert" on public.bookings for insert with check (auth.uid() = client_id);
drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_update" on public.bookings for update using (
  auth.uid() = client_id
  or public.is_admin()
  or exists (select 1 from public.artisans a where a.id = artisan_id and a.user_id = auth.uid())
);
drop policy if exists "bookings_delete" on public.bookings;
create policy "bookings_delete" on public.bookings for delete using (auth.uid() = client_id or public.is_admin());

drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin()
);
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert with check (auth.uid() = sender_id);
drop policy if exists "messages_update" on public.messages;
create policy "messages_update" on public.messages for update using (
  auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin()
);

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);
drop policy if exists "reviews_client_insert" on public.reviews;
create policy "reviews_client_insert" on public.reviews for insert with check (auth.uid() = client_id);
drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_admin_update" on public.reviews for update using (public.is_admin());
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews for delete using (public.is_admin());

drop policy if exists "activities_read" on public.activities;
create policy "activities_read" on public.activities for select using (public.is_admin());
drop policy if exists "activities_insert" on public.activities;
create policy "activities_insert" on public.activities for insert with check (public.is_admin());

drop policy if exists "newsletter_public_insert" on public.newsletter_subscribers;
create policy "newsletter_public_insert" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "newsletter_admin_read" on public.newsletter_subscribers;
create policy "newsletter_admin_read" on public.newsletter_subscribers for select using (public.is_admin());
drop policy if exists "newsletter_admin_delete" on public.newsletter_subscribers;
create policy "newsletter_admin_delete" on public.newsletter_subscribers for delete using (public.is_admin());
