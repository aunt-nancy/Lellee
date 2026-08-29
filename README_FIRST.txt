LELLEE — CREATE STANDARD + ADMIN TEST LOGINS
August 29, 2026

WHAT THIS PACKAGE DOES
1. Creates/resets one ordinary QA login.
2. Creates/resets one Admin QA login.
3. Confirms both Auth accounts so they can sign in immediately.
4. Makes sure the ordinary QA user is not an admin.
5. Grants the Admin QA user an active admin role in public.admin_user_roles.
6. Prints both login credentials at the end.

IMPORTANT
- This is a PRIVATE provisioning package. DO NOT upload it into the Lellee website repository.
- Do not put a Supabase service_role key into any website HTML or JavaScript.
- The script reads the service_role key only from your local environment.
- Use Node.js 18 or newer.

WINDOWS POWERSHELL — RUN STEPS
1. Put this folder somewhere private on your computer.
2. Open PowerShell in this folder.
3. Set the two temporary environment variables below using YOUR Supabase values:

   $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"

4. Optional safety preview (makes NO database changes):

   $env:DRY_RUN="1"
   node .\LELLEE_CREATE_USER_AND_ADMIN_LOGINS.mjs
   Remove-Item Env:DRY_RUN

5. Create/reset both accounts and grant Admin:

   node .\LELLEE_CREATE_USER_AND_ADMIN_LOGINS.mjs

6. Clear the service-role key from the PowerShell session:

   Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY

7. Test the standard account at:
   https://www.lellee.com/app?auth=signin

8. Sign out, then test the Admin account at the SAME sign-in address.
   After Admin signs in, the Admin navigation item should appear.

IF IT SAYS admin_user_roles DOES NOT EXIST
Run the previously approved ADMIN_OPERATIONS_CORRECTED.sql in Supabase SQL Editor,
then rerun this login-creation script.

WHY ADMIN USES THE SAME LOGIN PAGE
The approved Lellee security model uses Supabase Auth for identity and
public.admin_user_roles for authorization. Admin access is not determined by
a second exposed password form; it is determined by the signed-in user's
server-backed role.
