-- SAFE: Portal schema helpers, directory view, and RPCs.
-- Run AFTER 20250610120000_fix_admin_member_verification.sql

-- ---------------------------------------------------------------------------
-- Columns on profiles (idempotent)
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS member_type text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS university_subject text,
  ADD COLUMN IF NOT EXISTS university_hall_name text,
  ADD COLUMN IF NOT EXISTS first_year_admission_session text,
  ADD COLUMN IF NOT EXISTS present_address text,
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Normalize existing rows
UPDATE public.profiles
SET
  role = coalesce(nullif(trim(role), ''), 'member'),
  verification_status = coalesce(nullif(trim(verification_status), ''), 'pending'),
  is_verified = coalesce(is_verified, false),
  is_approved = coalesce(is_approved, false)
WHERE true;

-- ---------------------------------------------------------------------------
-- is_verified_member()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_verified_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'member'
      AND verification_status = 'approved'
      AND is_verified = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_verified_member() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_verified_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_member() TO service_role;

-- ---------------------------------------------------------------------------
-- member_profiles view — approved directory members only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.member_profiles
WITH (security_invoker = true)
AS
SELECT
  p.id AS profile_id,
  p.id,
  p.email,
  p.full_name,
  p.nick_name,
  p.member_type,
  p.academic_year,
  p.university_subject,
  p.university_hall_name,
  p.first_year_admission_session,
  p.present_address,
  p.union_pouroshova_name,
  p.ward_village_name,
  p.para_moholla_name,
  p.occupation,
  p.professional_details,
  p.organization_type,
  p.organization_name,
  p.designation,
  p.profile_photo_url,
  p.role,
  p.verification_status,
  p.is_verified,
  p.gender,
  p.blood_group,
  p.date_of_birth,
  p.contact_number,
  p.facebook_profile_link,
  p.life_story,
  p.created_at
FROM public.profiles p
WHERE p.role = 'member'
  AND p.verification_status = 'approved'
  AND p.is_verified = true;

GRANT SELECT ON public.member_profiles TO authenticated;
GRANT SELECT ON public.member_profiles TO anon;

-- ---------------------------------------------------------------------------
-- admin_pending_member_request_count()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_pending_member_request_count()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN 0;
  END IF;

  RETURN (
    SELECT count(*)::integer
    FROM public.profiles p
    WHERE p.role = 'member'
      AND p.verification_status = 'pending'
      AND coalesce(p.is_verified, false) = false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_pending_member_request_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_pending_member_request_count() TO authenticated;

-- ---------------------------------------------------------------------------
-- admin_list_pending_member_requests()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_pending_member_requests()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.profiles p
  WHERE public.is_admin()
    AND p.role = 'member'
    AND p.verification_status = 'pending'
    AND coalesce(p.is_verified, false) = false
  ORDER BY p.created_at DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.admin_list_pending_member_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_member_requests() TO authenticated;

-- Backward-compatible alias
CREATE OR REPLACE FUNCTION public.admin_list_member_requests()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.admin_list_pending_member_requests();
$$;

REVOKE ALL ON FUNCTION public.admin_list_member_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_member_requests() TO authenticated;

-- ---------------------------------------------------------------------------
-- public_list_members() — directory listing (approved + verified only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.public_list_members(
  p_role text DEFAULT NULL,
  p_academic_session text DEFAULT NULL,
  p_search_text text DEFAULT NULL
)
RETURNS SETOF public.member_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mp.*
  FROM public.member_profiles mp
  WHERE (
    auth.uid() IS NOT NULL
    AND (
      public.is_verified_member()
      OR public.is_admin()
    )
  )
  AND (p_role IS NULL OR p_role = '' OR lower(mp.member_type) = lower(p_role))
  AND (
    p_academic_session IS NULL
    OR p_academic_session = ''
    OR mp.academic_year ILIKE '%' || p_academic_session || '%'
    OR mp.first_year_admission_session ILIKE '%' || p_academic_session || '%'
  )
  AND (
    p_search_text IS NULL
    OR p_search_text = ''
    OR mp.full_name ILIKE '%' || p_search_text || '%'
    OR mp.university_subject ILIKE '%' || p_search_text || '%'
    OR mp.university_hall_name ILIKE '%' || p_search_text || '%'
    OR mp.present_address ILIKE '%' || p_search_text || '%'
    OR mp.occupation ILIKE '%' || p_search_text || '%'
  )
  ORDER BY mp.created_at DESC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.public_list_members(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_list_members(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_member_profile_details() — admin + verified directory access
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_member_profile_details(p_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_degrees jsonb;
BEGIN
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile ID is required';
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF public.is_admin() THEN
    NULL;
  ELSIF auth.uid() = p_profile_id THEN
    NULL;
  ELSIF public.is_verified_member()
    AND v_profile.role = 'member'
    AND v_profile.verification_status = 'approved'
    AND v_profile.is_verified = true THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb)
  INTO v_degrees
  FROM public.member_degree_qualifications d
  WHERE d.profile_id = p_profile_id;

  RETURN to_jsonb(v_profile)
    || jsonb_build_object('member_degree_qualifications', v_degrees);
END;
$$;

REVOKE ALL ON FUNCTION public.get_member_profile_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_member_profile_details(uuid) TO authenticated;

-- Backward-compatible directory details RPC
CREATE OR REPLACE FUNCTION public.get_directory_profile_details(p_profile_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_member_profile_details(p_profile_id);
$$;

REVOKE ALL ON FUNCTION public.get_directory_profile_details(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_directory_profile_details(uuid) TO authenticated;
