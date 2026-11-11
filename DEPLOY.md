# Deploying (free plans)

The site runs on five free services. Create the accounts, collect the values in step 1,
then deploy the backend (step 2) and the frontend (step 3).

| Part | Service | What it holds |
|---|---|---|
| Frontend (Next.js) | [Vercel](https://vercel.com) | the website |
| Backend (Express) | [Render](https://render.com) | the API; sleeps after ~15 min without visitors |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) | users, notes, chats (already used in development) |
| Redis | [Upstash](https://upstash.com) | sign-in codes, sessions |
| Files | [Cloudinary](https://cloudinary.com) | profile pictures, cover images, documents |
| Email | [Brevo](https://www.brevo.com) | verification and sign-in codes |

Never commit any of these values. They go in the services' settings only.

## 1. Collect the values

1. **MongoDB Atlas.**
   - Network Access → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`). Render's free
     servers don't have a fixed address.
   - `MONGODB_URL`: the same connection string as in `backend/.env`. You can use a separate database
     name for the live site, e.g. `.../unsaid?...`.
2. **Upstash.** Create Database → Redis, pick the region closest to your Render region. On its
   page, copy the URL that starts with `rediss://`. That's `REDIS_URL`.
3. **Cloudinary.** Dashboard → API Keys. Copy the **API environment variable**
   (`cloudinary://<key>:<secret>@<cloud name>`, without the `CLOUDINARY_URL=` part). That's
   `CLOUDINARY_URL`.
4. **Brevo.**
   - Senders, domains & dedicated IPs → Senders → add your email address and click the link Brevo
     emails you. That address is `MAIL_USER`.
   - SMTP & API → API Keys → Generate a new API key. That's `BREVO_API_KEY`.
   - Sending from a Gmail address works, but some codes may land in spam. A domain of your own
     (verified in Brevo) fixes that later.

## 2. Backend on Render

1. Dashboard → **New → Blueprint** → connect GitHub → pick this repository. Render reads
   `render.yaml`.
2. Fill in the values it asks for: `MONGODB_URL`, `REDIS_URL`, `CLOUDINARY_URL`, `BREVO_API_KEY` and
   `MAIL_USER`. For `CLIENT_URL`, enter `https://example.com` for now; it gets fixed in step 4.
3. Deploy. When it's live, open `https://<your service>.onrender.com/health`. It should answer.
   - In **Logs**, look for `email: ready to send`.
   - If you see `can't reach the email service`, the Brevo key or sender is wrong.
4. Environment tab: copy the generated **`PROXY_SECRET`** value. The frontend needs the same one.

## 3. Frontend on Vercel

1. **Add New → Project** → import this repository.
2. **Root Directory: `frontend`**. Leave the build settings as they are.
3. Environment Variables:
   - `BACKEND_URL`: `https://<your service>.onrender.com`
   - `PROXY_SECRET`: the value copied from Render
   - `NEXT_PUBLIC_SITE_URL`: the address Vercel gives the project, e.g. `https://unsaid.vercel.app`.
     It's known after the first deploy; set it then and redeploy.
4. Deploy.

## 4. Finish

1. Render → Environment → set `CLIENT_URL` to the Vercel address. Render redeploys by itself.
2. Open the Vercel address, create an account, and check that the code email arrives (check spam).
   Then upload a profile picture.

Every push to `main` redeploys both.

## Things to know

- **Sleeping backend.** Render's free plan stops the backend after ~15 minutes without visitors.
  The next visitor waits ~30–60 s, and the first request may fail; a reload works. A free pinger
  (e.g. cron-job.org calling `/health` every 10 minutes) keeps it awake.
- **Rate limits.** `PROXY_SECRET` (the same value on both) is what lets the backend tell visitors
  apart. Without it, everyone shares one limit and the site soon answers "too many requests".
- **Google sign-in** is off. To turn it on, set `GOOGLE_CLIENT_ID` on Render and
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` on Vercel (same value), and add the Vercel address to the client's
  authorized origins in Google Cloud Console.
- **Local development is unchanged.** Without `CLOUDINARY_URL`, `BREVO_API_KEY` and `REDIS_URL`,
  the backend keeps using `backend/uploads`, Gmail SMTP and your local Redis.
