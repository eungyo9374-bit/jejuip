-- 올레 수첩(favorites) 테이블 — Supabase 대시보드 → SQL Editor 에 붙여넣고 Run
-- (이미 만들었다면 맨 아래 "삭제 정책" 한 줄만 실행하면 됩니다)

create table if not exists favorites (
  id bigint generated always as identity primary key,
  nickname text not null,
  source text not null,       -- 'olle' | 'tour' | 'heritage'
  item_id text not null,
  title text not null,
  created_at timestamptz default now()
);
alter table favorites enable row level security;
create policy "read all"   on favorites for select using (true);
create policy "insert all" on favorites for insert with check (true);

-- ★ 수첩에서 빼기(삭제)에 필요한 정책
create policy "delete all" on favorites for delete using (true);
-- ※ 실습용 정책(누구나 읽기·쓰기·삭제)입니다. 실제 서비스에서는 Supabase Auth 로 로그인한 사용자만 쓰게 바꿉니다.
