# Development and releases

`main` is the release branch. `dev` is the integration and test branch. The
GitHub default branch stays `main`, so the daily Appwrite check continues there.

## Normal workflow

1. Pull `dev`, then create a feature branch: `git switch dev`, `git pull --ff-only`,
   `git switch -c feat/your-change`.
2. Implement the change with relevant tests. Use Node 22 (`nvm use`) and `npm ci`.
3. Push the feature branch and open a pull request targeting `dev`.
4. Merge only after `CI gate` passes and review conversations are resolved.
5. Release the tested work through a pull request from `dev` into `main`.

Branch protection requires the CI gate and a pull request on both long-lived
branches. No additional approving reviewer is required for this single-owner
repository. Force pushes and deletion are blocked. A successful pipeline checks
code quality; it does not automatically merge or deploy to production.

## Local checks

```sh
npm ci
npx playwright install chromium
npm run lint
npm run typecheck
npm run test:unit
npm run test:browser
npm run build
```

The browser suite starts its own server on port 3100. It uses mocked Appwrite
responses and tests drafts, publishing, project modals, mobile navigation,
outage fallbacks, and anonymous API rejection. The development server uses
`.next-dev`, browser tests use `.next-test`, and production builds and `next start`
use the standard `.next` directory for hosting compatibility. Each has its own generated route types so tests and builds
can run without replacing the development server's Webpack chunks.

Unit tests cover link validation, project ordering and publishing validation,
and snapshot preservation when a refresh fails. Snapshot fixtures live in
temporary directories and do not modify your public content or live database.

## GitHub pipelines

`Portfolio CI` runs on pushes to `dev` and `main`, and PRs targeting either:

- Lint, generated route types, TypeScript, and unit tests.
- Chromium browser tests with two workers and no automatic retries.
- A production build using the committed public snapshot.
- A final `CI gate` that fails if any required job fails or is skipped.

The jobs run independently, use `npm ci`, cache npm downloads, have timeouts,
and cancel superseded runs. Actions are pinned to exact commits. CI has only
read access and receives no Appwrite secrets. Failure traces, screenshots, HTML
reports and JUnit results are available as artifacts for seven days.

`dev` is a Git branch, not a separate Appwrite database or hosting environment.
For manual testing against Appwrite, configure an isolated project. Do not point
preview admin sessions at production if you intend to experiment with writes.

Dependabot configuration proposes weekly npm and GitHub Actions updates into
`dev`. GitHub activates that configuration after it reaches the default branch
in a release. The pull-request template becomes the default at that point too.

## Public snapshot

Use `npm run content:snapshot` while Appwrite is active and commit the generated
`src/lib/published-content.json` and `public/published-assets/` when public content
changes. The production build refreshes the snapshot when configured; isolated
CI builds verify the existing fallback instead. Never commit `.env.local`, API
keys, account exports, application notes, or private CV drafts.
