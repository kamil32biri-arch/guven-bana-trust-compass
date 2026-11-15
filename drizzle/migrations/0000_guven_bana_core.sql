
-- ENUMS
create type public.app_role as enum ('admin','moderator','user');
create type public.report_category as enum ('internet','telefon','eticaret','santaj','sahte_ilan','abonelik','isletme','finansal','diger');
create type public.report_status as enum ('yeni','inceleniyor','ek_bilgi','yanitlandi','cozuldu','sonuclandirilamadi');
create type public.verification_status as enum ('unverified','pending','verified','rejected');
create type public.entity_type as enum ('phone','website','social','payment');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_user(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and not is_suspended)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.profiles_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_suspended is distinct from old.is_suspended and not public.has_role(auth.uid(),'admin') then
    raise exception 'Bu alanı yalnızca yönetici değiştirebilir';
  end if;
  new.email := old.email;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles for each row execute function public.profiles_guard();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- HELPERS
create or replace function public.normalize_entity(_type public.entity_type, _v text)
returns text language plpgsql immutable as $$
declare d text;
begin
  if _v is null or btrim(_v) = '' then return null; end if;
  if _type = 'phone' then
    d := regexp_replace(_v, '\D', '', 'g');
    if length(d) < 7 then return null; end if;
    return right(d, 10);
  elsif _type = 'website' then
    d := lower(btrim(_v));
    d := regexp_replace(d, '^[a-z]+://', '');
    d := regexp_replace(d, '^www\.', '');
    d := regexp_replace(d, '[/?#].*$', '');
    return nullif(d,'');
  elsif _type = 'payment' then
    return nullif(upper(regexp_replace(_v, '\s', '', 'g')),'');
  else
    return nullif(lower(regexp_replace(btrim(_v), '^@', '')),'');
  end if;
end $$;

create or replace function public.redact_pii(_t text)
returns text language sql immutable as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(coalesce(_t,''), '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[e-posta gizlendi]', 'g'),
      'TR\s?\d{2}(\s?\d{4}){5}\s?\d{2}', '[IBAN gizlendi]', 'gi'),
    '\+?\d[\d\s().-]{7,}\d', '[numara gizlendi]', 'g')
$$;

-- BUSINESSES
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null check (length(name) between 2 and 120),
  logo_path text,
  category text not null default 'Genel',
  address text,
  phone text,
  email text,
  website text,
  description text,
  working_hours text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.businesses to anon;
grant select, insert, update, delete on public.businesses to authenticated;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;
create policy "businesses public read" on public.businesses for select to anon, authenticated using (true);
create policy "businesses owner insert" on public.businesses for insert to authenticated with check (owner_id = auth.uid() and public.is_active_user(auth.uid()));
create policy "businesses owner update" on public.businesses for update to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "businesses owner delete" on public.businesses for delete to authenticated using (owner_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.is_business_owner(_b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses where id = _b and owner_id = auth.uid())
$$;

create or replace function public.businesses_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.verification_status := 'unverified';
  elsif new.verification_status is distinct from old.verification_status
        and not public.has_role(auth.uid(),'admin')
        and coalesce(current_setting('app.bypass', true),'') <> 'on' then
    raise exception 'Doğrulama durumunu yalnızca yönetici değiştirebilir';
  end if;
  if tg_op = 'UPDATE' then new.owner_id := old.owner_id; end if;
  new.updated_at := now();
  return new;
end $$;
create trigger businesses_guard before insert or update on public.businesses for each row execute function public.businesses_guard();

-- VERIFICATIONS
create table public.business_verifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  submitted_by uuid not null,
  legal_name text not null,
  tax_number text not null,
  document_path text,
  note text,
  status public.verification_status not null default 'pending',
  reviewer_id uuid,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
grant select, insert, update on public.business_verifications to authenticated;
grant all on public.business_verifications to service_role;
alter table public.business_verifications enable row level security;
create policy "verif read" on public.business_verifications for select to authenticated using (submitted_by = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "verif insert" on public.business_verifications for insert to authenticated with check (submitted_by = auth.uid() and public.is_business_owner(business_id));
create policy "verif admin update" on public.business_verifications for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.verifications_sync() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.bypass','on',true);
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.reviewer_id := null; new.reviewed_at := null; new.review_note := null;
    update public.businesses set verification_status = 'pending' where id = new.business_id and verification_status <> 'verified';
  elsif new.status is distinct from old.status then
    new.reviewer_id := auth.uid(); new.reviewed_at := now();
    if new.status in ('verified','rejected') then
      update public.businesses set verification_status = new.status where id = new.business_id;
    end if;
  end if;
  perform set_config('app.bypass','off',true);
  return new;
end $$;
create trigger verifications_sync before insert or update on public.business_verifications for each row execute function public.verifications_sync();

-- REPORTS
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category public.report_category not null,
  title text not null check (length(title) between 3 and 150),
  description text not null check (length(description) between 10 and 10000),
  incident_date date,
  related_entity text,
  phone text,
  website text,
  social_account text,
  payment_info text,
  amount numeric(14,2),
  business_id uuid references public.businesses(id) on delete set null,
  status public.report_status not null default 'yeni',
  share_anonymously boolean not null default false,
  public_summary text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.reports (user_id);
create index on public.reports (business_id);
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports read" on public.reports for select to authenticated using (
  user_id = auth.uid() or public.has_role(auth.uid(),'admin') or (business_id is not null and public.is_business_owner(business_id)));
create policy "reports insert" on public.reports for insert to authenticated with check (user_id = auth.uid() and public.is_active_user(auth.uid()));
create policy "reports update" on public.reports for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reports delete" on public.reports for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.reports_guard() returns trigger language plpgsql security definer set search_path = public as $$
declare is_admin boolean := public.has_role(auth.uid(),'admin');
begin
  if tg_op = 'INSERT' then
    new.status := 'yeni'; new.admin_note := null;
  else
    new.user_id := old.user_id;
    if not is_admin and coalesce(current_setting('app.bypass', true),'') <> 'on' then
      new.admin_note := old.admin_note;
      if new.status is distinct from old.status and new.status not in ('cozuldu','sonuclandirilamadi') then
        raise exception 'Bu durumu yalnızca inceleme ekibi atayabilir';
      end if;
    end if;
  end if;
  new.public_summary := case when new.share_anonymously then left(public.redact_pii(coalesce(nullif(new.public_summary,''), new.description)), 1500) else null end;
  new.updated_at := now();
  return new;
end $$;
create trigger reports_guard before insert or update on public.reports for each row execute function public.reports_guard();

-- ATTACHMENTS (evidence vault)
create table public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  report_id uuid references public.reports(id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  kind text not null default 'diger',
  description text,
  incident_date date,
  shared_with_moderation boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.report_attachments (user_id);
grant select, insert, update, delete on public.report_attachments to authenticated;
grant all on public.report_attachments to service_role;
alter table public.report_attachments enable row level security;
create policy "att own read" on public.report_attachments for select to authenticated using (user_id = auth.uid() or (shared_with_moderation and public.has_role(auth.uid(),'admin')));
create policy "att own insert" on public.report_attachments for insert to authenticated with check (
  user_id = auth.uid() and storage_path like auth.uid()::text || '/%'
  and (report_id is null or exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())));
create policy "att own update" on public.report_attachments for update to authenticated using (user_id = auth.uid()) with check (
  user_id = auth.uid() and (report_id is null or exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid())));
create policy "att own delete" on public.report_attachments for delete to authenticated using (user_id = auth.uid());

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null check (length(body) between 10 and 3000),
  is_verified_experience boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "reviews public read" on public.reviews for select to anon, authenticated using (not is_hidden or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reviews insert" on public.reviews for insert to authenticated with check (user_id = auth.uid() and public.is_active_user(auth.uid()) and not public.is_business_owner(business_id));
create policy "reviews update" on public.reviews for update to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "reviews delete" on public.reviews for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.reviews_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then new.is_verified_experience := false; new.is_hidden := false;
    else new.is_verified_experience := old.is_verified_experience; new.is_hidden := old.is_hidden; new.user_id := old.user_id; new.business_id := old.business_id; end if;
  end if;
  new.body := public.redact_pii(new.body);
  return new;
end $$;
create trigger reviews_guard before insert or update on public.reviews for each row execute function public.reviews_guard();

-- BUSINESS RESPONSES
create table public.business_responses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  responder_id uuid not null,
  body text not null check (length(body) between 2 and 3000),
  created_at timestamptz not null default now(),
  check ((review_id is not null) <> (report_id is not null))
);
grant select on public.business_responses to anon;
grant select, insert, delete on public.business_responses to authenticated;
grant all on public.business_responses to service_role;
alter table public.business_responses enable row level security;
create policy "responses read" on public.business_responses for select to anon, authenticated using (
  review_id is not null
  or public.is_business_owner(business_id)
  or public.has_role(auth.uid(),'admin')
  or exists (select 1 from public.reports r where r.id = report_id and r.user_id = auth.uid()));
create policy "responses insert" on public.business_responses for insert to authenticated with check (
  responder_id = auth.uid() and public.is_business_owner(business_id) and (
    (review_id is not null and exists (select 1 from public.reviews v where v.id = review_id and v.business_id = business_responses.business_id))
    or (report_id is not null and exists (select 1 from public.reports r where r.id = report_id and r.business_id = business_responses.business_id))));
create policy "responses delete" on public.business_responses for delete to authenticated using (responder_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.responses_after() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.report_id is not null then
    perform set_config('app.bypass','on',true);
    update public.reports set status = 'yanitlandi' where id = new.report_id and status in ('yeni','inceleniyor','ek_bilgi');
    perform set_config('app.bypass','off',true);
  end if;
  return new;
end $$;
create trigger responses_after after insert on public.business_responses for each row execute function public.responses_after();

-- TRUST SCORES
create table public.trust_scores (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  score int,
  sample_size int not null default 0,
  avg_rating numeric(3,2),
  satisfaction numeric(4,3),
  response_rate numeric(4,3),
  resolution_rate numeric(4,3),
  transparency numeric(4,3),
  verified_reviews int not null default 0,
  report_count int not null default 0,
  computed_at timestamptz not null default now()
);
grant select on public.trust_scores to anon, authenticated;
grant all on public.trust_scores to service_role;
alter table public.trust_scores enable row level security;
create policy "trust public read" on public.trust_scores for select to anon, authenticated using (true);

create or replace function public.refresh_trust_score(_b uuid) returns void language plpgsql security definer set search_path = public as $$
declare
  n_rev int; n_ver int; w_sat numeric; avg_r numeric;
  n_rep int; n_rep_resp int; n_rep_closed int; n_rep_solved int;
  n_rev_resp int; n_items int; resp numeric; resol numeric; transp numeric; sat numeric; sc int;
  b record;
begin
  select * into b from public.businesses where id = _b;
  if not found then return; end if;
  -- only last 24 months count (recency)
  select count(*), count(*) filter (where is_verified_experience), avg(rating),
         sum(((rating-1)/4.0) * (case when is_verified_experience then 1.5 else 1 end)) / nullif(sum(case when is_verified_experience then 1.5 else 1 end),0)
    into n_rev, n_ver, avg_r, w_sat
    from public.reviews where business_id = _b and not is_hidden and created_at > now() - interval '24 months';
  select count(*),
         count(*) filter (where exists (select 1 from public.business_responses br where br.report_id = r.id)),
         count(*) filter (where status in ('cozuldu','sonuclandirilamadi')),
         count(*) filter (where status = 'cozuldu')
    into n_rep, n_rep_resp, n_rep_closed, n_rep_solved
    from public.reports r where business_id = _b and created_at > now() - interval '24 months';
  select count(distinct br.review_id) into n_rev_resp from public.business_responses br
    join public.reviews v on v.id = br.review_id where br.business_id = _b and v.rating <= 3;
  select count(*) + n_rep into n_items from public.reviews where business_id = _b and rating <= 3 and not is_hidden;
  resp := case when n_items > 0 then (n_rep_resp + n_rev_resp)::numeric / n_items else null end;
  resol := case when n_rep_closed > 0 then n_rep_solved::numeric / n_rep_closed else null end;
  transp := ((case when coalesce(b.address,'')<>'' then 1 else 0 end) + (case when coalesce(b.phone,'')<>'' or coalesce(b.email,'')<>'' then 1 else 0 end)
           + (case when coalesce(b.website,'')<>'' then 1 else 0 end) + (case when coalesce(b.working_hours,'')<>'' then 1 else 0 end)
           + (case when coalesce(b.description,'')<>'' then 1 else 0 end)) / 5.0;
  sat := w_sat;
  if (n_rev + n_rep) >= 5 and n_rev >= 3 then
    sc := round(100 * (
      0.40 * coalesce(sat, 0.5) +
      0.20 * coalesce(resp, 0.5) +
      0.25 * coalesce(resol, 0.5) +
      0.15 * transp));
  else
    sc := null;
  end if;
  insert into public.trust_scores as t (business_id, score, sample_size, avg_rating, satisfaction, response_rate, resolution_rate, transparency, verified_reviews, report_count, computed_at)
  values (_b, sc, n_rev + n_rep, avg_r, sat, resp, resol, transp, n_ver, n_rep, now())
  on conflict (business_id) do update set score = excluded.score, sample_size = excluded.sample_size, avg_rating = excluded.avg_rating,
    satisfaction = excluded.satisfaction, response_rate = excluded.response_rate, resolution_rate = excluded.resolution_rate,
    transparency = excluded.transparency, verified_reviews = excluded.verified_reviews, report_count = excluded.report_count, computed_at = now();
end $$;
revoke execute on function public.refresh_trust_score(uuid) from public, anon, authenticated;

create or replace function public.trust_trigger() returns trigger language plpgsql security definer set search_path = public as $$
declare bid uuid; oldbid uuid;
begin
  if tg_table_name = 'businesses' then
    if tg_op = 'DELETE' then return old; end if;
    perform public.refresh_trust_score(new.id); return new;
  end if;
  if tg_op <> 'INSERT' then oldbid := old.business_id; end if;
  if tg_op <> 'DELETE' then bid := new.business_id; end if;
  if bid is not null then perform public.refresh_trust_score(bid); end if;
  if oldbid is not null and oldbid is distinct from bid then perform public.refresh_trust_score(oldbid); end if;
  return coalesce(new, old);
end $$;
create trigger trust_reviews after insert or update or delete on public.reviews for each row execute function public.trust_trigger();
create trigger trust_reports after insert or update or delete on public.reports for each row execute function public.trust_trigger();
create trigger trust_responses after insert or delete on public.business_responses for each row execute function public.trust_trigger();
create trigger trust_businesses after insert or update on public.businesses for each row execute function public.trust_trigger();

-- ALERTS
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  level text not null default 'bilgi' check (level in ('bilgi','dikkat','kritik')),
  category public.report_category,
  published boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.alerts to anon;
grant select, insert, update, delete on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;
create policy "alerts read" on public.alerts for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "alerts admin insert" on public.alerts for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "alerts admin update" on public.alerts for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "alerts admin delete" on public.alerts for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- SUSPICIOUS ENTITIES
create table public.suspicious_entities (
  id uuid primary key default gen_random_uuid(),
  entity_type public.entity_type not null,
  value_normalized text not null,
  distinct_reporters int not null default 0,
  report_count int not null default 0,
  is_verified_warning boolean not null default false,
  admin_note text,
  last_reported_at timestamptz,
  created_at timestamptz not null default now(),
  unique (entity_type, value_normalized)
);
grant select, update on public.suspicious_entities to authenticated;
grant all on public.suspicious_entities to service_role;
alter table public.suspicious_entities enable row level security;
create policy "entities admin read" on public.suspicious_entities for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "entities admin update" on public.suspicious_entities for update to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.upsert_entity(_t public.entity_type, _raw text) returns void language plpgsql security definer set search_path = public as $$
declare v text := public.normalize_entity(_t, _raw); col text;
begin
  if v is null then return; end if;
  insert into public.suspicious_entities (entity_type, value_normalized) values (_t, v) on conflict do nothing;
  update public.suspicious_entities se set
    report_count = s.c, distinct_reporters = s.d, last_reported_at = s.m
  from (
    select count(*) c, count(distinct user_id) d, max(created_at) m from public.reports r
    where (_t = 'phone' and public.normalize_entity('phone', r.phone) = v)
       or (_t = 'website' and public.normalize_entity('website', r.website) = v)
       or (_t = 'social' and public.normalize_entity('social', r.social_account) = v)
       or (_t = 'payment' and public.normalize_entity('payment', r.payment_info) = v)
  ) s
  where se.entity_type = _t and se.value_normalized = v;
end $$;
revoke execute on function public.upsert_entity(public.entity_type, text) from public, anon, authenticated;

create or replace function public.reports_entities() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE','DELETE') then
    perform public.upsert_entity('phone', old.phone); perform public.upsert_entity('website', old.website);
    perform public.upsert_entity('social', old.social_account); perform public.upsert_entity('payment', old.payment_info);
  end if;
  if tg_op in ('INSERT','UPDATE') then
    perform public.upsert_entity('phone', new.phone); perform public.upsert_entity('website', new.website);
    perform public.upsert_entity('social', new.social_account); perform public.upsert_entity('payment', new.payment_info);
  end if;
  return coalesce(new, old);
end $$;
create trigger reports_entities after insert or update or delete on public.reports for each row execute function public.reports_entities();

-- Public lookup: returns only aggregate risk level, never reporter data
create or replace function public.check_entity(_type public.entity_type, _value text)
returns table (entity_type public.entity_type, value_normalized text, level text, distinct_reporters int, is_verified_warning boolean, admin_note text, last_reported_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare v text := public.normalize_entity(_type, _value); r record;
begin
  if v is null then return; end if;
  select * into r from public.suspicious_entities se where se.entity_type = _type and se.value_normalized = v;
  if not found or (r.distinct_reporters = 0 and not r.is_verified_warning) then
    return query select _type, v, 'bilinmiyor'::text, 0, false, null::text, null::timestamptz; return;
  end if;
  return query select r.entity_type, r.value_normalized,
    case when r.is_verified_warning then 'dogrulanmis' when r.distinct_reporters >= 2 then 'coklu' else 'incelenmemis' end,
    r.distinct_reporters, r.is_verified_warning, case when r.is_verified_warning then r.admin_note else null end, r.last_reported_at;
end $$;
grant execute on function public.check_entity(public.entity_type, text) to anon, authenticated;

-- SIMILAR CASES (curated patterns)
create table public.similar_cases (
  id uuid primary key default gen_random_uuid(),
  category public.report_category not null,
  title text not null,
  method_summary text not null,
  solution_hint text,
  case_count int not null default 0,
  published boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.similar_cases to anon;
grant select, insert, update, delete on public.similar_cases to authenticated;
grant all on public.similar_cases to service_role;
alter table public.similar_cases enable row level security;
create policy "cases read" on public.similar_cases for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "cases admin insert" on public.similar_cases for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "cases admin update" on public.similar_cases for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "cases admin delete" on public.similar_cases for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- Anonymous similar reports (redacted, opt-in only)
create or replace function public.public_similar_reports(_category public.report_category default null, _q text default null, _limit int default 20)
returns table (id uuid, category public.report_category, summary text, status public.report_status, created_month text)
language sql stable security definer set search_path = public as $$
  select r.id, r.category, r.public_summary, r.status, to_char(r.created_at, 'YYYY-MM')
  from public.reports r
  where r.share_anonymously and r.public_summary is not null
    and (_category is null or r.category = _category)
    and (_q is null or _q = '' or r.public_summary ilike '%' || _q || '%')
  order by r.created_at desc
  limit least(greatest(_limit,1),50)
$$;
grant execute on function public.public_similar_reports(public.report_category, text, int) to anon, authenticated;

-- SUPPORT REQUESTS
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subject text not null check (length(subject) between 3 and 150),
  message text not null check (length(message) between 10 and 5000),
  status text not null default 'acik' check (status in ('acik','yanitlandi','kapandi')),
  admin_reply text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.support_requests to authenticated;
grant all on public.support_requests to service_role;
alter table public.support_requests enable row level security;
create policy "support own read" on public.support_requests for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "support own insert" on public.support_requests for insert to authenticated with check (user_id = auth.uid());
create policy "support admin update" on public.support_requests for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- APPEALS
create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_id uuid references public.businesses(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete cascade,
  reason text not null check (length(reason) between 10 and 3000),
  status text not null default 'acik' check (status in ('acik','kabul','red')),
  admin_reply text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.appeals to authenticated;
grant all on public.appeals to service_role;
alter table public.appeals enable row level security;
create policy "appeals read" on public.appeals for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "appeals insert" on public.appeals for insert to authenticated with check (user_id = auth.uid() and (business_id is null or public.is_business_owner(business_id)));
create policy "appeals admin update" on public.appeals for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- AUDIT LOGS
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_table text not null,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit admin read" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.audit_admin() returns trigger language plpgsql security definer set search_path = public as $$
declare rid uuid; det jsonb;
begin
  if auth.uid() is null or not public.has_role(auth.uid(),'admin') then return coalesce(new, old); end if;
  rid := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('eski', to_jsonb(old)->k, 'yeni', to_jsonb(new)->k)) into det
    from jsonb_object_keys(to_jsonb(new)) k where to_jsonb(new)->k is distinct from to_jsonb(old)->k and k not in ('updated_at','computed_at');
  elsif tg_op = 'INSERT' then det := to_jsonb(new);
  else det := to_jsonb(old); end if;
  insert into public.audit_logs (actor_id, action, target_table, target_id, details) values (auth.uid(), tg_op, tg_table_name, rid, det);
  return coalesce(new, old);
end $$;
create trigger audit_reports after update or delete on public.reports for each row execute function public.audit_admin();
create trigger audit_businesses after update or delete on public.businesses for each row execute function public.audit_admin();
create trigger audit_verifs after update on public.business_verifications for each row execute function public.audit_admin();
create trigger audit_reviews after update or delete on public.reviews for each row execute function public.audit_admin();
create trigger audit_alerts after insert or update or delete on public.alerts for each row execute function public.audit_admin();
create trigger audit_cases after insert or update or delete on public.similar_cases for each row execute function public.audit_admin();
create trigger audit_entities after update on public.suspicious_entities for each row execute function public.audit_admin();
create trigger audit_profiles after update on public.profiles for each row execute function public.audit_admin();
create trigger audit_support after update on public.support_requests for each row execute function public.audit_admin();
create trigger audit_appeals after update on public.appeals for each row execute function public.audit_admin();
create trigger audit_roles after insert or delete on public.user_roles for each row execute function public.audit_admin();

-- ADMIN RPCs
create or replace function public.admin_set_role(_user uuid, _role public.app_role, _grant boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Yetkisiz'; end if;
  if _grant then insert into public.user_roles (user_id, role) values (_user, _role) on conflict do nothing;
  else
    if _user = auth.uid() and _role = 'admin' then raise exception 'Kendi yönetici yetkinizi kaldıramazsınız'; end if;
    delete from public.user_roles where user_id = _user and role = _role;
  end if;
end $$;
grant execute on function public.admin_set_role(uuid, public.app_role, boolean) to authenticated;

create or replace function public.admin_stats() returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Yetkisiz'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'reports', (select count(*) from public.reports),
    'reports_new', (select count(*) from public.reports where status = 'yeni'),
    'reports_solved', (select count(*) from public.reports where status = 'cozuldu'),
    'businesses', (select count(*) from public.businesses),
    'verifications_pending', (select count(*) from public.business_verifications where status = 'pending'),
    'reviews', (select count(*) from public.reviews),
    'support_open', (select count(*) from public.support_requests where status = 'acik'),
    'appeals_open', (select count(*) from public.appeals where status = 'acik'),
    'entities_multi', (select count(*) from public.suspicious_entities where distinct_reporters >= 2)
  );
end $$;
grant execute on function public.admin_stats() to authenticated;

-- STORAGE POLICIES
create policy "evidence own read" on storage.objects for select to authenticated using (
  bucket_id = 'evidence' and ((storage.foldername(name))[1] = auth.uid()::text
    or (public.has_role(auth.uid(),'admin') and exists (select 1 from public.report_attachments a where a.storage_path = name and a.shared_with_moderation))));
create policy "evidence own insert" on storage.objects for insert to authenticated with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "evidence own delete" on storage.objects for delete to authenticated using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verif docs read" on storage.objects for select to authenticated using (
  bucket_id = 'verification-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "verif docs insert" on storage.objects for insert to authenticated with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "logos read" on storage.objects for select to anon, authenticated using (bucket_id = 'business-logos');
create policy "logos insert" on storage.objects for insert to authenticated with check (bucket_id = 'business-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos update" on storage.objects for update to authenticated using (bucket_id = 'business-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos delete" on storage.objects for delete to authenticated using (bucket_id = 'business-logos' and (storage.foldername(name))[1] = auth.uid()::text);
