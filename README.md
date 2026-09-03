# SkillGap

Job-Market Skill-Gap Advisor — a graduation project that lets users register, authenticate, and (in progress) analyze skill gaps against market data, generate recommendations, and view skill trends.

## Project Structure

```
├── backend/            # Node.js / Express REST API
│   └── docs/rest-api/  # Hand-written OpenAPI 3.0 docs (JS objects)
├── frontend/           # Frontend (currently a skeleton)
└── DataPipeline/       # Python data pipeline (currently a skeleton)
```

## Backend Setup

### Prerequisites

- Node.js (20+ recommended, tested on 20/22/24/26)
- PostgreSQL
- Redis (optional for caching)

### Environment Variables

Copy `backend/.env` and set the following:

| Variable        | Description                          | Default                |
|-----------------|--------------------------------------|------------------------|
| `PORT`          | Server port                          | `5000`                 |
| `NODE_ENV`      | `development` / `production` / `test`|                        |
| `JWT_SECRET`    | Secret used to sign JWTs             | (dev fallback)         |
| `DATABASE_URL`  | PostgreSQL connection string         | none — must be set     |
| `REDIS_URL`     | Redis connection string (optional)   | none                   |

### Install & Run

```bash
cd backend
npm install
npm run dev        # start with nodemon (auto-reload)
# or
npm start          # start normally
```

The server starts on `http://localhost:5000`.

### Run Tests

```bash
cd backend
npm test
npm run test:coverage
```

## API Docs (Swagger)

API documentation is auto-served **only in development mode** (`NODE_ENV=development`).

| URL                              | What it is                          |
|----------------------------------|-------------------------------------|
| `http://localhost:5000/docs/api` | Interactive Swagger UI              |
| `http://localhost:5000/docs/specs.json` | Raw OpenAPI 3.0 JSON document |

The Swagger UI shows every wired API route, its method, path, request parameters/bodies, and response schemas. You can try requests directly — e.g. register a user, then paste the returned access token via the **Authorize** button (format `Bearer <accessToken>`) to call protected routes like `GET /auth/me`.

> **Note:** run `npm run dev` (or start with `NODE_ENV=development`) to access the docs.

### How the docs are written

Docs are **not** auto-generated — there are no `swagger-jsdoc` annotations or YAML files. They are hand-written JavaScript objects following the OpenAPI 3.0 spec, so they can import real constants/values from `src/` and stay in sync with the codebase:

```
backend/docs/rest-api/
├── index.js                  # Root OpenAPI document (info, servers, tags, components, paths)
├── constants.js              # Shared constants (e.g. error codes)
├── components/
│   ├── securitySchemes.js    # bearerAuth scheme
│   └── schemas/              # Shared schemas (User, Tokens, ErrorResponse, ...)
└── modules/
    ├── index.js              # Barrel: joins each module's paths + schemas
    ├── auth/                 # Auth routes
    │   ├── index.js          # Paths (endpoints)
    │   ├── schemas.js        # Request/response schemas
    │   └── parameters.js     # Shared parameters (e.g. auth header)
    └── system/               # System routes
        ├── index.js
        └── schemas.js
```

It is served by `backend/src/docs-router.js`, mounted at `/docs` in `app.js` only when `NODE_ENV=development`.

### Currently Wired Routes

| Method | Path             | Auth   | Description                       |
|--------|------------------|--------|-----------------------------------|
| `GET`  | `/health`        | No     | Health check                      |
| `POST` | `/auth/register` | No     | Register a new user               |
| `POST` | `/auth/login`    | No     | Log a user in                     |
| `POST` | `/auth/refresh`  | No     | Refresh (rotate) tokens           |
| `POST` | `/auth/logout`   | No     | Log out and revoke the token      |
| `GET`  | `/auth/me`       | Bearer | Get the current user's profile    |

## Docker

A multi-stage `Dockerfile` is included in `backend/` (Node 24 Alpine). Build and run with:

```bash
cd backend
docker build -t skillgap-backend .
docker run -p 5000:5000 skillgap-backend
```
