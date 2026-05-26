-- SQL ONLY — run in Supabase Dashboard → SQL Editor
-- Do NOT paste TypeScript from data/demo-accounts.ts here.
--
-- Requires seed_demo_user() from supabase/seed-users.sql (run full file once first),
-- or run the complete supabase/seed-users.sql instead.

select public.seed_demo_user('analyst@demo.com', 'Demo1234!', 'analyst', 'Demo Analyst');
select public.seed_demo_user('manager@demo.com', 'Demo1234!', 'treasury_manager', 'Demo Treasury Manager');
select public.seed_demo_user('admin@demo.com', 'Demo1234!', 'admin', 'Demo Admin');

select up.display_name, up.email, up.role
from public.user_profiles up
where up.email like '%@demo.com'
order by up.role;
