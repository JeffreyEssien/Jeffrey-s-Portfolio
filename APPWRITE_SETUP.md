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
