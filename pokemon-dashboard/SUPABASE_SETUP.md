# Supabase Setup

## 1. Install the Supabase CLI

If you do not already have the CLI installed:

```bash
brew install supabase/tap/supabase
```

Alternative installer:

```bash
npm install -g supabase
```

## 2. Log in to Supabase

```bash
supabase login
```

## 3. Link this project to your Supabase project

From the `pokemon-dashboard` directory:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## 4. Apply migrations

```bash
supabase db push
```

## 5. Deploy the Edge Function

```bash
supabase functions deploy check-stock
```

## 6. Set Edge Function secrets

```bash
supabase secrets set SUPABASE_URL="YOUR_SUPABASE_URL"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
supabase secrets set TELEGRAM_BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
supabase secrets set TELEGRAM_CHAT_ID="YOUR_TELEGRAM_CHAT_ID"
```

If you do not want Telegram notifications yet, omit the Telegram secrets.

## 7. Test the function

```bash
supabase functions invoke check-stock
```

## 8. Schedule the function with pg_cron and pg_net

Enable the extensions:

```sql
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
```

Schedule the function every 5 minutes using `net.http_post`:

```sql
select cron.schedule(
  'check-stock-every-5-minutes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-stock',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);
```

## 9. View scheduled jobs

```sql
select * from cron.job;
```

## 10. Unschedule the job if needed

```sql
select cron.unschedule('check-stock-every-5-minutes');
```

## Troubleshooting

- Do not paste Edge Function TypeScript into the Supabase SQL Editor.
- SQL migrations belong in `supabase/migrations/` or the SQL Editor.
- Edge Function code belongs in `supabase/functions/check-stock/index.ts`.
- Never put the service role key in the frontend `.env` file.
- If the function returns an auth error, verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were set with `supabase secrets set`.
- If the frontend cannot read product or status data, check the RLS `SELECT` policies on `products` and `product_status`.
- If products do not update, inspect the cron job, the Edge Function logs, and recent inserts in `stock_checks`.
- If the scheduled HTTP call fails, confirm `pg_cron` and `pg_net` are enabled and the project ref / anon key are correct.
