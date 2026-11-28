-- =====================================================
-- إشعارات الإدارة: إرسال إشعار جماعي من تطبيق الإدارة
-- الإشعار يُحفظ لكل مستخدم ويصل كإشعار جوال تلقائياً (عبر trg_notify_push الموجود)
-- شغّله مرة واحدة في Supabase > SQL Editor
-- =====================================================
create table if not exists public.broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  audience    text not null,
  city        text,
  category    text,
  recipients  int  not null default 0,
  sent_by     uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.broadcasts enable row level security;
drop policy if exists p_broadcasts_admin on public.broadcasts;
create policy p_broadcasts_admin on public.broadcasts for select using (is_admin());

create or replace function public.admin_broadcast(
  p_title text, p_body text, p_audience text default 'all',
  p_city text default null, p_category text default null, p_dry boolean default false
) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_admin() then raise exception 'not allowed'; end if;
  if length(trim(coalesce(p_title, ''))) < 2 or length(trim(coalesce(p_body, ''))) < 2 then raise exception 'title and body required'; end if;
  if p_audience not in ('all', 'seekers', 'employers') then raise exception 'bad audience'; end if;
  select count(*) into n from profiles p
   where p.role in ('seeker', 'employer')
     and (p_audience = 'all' or (p_audience = 'seekers' and p.role = 'seeker') or (p_audience = 'employers' and p.role = 'employer'))
     and (nullif(p_city, '') is null or p.location = p_city)
     and (nullif(p_category, '') is null or p.pref_category = p_category);
  if p_dry then return n; end if;
  if n > 20000 then raise exception 'too many recipients'; end if;
  insert into notifications(user_id, type, title, body)
    select p.id, 'broadcast', left(trim(p_title), 120), left(trim(p_body), 500) from profiles p
     where p.role in ('seeker', 'employer')
       and (p_audience = 'all' or (p_audience = 'seekers' and p.role = 'seeker') or (p_audience = 'employers' and p.role = 'employer'))
       and (nullif(p_city, '') is null or p.location = p_city)
       and (nullif(p_category, '') is null or p.pref_category = p_category);
  insert into broadcasts(title, body, audience, city, category, recipients, sent_by)
    values (left(trim(p_title), 120), left(trim(p_body), 500), p_audience, nullif(p_city, ''), nullif(p_category, ''), n, auth.uid());
  return n;
end $$;
revoke execute on function public.admin_broadcast(text, text, text, text, text, boolean) from public, anon;
grant execute on function public.admin_broadcast(text, text, text, text, text, boolean) to authenticated;
