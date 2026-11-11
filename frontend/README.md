# unsaid: frontend

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui, for the Express API in `../backend`.
People share a link, receive anonymous notes, and choose whether to unredact a sender, which opens a chat.

## Run it

You need the backend running first (see `../backend`, `npm run dev`, port 5000 by default).

```bash
cp .env.example .env.local   # then adjust if your backend isn't on localhost:5000
npm install
npm run dev                  # http://localhost:3000
```

Production: `npm run build && npm start`.

| Variable | Where it's used | |
| --- | --- | --- |
| `BACKEND_URL` | server only, read at runtime | where the Express API runs |
| `NEXT_PUBLIC_SITE_URL` | metadata, robots, sitemap | this site's public URL |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | the Google button | same id as the backend's `GOOGLE_CLIENT_ID`; empty hides the button |

## Checks

```bash
npm run typecheck
npm run lint
npm run test:e2e     # Playwright, see below
```

`test:e2e` starts its own backend (port 5055) against a throwaway `ngl_e2e_test` database that is dropped
before and after, with emails written to `test-results/mail.log` instead of sent, and a production build of
this app (port 3055). It needs MongoDB and Redis from `../backend/.env` to be reachable. The first run needs
`npx playwright install chromium`.

## How it talks to the backend

- The browser only ever calls `/api/*` on this site. `src/app/api/[...path]/route.ts` forwards each request
  to `BACKEND_URL` and streams the answer back, cookies included. The backend's auth cookies are therefore
  first-party (`sameSite=strict` works, no CORS) and its address is never exposed.
- `src/app/api/auth/session/route.ts` answers "who is signed in?": the backend has no such endpoint and its
  cookies are `httpOnly`, so this server route reads the access token (it does **not** verify the signature;
  it's only used for display, every API call is checked by the backend) and refreshes it when it expired.
- `src/lib/api/client.ts` is the single API client: on a 401 it refreshes the session once and retries, and
  if that fails the app signs the user out (`SessionExpiryHandler` in `providers.tsx`).

```
src/
  app/            routes: (auth) login, register, verify, forgot-password · (app) inbox, chats, link, profile
                  · u/[id] public send page · api/ proxy + session · uploads/ proxy
  components/     ui/ (shadcn, restyled) · brand/ (censor bar, stamp, paper note, logo)
                  · auth, inbox, chat, send, profile, layout, common
  hooks/          TanStack Query hooks (session, inbox, conversations) and small browser hooks
  lib/            api/ (client + one module per backend router) · validation.ts (zod, the backend's limits)
e2e/              Playwright specs and support (fixtures, email stub, database cleanup)
```

## Deploying

- Run the backend with `TRUST_PROXY` set to the number of proxies **in front of this app plus one** (this
  app forwards requests too), and only when the outermost proxy overwrites `X-Forwarded-For` (nginx
  `proxy_set_header X-Forwarded-For $remote_addr;`, Vercel, Render...). Without that, clients could fake
  their IP and get around the backend's rate limits. With `TRUST_PROXY=0` every user shares one limit.
- Serve over HTTPS and set the backend's `NODE_ENV=production` so its cookies are `secure`.

## Known limits (backend side)

- Share links use the user id (`/u/<id>`): there are no usernames.
- No live updates: chats poll every 4 s while open, the inbox every 30 s.
