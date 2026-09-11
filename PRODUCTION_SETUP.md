# Production Setup

## Vercel environment variables

This is a Vite app. Vercel's Supabase integration may create `NEXT_PUBLIC_*` variables; the app supports those, but these `VITE_*` variables are the clean preferred names:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_BUSINESS_NAME
VITE_CLIENT_NAME
VITE_SITE_URL
VITE_CONTACT_EMAIL
VITE_CONTACT_PHONE
VITE_SERVICE_AREA
VITE_QUOTE_VALIDITY_DAYS
```

## Supabase database

Run the latest migrations in Supabase SQL Editor if the CLI is not available:

```txt
supabase/migrations/20260911171000_secure_production_quote_flow.sql
supabase/migrations/20260911175500_grant_admin_table_access.sql
supabase/migrations/20260911180500_remove_demo_quote_seed_data.sql
supabase/migrations/20260911182000_add_admin_pricing_settings.sql
```

This closes the public demo RLS policies, adds token-safe quote RPCs, removes demo quote rows, creates admin-only app settings, and assigns admin role to `neel@scaleaura.info` if that auth user already exists.

## Admin user

Create the admin user in Supabase Authentication:

1. Supabase Dashboard
2. Authentication
3. Users
4. Add user
5. Email: `neel@scaleaura.info`
6. Mark the email as confirmed
7. Run the production migration after the user exists

If staff login accepts the password but returns to the homepage or says admin access is missing, the auth user exists but the admin role row is missing. Run this in Supabase SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'neel@scaleaura.info'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Gmail / Google Workspace SMTP

For the simplest no-paid-API email setup, use a Google Workspace app password.

1. In the Google account, enable 2-Step Verification.
2. Open Google Account security settings.
3. Create an app password for Mail.
4. Add these Supabase Edge Function secrets:

```txt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=neel@scaleaura.info
SMTP_PASS=your-google-app-password
SMTP_FROM=Pergola by Scale Aura <neel@scaleaura.info>
ADMIN_NOTIFICATION_EMAIL=neel@scaleaura.info
```

Then deploy the function:

```sh
supabase functions deploy send-email --project-ref mthuffvruetwheuvljjd
```

If using the Supabase Dashboard instead of CLI, create/deploy the `send-email` function with the code from `supabase/functions/send-email/index.ts` and add the same secrets.
