-- =====================================================
-- وظيفتي v2 - قاعدة البيانات الكاملة (Supabase / PostgreSQL 15+)
-- شغّل الملف كاملاً مرة واحدة من: SQL Editor ← New query ← Run
-- =====================================================

-- gen_random_uuid() مدمجة في PostgreSQL 13+

-- ---------- الملفات الشخصية (لكل مستخدم) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text check (role in ('seeker','employer','admin')),   -- يُختار عند أول دخول
  full_name     text,
  email         text,
  phone         text,
  lang          text not null default 'ar' check (lang in ('ar','en')),
  location      text,
  headline      text,
  about         text,
  exp_years     int  not null default 0 check (exp_years between 0 and 60),
  education     text,
  skills        text[] not null default '{}',
  languages     text[] not null default '{}',
  experiences   jsonb  not null default '[]',
  pref_category text,
  cv_template   text not null default 'khanjar',
  cv_path       text,
  open_to_work  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- الشركات ----------
create table if not exists public.companies (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null unique references public.profiles(id) on delete cascade,
  name           text not null,
  cr_number      text not null,
  cr_doc_path    text,
  location       text,
  about          text,
  phone          text,
  status         text not null default 'pending' check (status in ('pending','verified','rejected')),
  reject_reason  text,
  verified_at    timestamptz,
  rating_avg     numeric(3,2) not null default 0,
  rating_count   int not null default 0,
  apps_total     int not null default 0,
  apps_responded int not null default 0,
  created_at     timestamptz not null default now()
);

-- ---------- الوظائف ----------
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text not null check (length(title) between 2 and 120),
  category     text not null,
  location     text not null,
  job_type     text not null default 'full_time' check (job_type in ('full_time','part_time','contract','internship')),
  salary_min   numeric(12,2) check (salary_min >= 0),
  salary_max   numeric(12,2) check (salary_max >= 0),
  currency     text not null default 'YER' check (currency in ('YER','USD','SAR')),
  exp_years    int not null default 0,
  skills       text[] not null default '{}',
  description  text not null,
  requirements text[] not null default '{}',
  is_gig       boolean not null default false,
  featured     boolean not null default false,
  status       text not null default 'pending' check (status in ('pending','active','paused','closed','rejected','expired')),
  views        int not null default 0,
  created_at   timestamptz not null default now(),
  published_at timestamptz,
  expires_at   timestamptz,
  constraint salary_range check (salary_max is null or salary_min is null or salary_max >= salary_min)
);
create index if not exists jobs_status_idx on public.jobs(status, published_at desc);
create index if not exists jobs_company_idx on public.jobs(company_id);

-- ---------- طلبات التوظيف ----------
create table if not exists public.applications (
  id                uuid primary key default gen_random_uuid(),
  job_id            uuid not null references public.jobs(id) on delete cascade,
  seeker_id         uuid not null references public.profiles(id) on delete cascade,
  note              text,
  match             int,
  status            text not null default 'new' check (status in ('new','reviewed','interview','accepted','rejected','withdrawn')),
  snapshot          jsonb not null default '{}',     -- نسخة من ملف الباحث وقت التقديم
  first_response_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (job_id, seeker_id)
);
create index if not exists applications_seeker_idx on public.applications(seeker_id);
create index if not exists applications_job_idx on public.applications(job_id);

-- ---------- المحادثة ----------
create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  sender_id      uuid not null references public.profiles(id) on delete cascade,
  body           text not null check (length(body) between 1 and 4000),
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists messages_app_idx on public.messages(application_id, created_at);

-- ---------- المقابلات ----------
create table if not exists public.interviews (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  proposed_by    uuid references public.profiles(id) on delete set null,
  slots          timestamptz[] not null check (cardinality(slots) between 1 and 3),
  chosen_slot    timestamptz,
  mode           text not null default 'onsite' check (mode in ('onsite','phone','video')),
  place          text,
  note           text,
  status         text not null default 'proposed' check (status in ('proposed','confirmed','reschedule','cancelled')),
  created_at     timestamptz not null default now()
);
create index if not exists interviews_app_idx on public.interviews(application_id);

-- ---------- التقييمات ----------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  seeker_id     uuid not null references public.profiles(id) on delete cascade,
  reviewer_name text,
  rating        int not null check (rating between 1 and 5),
  comment       text check (length(comment) <= 1000),
  created_at    timestamptz not null default now(),
  unique (company_id, seeker_id)
);

-- ---------- المحفوظات والتنبيهات والإشعارات والبلاغات ----------
create table if not exists public.saved_jobs (
  user_id uuid references public.profiles(id) on delete cascade,
  job_id  uuid references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
create table if not exists public.job_alerts (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  category text,
  location text,
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  type           text not null,
  title          text not null,
  body           text,
  job_id         uuid references public.jobs(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create table if not exists public.push_tokens (
  token      text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  platform   text,
  created_at timestamptz not null default now()
);
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid references public.jobs(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at  timestamptz not null default now()
);
create table if not exists public.ai_usage (
  user_id uuid references public.profiles(id) on delete cascade,
  day     date not null default current_date,
  count   int not null default 0,
  primary key (user_id, day)
);

-- =====================================================
-- دوال مساعدة
-- =====================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- هل الطلب يخص المستخدم الحالي (باحث أو صاحب الشركة)
create or replace function public.app_party(p_app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a join jobs j on j.id = a.job_id join companies c on c.id = j.company_id
    where a.id = p_app and (a.seeker_id = auth.uid() or c.owner_id = auth.uid()));
$$;
create or replace function public.app_owner(p_app uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select c.owner_id from applications a join jobs j on j.id = a.job_id join companies c on c.id = j.company_id where a.id = p_app;
$$;

-- استدعاء من التطبيق (وليس من SQL Editor أو المشغّلات)
create or replace function public.api_call() returns boolean
language sql stable as $$ select current_user in ('authenticated','anon'); $$;

-- نسبة المطابقة: المهارات 70% + المدينة 15% + الخبرة 15% (نفس منطق التطبيق)
create or replace function public.match_score(p public.profiles, j public.jobs) returns int
language sql stable as $$
  select (round(
    case when coalesce(cardinality(j.skills),0) = 0 then 0
         else (select count(*) from unnest(j.skills) s
               where lower(trim(s)) in (select lower(trim(x)) from unnest(p.skills) x))::numeric / cardinality(j.skills) * 70 end
    + case when j.location = 'remote' or j.location = p.location then 15 else 0 end
    + case when coalesce(p.exp_years,0) >= coalesce(j.exp_years,0) then 15
           else 15.0 * coalesce(p.exp_years,0) / greatest(j.exp_years,1) end))::int;
$$;

-- إنشاء إشعار بلغة المستلم
create or replace function public.wz_notify(p_user uuid, p_type text, ar_t text, ar_b text, en_t text, en_b text, p_job uuid default null, p_app uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare l text;
begin
  if p_user is null then return; end if;
  select lang into l from profiles where id = p_user;
  insert into notifications(user_id, type, title, body, job_id, application_id)
  values (p_user, p_type, case when l = 'en' then en_t else ar_t end, case when l = 'en' then en_b else ar_b end, p_job, p_app);
end $$;

-- =====================================================
-- المشغّلات (Triggers)
-- =====================================================

-- إنشاء ملف تلقائياً عند التسجيل
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, phone, full_name)
  values (new.id, new.email, new.phone,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- حماية الملف: لا يمكن للمستخدم ترقية نفسه إلى مشرف
create or replace function public.guard_profile() returns trigger
language plpgsql as $$
begin
  if api_call() and not is_admin() then
    if new.role = 'admin' and old.role is distinct from 'admin' then raise exception 'not allowed'; end if;
    if old.role is not null and new.role is distinct from old.role then raise exception 'role already set'; end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_guard_profile on public.profiles;
create trigger trg_guard_profile before update on public.profiles for each row execute function public.guard_profile();

-- حماية الشركة: التوثيق للمشرف فقط، وتغيير السجل يعيد التحقق
create or replace function public.guard_company() returns trigger
language plpgsql as $$
begin
  if api_call() and not is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.verified_at := null; new.rating_avg := 0; new.rating_count := 0; new.apps_total := 0; new.apps_responded := 0;
    else
      new.status := old.status; new.verified_at := old.verified_at; new.reject_reason := old.reject_reason;
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count; new.apps_total := old.apps_total; new.apps_responded := old.apps_responded;
      if new.cr_number is distinct from old.cr_number or new.cr_doc_path is distinct from old.cr_doc_path then new.status := 'pending'; end if;
    end if;
  end if;
  if new.status = 'verified' and (tg_op = 'INSERT' or old.status <> 'verified') then new.verified_at := now(); end if;
  return new;
end $$;
drop trigger if exists trg_guard_company on public.companies;
create trigger trg_guard_company before insert or update on public.companies for each row execute function public.guard_company();

create or replace function public.after_company() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('verified','rejected') then
    perform wz_notify(new.owner_id, 'company',
      case when new.status = 'verified' then 'تم توثيق شركتك ✓' else 'لم يتم توثيق الشركة' end, new.name || coalesce(' — ' || new.reject_reason, ''),
      case when new.status = 'verified' then 'Your company is verified ✓' else 'Company verification declined' end, new.name || coalesce(' — ' || new.reject_reason, ''));
  end if;
  return null;
end $$;
drop trigger if exists trg_after_company on public.companies;
create trigger trg_after_company after update on public.companies for each row execute function public.after_company();

-- حماية الوظيفة: النشر والتمييز للمشرف، وصاحب العمل يغلق أو يعيد الفتح فقط
create or replace function public.guard_job() returns trigger
language plpgsql as $$
begin
  if api_call() and not is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.featured := false; new.views := 0; new.published_at := null;
    else
      new.featured := old.featured; new.views := old.views; new.company_id := old.company_id;
      if new.status is distinct from old.status and not (
           (old.status = 'active' and new.status = 'closed') or
           (old.status = 'closed' and new.status = 'active' and old.published_at is not null)) then
        new.status := old.status;
      end if;
      -- تعديل محتوى وظيفة منشورة يعيدها للمراجعة
      if old.status = 'active' and (new.title, new.description, new.salary_min, new.salary_max) is distinct from (old.title, old.description, old.salary_min, old.salary_max) then
        new.status := 'pending';
      end if;
    end if;
  end if;
  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    if new.published_at is null then new.published_at := now(); end if;
    new.expires_at := now() + interval '45 days';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_job on public.jobs;
create trigger trg_guard_job before insert or update on public.jobs for each row execute function public.guard_job();

-- عند نشر وظيفة: إشعار صاحبها + إشعار الباحثين المناسبين لها
create or replace function public.after_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare c companies;
begin
  select * into c from companies where id = new.company_id;
  if tg_op = 'INSERT' and new.status = 'pending' then
    insert into notifications(user_id, type, title, body, job_id)
    select id, 'job_pending', 'وظيفة بانتظار المراجعة', c.name || ': ' || new.title, new.id from profiles where role = 'admin';
    return null;
  end if;
  if tg_op = 'UPDATE' and new.status = 'active' and old.status = 'pending' then
    perform wz_notify(c.owner_id, 'job_live', 'تم نشر وظيفتك ✓', new.title, 'Your job is live ✓', new.title, new.id);
    -- الباحثون المناسبون: مطابقة 60%+، أو نفس التخصص المفضل بمطابقة 40%+، أو لديهم تنبيه مطابق
    insert into notifications(user_id, type, title, body, job_id)
    select p.id, 'job_match',
           case when p.lang = 'en' then c.name || ' posted a job that fits you' else c.name || ' نزّلت وظيفة مناسبة لك' end,
           case when p.lang = 'en' then new.title || ' — want to see the details?' else new.title || ' — هل تحب مشاهدة التفاصيل؟' end,
           new.id
    from profiles p
    where p.role = 'seeker' and p.open_to_work
      and not exists (select 1 from applications a where a.job_id = new.id and a.seeker_id = p.id)
      and ( match_score(p, new) >= 60
         or (p.pref_category = new.category and match_score(p, new) >= 40)
         or exists (select 1 from job_alerts al where al.user_id = p.id
                    and (al.category is null or al.category = new.category)
                    and (al.location is null or al.location = new.location)) )
    limit 5000;
  elsif tg_op = 'UPDATE' and new.status = 'rejected' and old.status <> 'rejected' then
    perform wz_notify(c.owner_id, 'job_rejected', 'لم تُعتمد وظيفتك', new.title, 'Your job was not approved', new.title, new.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_after_job on public.jobs;
create trigger trg_after_job after insert or update on public.jobs for each row execute function public.after_job();

-- قبل التقديم: الوظيفة منشورة، حساب المطابقة، ونسخة من الملف
create or replace function public.before_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jobs; p profiles;
begin
  select * into j from jobs where id = new.job_id;
  select * into p from profiles where id = new.seeker_id;
  if j.status <> 'active' then raise exception 'job is not open'; end if;
  if p.role is distinct from 'seeker' then raise exception 'only job seekers can apply'; end if;
  new.status := 'new'; new.first_response_at := null;
  new.match := match_score(p, j);
  new.snapshot := jsonb_build_object('id', p.id, 'name', p.full_name, 'title', p.headline, 'loc', p.location, 'exp', p.exp_years,
    'skills', to_jsonb(p.skills), 'about', p.about, 'edu', p.education, 'langs', to_jsonb(p.languages), 'experiences', p.experiences,
    'phone', p.phone, 'email', p.email, 'cvTpl', p.cv_template, 'cvPath', p.cv_path);
  return new;
end $$;
drop trigger if exists trg_before_apply on public.applications;
create trigger trg_before_apply before insert on public.applications for each row execute function public.before_apply();

create or replace function public.after_apply() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jobs; c companies;
begin
  select * into j from jobs where id = new.job_id;
  select * into c from companies where id = j.company_id;
  update companies set apps_total = apps_total + 1 where id = c.id;
  perform wz_notify(c.owner_id, 'new_applicant', 'متقدم جديد', coalesce(new.snapshot->>'name','') || ' قدّم على ' || j.title,
                 'New applicant', coalesce(new.snapshot->>'name','') || ' applied to ' || j.title, j.id, new.id);
  return null;
end $$;
drop trigger if exists trg_after_apply on public.applications;
create trigger trg_after_apply after insert on public.applications for each row execute function public.after_apply();

-- تحديث حالة الطلب: صاحب العمل فقط (والباحث يسحب طلبه)، وتسجيل أول رد
create or replace function public.guard_app() returns trigger
language plpgsql as $$
begin
  if api_call() and not is_admin() then
    new.job_id := old.job_id; new.seeker_id := old.seeker_id; new.snapshot := old.snapshot; new.match := old.match;
    if auth.uid() = old.seeker_id and app_owner(old.id) is distinct from auth.uid() then
      if new.status is distinct from old.status and new.status <> 'withdrawn' then new.status := old.status; end if;
      new.first_response_at := old.first_response_at;
    end if;
  end if;
  if new.status is distinct from old.status then
    new.updated_at := now();
    if old.status = 'new' and new.first_response_at is null and new.status <> 'withdrawn' then new.first_response_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_app on public.applications;
create trigger trg_guard_app before update on public.applications for each row execute function public.guard_app();

create or replace function public.after_app_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare j jobs; st_ar text; st_en text;
begin
  if old.first_response_at is null and new.first_response_at is not null then
    update companies set apps_responded = apps_responded + 1 where id = (select company_id from jobs where id = new.job_id);
  end if;
  if new.status is distinct from old.status and new.status not in ('withdrawn','interview') then
    select * into j from jobs where id = new.job_id;
    st_ar := case new.status when 'reviewed' then 'تمت المراجعة' when 'interview' then 'مقابلة' when 'accepted' then 'مقبول 🎉' when 'rejected' then 'مرفوض' else 'جديد' end;
    st_en := case new.status when 'reviewed' then 'Reviewed' when 'interview' then 'Interview' when 'accepted' then 'Accepted 🎉' when 'rejected' then 'Rejected' else 'New' end;
    perform wz_notify(new.seeker_id, 'status', 'تحديث على طلبك', 'طلبك في «' || j.title || '» أصبح: ' || st_ar,
                   'Application update', 'Your application for “' || j.title || '” is now: ' || st_en, j.id, new.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_after_app_update on public.applications;
create trigger trg_after_app_update after update on public.applications for each row execute function public.after_app_update();

-- الرسائل: إشعار الطرف الآخر، ورسالة صاحب العمل تُحسب رداً
create or replace function public.after_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare a applications; owner uuid; cname text;
begin
  select * into a from applications where id = new.application_id;
  owner := app_owner(a.id);
  if new.sender_id = owner then
    if a.first_response_at is null then update applications set first_response_at = now() where id = a.id; end if;
    select c.name into cname from companies c where c.owner_id = owner;
    perform wz_notify(a.seeker_id, 'message', 'رسالة جديدة من ' || coalesce(cname,''), left(new.body, 120), 'New message from ' || coalesce(cname,''), left(new.body, 120), null, a.id);
  else
    perform wz_notify(owner, 'message', 'رسالة جديدة من ' || coalesce(a.snapshot->>'name',''), left(new.body, 120), 'New message from ' || coalesce(a.snapshot->>'name',''), left(new.body, 120), null, a.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_after_message on public.messages;
create trigger trg_after_message after insert on public.messages for each row execute function public.after_message();

-- المقابلات: صاحب العمل يقترح، الباحث يختار أو يطلب موعداً آخر
create or replace function public.guard_interview() returns trigger
language plpgsql as $$
begin
  if api_call() and not is_admin() then
    if tg_op = 'INSERT' then
      if app_owner(new.application_id) is distinct from auth.uid() then raise exception 'only the employer can propose'; end if;
      new.proposed_by := auth.uid(); new.status := 'proposed'; new.chosen_slot := null;
    else
      new.application_id := old.application_id; new.proposed_by := old.proposed_by;
      if (select seeker_id from applications where id = old.application_id) = auth.uid() then
        new.slots := old.slots; new.mode := old.mode; new.place := old.place; new.note := old.note;
        if new.status not in ('confirmed','reschedule') then new.status := old.status; end if;
        if new.status = 'confirmed' and not (new.chosen_slot = any(old.slots)) then raise exception 'invalid slot'; end if;
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_interview on public.interviews;
create trigger trg_guard_interview before insert or update on public.interviews for each row execute function public.guard_interview();

create or replace function public.after_interview() returns trigger
language plpgsql security definer set search_path = public as $$
declare a applications; j jobs; cname text;
begin
  select * into a from applications where id = new.application_id;
  select * into j from jobs where id = a.job_id;
  select name into cname from companies where id = j.company_id;
  if tg_op = 'INSERT' then
    update interviews set status = 'cancelled' where application_id = new.application_id and id <> new.id and status <> 'cancelled';
    if a.status <> 'interview' then update applications set status = 'interview' where id = a.id; end if;
    perform wz_notify(a.seeker_id, 'interview', 'دعوة لمقابلة 📅', cname || ' تقترح مواعيد لمقابلة «' || j.title || '»',
                   'Interview invitation 📅', cname || ' proposed times for “' || j.title || '”', j.id, a.id);
  elsif new.status is distinct from old.status and new.status in ('confirmed','reschedule') then
    perform wz_notify(app_owner(a.id), 'interview',
      case when new.status = 'confirmed' then 'تم تأكيد موعد المقابلة' else 'طلب موعد آخر' end, coalesce(a.snapshot->>'name','') || ' — ' || j.title,
      case when new.status = 'confirmed' then 'Interview confirmed' else 'New time requested' end, coalesce(a.snapshot->>'name','') || ' — ' || j.title, j.id, a.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_after_interview on public.interviews;
create trigger trg_after_interview after insert or update on public.interviews for each row execute function public.after_interview();

-- التقييمات: لمن قدّم على الشركة فقط، وتحديث متوسط التقييم
create or replace function public.before_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from applications a join jobs j on j.id = a.job_id where a.seeker_id = new.seeker_id and j.company_id = new.company_id) then
    raise exception 'apply to this company before rating it';
  end if;
  select full_name into new.reviewer_name from profiles where id = new.seeker_id;
  new.created_at := now();
  return new;
end $$;
drop trigger if exists trg_before_review on public.reviews;
create trigger trg_before_review before insert or update on public.reviews for each row execute function public.before_review();

create or replace function public.after_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid := coalesce(new.company_id, old.company_id);
begin
  update companies c set rating_count = s.n, rating_avg = coalesce(s.a, 0)
  from (select count(*) n, round(avg(rating)::numeric, 2) a from reviews where company_id = cid) s where c.id = cid;
  return null;
end $$;
drop trigger if exists trg_after_review on public.reviews;
create trigger trg_after_review after insert or update or delete on public.reviews for each row execute function public.after_review();

-- =====================================================
-- دوال يستدعيها التطبيق
-- =====================================================
create or replace function public.inc_job_views(p_job uuid) returns void
language sql security definer set search_path = public as $$
  update jobs set views = views + 1 where id = p_job and status = 'active';
$$;

-- حذف الحساب نهائياً (مطلوب أيضاً لنشر التطبيق في Google Play)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- عدّاد الاستخدام اليومي للذكاء الاصطناعي (تستدعيه دالة ai)
create or replace function public.ai_hit(p_user uuid, p_limit int) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into ai_usage(user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into n;
  return n <= p_limit;
end $$;

-- إنهاء الوظائف القديمة (اختياري: جدولها يومياً من Database ← Cron)
create or replace function public.expire_jobs() returns void
language sql security definer set search_path = public as $$
  update jobs set status = 'expired' where status = 'active' and expires_at < now();
$$;

-- =====================================================
-- الصلاحيات (Row Level Security)
-- =====================================================
alter table public.profiles      enable row level security;
alter table public.companies     enable row level security;
alter table public.jobs          enable row level security;
alter table public.applications  enable row level security;
alter table public.messages      enable row level security;
alter table public.interviews    enable row level security;
alter table public.reviews       enable row level security;
alter table public.saved_jobs    enable row level security;
alter table public.job_alerts    enable row level security;
alter table public.notifications enable row level security;
alter table public.push_tokens   enable row level security;
alter table public.reports       enable row level security;
alter table public.ai_usage      enable row level security;

-- الملفات: المستخدم نفسه، والمشرف، وصاحب العمل لمن تقدّم عنده
drop policy if exists p_profiles_read on public.profiles;
create policy p_profiles_read on public.profiles for select using (
  id = auth.uid() or is_admin() or exists (
    select 1 from applications a join jobs j on j.id = a.job_id join companies c on c.id = j.company_id
    where a.seeker_id = profiles.id and c.owner_id = auth.uid()));
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (id = auth.uid() or is_admin());

-- الشركات: البيانات العامة للجميع
drop policy if exists p_companies_read on public.companies;
create policy p_companies_read on public.companies for select using (true);
drop policy if exists p_companies_insert on public.companies;
create policy p_companies_insert on public.companies for insert with check (
  owner_id = auth.uid() and exists (select 1 from profiles where id = auth.uid() and role = 'employer'));
drop policy if exists p_companies_update on public.companies;
create policy p_companies_update on public.companies for update using (owner_id = auth.uid() or is_admin());

-- الوظائف: المنشورة للجميع، وصاحبها والمشرف يرون الكل
drop policy if exists p_jobs_read on public.jobs;
create policy p_jobs_read on public.jobs for select using (
  status = 'active' or is_admin() or exists (select 1 from companies c where c.id = company_id and c.owner_id = auth.uid())
  or exists (select 1 from applications a where a.job_id = jobs.id and a.seeker_id = auth.uid()));
drop policy if exists p_jobs_insert on public.jobs;
create policy p_jobs_insert on public.jobs for insert with check (exists (select 1 from companies c where c.id = company_id and c.owner_id = auth.uid()));
drop policy if exists p_jobs_update on public.jobs;
create policy p_jobs_update on public.jobs for update using (is_admin() or exists (select 1 from companies c where c.id = company_id and c.owner_id = auth.uid()));

-- الطلبات
drop policy if exists p_apps_read on public.applications;
create policy p_apps_read on public.applications for select using (seeker_id = auth.uid() or is_admin() or app_owner(id) = auth.uid());
drop policy if exists p_apps_insert on public.applications;
create policy p_apps_insert on public.applications for insert with check (seeker_id = auth.uid());
drop policy if exists p_apps_update on public.applications;
create policy p_apps_update on public.applications for update using (seeker_id = auth.uid() or app_owner(id) = auth.uid() or is_admin());

-- الرسائل والمقابلات: طرفا الطلب فقط
drop policy if exists p_msgs_read on public.messages;
create policy p_msgs_read on public.messages for select using (app_party(application_id) or is_admin());
drop policy if exists p_msgs_insert on public.messages;
create policy p_msgs_insert on public.messages for insert with check (sender_id = auth.uid() and app_party(application_id));
drop policy if exists p_msgs_update on public.messages;
create policy p_msgs_update on public.messages for update using (app_party(application_id));
drop policy if exists p_iv_read on public.interviews;
create policy p_iv_read on public.interviews for select using (app_party(application_id) or is_admin());
drop policy if exists p_iv_insert on public.interviews;
create policy p_iv_insert on public.interviews for insert with check (app_owner(application_id) = auth.uid());
drop policy if exists p_iv_update on public.interviews;
create policy p_iv_update on public.interviews for update using (app_party(application_id));

-- التقييمات: عامة للقراءة
drop policy if exists p_reviews_read on public.reviews;
create policy p_reviews_read on public.reviews for select using (true);
drop policy if exists p_reviews_write on public.reviews;
create policy p_reviews_write on public.reviews for insert with check (seeker_id = auth.uid());
drop policy if exists p_reviews_update on public.reviews;
create policy p_reviews_update on public.reviews for update using (seeker_id = auth.uid());
drop policy if exists p_reviews_delete on public.reviews;
create policy p_reviews_delete on public.reviews for delete using (seeker_id = auth.uid() or is_admin());

-- بيانات المستخدم الخاصة
drop policy if exists p_saved on public.saved_jobs;
create policy p_saved on public.saved_jobs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_alerts on public.job_alerts;
create policy p_alerts on public.job_alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists p_notifs_read on public.notifications;
create policy p_notifs_read on public.notifications for select using (user_id = auth.uid());
drop policy if exists p_notifs_update on public.notifications;
create policy p_notifs_update on public.notifications for update using (user_id = auth.uid());
drop policy if exists p_tokens on public.push_tokens;
create policy p_tokens on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- البلاغات: أي مستخدم يبلّغ، والمشرف يقرأ ويعالج
drop policy if exists p_reports_insert on public.reports;
create policy p_reports_insert on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists p_reports_admin on public.reports;
create policy p_reports_admin on public.reports for select using (is_admin());
drop policy if exists p_reports_update on public.reports;
create policy p_reports_update on public.reports for update using (is_admin());

-- =====================================================
-- تخزين الملفات (Storage)
-- =====================================================
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('cr-docs', 'cr-docs', false) on conflict (id) do nothing;

drop policy if exists s_cv_own on storage.objects;
create policy s_cv_own on storage.objects for all to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists s_cv_employer on storage.objects;
create policy s_cv_employer on storage.objects for select to authenticated using (
  bucket_id = 'cvs' and (is_admin() or exists (
    select 1 from applications a join jobs j on j.id = a.job_id join companies c on c.id = j.company_id
    where c.owner_id = auth.uid() and a.seeker_id::text = (storage.foldername(name))[1])));
drop policy if exists s_cr_own on storage.objects;
create policy s_cr_own on storage.objects for all to authenticated
  using (bucket_id = 'cr-docs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()))
  with check (bucket_id = 'cr-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- التحديث اللحظي (Realtime) للإشعارات والرسائل
-- =====================================================
do $$ begin
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
end $$;

-- =====================================================
-- بعد التشغيل: اجعل حسابك مشرفاً (غيّر البريد ثم شغّل السطر بعد أول دخول لك):
-- update public.profiles set role = 'admin' where email = 'your@gmail.com';
-- =====================================================

-- ===== صلاحيات الوصول عبر API (مطلوبة في المشاريع الجديدة) =====
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;

-- =====================================================
-- أمان إضافي: دوال داخلية لا يستدعيها إلا الخادم (service_role) أو الجدولة
-- =====================================================
revoke execute on function public.ai_hit(uuid, int) from public, anon, authenticated;
revoke execute on function public.expire_jobs() from public, anon, authenticated;
