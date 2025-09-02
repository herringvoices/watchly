# Watchly API & Frontend

An ASP.NET Core (net9.0 target) backend plus a Vite + React + Tailwind (3.x) frontend. The API provides user authentication, media watchlist management, update feeds, comments, likes, and follow relationships. Auth uses ASP.NET Core Identity + JWT issued into an HttpOnly / Secure / SameSite=None cookie named `jwt`.

> NOTE: Runtime target is `net9.0` while EF / Identity packages are 8.x for stability until 9.x data stack is fully released. This can be upgraded later when Npgsql + EF Core 9 stable lands.

## Design Prototype (Figma)
Read-only UI/UX prototype (screens / flows) is available here:

https://www.figma.com/proto/cYFebxAZlhM4GkOVacGOEx/Watchly?node-id=1-3&starting-point-node-id=1%3A3


## Key Features (Current)
- Identity-based registration / login / logout / me endpoints
- JWT Bearer auth reading token from `jwt` cookie
- PostgreSQL via EF Core (code-first)
- Domain models: Users, Follows, Media, MediaUpdates, MediaRating, Comments, Likes (UpdateLike / CommentLike)
- CORS configuration for local frontend dev (Vite: http://localhost:5173 & 4173)
- Swagger (Dev only) for quick endpoint testing (browser will retain cookie)
 - Frontend scaffold: React 19 + Vite + Tailwind CSS 3.4 (utility-first styling)

### Frontend Stack
| Layer | Tech |
|-------|------|
| Build | Vite |
| UI | React 19 (strict mode) |
| Styling | Tailwind CSS 3.4 (+ autoprefixer) |
| Future Data | TanStack Query (planned) |

Tailwind configuration lives in `client/tailwind.config.js` (content maps to `index.html` + all `src/**/*.{js,jsx}`). Global styles & directives are in `client/src/index.css`.

## Planned / In Progress (See `issues.md` + `planning.md`)
UI feed components, comment modal, media search/details, user search/details, watchlist flows, reusable buttons (Like / Comment), timestamp helper utilities, etc.

---
## Architecture Overview
| Layer | Purpose |
|-------|---------|
| Models | EF Core entities (Identity `User` extended with profile fields) |
| Data | `WatchlyDbContext` extending `IdentityDbContext<User>` |
| Services | Auth service now; future: Media, MediaUpdate, MediaRating, Comment, Like, Follow, User, Watchlist |
| Controllers | REST endpoints (currently `AuthController`) |
| DTOs | Plain POCO request/response contracts (explicit mapping; NO AutoMapper) |

Auth flow: Register/Login -> create Identity user -> generate JWT (7d) -> set secure cookie. Incoming requests authenticated by JWT Bearer which pulls token from cookie or (optionally) Authorization header.

---
## Environment & Configuration
Environment variables (load order):
- Development: `.env` loaded via DotNetEnv then overlaid by real environment
- Production: **no** `.env` load; only environment

`.env` template (already added and gitignored):
```
DEV_POSTGRES_HOST=localhost
DEV_POSTGRES_DB=WatchlyDb
DEV_POSTGRES_USER=postgres
DEV_POSTGRES_PASSWORD=password
DEV_POSTGRES_SSL_MODE=Disable

POSTGRES_HOST=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_SSL_MODE=Require

JWT_SECRET=replace-with-64+char-random-string____________________________________________________

CLOUDINARY_CLOUDNAME=
CLOUDINARY_APIKEY=
CLOUDINARY_APISECRET=
```
Connection string is assembled from `DEV_` prefixed vars in Development or unprefixed vars in Production. The API fails fast if `JWT_SECRET` missing or < 32 chars.

---
## Quick Start (Local Dev)
1. Clone repo
2. Create / edit `.env` (already present) with local DB creds
3. Start Postgres (example using Docker):
   ```bash
   docker run -d --name watchly-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=watchly_dev -p 5432:5432 postgres:16
   ```
4. (Optional first time) Add initial migration & apply (skip until DB is ready):
   ```bash
   dotnet ef migrations add InitialCreate
   dotnet ef database update
   ```
5. Run the API:
   ```bash
   dotnet run
   ```
6. Visit Swagger (Development): `https://localhost:5001/swagger` (port may differ)
7. Start the frontend (in a second terminal):
   ```bash
   cd client
   npm install   # first time only
   npm run dev   # serves at http://localhost:5173
   ```
8. Log in / register via the UI (future components) or via Swagger to set the cookie, then consume protected endpoints from the frontend.

### Full-Stack Dev Convenience
You can optionally run both with one command later (e.g. a root `concurrently` script). For now open two terminals: one `dotnet run`, one `npm run dev`.

### Expected Local Origins
| Service | URL |
|---------|-----|
| API (HTTPS) | https://localhost:5001 (default dev cert) |
| API (HTTP) | http://localhost:5000 |
| Frontend | http://localhost:5173 |

If your API port differs, update CORS in `Program.cs` and (once introduced) any `VITE_API_BASE` variable in the frontend.

### Adding an API Base URL (Future)
When client code begins calling endpoints, create `client/.env` (ignored by git by default if you add a pattern) containing:
```
VITE_API_BASE=https://localhost:5001
```
Then in code: `const api = import.meta.env.VITE_API_BASE;`

> If DB is absent at startup `Migrate()` will throw. Spin up Postgres or temporarily wrap migration in try/catch if you just need the process alive for front-end scaffolding.

---
## Auth Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Create user; sets jwt cookie |
| POST | /api/auth/login | Authenticate; sets jwt cookie |
| GET | /api/auth/me | Returns current user (requires auth) |
| POST | /api/auth/logout | Clears jwt cookie |

Cookie details: `jwt` (HttpOnly, Secure, SameSite=None, 7d expiry).

### Frontend Auth Notes
Calls should be made with `fetch(api + '/api/auth/me', { credentials: 'include' })` so the `jwt` cookie is sent. No token storage in `localStorage` needed.

Minimal example (to be placed in future hook/component):
```js
const api = import.meta.env.VITE_API_BASE || 'https://localhost:5001';
export async function fetchMe() {
   const res = await fetch(`${api}/api/auth/me`, { credentials: 'include' });
   if (!res.ok) throw new Error('unauthorized');
   return res.json();
}
```

---
## Contribution Guide
1. Clone down repo
2. Create branch: `feature/<short-topic>` or `fix/<short-topic>` (optionally include issue id: `feature/123-feed-pagination`)
3. Keep commits small & meaningful; follow Conventional Commits:
   - `feat: add media search endpoint`
   - `fix: correct jwt cookie expiration`
   - `chore: bump swashbuckle version`
4. Run build & (future) tests before pushing:
   ```bash
   dotnet build
   ```
5. Open PR to `main` with:
   - Summary (What / Why)
   - Implementation notes
   - Screenshots (if UI) / sample requests
   - Checklist referencing acceptance criteria
6. Address review feedback; squash or rebase as requested.

### Code Style
- Explicit DTO mapping (no AutoMapper)
- Async suffix for async methods (already in services)
- Validate inputs early; return 400 with message for domain validation issues
- Avoid leaking entity types directly; use DTOs
- Keep service interfaces focused & cohesive
- Use cancellation tokens where long-running queries introduced (future)

### EF / Migrations
- Add migration per schema change (`dotnet ef migrations add <Name>`)
- Inspect generated code; ensure no accidental data loss
- Apply locally with `dotnet ef database update`
- NEVER commit secrets; `.env` is ignored

### Testing (Planned)
- Unit tests: service logic (Auth, upcoming MediaUpdate rating recalculation)
- Integration tests: minimal in-memory or Testcontainers harness for Postgres
- Utility tests: timestamp formatter boundaries

### Security Notes
- JWT in HttpOnly cookie only; do not expose token in JSON responses
- `SameSite=None; Secure` to allow cross-site requests from frontend served at different origin
- CORS whitelist must list deployed frontend origins before production launch

### Future Enhancements
- Refresh token rotation (current: long-lived 7d JWT)
- Rate limiting (login, comment posting)
- Soft deletes / audit trail
- Caching for media ratings
- Pagination cursors instead of offset

---
## Folder Structure (Simplified)
```
Controllers/      # API controllers
DTOs/             # Request/response contracts
Models/           # EF Core entities (Identity User extended)
Data/             # DbContext
Services/         # Domain service layer (Auth for now)
client/           # Frontend (React + Vite + Tailwind)
```

### Client Structure (Initial)
```
client/
   src/
      App.jsx        # Root component
      main.jsx       # React entrypoint
      index.css      # Tailwind directives + base utility usage
   tailwind.config.js
   postcss.config.js
   package.json
```

### Tailwind Notes
- Pinned to 3.4.x for stability; upgrade path to v4 once ecosystem matures.
- Global utility layers declared in `index.css` (`@tailwind base; @tailwind components; @tailwind utilities;`).
- Add component-level CSS via `@layer components { ... }` if needed.
- Prefer semantic extraction into small React components instead of large global CSS.

---
## Running With Docker Compose (Optional Sketch)
_Add a `docker-compose.yml` later if desired:_
```
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
   POSTGRES_DB: watchly_dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

---
## Troubleshooting
| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Startup exception: cannot connect | Postgres not running | Start container or local server |
| JWT cookie not set | Insecure origin / missing HTTPS | Use HTTPS or adjust dev cookie policy (not recommended) |
| 401 from /api/auth/me | Missing/expired cookie | Re-login; check browser blocked third-party cookies |
| `UseNpgsql` missing | Packages not restored | `dotnet restore` |
| Frontend styles missing | Tailwind not building / wrong port | Ensure `npm run dev` running & classes not tree-shaken (correct file paths in `tailwind.config.js`) |
| Cookie not included in fetch | Missing `credentials: 'include'` | Add option to every auth-dependent request |
| CORS error in console | Origin not allowed | Add frontend origin to CORS policy in `Program.cs` |
| 404 on static assets | Wrong frontend base path | Ensure using Vite default or configure `base` consistently |

---
## License
Not yet specified. Add a LICENSE file before public release.

---
## Contact / Discussion
Use GitHub Issues for features & bugs. Provide reproduction steps & environment info.

Happy building! ✨
