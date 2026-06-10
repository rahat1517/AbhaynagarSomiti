-- Fix admin member verification while blocking privilege escalation for normal users.
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- ---------------------------------------------------------------------------
-- is_admin(): true when the authenticated user has profiles.role = 'admin'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
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
      AND lower(coalesce(role, '')) = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ---------------------------------------------------------------------------
-- prevent_profile_privilege_escalation()
-- Normal users cannot change role, verification_status, or is_verified.
-- Admins may change these fields (e.g. from the admin panel).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF coalesce(NEW.role, 'member') <> 'member' THEN
      RAISE EXCEPTION 'Role cannot be changed by the user';
    END IF;

    IF coalesce(NEW.verification_status, 'pending') <> 'pending' THEN
      RAISE EXCEPTION 'Verification status cannot be changed by the user';
    END IF;

    IF coalesce(NEW.is_verified, false) IS TRUE THEN
      RAISE EXCEPTION 'Verification status cannot be changed by the user';
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Role cannot be changed by the user';
    END IF;

    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
      RAISE EXCEPTION 'Verification status cannot be changed by the user';
    END IF;

    IF NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
      RAISE EXCEPTION 'Verification status cannot be changed by the user';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;

CREATE TRIGGER prevent_profile_privilege_escalation_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ---------------------------------------------------------------------------
-- admin_update_member_verification()
-- Admin-only approve / reject for member profiles.
-- Keeps role = 'member' and preserves member_type.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_member_verification(
  p_profile_id uuid,
  p_action text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text := lower(trim(coalesce(p_action, '')));
  v_profile public.profiles%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile ID is required';
  END IF;

  SELECT *
  INTO v_profile
  FROM public.profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_action IN ('approved', 'approve') THEN
    UPDATE public.profiles
    SET
      verification_status = 'approved',
      is_verified = true,
      is_approved = true,
      role = 'member'
    WHERE id = p_profile_id;

  ELSIF v_action IN ('rejected', 'reject') THEN
    UPDATE public.profiles
    SET
      verification_status = 'rejected',
      is_verified = false,
      is_approved = false,
      role = 'member'
    WHERE id = p_profile_id;

  ELSE
    RAISE EXCEPTION 'Invalid verification action: %', p_action;
  END IF;

  -- Keep legacy registration tables in sync when present.
  IF to_regclass('public.member_registrations') IS NOT NULL THEN
    UPDATE public.member_registrations
    SET status = CASE
      WHEN v_action IN ('approved', 'approve') THEN 'approved'
      ELSE 'rejected'
    END
    WHERE id = p_profile_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', p_profile_id,
    'action', v_action,
    'verification_status', CASE
      WHEN v_action IN ('approved', 'approve') THEN 'approved'
      ELSE 'rejected'
    END,
    'is_verified', v_action IN ('approved', 'approve'),
    'role', 'member',
    'member_type', v_profile.member_type,
    'reason', p_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_member_verification(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_member_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_member_verification(uuid, text, text) TO service_role;

-- Backward-compatible RPC aliases used by older client code.
CREATE OR REPLACE FUNCTION public.approve_member_registration(p_member_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.admin_update_member_verification(p_member_id, 'approved', NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_member_registration(
  p_member_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.admin_update_member_verification(p_member_id, 'rejected', p_reason);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_member_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_member_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_member_registration(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reject_member_registration(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_member_registration(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_member_registration(uuid, text) TO service_role;
