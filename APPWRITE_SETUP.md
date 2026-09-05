# Appwrite Setup

Follow these steps once. After this, all content is editable from `/admin`.

## 1. Create project
1. Go to https://cloud.appwrite.io and create a project.
2. Add a **Web platform** with hostname `localhost` (and your production domain when you deploy).
3. Copy the **Project ID** and **API Endpoint**.

## 2. Env vars
Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_APPWRITE_PROJECT_ID`. Leave the rest as default unless you want different IDs.

## 3. Create database
- Database ID: `portfolio`

## 4. Create collections
For **each** collection below, use the exact ID and add a single attribute:

| Collection ID | Attribute | Type | Size | Required |
|---------------|-----------|------|------|----------|
| `site`        | `data`    | String | 100000 | yes |
| `hero`        | `data`    | String | 100000 | yes |
| `about`       | `data`    | String | 100000 | yes |
| `projects`    | `data`    | String | 100000 | yes |
| `work`        | `data`    | String | 100000 | yes |
| `contact`     | `data`    | String | 100000 | yes |

For each collection, set **Permissions**:
- Role `Any` → **Read**
- Role `Users` → **Create, Update, Delete**

## 5. Seed singleton documents
For `site`, `hero`, `about`, `contact` — create one document with **Document ID = `main`** and `data = {}`. (You can edit them through `/admin` after.)

`projects` and `work` are multi-doc collections — leave empty.

## 6. Create storage bucket
- Bucket ID: `assets`
- Permissions:
  - Role `Any` → **Read**
  - Role `Users` → **Create, Update, Delete**
- File security: off (collection-level perms apply)
- Max file size: 10 MB
- Allowed extensions: `jpg, jpeg, png, webp, gif, svg, pdf`

## 7. Create your admin user
1. In Appwrite Console → **Auth** → **Users** → **Create user**.
2. Use your email + a strong password. This is your `/admin` login.
3. (Optional) Disable signups: **Auth → Settings → Sign Up → off**.

## 8. Run
```
npm run dev
```
Visit `/admin/login`, sign in, edit everything.

## Daily database availability check

`.github/workflows/appwrite-daily-check.yml` reads the public projects collection
daily at approximately **08:23 WAT** using GitHub Actions. It makes no changes to
your content and needs no Appwrite API key. Failed requests retry up to three
times and then fail the workflow, which can trigger GitHub Actions notifications.

To activate:

1. Push the workflow and `scripts/check-appwrite.mjs` to the repository's default branch.
2. In GitHub → Settings → Secrets and variables → Actions → Variables, set:
   - `APPWRITE_ENDPOINT`: the same value as `NEXT_PUBLIC_APPWRITE_ENDPOINT`, including `/v1`.
   - `APPWRITE_PROJECT_ID`: the same value as `NEXT_PUBLIC_APPWRITE_PROJECT_ID`.
   - Optional `APPWRITE_DATABASE_ID` (default `portfolio`).
   - Optional `APPWRITE_PROJECTS_COLLECTION_ID` (default `projects`).
3. Under Actions → Appwrite daily database check → Run workflow, verify the first run.
4. Enable failed-workflow notifications in your GitHub notification settings.

Local manual check (Node 20.6+): `node --env-file=.env.local scripts/check-appwrite.mjs`.

**This is an availability check, not a guaranteed keep-alive.** Appwrite's
[free-plan policy](https://appwrite.io/changelog/entry/2026-02-20-1) says projects
pause after seven days without development activity in the Console. Ordinary
database traffic is not documented as sufficient. Open and actively maintain
your project in the Console regularly; resume an already-paused project there.
Scheduled Appwrite functions stop while paused, so this check runs externally.

GitHub schedules can be delayed, and scheduled workflows in public repositories
[are disabled after 60 days without repository activity](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/disabling-and-enabling-a-workflow).
Check that the workflow remains enabled. Continuous availability requires a plan
that does not pause for inactivity.
