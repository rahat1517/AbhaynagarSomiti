-- OPTIONAL / DESTRUCTIVE-ISH: Only run if legacy objects conflict with the new flow.
-- Review each DROP before executing. Safe to skip if the app already works.

-- DROP VIEW IF EXISTS public.public_member_directory CASCADE;
-- DROP VIEW IF EXISTS public.member_full_details CASCADE;

-- DROP FUNCTION IF EXISTS public.old_public_list_members();
