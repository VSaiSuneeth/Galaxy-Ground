# Superseded Local Database Work

`supabase/migrations/20261020010000_security_authorization_hardening.sql` is superseded by database hardening that is already live in production.

Do not apply this migration from this repository. The website code now targets the live authorization model: administrators are determined by `public.user_roles`, and client code never treats `profiles.badges` as authorization.

This repository does not apply SQL, deploy Edge Functions, or modify production configuration.
