# jobs-cron Appwrite Function

Runs twice daily, hits `/api/jobs/refresh` on the deployed site, and emails a digest of top matches via SMTP.

## Deploy (one-time)

1. Install Appwrite CLI: `npm i -g appwrite-cli`
2. From repo root: `appwrite login` then `appwrite init` (skip if project already initialised).
3. Push the function:
   ```
   appwrite functions create \
     --functionId jobs-cron \
     --name "Jobs Cron" \
     --runtime node-20 \
     --schedule "0 6,18 * * *"   # 07:00 + 19:00 Africa/Lagos (UTC+1)
   appwrite functions createDeployment \
     --functionId jobs-cron \
     --code ./appwrite/functions/jobs-cron \
     --activate true \
     --entrypoint src/main.js
   ```

## Environment variables (set on the Function in Appwrite Console)

| Key | Value |
|---|---|
| `SITE_URL` | Your deployed origin, e.g. `https://jeffrey-s-portfolio.vercel.app` |
| `JOBS_CRON_SECRET` | Any random string. **Also set the same value as `JOBS_CRON_SECRET` on Vercel/Next.js** — it's how the function authenticates to the API route. |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `jeffreye306@gmail.com` |
| `SMTP_PASS` | Gmail App Password |
| `JOBS_DIGEST_TO` | `jeffreye306@gmail.com` |

## Manual trigger

In Appwrite Console → Functions → jobs-cron → "Execute now".
