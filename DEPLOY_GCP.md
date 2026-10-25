# Google Cloud Run Deployment Guide for LocaToGo

This guide covers deploying the Next.js application to **Google Cloud Run** using the **Always Free Tier**.

---

## 1. Prerequisites

1. Install the [Google Cloud CLI (gcloud)](https://cloud.google.com/sdk/docs/install) on your machine.
2. Initialize and log in:
   ```powershell
   gcloud init
   gcloud auth login
   ```
3. Set your project (or create one in GCP Console):
   ```powershell
   gcloud config set project <YOUR_GCP_PROJECT_ID>
   ```
4. Enable the necessary APIs (Run, Build, Scheduler):
   ```powershell
   gcloud services enable run.googleapis.com cloudscheduler.googleapis.com cloudbuild.googleapis.com
   ```

---

## 2. Deploy to Cloud Run (Single Command)

You do **not** need Docker installed locally. Google Cloud Build will build the multi-stage container in the cloud directly from the repository.

Run the following command from the project root:

```powershell
gcloud run deploy locatogo `
  --source . `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 5 `
  --port 8080 `
  --set-env-vars "^##^NEXT_PUBLIC_APP_URL=https://locatogo.com##NEXT_PUBLIC_SUPABASE_URL=your_supabase_url##NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key##SUPABASE_SERVICE_ROLE_KEY=your_service_role_key##RESEND_API_KEY=your_resend_key##GEMINI_API_KEY=your_gemini_key##CRON_SECRET=your_cron_secret"
```

> [!TIP]
> Setting `--min-instances 0` ensures the container scales down to zero when idle, keeping your monthly cost **$0.00** within the GCP Always Free Tier.

---

## 3. Configure the Background Cron Job (Replaces Vercel Cron)

Your app has a weekly job synchronization endpoint at `/api/cron/sync-company-jobs?all=true`.

Set it up in **Cloud Scheduler** (free for up to 3 jobs):

```powershell
gcloud scheduler jobs create http sync-company-jobs `
  --location us-central1 `
  --schedule "0 2 * * 1" `
  --time-zone "UTC" `
  --uri "https://<YOUR-CLOUD-RUN-URL>/api/cron/sync-company-jobs?all=true" `
  --http-method GET `
  --headers "Authorization=Bearer <YOUR_CRON_SECRET>"
```

---

## 4. Map Your Custom Domain

1. In Google Cloud Console, go to **Cloud Run** > **Custom Domains** (or **Manage Custom Domains**).
2. Click **Add Mapping** and choose your service `locatogo`.
3. Enter your domain: `locatogo.com` and/or `app.locatogo.com`.
4. Add the provided DNS `CNAME` and `A` records to your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy).
5. Google will automatically issue and renew a free SSL certificate for you.

---

## 5. Summary of Created/Modified Files

- `next.config.ts`: Added `output: "standalone"` to bundle a lightweight self-contained server.
- `Dockerfile`: Multi-stage Alpine container optimized for Next.js 16 (App Router) on port 8080.
- `.dockerignore`: Prevents local node modules, cache, and secrets from being uploaded.
- `cloudbuild.yaml`: Automated Cloud Build pipeline configuration.
