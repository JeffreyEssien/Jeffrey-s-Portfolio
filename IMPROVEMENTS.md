# Portfolio review — 1 Nov 2026

Review of the `dev` branch after the WebGL / live telemetry / case-study work (#11, #12, #5).

**Baseline:** lint, typecheck and the 8 unit tests all pass. The WebGL scene is dynamically imported, respects `prefers-reduced-motion`, drops quality on slow devices and disposes its GPU resources. The issues below are about hygiene, hardening and polish, not broken code.

Status key: ✅ fixed on `fix/repo-hygiene-and-hardening` · ⚠️ needs manual action · 💡 suggestion for later

---

## 1. Files that shouldn't be in a public repo

| File | Problem | Status |
|---|---|---|
| `leslieslogsagain.pdf` | A CI pipeline log from a private employer pipeline. No credentials in it (secrets are masked), but it exposes internal organisation, project and repository names. | ✅ deleted · ⚠️ still in git history |
| `jcompanies list.txt` | Target-employer list for job hunting. Not referenced by any code; shows anyone browsing where you're applying. | ✅ deleted |
| `public/Curriculum Vitae_Tips & Tricks.pdf` | A third-party CV guide, **served publicly** at `/Curriculum Vitae_Tips & Tricks.pdf`. Not linked from the site. | ✅ deleted |

`.gitignore` now ignores `*.log`, a `private/` folder and loose PDFs/TXT files in the repo root so this doesn't recur. Keep personal notes in `private/`.

### ⚠️ Remove the log from history

Deleting the file in a commit doesn't remove it from history; anyone can still check out an older commit. Once this branch is merged:

```bash
pip install git-filter-repo
git clone https://github.com/JeffreyEssien/Jeffrey-s-Portfolio.git portfolio-clean
cd portfolio-clean
git filter-repo --path leslieslogsagain.pdf --path "jcompanies list.txt" --invert-paths
git remote add origin https://github.com/JeffreyEssien/Jeffrey-s-Portfolio.git
git push origin --force --all
git push origin --force --tags
```

Then:
- Delete any local clones made before the rewrite (or re-clone), otherwise a future push puts the file back.
- Close or rebase the open Dependabot PRs, since their branches still point at old history.
- GitHub may keep cached views of old commits. If that matters, contact GitHub Support to purge them.

---

## 2. "Ask my AI" endpoint (`/api/ask`)

| Issue | Fix | Status |
|---|---|---|
| Rate limiter was an in-memory `Map`. On Vercel each serverless instance has its own map, so the 8-per-10-min limit barely applies and the AI budget is exposed. | New `src/lib/rate-limit.ts`: uses Upstash Redis / Vercel KV over REST when configured (shared across instances), falls back to the in-memory limiter otherwise. No new npm dependency. | ✅ · ⚠️ add env vars |
| Gemini API key was sent in the URL query string (`?key=`), which ends up in proxy and request logs. | Sent in the `x-goog-api-key` header instead, in both `ask.ts` and `cv/ai-tailor.ts`. | ✅ |
| Internal error messages (provider names, HTTP codes) were returned to visitors. | Generic message to the client; detail goes to the server log. | ✅ |

### ⚠️ Turn on the shared limiter

In Vercel → Storage, add an Upstash Redis (or KV) database to the project. It sets these automatically; either pair works:

```
KV_REST_API_URL / KV_REST_API_TOKEN
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
```

The free tier is plenty for this traffic. Without them, behaviour is the same as before.

---

## 3. Sharing and SEO

| Issue | Fix | Status |
|---|---|---|
| No Open Graph / Twitter tags on the home page, so links pasted on LinkedIn, Slack or WhatsApp showed no preview card. | `generateMetadata` in the root layout now sets `metadataBase`, Open Graph and a large Twitter card. | ✅ |
| No preview image. | `src/app/opengraph-image.tsx` generates a 1200×630 card from the hero content (name, headline, taglines). | ✅ |
| No `sitemap.xml` or `robots.txt`. | `src/app/sitemap.ts` (home + every project page) and `src/app/robots.ts` (blocks `/admin` and `/api`). | ✅ |

### ⚠️ Set the site URL

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://your-domain.com`) in Vercel. If it's missing, the code falls back to Vercel's production URL, then `http://localhost:3000`.

---

## 4. README

The README was the Create Next App boilerplate, and it's the first thing an engineer opens. It now covers what the site does, the stack, architecture, scripts, environment variables and CI. ✅

💡 Add a screenshot or short GIF of the WebGL hero to the top of the README once it's live.

---

## 5. Release

- ⚠️ Merge the safe Dependabot PRs into `dev`: `setup-node` 7.1.0, `upload-artifact` 7.0.2, `swr` 2.5.1, `@react-pdf/renderer` 4.9.0, dev-tools group. Let CI decide on each.
- ⚠️ Delete merged branches: `feat/webgl-live-case-studies`, `fix/ci-flaky-test-and-dependabot`, `fix/isolate-next-build-caches`.
- ⚠️ Open `dev → main` so today's work deploys. `main` is still at #10 (19 Oct).

## 6. Later

- 💡 Run Lighthouse on the deployed site and check the bundle size of the Three.js scene on a mid-range Android phone.
- 💡 Replace `https://example.com` in the `og-preview` bot user agent with the real site URL.
- 💡 Add a Playwright test for `/api/ask` rate limiting and the new `sitemap.xml` / `robots.txt`.
