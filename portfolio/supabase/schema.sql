-- Ahmadou Lamine Diouf Portfolio CMS
-- Apply this script in Supabase SQL Editor for a fresh project.
-- The only browser-exposed key is the publishable key. Never expose service_role / sb_secret.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.is_portfolio_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select coalesce(
    (auth.jwt() ->> 'email') = 'ahmadoulaminediouf39@gmail.com'
    and coalesce(auth.jwt() ->> 'is_anonymous','false') <> 'true',
    false
  );
$$;
revoke all on function public.is_portfolio_admin() from public, anon;
grant execute on function public.is_portfolio_admin() to authenticated;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null, location text, country text,
  start_date date, end_date date,
  status text not null default 'upcoming' check(status in ('upcoming','past')),
  role_en text, role_fr text, summary_en text, summary_fr text,
  cover_image text, gallery_urls text[] not null default '{}',
  sort_order integer not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null, organization text not null,
  start_date date, end_date date, is_current boolean not null default false,
  description_en text, description_fr text,
  skills text[] not null default '{}', image_urls text[] not null default '{}',
  sort_order integer not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.diplomas (
  id uuid primary key default gen_random_uuid(),
  title text not null, institution text not null, year integer,
  details_en text, details_fr text, image_url text,
  sort_order integer not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.initiatives (
  id uuid primary key default gen_random_uuid(),
  title text not null, category text, status text not null default 'ongoing',
  start_date date, end_date date, description_en text, description_fr text,
  image_urls text[] not null default '{}', link_url text,
  sort_order integer not null default 0, is_published boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.profile (
  id smallint primary key default 1 check(id = 1),
  full_name text not null default 'Ahmadou Lamine Diouf',
  title_en text, title_fr text, signature_en text, signature_fr text,
  location text, phone text, email text, linkedin_url text,
  intro_en text, intro_fr text, photo_url text,
  updated_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated;
grant select on public.events, public.experiences, public.diplomas, public.initiatives, public.profile to anon, authenticated;
grant insert, update, delete on public.events, public.experiences, public.diplomas, public.initiatives, public.profile to authenticated;

alter table public.events enable row level security;
alter table public.experiences enable row level security;
alter table public.diplomas enable row level security;
alter table public.initiatives enable row level security;
alter table public.profile enable row level security;

-- Anonymous visitors can only read published public content.
-- The owner can read drafts and manage all rows.
drop policy if exists "Public read published events" on public.events;
create policy "Public read published events" on public.events for select to anon using(is_published = true);
drop policy if exists "Portfolio admin read all events" on public.events;
create policy "Portfolio admin read all events" on public.events for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert events" on public.events;
create policy "Portfolio admin insert events" on public.events for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update events" on public.events;
create policy "Portfolio admin update events" on public.events for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete events" on public.events;
create policy "Portfolio admin delete events" on public.events for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published experiences" on public.experiences;
create policy "Public read published experiences" on public.experiences for select to anon using(is_published = true);
drop policy if exists "Portfolio admin read all experiences" on public.experiences;
create policy "Portfolio admin read all experiences" on public.experiences for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert experiences" on public.experiences;
create policy "Portfolio admin insert experiences" on public.experiences for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update experiences" on public.experiences;
create policy "Portfolio admin update experiences" on public.experiences for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete experiences" on public.experiences;
create policy "Portfolio admin delete experiences" on public.experiences for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published diplomas" on public.diplomas;
create policy "Public read published diplomas" on public.diplomas for select to anon using(is_published = true);
drop policy if exists "Portfolio admin read all diplomas" on public.diplomas;
create policy "Portfolio admin read all diplomas" on public.diplomas for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert diplomas" on public.diplomas;
create policy "Portfolio admin insert diplomas" on public.diplomas for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update diplomas" on public.diplomas;
create policy "Portfolio admin update diplomas" on public.diplomas for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete diplomas" on public.diplomas;
create policy "Portfolio admin delete diplomas" on public.diplomas for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published initiatives" on public.initiatives;
create policy "Public read published initiatives" on public.initiatives for select to anon using(is_published = true);
drop policy if exists "Portfolio admin read all initiatives" on public.initiatives;
create policy "Portfolio admin read all initiatives" on public.initiatives for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert initiatives" on public.initiatives;
create policy "Portfolio admin insert initiatives" on public.initiatives for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update initiatives" on public.initiatives;
create policy "Portfolio admin update initiatives" on public.initiatives for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete initiatives" on public.initiatives;
create policy "Portfolio admin delete initiatives" on public.initiatives for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read portfolio profile" on public.profile;
create policy "Public read portfolio profile" on public.profile for select to anon, authenticated using(true);
drop policy if exists "Portfolio admin insert profile" on public.profile;
create policy "Portfolio admin insert profile" on public.profile for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update profile" on public.profile;
create policy "Portfolio admin update profile" on public.profile for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at before update on public.experiences for each row execute function public.set_updated_at();
drop trigger if exists diplomas_set_updated_at on public.diplomas;
create trigger diplomas_set_updated_at before update on public.diplomas for each row execute function public.set_updated_at();
drop trigger if exists initiatives_set_updated_at on public.initiatives;
create trigger initiatives_set_updated_at before update on public.initiatives for each row execute function public.set_updated_at();
drop trigger if exists profile_set_updated_at on public.profile;
create trigger profile_set_updated_at before update on public.profile for each row execute function public.set_updated_at();

-- Public read by stable URL; only the authenticated owner may upload/update/delete.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('portfolio-media','portfolio-media',true,12582912,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Portfolio admin upload media" on storage.objects;
create policy "Portfolio admin upload media" on storage.objects for insert to authenticated with check(bucket_id='portfolio-media' and public.is_portfolio_admin());
drop policy if exists "Portfolio admin update media" on storage.objects;
create policy "Portfolio admin update media" on storage.objects for update to authenticated using(bucket_id='portfolio-media' and public.is_portfolio_admin()) with check(bucket_id='portfolio-media' and public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete media" on storage.objects;
create policy "Portfolio admin delete media" on storage.objects for delete to authenticated using(bucket_id='portfolio-media' and public.is_portfolio_admin());
drop policy if exists "Portfolio admin list media" on storage.objects;
create policy "Portfolio admin list media" on storage.objects for select to authenticated using(bucket_id='portfolio-media' and public.is_portfolio_admin());

insert into public.profile(id,full_name,title_en,title_fr,signature_en,signature_fr,location,phone,email,linkedin_url,intro_en,intro_fr)
values(1,'Ahmadou Lamine Diouf',
'Biomanufacturing Specialist | Advocating for African Vaccine Manufacturing',
'Spécialiste en bioproduction | Engagé pour la fabrication de vaccins en Afrique',
'Advocating for African Vaccine Manufacturing','Engagé pour la fabrication de vaccins en Afrique',
'Dakar, Senegal','+221 77 101 82 90','ahmadoulaminediouf39@gmail.com',
'https://www.linkedin.com/in/ahmadou-lamine-diouf-003a98321/',
'Working at the intersection of biomanufacturing, scientific solutions and advocacy to help strengthen Africa’s capacity to develop and produce vaccines.',
'À la croisée de la bioproduction, des solutions scientifiques et du plaidoyer, je contribue à promouvoir le renforcement des capacités africaines de développement et de fabrication des vaccins.')
on conflict(id) do nothing;
