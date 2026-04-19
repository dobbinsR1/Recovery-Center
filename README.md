# Recovery Center

Recovery Center is a React + Vite app for tracking a structured recovery protocol week by week while saving each day inside that week. It includes:

- Responsive desktop and mobile layouts
- A login page with Supabase auth wiring
- A demo workspace fallback when Supabase is not configured yet
- Daily symptom logging
- Nutrition and supplement tracking
- Oura trend charts
- History and export views

## Stack

- React
- Vite
- PrimeReact
- Supabase
- Recharts

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app in your browser.

If no Supabase environment variables are present, the app runs in seeded demo mode automatically.

## Supabase Setup

Create a `.env` file from `.env.example` and add:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then apply the SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Note:

- `seed.sql` is meant for review/demo purposes.
- In a live Supabase project, `profiles.id` should match a real user in `auth.users`.

## Project Files

- App source: `src/`
- Planning docs: `docs/`
- Supabase SQL: `supabase/`

## Build

```bash
npm run build
```

The current build succeeds locally.

## Docker

Build and run the app locally in Docker:

```bash
npm run docker
```

The container serves the app at `http://localhost:4173`.

To stop and remove the container:

```bash
npm run docker:stop
```

## GitHub Pages

The repo now includes a Pages deployment workflow in `.github/workflows/deploy-pages.yml`.

It will deploy the latest commit on `main` to GitHub Pages automatically.

Notes:

- The workflow uses the current GitHub Pages actions flow with `configure-pages`, `upload-pages-artifact`, and `deploy-pages`.
- The app switches to hash-based routing during the Pages build so client-side routes keep working after refresh.
