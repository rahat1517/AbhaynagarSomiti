# Supabase SQL Setup Order

Run these scripts in the **Supabase SQL Editor** in the order below.

## 1. SAFE — run first (required)

File: `migrations/20250610120000_fix_admin_member_verification.sql`

- `is_admin()`
- `prevent_profile_privilege_escalation()` trigger
- `admin_update_member_verification()`
- Legacy approve/reject RPC aliases

## 2. SAFE — run second (required)

File: `migrations/20250610130000_portal_schema_and_rpcs.sql`

- Adds missing `profiles` columns (`member_type`, `academic_year`, etc.)
- `is_verified_member()`
- `member_profiles` directory view
- Pending count + list RPCs
- Directory list + profile details RPCs
- Grants

## 3. OPTIONAL — run only if you have conflicting old objects

File: `migrations/OPTIONAL_destructive_cleanup.sql`

- Drops legacy views/functions that duplicate the new flow
- **Do not run** unless you know the old object is unused

## 4. DESTRUCTIVE — never run unless you intend to reset data

Not included. Do not delete `auth.users` or truncate `profiles`.

## After SQL

1. Ensure at least one admin: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`
2. Register a test member → should be `pending`
3. Admin login → navbar badge shows pending count
4. Approve member → `is_verified = true`
5. Member login → Directory shows approved member only
