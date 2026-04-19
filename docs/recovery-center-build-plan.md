# Recovery Center Build Plan

## Target Stack

- Frontend: React + Vite
- UI library: PrimeReact
- Backend: Supabase
- Auth: Supabase Auth
- Charts: Recharts or PrimeReact Chart wrapper

## Product Scope For Initial Build

### 1. Authentication

Build a login page first using Supabase Auth with:

- Email + password
- Password reset
- Session persistence
- Protected app shell

### 2. Responsive App Shell

Create one responsive application, not separate apps.

Desktop:

- Left rail navigation
- Top summary bar
- Multi-column dashboard
- Wider analytics and week overview

Mobile:

- Compact top header
- Bottom tab navigation
- Single-column forms
- Sticky save actions

### 3. Main App Areas

- Dashboard
- Daily log
- Nutrition
- Oura insights
- History
- Settings

## PrimeReact Component Plan

Recommended core components:

- `Card`
- `Button`
- `InputText`
- `InputTextarea`
- `InputNumber`
- `Slider`
- `ToggleButton`
- `Tag`
- `Chip`
- `TabView`
- `DataTable`
- `Chart`
- `Dialog`
- `Toast`
- `Sidebar`
- `Menubar`
- `Avatar`

## Data Model Strategy

### Principle

Store the program in three layers:

1. Program configuration
2. Week records
3. Daily records

That gives you:

- Easy week-by-week navigation
- Daily logging inside each week
- Room for multiple protocols in the future

### Daily Record Shape

Each day should include:

- Calendar date
- Program week
- Day of week
- Patch cycle day
- Symptom scores
- Nutrition metrics
- Supplement selections
- Freeform notes
- Optional Oura metrics for that date

## Supabase Plan

### Auth

- Use Supabase `auth.users`
- Create a `profiles` table keyed by auth user id
- Scope every recovery record to the signed-in user

### Storage

Use Postgres tables for the app state rather than JSON blobs.

Possible future storage bucket use:

- CSV exports
- PDF reports
- Uploaded Oura files

### Security

- Enable Row Level Security on all user-owned tables
- Policies should restrict reads and writes to `auth.uid()`

## Implementation Phases

### Phase 0. Planning And Data Contract

- Finalize schema
- Finalize routes
- Finalize responsive layout rules
- Finalize seed dataset

### Phase 1. Project Scaffold

- Initialize Vite React app
- Install PrimeReact, PrimeIcons, PrimeFlex
- Install Supabase client
- Set up theme, layout tokens, router, auth provider

### Phase 2. Auth And Shell

- Build login page
- Add protected routes
- Build responsive shell
- Add desktop and mobile navigation

### Phase 3. Daily Logging

- Week selector
- Day selector
- Symptom form
- Save/update daily logs
- Success and validation messaging

### Phase 4. Nutrition And Supplements

- Macro inputs
- Water tracking
- Meals text area
- Supplement catalog and daily selection

### Phase 5. Oura And History

- Oura metric table
- Charts
- Flagged day display
- History filters

### Phase 6. Export And Polish

- CSV export
- Backup / restore strategy
- Loading states
- Empty states
- Final responsive QA

## Suggested Frontend File Structure

```text
src/
  app/
    router.jsx
    providers.jsx
  components/
    layout/
    dashboard/
    forms/
    charts/
  features/
    auth/
    recovery-program/
    daily-logs/
    nutrition/
    supplements/
    oura/
    history/
  lib/
    supabase.js
    date.js
    formatters.js
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    DailyLogPage.jsx
    HistoryPage.jsx
    SettingsPage.jsx
  styles/
    theme.css
```

## View Definitions

### Login Page

Should include:

- Brand block for Recovery Center
- Email input
- Password input
- Sign in button
- Forgot password action
- Small trust copy

### Desktop Dashboard

Should include:

- Program phase summary
- Current patch cycle
- Week/day quick picker
- Daily symptom snapshot
- Oura trend cards
- History list

### Mobile Dashboard

Should prioritize:

- Today status
- Quick symptom entry
- Week/day pills
- One-tap navigation to nutrition and history

## Decisions To Preserve From The Prototype

- 8-week protocol framing
- Week/day navigation model
- Patch cycle visualization
- Symptom categories and score scale
- Nutrition plus supplements split
- Oura charts and tagged events

## Changes Recommended Before Implementation

- Move away from local JSON blob storage
- Separate supplements into catalog plus join table
- Store actual dates alongside week/day
- Keep Oura data in its own table instead of mixing into daily logs
- Support one user having more than one recovery program over time
