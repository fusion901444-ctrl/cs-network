-- CS 국가기관 네트워크망 관리 V1 - Supabase 스키마 (로그인 없는 버전)
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여 넣고 Run. 여러 번 실행해도 안전하다.
--
-- 주의: 로그인이 없으므로 앱 주소와 anon 키를 아는 사람은 누구나 데이터를 읽고 쓸 수 있다.
--       IP·계정·구성도 같은 민감 정보는 절대 저장하지 않는다. 로그인은 이후 단계에서 추가한다.

-- ---------- 테이블 ----------

-- 직원 (앱 첫 화면에서 이름을 골라 사용)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  role text not null default 'staff' check (role in ('admin', 'staff'))
);

-- 기관
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  dept text,
  contact_name text,
  phone text,
  address text,
  contract_amount integer,
  inspection_cycle text,
  memo text, -- IP·계정·구성도 입력 금지
  created_at timestamptz not null default now()
);

-- 작업
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id),
  type text not null check (type in ('정기점검', '작업·공사', '보안정책 변경')),
  categories text[] not null check (cardinality(categories) > 0),
  content text not null,
  requester text,
  basis text,
  scheduled_date date not null,
  status text not null default '접수' check (status in ('접수', '배정', '진행', '완료')),
  assignee_id uuid references public.users(id),
  created_by uuid references public.users(id),
  checklist jsonb, -- {분류: {항목: 정상/이상/해당없음}}
  result text,
  materials text,
  work_minutes integer,
  photo_urls text[],
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  completed_by uuid references public.users(id)
);

create index if not exists works_agency_idx on public.works (agency_id);
create index if not exists works_status_idx on public.works (status, scheduled_date);

-- ---------- 권한 (RLS) ----------
-- 조회·등록·수정만 허용. 삭제 정책이 없으므로 앱에서는 아무것도 삭제할 수 없다.
-- 직원 목록은 조회만 가능 (이름·역할 변경은 SQL Editor 또는 Table Editor 에서).

alter table public.users enable row level security;
alter table public.agencies enable row level security;
alter table public.works enable row level security;

drop policy if exists "직원 조회" on public.users;
create policy "직원 조회" on public.users for select to anon, authenticated using (true);

drop policy if exists "기관 조회" on public.agencies;
drop policy if exists "기관 등록" on public.agencies;
drop policy if exists "기관 수정" on public.agencies;
create policy "기관 조회" on public.agencies for select to anon, authenticated using (true);
create policy "기관 등록" on public.agencies for insert to anon, authenticated with check (true);
create policy "기관 수정" on public.agencies for update to anon, authenticated using (true);

drop policy if exists "작업 조회" on public.works;
drop policy if exists "작업 등록" on public.works;
drop policy if exists "작업 수정" on public.works;
create policy "작업 조회" on public.works for select to anon, authenticated using (true);
create policy "작업 등록" on public.works for insert to anon, authenticated with check (true);
create policy "작업 수정" on public.works for update to anon, authenticated using (true);

-- ---------- 초기 데이터 (실제 이름으로 바꿔서 실행해도 된다) ----------

insert into public.users (name, role) values
  ('대표', 'admin'), ('김기사', 'staff'), ('이기사', 'staff'), ('박기사', 'staff'), ('최기사', 'staff')
on conflict (name) do nothing;

insert into public.agencies (name) values
  ('중구청'), ('동구청'), ('남부경찰서'), ('북부소방서'), ('중부세무서'),
  ('시청'), ('보건소'), ('교육지원청'), ('중앙우체국'), ('행정복지센터')
on conflict (name) do nothing;
