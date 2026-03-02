-- Supabase advisor hardening
-- Addresses:
-- 1) auth_rls_initplan warnings by wrapping auth.uid() as (select auth.uid())
-- 2) function_search_path_mutable warnings by pinning search_path on functions

-- -----------------------------
-- Profiles RLS policy optimization
-- -----------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- -----------------------------
-- Courses RLS policy optimization
-- -----------------------------
DROP POLICY IF EXISTS "Courses: user can access own" ON public.courses;
DROP POLICY IF EXISTS "Courses: user can insert own" ON public.courses;
DROP POLICY IF EXISTS "Courses: user can update own" ON public.courses;
DROP POLICY IF EXISTS "Courses: user can delete own" ON public.courses;

CREATE POLICY "Courses: user can access own"
  ON public.courses FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Courses: user can insert own"
  ON public.courses FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Courses: user can update own"
  ON public.courses FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Courses: user can delete own"
  ON public.courses FOR DELETE
  USING (user_id = (select auth.uid()));

-- -----------------------------
-- Tasks RLS policy optimization
-- -----------------------------
DROP POLICY IF EXISTS "Tasks: user can access own" ON public.tasks;
DROP POLICY IF EXISTS "Tasks: user can insert own" ON public.tasks;
DROP POLICY IF EXISTS "Tasks: user can update own" ON public.tasks;
DROP POLICY IF EXISTS "Tasks: user can delete own" ON public.tasks;

CREATE POLICY "Tasks: user can access own"
  ON public.tasks FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Tasks: user can insert own"
  ON public.tasks FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Tasks: user can update own"
  ON public.tasks FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Tasks: user can delete own"
  ON public.tasks FOR DELETE
  USING (user_id = (select auth.uid()));

-- -----------------------------
-- Function search_path hardening
-- -----------------------------
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
