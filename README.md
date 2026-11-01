# Jeffrey Essien — Portfolio

[![Portfolio CI](https://github.com/JeffreyEssien/Jeffrey-s-Portfolio/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/JeffreyEssien/Jeffrey-s-Portfolio/actions/workflows/ci.yml)

Personal portfolio and career toolkit for a DevOps / full-stack engineer. The public site is a content-managed portfolio with a WebGL hero, live service telemetry and an AI assistant that answers questions about my experience. Behind a login sits an admin area that edits every section of the site, builds and AI-tailors CVs, and runs a job-search inbox.

## Features

**Public site**
- WebGL particle scene (Three.js) with adaptive quality and `prefers-reduced-motion` support
- Live telemetry panel — server region, latency and CI status pulled from GitHub Actions
- "Ask my AI" console grounded only in the published profile (Gemini, with Claude as fallback), rate-limited
- Project case studies with problem → approach → results write-ups
- Open Graph preview card, sitemap and robots generated from content

**Admin (`/admin`)**
- Editors for hero, about, work, projects, contact and site copy, backed by Appwrite
- CV builder with PDF export and AI tailoring against a job description
- Job inbox that pulls listings from job APIs, with a twice-daily email digest

## Stack

| Layer | Tools |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Three.js |
| Backend | Next.js route handlers (Node runtime), Appwrite (database, storage, auth) |
| AI | Google Gemini, Anthropic Claude |
| Testing | Node test runner (unit), Playwright (browser) |
| CI/CD | GitHub Actions, Vercel, Dependabot |

## Architecture

```
Browser ──► Next.js on Vercel ──► Appwrite (content, files, admin auth)
               │
               ├── /api/ask      ─► Gemini → Claude fallback, shared rate limit (Redis/KV)
               ├── /api/status   ─► live telemetry
               ├── /api/cv/*     ─► CV tailoring (admin only)
               └── /api/jobs/*   ─► job sources (admin / cron only)
```

Content is read from Appwrite at request time with a 5-second fallback to `src/lib/published-content.json`, a snapshot taken at build time (`prebuild`). The site stays up even if Appwrite is down.

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
npm ci
# create .env.local with the variables listed below
npm run dev
```

First-time Appwrite setup is in [APPWRITE_SETUP.md](APPWRITE_SETUP.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Snapshot content, then production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run test:unit` | Unit tests |
| `npm run test:browser` | Playwright browser tests |
| `npm run content:snapshot` | Refresh `published-content.json` from Appwrite |

## Environment variables

| Group | Variables |
|---|---|
| Site | `NEXT_PUBLIC_SITE_URL` |
| Appwrite | `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `NEXT_PUBLIC_APPWRITE_BUCKET_ID`, `NEXT_PUBLIC_APPWRITE_COLLECTION_*`, `APPWRITE_API_KEY`, `APPWRITE_ADMIN_USER_ID` |
| AI | `GOOGLE_API_KEY`, `GEMINI_MODEL`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `ASK_CLAUDE_MODEL` |
| Rate limiting | `KV_REST_API_URL` + `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (optional; falls back to in-memory) |
| Telemetry | `GITHUB_TOKEN`, `GITHUB_USER`, `GITHUB_REPO`, `GITHUB_CI_WORKFLOW` |
| Jobs | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `ADZUNA_COUNTRY`, `JOOBLE_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_CX`, `JOBS_CRON_SECRET` |
| Digest email | `SITE_URL`, `JOBS_DIGEST_TO`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |

## CI/CD

- **Portfolio CI** (`ci.yml`) — on pushes and PRs to `dev` and `main`: lint, typecheck, unit tests, Playwright tests and a production build.
- **Appwrite daily check** — checks each morning that the Appwrite database is reachable.
- **Jobs digest** — refreshes the job inbox and emails a digest at 06:00 and 18:00 UTC.
- **Dependabot** — weekly grouped updates against `dev`.

Work happens on feature branches → PR into `dev` → PR into `main`, which Vercel deploys. See [CONTRIBUTING.md](CONTRIBUTING.md).
