-- Public portfolio platform: isolated schema objects only.
-- Existing personal portfolio tables and policies are intentionally untouched.

create table if not exists public.public_profiles (
  slug text primary key check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$'),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  title_en text not null check (char_length(btrim(title_en)) between 2 and 180),
  title_fr text,
  bio_en text not null check (char_length(btrim(bio_en)) between 10 and 2400),
  bio_fr text not null check (char_length(btrim(bio_fr)) between 10 and 2400),
  organization text,
  location text,
  photo_url text,
  whatsapp text,
  linkedin_url text,
  email text,
  pin_salt text,
  pin_hash text,
  recovery_hash text,
  is_demo boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is null or char_length(email) <= 254),
  check (whatsapp is null or char_length(whatsapp) <= 40),
  check (linkedin_url is null or char_length(linkedin_url) <= 500),
  check (is_demo or (pin_salt is not null and pin_hash is not null))
);

create table if not exists public.public_experiences (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.public_profiles(slug) on delete cascade,
  title_en text not null,
  title_fr text,
  organization text,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description_en text,
  description_fr text,
  skills text[] not null default '{}',
  image_urls text[] not null default '{}',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_diplomas (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.public_profiles(slug) on delete cascade,
  title_en text not null,
  title_fr text,
  institution text,
  year integer check (year is null or year between 1900 and 2200),
  details_en text,
  details_fr text,
  image_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.public_profiles(slug) on delete cascade,
  title_en text not null,
  title_fr text,
  location text,
  country text,
  start_date date,
  end_date date,
  status text not null default 'past' check (status in ('upcoming','past')),
  role_en text,
  role_fr text,
  summary_en text,
  summary_fr text,
  cover_image text,
  gallery_urls text[] not null default '{}',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_initiatives (
  id uuid primary key default gen_random_uuid(),
  slug text not null references public.public_profiles(slug) on delete cascade,
  title_en text not null,
  title_fr text,
  category text,
  status text not null default 'ongoing' check (status in ('ongoing','completed','planned')),
  start_date date,
  end_date date,
  description_en text,
  description_fr text,
  image_urls text[] not null default '{}',
  link_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_contacts (
  id uuid primary key default gen_random_uuid(),
  owner_slug text not null references public.public_profiles(slug) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  phone text,
  email text,
  organization text,
  share_method text not null default 'autofill' check (share_method in ('contact_picker','autofill')),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (phone is null or (char_length(phone) between 7 and 40 and phone ~ '^[0-9+(). -]+$')),
  check (email is null or char_length(email) <= 254),
  check (organization is null or char_length(organization) <= 180),
  check (nullif(btrim(phone),'') is not null or nullif(btrim(email),'') is not null)
);

-- Server-side sessions: only token hashes are persisted.
create table if not exists public.public_sessions (
  token_hash text primary key,
  owner_slug text not null references public.public_profiles(slug) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Atomic rate limiting for PIN attempts, account creation and contact sharing.
create table if not exists public.public_rate_limits (
  rate_key text primary key,
  action text not null,
  attempts integer not null default 0 check (attempts >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists public_experiences_slug_sort_idx on public.public_experiences(slug, sort_order, start_date desc);
create index if not exists public_diplomas_slug_sort_idx on public.public_diplomas(slug, sort_order, year desc);
create index if not exists public_events_slug_sort_idx on public.public_events(slug, sort_order, start_date desc);
create index if not exists public_initiatives_slug_sort_idx on public.public_initiatives(slug, sort_order, created_at desc);
create index if not exists public_contacts_owner_created_idx on public.public_contacts(owner_slug, created_at desc);
create index if not exists public_sessions_expiry_idx on public.public_sessions(expires_at);
create index if not exists public_sessions_owner_slug_idx on public.public_sessions(owner_slug);

-- No anonymous/authenticated direct Data API access. The Edge Function uses the server secret.
alter table public.public_profiles enable row level security;
alter table public.public_experiences enable row level security;
alter table public.public_diplomas enable row level security;
alter table public.public_events enable row level security;
alter table public.public_initiatives enable row level security;
alter table public.public_contacts enable row level security;
alter table public.public_sessions enable row level security;
alter table public.public_rate_limits enable row level security;

revoke all privileges on public.public_profiles, public.public_experiences, public.public_diplomas,
  public.public_events, public.public_initiatives, public.public_contacts, public.public_sessions,
  public.public_rate_limits from public, anon, authenticated;

grant all privileges on public.public_profiles, public.public_experiences, public.public_diplomas,
  public.public_events, public.public_initiatives, public.public_contacts, public.public_sessions,
  public.public_rate_limits to service_role;

-- This SECURITY DEFINER helper is executable by the backend role only.
create or replace function public.consume_public_platform_rate_limit(
  p_rate_key text,
  p_action text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.public_rate_limits%rowtype;
  v_reset boolean;
begin
  if p_rate_key is null or length(p_rate_key) < 32 or length(p_rate_key) > 128
     or p_action not in ('login','create','contact')
     or p_max_attempts < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.public_rate_limits(rate_key, action, attempts, window_started_at, updated_at)
  values (p_rate_key, p_action, 1, now(), now())
  on conflict (rate_key) do update
  set
    attempts = case
      when public.public_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else public.public_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.public_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else public.public_rate_limits.window_started_at
    end,
    blocked_until = case
      when public.public_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then null
      when public.public_rate_limits.attempts + 1 > p_max_attempts
        then now() + make_interval(secs => p_window_seconds)
      else public.public_rate_limits.blocked_until
    end,
    updated_at = now()
  returning * into v_row;

  return query
    select
      (v_row.attempts <= p_max_attempts and (v_row.blocked_until is null or v_row.blocked_until <= now())),
      case when v_row.blocked_until > now()
        then greatest(1, ceil(extract(epoch from (v_row.blocked_until - now())))::integer)
        else 0
      end;
end;
$$;

revoke all on function public.consume_public_platform_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_public_platform_rate_limit(text,text,integer,integer) to service_role;

-- Dedicated public image bucket. The portfolio-media bucket is not touched.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('public-portfolios-media','public-portfolios-media',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Fictitious demonstration profile only. It has no editable PIN/session.
insert into public.public_profiles (
  slug, full_name, title_en, title_fr, bio_en, bio_fr, organization, location,
  email, is_demo, is_public
) values (
  'amara-diallo',
  'Dr. Amara Diallo',
  'Public Health & Biomanufacturing Specialist',
  'Spécialiste en santé publique et bioproduction',
  'Dr. Amara Diallo works at the intersection of public health, vaccine biomanufacturing and regional skills development. Her work focuses on practical partnerships, responsible technology transfer and stronger local production ecosystems across Africa.',
  'La Dre Amara Diallo travaille à la croisée de la santé publique, de la bioproduction des vaccins et du développement des compétences régionales. Ses activités portent sur les partenariats opérationnels, le transfert responsable de technologies et le renforcement des écosystèmes de production locale en Afrique.',
  'Pan-African Health Initiative',
  'Nairobi, Kenya',
  'amara.diallo@example.org',
  true,
  true
) on conflict (slug) do nothing;

insert into public.public_experiences (
  slug,title_en,title_fr,organization,location,start_date,end_date,is_current,
  description_en,description_fr,skills,sort_order,is_published
)
select 'amara-diallo','Regional Biomanufacturing Programme Lead','Responsable régionale des programmes de bioproduction',
  'Pan-African Health Initiative','Nairobi, Kenya','2023-01-01',null,true,
  'Coordinates cross-border professional development programmes, connects training institutions with public health partners and supports practical pathways into vaccine manufacturing.',
  'Coordonne des programmes régionaux de développement professionnel, met en relation les établissements de formation et les partenaires de santé publique et soutient les parcours vers la fabrication de vaccins.',
  array['Programme development','Partnerships','Technology transfer'],10,true
where not exists(select 1 from public.public_experiences where slug='amara-diallo' and title_en='Regional Biomanufacturing Programme Lead');

insert into public.public_experiences (
  slug,title_en,title_fr,organization,location,start_date,end_date,is_current,
  description_en,description_fr,skills,sort_order,is_published
)
select 'amara-diallo','Research Associate — Vaccine Systems','Chargée de recherche — Systèmes vaccinaux',
  'Centre for Vaccine Systems Innovation','Kigali, Rwanda','2020-08-01','2022-12-31',false,
  'Contributed to evidence reviews on regional vaccine supply chains, workforce capabilities and the enabling conditions for sustainable manufacturing.',
  'A contribué à des analyses documentaires sur les chaînes régionales d’approvisionnement en vaccins, les compétences professionnelles et les conditions nécessaires à une production durable.',
  array['Research','Health systems','Evidence synthesis'],20,true
where not exists(select 1 from public.public_experiences where slug='amara-diallo' and title_en='Research Associate — Vaccine Systems');

insert into public.public_diplomas (
  slug,title_en,title_fr,institution,year,details_en,details_fr,sort_order,is_published
)
select 'amara-diallo','MSc, Public Health & Biomanufacturing','Master en santé publique et bioproduction',
  'Institute for Global Health Innovation',2021,
  'Interdisciplinary programme covering public health systems, vaccine production ecosystems and industrial development.',
  'Formation interdisciplinaire consacrée aux systèmes de santé publique, aux écosystèmes de production vaccinale et au développement industriel.',10,true
where not exists(select 1 from public.public_diplomas where slug='amara-diallo' and title_en='MSc, Public Health & Biomanufacturing');

insert into public.public_diplomas (
  slug,title_en,title_fr,institution,year,details_en,details_fr,sort_order,is_published
)
select 'amara-diallo','BSc, Biotechnology','Licence en biotechnologie',
  'Lakeside University',2018,
  'Foundation in molecular biology, microbiology, bioprocess principles and laboratory methods.',
  'Formation fondamentale en biologie moléculaire, microbiologie, principes de bioprocédés et méthodes de laboratoire.',20,true
where not exists(select 1 from public.public_diplomas where slug='amara-diallo' and title_en='BSc, Biotechnology');

insert into public.public_events (
  slug,title_en,title_fr,location,country,start_date,end_date,status,role_en,role_fr,summary_en,summary_fr,sort_order,is_published
)
select 'amara-diallo','Pan-African Biomanufacturing Forum','Forum panafricain de la bioproduction',
  'Kigali','Rwanda','2025-06-10','2025-06-12','past','Programme contributor','Contributrice au programme',
  'Shared lessons on workforce development, technology transfer and regional collaboration in vaccine manufacturing.',
  'A partagé des enseignements sur le développement des compétences, le transfert de technologies et la coopération régionale dans la fabrication de vaccins.',10,true
where not exists(select 1 from public.public_events where slug='amara-diallo' and title_en='Pan-African Biomanufacturing Forum');

insert into public.public_events (
  slug,title_en,title_fr,location,country,start_date,end_date,status,role_en,role_fr,summary_en,summary_fr,sort_order,is_published
)
select 'amara-diallo','Regional Vaccine Ecosystem Summit','Sommet régional sur l’écosystème vaccinal',
  'Nairobi','Kenya','2024-09-18','2024-09-19','past','Panel rapporteur','Rapporteure de session',
  'Documented stakeholder perspectives on sustainable access, local manufacturing and regional supply resilience.',
  'A documenté les perspectives des parties prenantes sur l’accès durable, la production locale et la résilience régionale des approvisionnements.',20,true
where not exists(select 1 from public.public_events where slug='amara-diallo' and title_en='Regional Vaccine Ecosystem Summit');

insert into public.public_initiatives (
  slug,title_en,title_fr,category,status,start_date,description_en,description_fr,sort_order,is_published
)
select 'amara-diallo','Regional Biomanufacturing Skills Accelerator','Accélérateur régional de compétences en bioproduction',
  'Capacity building','ongoing','2024-01-01',
  'A collaborative learning initiative designed to connect early-career professionals with practical training, mentors and industry perspectives.',
  'Une initiative d’apprentissage collaboratif qui met en relation les jeunes professionnels avec des formations pratiques, des mentors et des perspectives industrielles.',10,true
where not exists(select 1 from public.public_initiatives where slug='amara-diallo' and title_en='Regional Biomanufacturing Skills Accelerator');

insert into public.public_initiatives (
  slug,title_en,title_fr,category,status,start_date,description_en,description_fr,sort_order,is_published
)
select 'amara-diallo','Vaccine Access Evidence Lab','Laboratoire d’analyse sur l’accès aux vaccins',
  'Research','planned','2025-02-01',
  'A proposed research programme to translate evidence on supply, affordability and production capacity into practical policy insights.',
  'Un programme de recherche proposé pour transformer les données sur l’approvisionnement, l’accessibilité financière et les capacités de production en pistes d’action concrètes.',
  20,true
where not exists(select 1 from public.public_initiatives where slug='amara-diallo' and title_en='Vaccine Access Evidence Lab');
