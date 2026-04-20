# Recovery Center

Recovery Center is a React + Vite app for tracking a structured recovery protocol week by week while saving each day inside that week. It includes:

- Responsive desktop and mobile layouts
- A login page with Supabase auth wiring
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

- `seed.sql` is sample application data.
- In a live Supabase project, `profiles.id` should match a real user in `auth.users`.

### GitHub Actions configuration

For the GitHub Pages build, add these GitHub repository variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If you later add a migration or database-admin workflow, store the Postgres password as a GitHub repository secret:

- `SUPABASE_DB_PASSWORD`

Then the connection string format would be:

```text
postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.vbyeabiqfoytltwdhbsk.supabase.co:5432/postgres
```

Do not expose the raw database password to the frontend build. GitHub Pages only needs the public Supabase URL and anon key.

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
