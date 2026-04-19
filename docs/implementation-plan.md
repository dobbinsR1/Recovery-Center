# Recovery Center Implementation Plan

## Build target

Build `Recovery Center` as a React app using:

- Vite
- PrimeReact
- PrimeIcons
- PrimeFlex or responsive CSS utilities
- React Router
- Supabase Auth
- Supabase Postgres

## Assumptions for this first implementation

- Authentication will use Supabase email/password login
- The first version is single-user per account, but the schema supports multiple users
- The current prototype represents one active protocol at a time
- Oura import starts as CSV/manual ingestion later, not live API sync in v1

## Product structure

### Routes

- `/login`
- `/app`
- `/app/week/:weekNumber/day/:date?`
- `/app/history`
- `/app/settings`

### Main feature areas

1. Authentication
2. Responsive dashboard shell
3. Weekly/day recovery logging
4. Nutrition and supplement tracking
5. Oura metrics and charts
6. History and export

## Responsive UI plan

### Desktop view

- Left sidebar for navigation
- Header with active protocol, current week, patch-cycle state
- Main content in 2-column layout
- Persistent week/day selector near top
- Oura charts shown in wider cards

### Mobile view

- Stacked single-column cards
- Sticky top header
- Horizontal scroll week selector
- Tap-friendly day pills
- Bottom tab navigation or compact top tab bar
- Log forms broken into smaller card sections

## PrimeReact component plan

- `Card` for metric blocks and form sections
- `TabView` or `TabMenu` for Log / Nutrition / Oura / History
- `InputText`, `InputNumber`, `InputTextarea`, `Password`
- `Slider` for symptom scales
- `ToggleButton` or `InputSwitch` for alcohol toggle
- `Chips` or `MultiSelect` for supplements and tags
- `Chart` for Oura trends
- `DataTable` for history on desktop
- `Drawer` or `Sidebar` for mobile navigation
- `Toast` for save feedback
- `Message` for auth and validation states

## Data architecture plan

### Core storage model

Use one active recovery program with explicit week/day records:

- `recovery_programs` stores protocol rules
- `recovery_weeks` stores each week in the protocol
- `daily_entries` stores the daily record
- `daily_symptom_scores` stores the 1-10 recovery measures
- `oura_daily_metrics` stores wearable metrics
- `supplements` and `daily_entry_supplements` store supplement usage
- `daily_tags` stores recovery or Oura day markers

### Why this model

- It preserves the week-by-week experience from the prototype
- It still works with actual dates and charts
- It avoids packing unrelated data into one giant table
- It is flexible enough for future imports and multiple protocols

## Authentication plan

### Login page

- Email
- Password
- Sign in
- Create account
- Reset password link

### Protected app behavior

- Anonymous users only see `/login`
- Signed-in users are redirected into `/app`
- All Supabase rows are scoped by `auth.uid()` through RLS policies

## Implementation phases

### Phase 1. App scaffold

- Initialize Vite React app
- Install PrimeReact dependencies
- Add React Router
- Add Supabase client setup
- Add base layout, theme, and route guards

### Phase 2. Auth and shell

- Build login/register/reset page
- Build authenticated app shell
- Add desktop/mobile responsive layout
- Add reusable header, sidebar, and tab shell

### Phase 3. Database integration

- Create Supabase tables and RLS policies
- Create seed data for demo review
- Build typed data service layer
- Add program bootstrap logic for week/day generation

### Phase 4. Daily logging

- Build week selector
- Build day selector
- Build symptom logging form
- Build nutrition form
- Build supplement picker and custom supplement create flow
- Save and update daily entries

### Phase 5. Oura and history

- Build Oura metrics views
- Build flagged-day display
- Build history list/table
- Add CSV export
- Add backup/restore replacement with Supabase-backed history

### Phase 6. Polish

- Loading and error states
- Form validation
- Empty states
- Mobile UX tuning
- Basic test coverage

## Suggested file/module layout

```text
src/
  app/
  components/
  features/
    auth/
    dashboard/
    recovery-log/
    nutrition/
    oura/
    history/
  lib/
    supabase/
    date/
    protocol/
  routes/
  styles/
```

## Immediate next implementation step

After approval of the schema and plan, the next practical move is:

1. Scaffold the Vite app
2. Install PrimeReact and Supabase
3. Create the login page and protected shell
4. Wire the app to the mock schema in `supabase/schema.sql`
