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
-- Remove inherited/default writes from PUBLIC and anon before granting least privilege.
revoke all privileges on public.events, public.experiences, public.diplomas, public.initiatives, public.profile from anon, public;
grant select on public.events, public.experiences, public.diplomas, public.initiatives, public.profile to anon;
grant select, insert, update, delete on public.events, public.experiences, public.diplomas, public.initiatives, public.profile to authenticated;

alter table public.events enable row level security;
alter table public.experiences enable row level security;
alter table public.diplomas enable row level security;
alter table public.initiatives enable row level security;
alter table public.profile enable row level security;

-- Anonymous visitors can only read published public content.
-- The owner can read drafts and manage all rows.
drop policy if exists "Public read published events" on public.events;
create policy "Public read published events" on public.events for select to anon, authenticated using(is_published = true);
drop policy if exists "Portfolio admin read all events" on public.events;
create policy "Portfolio admin read all events" on public.events for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert events" on public.events;
create policy "Portfolio admin insert events" on public.events for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update events" on public.events;
create policy "Portfolio admin update events" on public.events for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete events" on public.events;
create policy "Portfolio admin delete events" on public.events for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published experiences" on public.experiences;
create policy "Public read published experiences" on public.experiences for select to anon, authenticated using(is_published = true);
drop policy if exists "Portfolio admin read all experiences" on public.experiences;
create policy "Portfolio admin read all experiences" on public.experiences for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert experiences" on public.experiences;
create policy "Portfolio admin insert experiences" on public.experiences for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update experiences" on public.experiences;
create policy "Portfolio admin update experiences" on public.experiences for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete experiences" on public.experiences;
create policy "Portfolio admin delete experiences" on public.experiences for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published diplomas" on public.diplomas;
create policy "Public read published diplomas" on public.diplomas for select to anon, authenticated using(is_published = true);
drop policy if exists "Portfolio admin read all diplomas" on public.diplomas;
create policy "Portfolio admin read all diplomas" on public.diplomas for select to authenticated using(public.is_portfolio_admin());
drop policy if exists "Portfolio admin insert diplomas" on public.diplomas;
create policy "Portfolio admin insert diplomas" on public.diplomas for insert to authenticated with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin update diplomas" on public.diplomas;
create policy "Portfolio admin update diplomas" on public.diplomas for update to authenticated using(public.is_portfolio_admin()) with check(public.is_portfolio_admin());
drop policy if exists "Portfolio admin delete diplomas" on public.diplomas;
create policy "Portfolio admin delete diplomas" on public.diplomas for delete to authenticated using(public.is_portfolio_admin());

drop policy if exists "Public read published initiatives" on public.initiatives;
create policy "Public read published initiatives" on public.initiatives for select to anon, authenticated using(is_published = true);
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

-- Useful indexes for the public portfolio queries.
create index if not exists events_public_sort_idx on public.events(is_published,start_date desc,sort_order);
create index if not exists experiences_public_sort_idx on public.experiences(is_published,start_date desc,sort_order);
create index if not exists diplomas_public_sort_idx on public.diplomas(is_published,year desc,sort_order);
create index if not exists initiatives_public_sort_idx on public.initiatives(is_published,sort_order,created_at desc);

-- Initial profile and starter content. These inserts are idempotent.
insert into public.events(title,location,country,start_date,end_date,status,role_en,role_fr,summary_en,summary_fr,sort_order)
select
  'CPHIA 2026 & Youth Pre-Conference','Addis Ababa','Ethiopia',date '2026-11-22',date '2026-11-27','upcoming',
  'Participant','Participant',
  'Participation in the Africa CDC International Conference on Public Health in Africa and its youth pre-conference, contributing to discussions on African health sovereignty and local vaccine manufacturing.',
  'Participation à la Conférence internationale sur la santé publique en Afrique organisée par Africa CDC et à sa pré-conférence jeunesse, avec un intérêt particulier pour la souveraineté sanitaire africaine et la fabrication locale des vaccins.',
  10
where not exists(select 1 from public.events where title='CPHIA 2026 & Youth Pre-Conference');

insert into public.experiences(title,organization,is_current,description_en,description_fr,skills,sort_order)
select
  'Technical Sales Representative','DISLAB West Africa',true,
  'Scientific needs assessment and technical support for laboratories, helping connect users with relevant products, equipment and solutions.',
  'Analyse des besoins scientifiques et accompagnement technique des laboratoires, en facilitant la mise en relation des utilisateurs avec les produits, équipements et solutions adaptés.',
  array['Scientific needs assessment','Laboratory workflows','Technical support','Customer relations'],10
where not exists(select 1 from public.experiences where organization='DISLAB West Africa' and is_current=true);

insert into public.experiences(title,organization,is_current,description_en,description_fr,skills,sort_order)
select
  'Quality Control Laboratory Immersion','Institut Pasteur de Dakar',false,
  'Practical exposure to quality control in a biological products environment, including ELISA, HPLC, PCR and GMP/BPF quality-system principles.',
  'Immersion pratique dans un environnement de contrôle qualité des produits biologiques, avec une exposition à l’ELISA, la HPLC, la PCR et aux principes des systèmes qualité GMP/BPF.',
  array['ELISA','HPLC','PCR','GMP / BPF','Quality control'],20
where not exists(select 1 from public.experiences where organization='Institut Pasteur de Dakar' and title='Quality Control Laboratory Immersion');

insert into public.diplomas(title,institution,year,details_en,details_fr,sort_order)
select
  'Certificate in Vaccine Bioproduction','Institut Pasteur de Dakar / Université Rose Dieng',2026,
  'Specialised training combining theoretical foundations and practical exposure to vaccine bioproduction environments and processes.',
  'Formation spécialisée associant des bases théoriques et une exposition pratique aux environnements et procédés de bioproduction des vaccins.',10
where not exists(select 1 from public.diplomas where title='Certificate in Vaccine Bioproduction' and institution='Institut Pasteur de Dakar / Université Rose Dieng');

insert into public.diplomas(title,institution,year,details_en,details_fr,sort_order)
select
  'NOA–NIBRT Biopharmaceutical Manufacturing Training','NOA / NIBRT',2026,
  'Training in upstream and downstream operations, aseptic fill & finish, quality control and cleanroom behaviour in biopharmaceutical manufacturing.',
  'Formation aux opérations upstream et downstream, au fill & finish aseptique, au contrôle qualité et aux comportements en salle blanche dans l’industrie biopharmaceutique.',20
where not exists(select 1 from public.diplomas where title='NOA–NIBRT Biopharmaceutical Manufacturing Training');

insert into public.initiatives(title,category,status,description_en,description_fr,sort_order)
select
  'Student Ambassador — MADIBA Programme','Youth engagement','ongoing',
  'Supporting skills development and awareness around vaccine biomanufacturing, and encouraging students to explore careers in this strategic field.',
  'Contribution à la sensibilisation et au développement des compétences autour de la bioproduction vaccinale, tout en encourageant les étudiants à découvrir les carrières de ce secteur stratégique.',10
where not exists(select 1 from public.initiatives where title='Student Ambassador — MADIBA Programme');

insert into public.initiatives(title,category,status,description_en,description_fr,sort_order)
select
  'Introduction to Vaccine Biomanufacturing','Book / Knowledge sharing','in_progress',
  'A forthcoming introductory book designed to make the fundamentals of vaccine biomanufacturing clearer and more accessible to French-speaking students and young professionals.',
  'Un ouvrage d’introduction en cours de finalisation, conçu pour rendre les fondamentaux de la bioproduction vaccinale plus clairs et accessibles aux étudiants et jeunes professionnels francophones.',20
where not exists(select 1 from public.initiatives where title='Introduction to Vaccine Biomanufacturing');

-- CPHIA digital business card: visitor-consented contact shares.
-- Public visitors can INSERT only; only the portfolio owner can SELECT.
create table if not exists public.received_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  phone text not null check (char_length(btrim(phone)) between 7 and 40 and phone ~ '^[0-9+(). -]+$'),
  email text check (email is null or char_length(email) <= 254),
  organization text check (organization is null or char_length(organization) <= 180),
  share_method text not null default 'autofill' check (share_method in ('contact_picker','autofill')),
  created_at timestamptz not null default now()
);

revoke all privileges on public.received_contacts from public, anon, authenticated;
grant insert on public.received_contacts to anon, authenticated;
grant select on public.received_contacts to authenticated;

alter table public.received_contacts enable row level security;

drop policy if exists "Visitors can submit shared contacts" on public.received_contacts;
create policy "Visitors can submit shared contacts"
  on public.received_contacts for insert to anon, authenticated
  with check (true);

drop policy if exists "Portfolio owner can read received contacts" on public.received_contacts;
create policy "Portfolio owner can read received contacts"
  on public.received_contacts for select to authenticated
  using (public.is_portfolio_admin());

create index if not exists received_contacts_created_at_idx
  on public.received_contacts(created_at desc);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'received_contacts'
     ) then
    execute 'alter publication supabase_realtime add table public.received_contacts';
  end if;
end $$;
