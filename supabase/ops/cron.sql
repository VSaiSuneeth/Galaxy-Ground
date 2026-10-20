-- Galaxy Ground cron template. Do not apply from this repository.
-- Jobs are deliberately created INACTIVE. The owner enables individual jobs only
-- after deploying the protected Edge Functions and setting CRON_SECRET plus the
-- matching Vault secret named cron_secret.

-- Suggested schedules (UTC):
-- fetch-startup-updates: 0 */6 * * *
-- fetch-themed-posts: 30 */6 * * *
-- send-weekly-digest: 0 3 * * 1
-- sync-launches and sync-topic-content: keep inactive until configured
-- send-live-reminders: */5 * * * * after the function is deployed

-- Example: replace FUNCTION_NAME and SCHEDULE, then run in the Supabase SQL editor.
-- cron.schedule updates an existing job with the same name.
-- select cron.schedule('FUNCTION_NAME', 'SCHEDULE', $cron$
--   select net.http_post(
--     url := 'https://lmdswaagcdxulcczkqmu.supabase.co/functions/v1/FUNCTION_NAME',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
--     ),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 120000
--   );
-- $cron$);
-- select cron.alter_job((select jobid from cron.job where jobname = 'FUNCTION_NAME'), active := false);

-- Verify current configuration without revealing secrets.
select jobname, schedule, active from cron.job order by jobname;

-- Owner-only action after each configured source and function deployment is verified:
-- select cron.alter_job((select jobid from cron.job where jobname = 'FUNCTION_NAME'), active := true);
