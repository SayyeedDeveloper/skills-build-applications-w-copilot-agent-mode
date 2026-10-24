# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Each route component (Activities, Teams, Leaderboard, Workouts) loads data only through `getJson` from `src/api/client.ts`, using relative `/api` paths that the Vite dev server on port 5173 proxies to Express on 8000. A small shared hook tracks loading, empty, success and error states, which render as `role="status"` messages, Bootstrap tables and `role="alert"` errors.
- Logic tier decision: Express routes in `src/routes/api.ts` stay thin and delegate to `src/services/octofitService.ts`. Services validate input and throw errors with a deliberate HTTP status (400 for invalid input, 404 for unknown records). The app error handler maps Mongoose validation and cast errors to 400, so bad input never becomes a 500.
- Data tier decision: Mongoose schemas with `required` validation, enums and min values for User, Team, Activity and Workout, stored in MongoDB on port 27017. The seed script upserts stable fixtures keyed by email, team name, workout title and activity timestamp, so it is idempotent and never deletes unrelated records.
- Activity tracking approach: `POST /api/activities` checks that `userId` and `teamId` are well-formed ObjectIds for an existing user and team, that `type` is a known activity and `minutes` is a positive number, then stores the activity with computed `points` (minutes times an intensity factor per type) and `occurredAt`. `GET` lists activities, newest first.
- Team management approach: `POST /api/teams` requires `name` and `mascot` (400 otherwise), validates that `members` are ObjectIds of existing users, and keeps those users' `team` field in sync. `GET` lists teams with their member IDs.
- Leaderboard approach: Sum activity `points` per team with an aggregation, include teams that have no activity yet with 0 points, sort by `totalPoints` (highest first, then by name) and add a 1-based `rank`.
- Workout suggestions approach: Look up the user by email (404 if not found), map their 10 most recent activities to a focus (run, cycle, swim and walk build endurance; strength builds strength; yoga builds mobility), use the most frequent focus or fall back to the user's `fitnessGoal`, and return workouts with matching workouts first. Each suggestion includes a `reason` that explains the match.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`

### Baseline (before implementation)

- `npm run test:data --prefix octofit-tracker/backend`: 4 of 5 fail. The schemas have no `required` validation; the seed test already passes.
- `npm run test:api --prefix octofit-tracker/backend`: 4 of 4 fail. Create endpoints return 501, the leaderboard is empty and suggestions ignore the user.
- `npm test --prefix octofit-tracker/frontend`: 15 of 15 fail. Components are placeholders with no API calls or loading, empty and error states.

### Implementation order

1. Data tier: add schema validation, then extend the seed data and confirm it stays idempotent.
2. Logic tier: activities, then teams, then leaderboard, then workout suggestions, running the API tests after each.
3. Presentation tier: shared state handling, then one route at a time, running the frontend tests after each.
4. Run all suites plus both builds, then open a pull request.
