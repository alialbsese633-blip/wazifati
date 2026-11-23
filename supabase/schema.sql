-- =====================================================
-- وظيفتي (Wazifati) - Database schema
-- PostgreSQL (Supabase). Run in the SQL editor.
-- Salary in OMR (3 decimals)
-- =====================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;   -- fast text search

-- ---------- Enums ----------
create type user_role     as enum ('seeker','employer','admin');
create type job_status    as enum ('draft','pending','active','paused','closed','rejected','expired');
create type job_type      as enum ('full_time','part_time','contract','internship','gig');
create type nat_req       as enum ('any','omani_only');
create type app_status    as enum ('new','reviewed','interview','accepted','rejected','withdrawn');
create type report_status as enum ('open','resolved','dismissed');
create type notif_channel as enum ('push','whatsapp','email');

-- ---------- Lookups ----------
create table wilayat (
  id      serial primary key,
  name_ar text not null,
  name_en text not null,
  governorate_ar text
);

create table categories (
  id      serial primary key,
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true
);

create table skills (
  id      serial primary key,
  name_ar text not null,
  name_en text,
  unique (name_ar)
);

-- ---------- Users ----------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'seeker',
  full_name  text not null,
  phone      text unique not null,
  is_omani   boolean not null default true,
  wilayat_id int references wilayat(id),
  lang       text not null default 'ar' check (lang in ('ar','en')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Seeker CV ----------
create table seeker_profiles (
  user_id      uuid primary key references profiles(id) on delete cascade,
  headline     text,                    -- المسمى الوظيفي
  about        text,
  exp_years    int not null default 0 check (exp_years >= 0),
  education    text,
  cv_url       text,
  open_to_work boolean not null default true,
  completeness int not null default 0 check (completeness between 0 and 100),
  updated_at   timestamptz not null default now()
);

create table seeker_skills (
  user_id  uuid references seeker_profiles(user_id) on delete cascade,
  skill_id int  references skills(id),
  primary key (user_id, skill_id)
);

create table seeker_experiences (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references seeker_profiles(user_id) on delete cascade,
  title      text not null,
  company    text not null,
  start_date date,
  end_date   date,
  details    text
);

-- ---------- Employers ----------
create table employers (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id),
  name        text not null,
  cr_number   text unique,              -- السجل التجاري
  about       text,
  logo_url    text,
  wilayat_id  int references wilayat(id),
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table employer_members (       -- team members who can manage jobs
  employer_id uuid references employers(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  primary key (employer_id, user_id)
);

-- ---------- Jobs ----------
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references employers(id),
  title       text not null,
  category_id int  not null references categories(id),
  wilayat_id  int  references wilayat(id),
  is_remote   boolean not null default false,
  type        job_type not null default 'full_time',
  salary_min  numeric(8,3) check (salary_min >= 0),
  salary_max  numeric(8,3) check (salary_max >= salary_min),
  exp_years   int not null default 0,
  nationality nat_req not null default 'any',
  description text not null,
  requirements text[] not null default '{}',
  status      job_status not null default 'pending',
  reject_reason text,
  views       int not null default 0,
  created_at  timestamptz not null default now(),
  published_at timestamptz,
  expires_at  timestamptz
);
create index jobs_status_idx   on jobs(status, published_at desc);
create index jobs_filter_idx   on jobs(category_id, wilayat_id, type) where status = 'active';
create index jobs_title_trgm   on jobs using gin (title gin_trgm_ops);

create table job_skills (
  job_id   uuid references jobs(id) on delete cascade,
  skill_id int  references skills(id),
  primary key (job_id, skill_id)
);

-- ---------- Applications ----------
create table applications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references jobs(id) on delete cascade,
  seeker_id  uuid not null references profiles(id),
  note       text,
  match_pct  int,
  status     app_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, seeker_id)
);
create index applications_job_idx    on applications(job_id, status);
create index applications_seeker_idx on applications(seeker_id, created_at desc);

create table application_events (     -- who changed the status and when
  id             bigserial primary key,
  application_id uuid not null references applications(id) on delete cascade,
  actor_id       uuid references profiles(id),
  from_status    app_status,
  to_status      app_status not null,
  note           text,
  created_at     timestamptz not null default now()
);

create table interviews (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  scheduled_at   timestamptz not null,
  location       text,
  notes          text
);

-- ---------- Engagement ----------
create table saved_jobs (
  user_id    uuid references profiles(id) on delete cascade,
  job_id     uuid references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table job_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  category_id int references categories(id),
  wilayat_id  int references wilayat(id),
  channel     notif_channel not null default 'push',
  is_active   boolean not null default true
);

create table notifications (
  id         bigserial primary key,
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null,
  body       text,
  data       jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications(user_id, created_at desc);

-- ---------- Trust & safety ----------
create table reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references jobs(id) on delete set null,
  reporter_id uuid not null references profiles(id),
  reason      text not null,
  status      report_status not null default 'open',
  handled_by  uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references profiles(id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Monetization (phase 2) ----------
create table plans (
  id        serial primary key,
  code      text unique not null,       -- free / starter / pro
  name_ar   text not null,
  price_omr numeric(8,3) not null default 0,
  job_slots int not null,
  featured_slots int not null default 0
);

create table subscriptions (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references employers(id),
  plan_id     int  not null references plans(id),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null
);

-- =====================================================
-- Functions & triggers
-- =====================================================

-- Match % between a seeker and a job (70% skills, 15% place, 15% experience)
create or replace function match_pct(p_user uuid, p_job uuid) returns int
language plpgsql stable as $$
declare
  j jobs; sp seeker_profiles; pr profiles;
  js int; hit int; sk numeric := 0; pl int := 0; ex int := 0;
begin
  select * into j  from jobs where id = p_job;
  select * into sp from seeker_profiles where user_id = p_user;
  select * into pr from profiles where id = p_user;
  select count(*) into js from job_skills where job_id = p_job;
  select count(*) into hit from job_skills jk
   join seeker_skills s on s.skill_id = jk.skill_id and s.user_id = p_user
   where jk.job_id = p_job;
  if js > 0 then sk := hit::numeric / js * 70; end if;
  if j.is_remote or pr.wilayat_id = j.wilayat_id then pl := 15; end if;
  if sp.exp_years >= j.exp_years then ex := 15;
  else ex := round(15.0 * sp.exp_years / greatest(j.exp_years,1)); end if;
  return round(sk + pl + ex);
end $$;

-- Block applying to omani_only jobs for non-omani users + stamp match
create or replace function before_apply() returns trigger
language plpgsql as $$
declare j jobs; pr profiles;
begin
  select * into j  from jobs where id = new.job_id;
  select * into pr from profiles where id = new.seeker_id;
  if j.status <> 'active' then raise exception 'job is not open'; end if;
  if j.nationality = 'omani_only' and not pr.is_omani then
    raise exception 'job is for Omani nationals only';
  end if;
  new.match_pct := match_pct(new.seeker_id, new.job_id);
  return new;
end $$;
create trigger trg_before_apply before insert on applications
  for each row execute function before_apply();

-- Log status changes + notify the seeker
create or replace function on_app_status() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.updated_at := now();
    insert into application_events(application_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), old.status, new.status);
    insert into notifications(user_id, title, body, data)
    values (new.seeker_id, 'تحديث على طلبك',
            'تغيّرت حالة طلبك إلى: ' || new.status::text,
            jsonb_build_object('application_id', new.id));
  end if;
  return new;
end $$;
create trigger trg_app_status before update on applications
  for each row execute function on_app_status();

-- Stamp publish date when admin approves
create or replace function on_job_status() returns trigger
language plpgsql as $$
begin
  if new.status = 'active' and old.status <> 'active' then
    new.published_at := now();
    new.expires_at   := now() + interval '30 days';
  end if;
  return new;
end $$;
create trigger trg_job_status before update on jobs
  for each row execute function on_job_status();

-- Notify seekers whose alerts match a newly published job
create or replace function notify_alerts() returns trigger
language plpgsql as $$
begin
  if new.status = 'active' and old.status <> 'active' then
    insert into notifications(user_id, title, body, data)
    select a.user_id, 'وظيفة جديدة تناسبك', new.title,
           jsonb_build_object('job_id', new.id)
    from job_alerts a
    where a.is_active
      and (a.category_id is null or a.category_id = new.category_id)
      and (a.wilayat_id  is null or a.wilayat_id  = new.wilayat_id);
  end if;
  return new;
end $$;
create trigger trg_notify_alerts after update on jobs
  for each row execute function notify_alerts();

-- Expire old jobs (schedule with pg_cron daily)
create or replace function expire_jobs() returns void
language sql as $$
  update jobs set status = 'expired' where status = 'active' and expires_at < now();
$$;

-- Increment views safely
create or replace function inc_job_views(p_job uuid) returns void
language sql security definer as $$
  update jobs set views = views + 1 where id = p_job and status = 'active';
$$;

-- =====================================================
-- Row Level Security
-- =====================================================
alter table profiles        enable row level security;
alter table seeker_profiles enable row level security;
alter table seeker_skills   enable row level security;
alter table employers       enable row level security;
alter table jobs            enable row level security;
alter table applications    enable row level security;
alter table saved_jobs      enable row level security;
alter table job_alerts      enable row level security;
alter table notifications   enable row level security;
alter table reports         enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_employer_member(p_emp uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from employers where id = p_emp and owner_id = auth.uid())
      or exists (select 1 from employer_members where employer_id = p_emp and user_id = auth.uid());
$$;

create policy prof_self   on profiles for select using (id = auth.uid() or is_admin());
create policy prof_upd    on profiles for update using (id = auth.uid());

create policy sp_self     on seeker_profiles for all using (user_id = auth.uid());
create policy sp_employer on seeker_profiles for select using (
  exists (select 1 from applications a join jobs j on j.id = a.job_id
          where a.seeker_id = seeker_profiles.user_id and is_employer_member(j.employer_id)));
create policy ss_self     on seeker_skills for all using (user_id = auth.uid());

create policy emp_read    on employers for select using (true);
create policy emp_write   on employers for all using (owner_id = auth.uid() or is_admin());

create policy job_public  on jobs for select using (status = 'active' or is_employer_member(employer_id) or is_admin());
create policy job_write   on jobs for insert with check (is_employer_member(employer_id));
create policy job_update  on jobs for update using (is_employer_member(employer_id) or is_admin());

create policy app_seeker   on applications for select using (seeker_id = auth.uid());
create policy app_insert   on applications for insert with check (seeker_id = auth.uid());
create policy app_employer on applications for select using (
  exists (select 1 from jobs j where j.id = job_id and is_employer_member(j.employer_id)));
create policy app_emp_upd  on applications for update using (
  exists (select 1 from jobs j where j.id = job_id and is_employer_member(j.employer_id)));

create policy saved_self  on saved_jobs    for all using (user_id = auth.uid());
create policy alert_self  on job_alerts    for all using (user_id = auth.uid());
create policy notif_self  on notifications for all using (user_id = auth.uid());
create policy rep_insert  on reports for insert with check (reporter_id = auth.uid());
create policy rep_admin   on reports for select using (is_admin() or reporter_id = auth.uid());

-- =====================================================
-- Seed data
-- =====================================================
insert into wilayat (name_ar, name_en, governorate_ar) values
 ('مسقط','Muscat','مسقط'),('صلالة','Salalah','ظفار'),('صحار','Sohar','شمال الباطنة'),
 ('نزوى','Nizwa','الداخلية'),('صور','Sur','جنوب الشرقية'),('الرستاق','Rustaq','جنوب الباطنة'),
 ('عبري','Ibri','الظاهرة'),('الدقم','Duqm','الوسطى'),('خصب','Khasab','مسندم');

insert into categories (name_ar, name_en) values
 ('محاسبة وإدارة','Accounting & Admin'),('مبيعات وتسويق','Sales & Marketing'),
 ('ضيافة وفنادق','Hospitality'),('هندسة وفنيون','Engineering & Technical'),
 ('تقنية معلومات','IT'),('تعليم','Education'),('صحة','Healthcare'),
 ('نقل وتوصيل','Transport & Delivery'),('خدمة عملاء','Customer Service'),
 ('أعمال مؤقتة','Gigs');

insert into plans (code, name_ar, price_omr, job_slots, featured_slots) values
 ('free','مجانية',0,2,0),('starter','أساسية',15,10,1),('pro','احترافية',40,50,5);
