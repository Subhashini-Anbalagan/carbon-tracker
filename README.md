
  # Premium Sustainability Web App UI

  This is a code bundle for Premium Sustainability Web App UI. The original project is available at https://www.figma.com/design/Gp3a33zeYI9QN21DeNfoyU/Premium-Sustainability-Web-App-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Combined screens & routing

  This bundle combines all 5 exported screens into one app with client-side
  routing (`react-router`, hash-based so it also works from a static file
  server with no extra config). No screen's design, animation, copy, or
  icons were changed — each screen's original JSX/CSS was kept as-is. The
  only edits were: renaming each screen's `App()` function to a unique name,
  and wiring the existing sidebar nav buttons to actually change routes
  instead of just local "active" state.

  | Route         | Screen                                   | Source file                        |
  |---------------|-------------------------------------------|-------------------------------------|
  | `/`           | Login (sign in)                           | `src/app/pages/Login.tsx`           |
  | `/dashboard`  | Dashboard (overview + AI insights)        | `src/app/pages/Dashboard.tsx`       |
  | `/activity`   | Activity Logger (log travel/food/power)   | `src/app/pages/ActivityLogger.tsx`  |
  | `/analytics`  | Analytics (carbon breakdown & trends)     | `src/app/pages/Analytics.tsx`       |
  | `/reports`    | Reports (monthly report & achievements)   | `src/app/pages/Reports.tsx`         |

  Signing in on the Login screen takes you to `/dashboard`. From any of the
  4 inner screens, clicking a sidebar nav item ("Dashboard", "Activity
  Logger", "Analytics", "Reports") navigates to that screen. "Settings" has
  no nav target since none of the 5 exports included a Settings screen.

  The router shell lives in `src/app/App.tsx`. The route-to-label mapping
  lives in `src/app/navRoutes.ts`.
  