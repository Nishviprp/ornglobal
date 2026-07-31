# OrnGlobal — Surgical Procedure Management

A zero-cost, mobile-first surgical procedure management app. React + Vite + Tailwind CSS on the
frontend, Supabase (Postgres, Auth, Storage) on the backend — all on free tiers.

## 1. Prerequisites

- Node.js 20+ and npm (already installed on this machine)
- A Supabase project (already created — see credentials below)

## 2. One-time Supabase setup

**You must do this once before the app will work.** This project has no direct database access
from the assistant, so the schema has to be applied by hand.

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and click **Run**. This creates all tables, roles, Row Level Security policies, the
   `procedure-files` storage bucket, and seeds a few common specialties. It's safe to re-run.
3. **Enable OTP-code email verification** (the app expects a 6-digit code, not a magic link):
   - Go to **Authentication → Emails → Confirm signup** template.
   - Replace the confirmation link with `{{ .Token }}` so the email shows a 6-digit code instead
     of (or alongside) a link. See [Supabase docs on email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).
4. (Optional) Under **Authentication → Providers → Email**, confirm "Confirm email" is enabled so
   new sign-ups are required to verify before signing in.

## 3. Environment variables

`.env.local` is already created with your project's URL and **anon key** (safe for the browser).

```
VITE_SUPABASE_URL=https://vrcnhvpvygkjlfrdiffy.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

> **Never put the Supabase service role key in this project.** It bypasses Row Level Security
> entirely — if it ends up in frontend code it is visible to anyone who opens dev tools. All
> access control in this app is enforced by RLS policies using the anon key + the logged-in
> user's JWT, which is the correct approach for a client-only app. If you ever need the service
> role key (e.g. for an admin script), keep it in a separate, server-only environment — never in
> `VITE_`-prefixed variables, which Vite inlines into the browser bundle.

## 4. Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:5173.

## 5. Project structure

```
src/
  components/
    Auth/          Login, Register, OTP verification
    Dashboard/     Dashboard, ProcedureList
    SurgicalForm/  Specialty/Surgeon/Procedure selectors, collapsible FormSection, main form
    FileUpload/    FileUploader (drag/drop + tap), VoiceRecorder (Web Audio API), MediaPreview
    Permissions/   ShareDialog
    Common/        Header, Sidebar (hamburger on mobile), Loading
  services/        Thin wrappers around the Supabase client (auth, procedures, files, permissions)
  hooks/           useAuth (context), useProcedure, useFileUpload
  utils/           validators, formatters, audioUtils, localStorage helpers
supabase/
  migrations/0001_init.sql   Full schema + RLS + storage bucket + seed data
```

## 6. How access control works

Roles: `nurse` (default on sign-up), `shared_access`, `hospital_admin`, `higher_authority`.

- A record's owner (`surgical_records.user_id`) always has full read/write/delete.
- Owners share a record via the **Share** dialog, granting `read` or `write` to another user by
  email. Only the owner (or a `higher_authority` user) can create/change/revoke these grants —
  this is what enforces "the data owner must approve all edits."
- `higher_authority` has full read/write/delete on every record, hospital, and global dropdown.
- Everything is enforced server-side by Postgres RLS policies (see the migration), not just in
  the UI — the anon key alone cannot bypass these.

## 7. Deployment (free tier)

### Option A — Vercel (recommended)

1. Push this repo to GitHub (see below).
2. Import the repo at https://vercel.com/new.
3. Framework preset: **Vite**. Build command `npm run build`, output dir `dist` (auto-detected).
4. Add environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Vercel handles SPA client-side routing out of the box.

### Option B — GitHub Pages

GitHub Pages serves static files with no built-in SPA rewrite, and typically serves from a
subpath (`/<repo-name>/`), so two extra steps are needed:

1. In `vite.config.js`, set `base: '/<your-repo-name>/'`.
2. Add a SPA fallback so deep links (e.g. `/procedures/abc`) don't 404: after `npm run build`,
   copy `dist/index.html` to `dist/404.html` (GitHub Pages serves `404.html` for unknown routes,
   which re-boots the React app and lets React Router take over).
3. Add a deploy script, e.g. using the `gh-pages` package:
   ```bash
   npm install -D gh-pages
   npm run build && cp dist/index.html dist/404.html
   npx gh-pages -d dist
   ```
4. Because GitHub Pages has no server-side env injection, `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` get baked in at build time from your local `.env.local` (or CI
   secrets if you build via GitHub Actions). The anon key is safe to ship publicly.

### Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Nishviprp/ornglobal.git
git push -u origin main
```

## 8. Mobile-first notes

- Layout is built mobile-first with Tailwind (`sm:`/`lg:` breakpoints added upward).
- Sidebar collapses to a hamburger menu below the `lg` breakpoint.
- File upload area supports both tap-to-browse (mobile) and drag-and-drop (desktop).
- Voice recording uses the native `MediaRecorder`/`getUserMedia` Web Audio APIs — no external
  libraries — and requires the browser to be served over HTTPS or localhost.
