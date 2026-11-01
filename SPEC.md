# NewsPulse — Specification & Implementation Plan

> A business-news platform built on **Payload CMS 3 + Next.js**, with an editorial review workflow (editor writes, admin reviews and publishes), a **default-deny REST security layer with role-based access control (RBAC)**, deployed on **AWS EC2** (PM2 + Nginx + Postgres in Docker). English only, by design (see Section 8). Security is **demo level**: the simple, needed protections only (Section 14).
>
> The product name lives in one place, `src/config/brand.ts`. Nothing else should hardcode it.

---

## 0. How to use this document

- This is a **specification and build plan**, not a prompt. Work through the phases in Section 15 in order. Each phase has tasks, deliverables and a Definition of Done (DoD).
- Where this spec names a Payload or Next.js API, **confirm it against the docs for the version actually installed** (Section 19 lists the items most likely to differ). If the installed version differs from the spec, follow the installed version and record the deviation in `docs/DECISIONS.md`.
- Section 2 lists what is **out of scope**. Do not add those items.
- Planned work is **about 9 hours** inside a 9 to 10 hour window, so slack is at most an hour. If time slips, cut in this order: stretch and optional items, then reduce the dummy articles from 20 to 14, then drop the Review Queue nav link (admins can filter the Articles list instead). Do **not** cut the core security tests (groups A, C, D, E, F, J).

### Working agreements

- TypeScript `strict: true`; no `any` unless justified in a comment.
- One commit per completed task group, and a clear commit message at the end of each phase.
- Before each phase commit: `make check` (lint, typecheck, unit tests) must pass. From Phase 3 onwards, `make test-security` must also pass against the local server.
- After any schema change: `make types` (regenerates Payload types and the admin import map) and `make migrate-create NAME=<change>`. Commit the results.
- Never commit `.env`. Keep `.env.example` current.
- No lorem ipsum anywhere. Seed content is realistic but fictional (see Section 12).
- Do not use Payload's built-in `versions.drafts` (see Section 7.4 for why).
- Do not add Payload localization (see Section 8 for why).

---

## 1. Context and goals

**Project.** NewsPulse is a demo-level business and financial news platform built with Payload CMS 3 and Next.js. It covers topics such as markets, economy, companies, IPOs and personal finance, with regional, national and global sections. It is not a production product; it is a focused demo that shows a working editorial workflow, role-based access control and a clean public-facing news site.

**What is built.** A website with Payload CMS and Next.js:
1. An admin panel with full CRUD for articles, including a publish step.
2. A public site whose home page lists articles and whose article page shows the detail.

**What makes it more than basic CRUD:**
- A real **editorial workflow** with two fixed roles, an approval step and rejection with a reason.
- **User management**: the admin creates and manages editor accounts from a Users screen; roles are fixed and an admin account exists only through the seed.
- A **simple security layer**: anonymous access to the REST API is denied by default, each role can call only what its permissions allow, and this is proven by automated tests that hit the REST API directly (not only through the admin UI).
- **On-demand revalidation** so publishing is instantly visible on the public site.
- A **production deployment** reachable by a public URL, and a **Makefile** for day-to-day commands.

**Success criteria** (all verified in Section 17):
- Admin creates an editor from the Users screen; the editor logs in and sees only their own articles.
- Editor writes a draft and submits it for review; admin reviews, then publishes or rejects with a reason; the editor sees the reason, edits and resubmits.
- Published articles appear on the public site immediately.
- Direct REST calls succeed or fail exactly as the RBAC matrix in Section 14.3 says, proven by the security test suite run against the live URL.
- `make seed-dummy` produces a fully populated demo (2 editors, 20 articles across every workflow state).
- The site is live on an EC2 public URL and survives a reboot.

---

## 2. Scope

### In scope

| Area | Items |
|---|---|
| Admin | Users screen (admin only), Articles, Review Queue shortcut (admin only), Categories, Media, Breaking News global, editorial workflow, branded logo, titles and favicon |
| Content | Rich text, hero images, categories, featured flag |
| Public site | Home, category listing, article detail, search, related articles, breaking-news ticker, 404 |
| Security (demo level) | Default-deny REST for anonymous users, RBAC for two fixed roles, field-level access, mass-assignment protection, automated REST security tests |
| Platform | Postgres migrations, essential seed, dummy-data seed, Makefile, revalidation hooks, unit tests for workflow logic |
| Delivery | EC2 deployment with PM2 and Nginx, README, demo accounts |

### Out of scope (do not build)

- A Roles screen or any role management. Roles are two fixed values in code.
- Creating admin accounts from the UI or API (admins exist only through the seed).
- Localization or multi-language content (see Section 8)
- Sitemap, RSS, newsletter signup / subscribers
- Custom admin dashboard, custom admin colours or theme switching, dark mode
- Public user accounts, comments, payments, notifications / email
- Real market data feeds
- Payload built-in drafts (`versions.drafts`), Live Preview, SEO plugin, Search plugin, Redirects plugin
- Docker for the app itself (only Postgres runs in Docker), ECS, CI/CD, HTTPS / domain setup
- API keys, OAuth / SSO, a WAF or CDN, a Content-Security-Policy
- Analytics

### Stretch and optional (only after Phase 6 is complete and verified)

- Optional hardening (Section 14.4): Nginx rate limiting, security headers, `pnpm audit`, UUID upload filenames, extra tests (groups G, H, I)
- Review Queue count badge
- Article view counter and "Trending" block (the dummy seed already fills `views`)
- Scheduled publishing
- Postgres full-text search with ranking

---

## 3. Tech stack and version policy

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 22 LTS | Payload requires Node 20.9+ |
| Package manager | pnpm | Preferred by Payload |
| Framework | Next.js (App Router), TypeScript | Use a Next version inside Payload's supported range (see below) |
| CMS | Payload 3.x | Installed into the Next app |
| Database | PostgreSQL 16 | `@payloadcms/db-postgres`; Docker locally and on EC2 |
| Rich text | Lexical | `@payloadcms/richtext-lexical` |
| Images | `sharp` | Required for upload resizing and seed image generation |
| Styling | Tailwind CSS | Fixed single theme, tokens in CSS variables |
| Fonts | `next/font/google` | Inter (UI and body), Noto Serif (headlines) |
| Tests | Vitest | Unit tests (pure functions) and security tests (HTTP against a running server) |
| Task runner | GNU Make | Linux, macOS, WSL and EC2; on Windows use WSL or Git Bash |
| Process manager | PM2 | Single instance, fork mode |
| Reverse proxy | Nginx | Port 80 to Next on 127.0.0.1:3000 |

**Version policy.** Bootstrap with `create-payload-app` (blank template, Postgres adapter) so it pins a compatible Payload and Next.js pair. Payload only supports specific Next.js version ranges, so do not hand-upgrade Next afterwards. Record the final versions in the README.

---

## 4. Architecture overview

```
Browser / curl
   │  http://<ec2-public-dns>
   ▼
Nginx :80
   │  proxy
   ▼
Next.js (PM2) 127.0.0.1:3000
   │
   ├── app/(site)/...                public site, server components
   │        └── reads data through the Payload Local API (in-process)
   │
   └── app/(payload)/admin, /api     Payload admin UI + REST API
            └── every REST call is checked by collection and field access rules
                                 │
                                 ▼
                    PostgreSQL 16 (Docker, bound to 127.0.0.1:5432)
   Media files: <repo>/media (EC2 disk, git-ignored)
```

Key properties:
- **One deployable.** Admin, API and public site are the same Next.js process.
- **Two ways to read data, with different trust levels.**
  - The **public site** uses the Local API on the server. The Local API skips access control by default, so every public query carries an explicit "published only" filter and returns narrow DTOs (Section 10.7).
  - The **REST API** at `/api` is reachable by anyone on the internet, and the admin panel itself depends on it, so it cannot be turned off. Access control is the security boundary. The public site never needs anonymous REST reads, so **anonymous REST access is denied by default** (Section 14).

---

## 5. Repository structure

```
.
├─ Makefile                        # day-to-day commands (Section 13.2)
├─ docker-compose.yml              # Postgres only
├─ ecosystem.config.cjs            # PM2
├─ next.config.mjs                 # withPayload
├─ vitest.config.ts                # unit tests
├─ vitest.security.config.ts       # security tests (HTTP, needs a running server)
├─ .env.example
├─ scripts/
│  └─ deploy.sh                    # same steps as `make deploy`
├─ docs/
│  └─ DECISIONS.md                 # deviations from this spec, tradeoffs
├─ media/                          # uploads (git-ignored)
├─ backups/                        # db dumps (git-ignored)
├─ src/
│  ├─ payload.config.ts
│  ├─ payload-types.ts             # generated, committed
│  ├─ migrations/                  # committed
│  ├─ config/
│  │  ├─ brand.ts                  # name (NewsPulse), tagline
│  │  └─ copy.ts                   # all UI strings in one place (English)
│  ├─ access/
│  │  └─ index.ts                  # shared helpers: isAdmin, isEditor, isLoggedIn, isSelf, ownsDoc
│  ├─ collections/
│  │  ├─ Users.ts
│  │  ├─ Media.ts
│  │  ├─ Categories.ts
│  │  └─ Articles/
│  │     ├─ index.ts
│  │     ├─ access.ts
│  │     └─ hooks.ts
│  ├─ globals/
│  │  └─ BreakingNews.ts
│  ├─ lib/
│  │  ├─ workflow.ts               # pure transition rules (unit tested)
│  │  ├─ text.ts                   # slugify, lexical→plain text, reading time
│  │  ├─ revalidate.ts             # safe revalidatePath wrappers
│  │  ├─ queries.ts                # ALL public data fetching + DTO mappers
│  │  └─ dates.ts                  # date formatting (en-IN, Asia/Kolkata)
│  ├─ components/
│  │  ├─ admin/                    # Logo.tsx, Icon.tsx, ReviewQueueLink.tsx
│  │  └─ site/                     # header, footer, cards, ticker, etc.
│  ├─ seed/
│  │  ├─ base.ts                   # `pnpm seed`: admin, categories, empty breaking news
│  │  ├─ dummy.ts                  # `pnpm seed:dummy`: editors, 20 articles (with all content/metadata inline), images, breaking news
│  │  ├─ images.ts                 # generates placeholder images with sharp
│  │  └─ lexical.ts                # lexicalFromBlocks helper
│  └─ app/
│     ├─ (payload)/                # Payload-managed admin and API routes
│     └─ (site)/
│        ├─ layout.tsx             # root layout for the public site
│        ├─ page.tsx               # home
│        ├─ category/[slug]/page.tsx
│        ├─ article/[slug]/page.tsx
│        ├─ search/page.tsx
│        ├─ preview/[id]/page.tsx
│        └─ not-found.tsx
├─ tests/
│  ├─ workflow.test.ts             # unit
│  ├─ text.test.ts                 # unit
│  └─ security/
│     ├─ helpers.ts                # login, create temp users, cleanup
│     └─ api.security.test.ts      # direct REST attack tests (Section 14.6)
└─ README.md
```

Notes:
- Using two route groups means **two root layouts and no top-level `app/layout.tsx`**. The `(payload)` group has its own `<html>`; the `(site)` group renders `<html lang="en">` itself.
- The public routes (`/`, `/category/*`, `/article/*`, `/search`, `/preview/*`) do not overlap Payload's `/admin` and `/api` routes.

---

## 6. Data model

There is **no localization**: every field below is a plain, single-value field.

### 6.1 Users (`users`, auth-enabled)

| Field | Type | Rules |
|---|---|---|
| email | auth | built in |
| displayName | text | required; shown as byline |
| role | select: `admin`, `editor` | required, default `editor`; **fixed after creation**; see rules below |
| bio | textarea | optional |

**What comes from Payload and what we write** (see also Section 7.5):
- Because `Users` is an auth collection, Payload provides, with no custom code: the Users list, create, edit and delete screens, login and logout, password hashing, the account page, lockout after failed logins, and the REST endpoints behind them.
- Payload has **no role system**. `role` is just a select field we define, with two fixed values, plus our access functions. There is no Roles collection and no Roles screen.

**Role rules**
- **Admin accounts exist only through the seed** (`pnpm seed`, which uses the Local API). No request over REST or the admin UI can create an admin or change anyone's role.
- Implementation: field-level access on `role`: `create: () => false` (submitted values are ignored, so the default `editor` applies) and `update: () => false` for everyone. The seed bypasses this because the Local API skips access control by default.
- Result: when an admin uses the "Create new" Users form, the new user is always an `editor`. Role is immutable afterwards.
- **First-user rule (safety net):** if no users exist when a user is created through Payload's "create first user" screen, a `beforeValidate` hook forces `role = 'admin'`. Because that screen is open to anyone while the table is empty, **always run the seed before the app becomes reachable** (Section 16.3).

**User management rules**
- Admin can create editors, edit editors (name, email, password, bio) and delete editors.
- Admin cannot delete any admin account (including their own): `delete` access for admins is limited to `{ role: { equals: 'editor' } }`.
- A `beforeDelete` hook **cascade-deletes all articles owned by the editor** before the user record is removed. There is no reassign flow; this is a demo and the simplest correct behaviour.
- Editors can read and update only their own record (name, bio, password via the account page); they cannot change `role` or `email` is allowed only for themselves.

Auth settings: `maxLoginAttempts: 5`, `lockTime: 10 minutes`, API keys disabled, email verification off. No self-registration.

### 6.2 Media (`media`, upload)

| Field | Type | Rules |
|---|---|---|
| alt | text | required |
| caption | text | optional |

- Image MIME types only (reject everything else, including SVG uploads from editors, because SVG can carry scripts); max file size 5 MB.
- Generated sizes: `thumbnail` (400 wide), `card` (800 wide), `hero` (1600 wide).
- Storage: local disk at `<repo>/media`, git-ignored. Admin thumbnail uses `thumbnail`.
- **Public read is the one deliberate exception to default-deny**, because browsers must load images anonymously. See Section 14.4.

### 6.3 Categories (`categories`)

| Field | Type | Rules |
|---|---|---|
| name | text | required |
| slug | text | required, unique, indexed; auto-generated from the name if empty |
| description | textarea | optional |
| order | number | default 0; controls nav order; collection default sort is `order` |

- Guard: a `beforeDelete` hook blocks deleting a category that still has articles, with a clear error message.
- Seed set: **Market, Economy, Companies, IPO, Personal Finance, Gujarat, India, Global**.

### 6.4 Articles (`articles`)

**Content fields**

| Field | Type | Rules |
|---|---|---|
| title | text | required, max 160 |
| slug | text | required, unique, indexed; auto-generated (Section 9.1); editable by admin only after first save |
| summary | textarea | required, max 280; used as the card blurb and meta description |
| body | richText (Lexical) | required |
| heroImage | upload → `media` | required |
| category | relationship → `categories` | required, single |

**Workflow and editorial fields** (placed in the admin sidebar)

| Field | Type | Rules |
|---|---|---|
| workflowStatus | select: `draft`, `in_review`, `published`, `rejected` | default `draft`; transitions validated by hook (Section 7.3) |
| rejectionReason | textarea | visible only when status is `rejected`; **writable by admin only** |
| author | relationship → `users` | auto-set to current user on create; editors cannot change it |
| isFeatured | checkbox | admin only; drives the home hero |
| publishedAt | date | auto-set on first publish; admin only |
| submittedAt | date | auto-set when moved to `in_review`; read-only |
| reviewedBy | relationship → `users` | auto-set on publish or reject; read-only |
| reviewedAt | date | auto-set on publish or reject; read-only |
| reviewLog | array | read-only; rows of `{ action, by, at, reason? }` appended by hook; `action` is one of `submitted`, `published`, `rejected`, `unpublished` |

**Derived fields** (computed by hook, not editable)

| Field | Type | Rules |
|---|---|---|
| readingTime | number | minutes, minimum 1 |
| searchText | textarea, hidden in admin | title + summary + plain text of body, used by search |
| views | number | default 0, read-only (stretch: used by Trending; the dummy seed fills it) |

**Collection settings**
- `versions: { maxPerDoc: 25 }` with **drafts disabled**. This gives a version history and diff view for reviewers without the complexity of Payload drafts.
- `admin.useAsTitle: 'title'`, `defaultColumns: ['title', 'category', 'author', 'workflowStatus', 'updatedAt']`, `listSearchableFields: ['title', 'slug']`.
- `admin.preview`: returns `/preview/{id}` (Section 10.6).
- Indexes: `slug` unique; consider an index on `workflowStatus` and `publishedAt` if the adapter supports `index: true` on those fields.

### 6.5 Global: Breaking News (`breaking-news`)

A **Global** is a single document stored once (unlike a collection, which holds many). It fits content that is one small, frequently edited block rather than a list of records with their own pages.

| Field | Type | Rules |
|---|---|---|
| enabled | checkbox | default false; master on/off switch for the ticker |
| items | array, max 5 | each item below |
| items.headline | text | required, max 140 |
| items.article | relationship → `articles` | optional; `filterOptions` limits to published articles |
| items.expiresAt | date | optional; expired items are hidden automatically |

- Validation: if `enabled` is true, at least one item is required.
- Access: **read for any logged-in user** (anonymous REST read is denied; the public site reads it through the Local API), **update for admin only**. Editors never see this screen (Section 7.5).
- Frontend behaviour: Section 10.5.

---

## 7. Roles, access control and the editorial workflow

### 7.1 Roles (two, fixed)

| Role | Can do |
|---|---|
| `editor` | Create articles; see and edit **only their own** articles while in `draft` or `rejected`; submit for review; upload images (through the article form); change their own password and name |
| `admin` | Everything: manage editor accounts, categories, breaking news, feature articles, review, publish, reject, unpublish, delete articles |
| anonymous (not logged in) | **REST: only log in and fetch image files.** Everything else is denied. The public website itself still shows published content, because it reads server-side. |

### 7.2 Collection access rules (default-deny)

Shared helpers live in `src/access/index.ts` (`isAdmin`, `isEditor`, `isLoggedIn`, `isSelf`, `ownsDoc`). Every collection and global defines **all** of `read`, `create`, `update`, `delete` explicitly. Never rely on Payload defaults.

**Articles**
```ts
read: ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  if (user?.role === 'editor') return { author: { equals: user.id } }   // own articles only, any status
  return false                                                           // anonymous: denied over REST
}

create: ({ req: { user } }) => Boolean(user)                // admin or editor

update: ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { and: [
    { author: { equals: user.id } },
    { workflowStatus: { in: ['draft', 'rejected'] } },      // locked while in_review / published
  ] }
}

delete: ({ req: { user } }) => user?.role === 'admin'

readVersions: admin → all; editor → only versions of their own articles
              (for example { 'version.author': { equals: user.id } }; confirm syntax); anonymous → false
```

| Collection / global | read | create | update | delete |
|---|---|---|---|---|
| users | admin: all; editor: self only; anonymous: **denied** | admin (role forced to `editor`) | admin: editors and self; editor: self (never `role`) | admin, **editor accounts only** (blocked if the editor has articles) |
| media | **public** (image files only, see 14.4) | admin, editor | admin | admin |
| categories | any logged-in user; anonymous **denied** | admin | admin | admin |
| articles | see above | admin, editor | see above | admin |
| breaking-news (global) | any logged-in user; anonymous **denied** | n/a | admin | n/a |

`admin` panel access (`Users.access.admin`): any logged-in user with role `admin` or `editor`.

Editors need read access to categories (to pick one in the article form) and to media (to pick or upload a hero image). They get that through the API, but the **screens are hidden** from their sidebar (Section 7.5).

### 7.2.1 Field-level access

Collection rules decide whether a document is visible; field rules decide which **fields** of a visible document each role may read or change. Both must be defined.

| Field(s) | Read | Update |
|---|---|---|
| `workflowStatus` | any role that can read the doc | admin, editor (value validated by the transition hook) |
| `rejectionReason`, `reviewLog`, `reviewedBy`, `reviewedAt`, `submittedAt` | admin, or the article's author | `rejectionReason`: admin only. Others: nobody (hook-written) |
| `author`, `isFeatured`, `publishedAt`, `views`, `readingTime` | any role that can read the doc | admin only (`author` is also auto-set on create) |
| `searchText` | nobody over REST (`read: () => false`) | nobody (hook-written) |
| `slug` | any role that can read the doc | admin only after first save |
| `Users.role` | self and admin | **nobody** over REST or the UI (seed only) |
| `Users.email` | self and admin | self and admin |

Rules for `ownsDoc`: compare the doc's `author` to `user.id` and handle both shapes (a plain id, or a populated object with an `id`).

Field-level `update: () => false` makes Payload silently ignore submitted values, which is the defence against **mass assignment** (an attacker adding `"isFeatured": true` or `"role": "admin"` to a request body). The security tests assert the value did not change (Section 14.6, group E).

### 7.3 Workflow state machine

```
 ┌───────┐  submit   ┌───────────┐  publish   ┌───────────┐
 │ draft │ ────────▶ │ in_review │ ─────────▶ │ published │
 └───────┘           └───────────┘            └─────┬─────┘
     ▲                     │ reject (reason)        │ unpublish (admin)
     │                     ▼                        │
     │               ┌──────────┐   resubmit         │
     └───────────────│ rejected │ ──────────▶ in_review
        (admin only) └──────────┘                    │
                                          back to ◀──┘ draft
```

**Allowed transitions** (enforced in `src/lib/workflow.ts`, a **pure function** with unit tests, called from the Articles `beforeChange` hook):

| Role | From | To | Extra requirements |
|---|---|---|---|
| editor | (create) | `draft`, `in_review` | `in_review` requires complete content (below) |
| editor | `draft` | `draft`, `in_review` | same |
| editor | `rejected` | `rejected` (just editing), `in_review` | same |
| admin | any | `draft`, `in_review`, `published` | `published` sets publish metadata |
| admin | `in_review` | `rejected` | `rejectionReason` required (min 10 characters) |
| admin | `published` | `published` (editing), `draft` (unpublish) | unpublish is logged |
| anyone else | any | anything | rejected with an error |

Notes:
- `rejected` may be set **only by admin and only from `in_review`**.
- Editors can never set `published` or `rejected`, and cannot edit articles in `in_review` or `published` (the access rule blocks the update before the hook even runs).
- **Complete content** for submission: `title`, `summary`, non-empty `body`, `heroImage`, `category`.

**Side effects on transition** (all in the hook):

| To | Effects |
|---|---|
| `in_review` | set `submittedAt = now`; append `reviewLog` `{ action: 'submitted', by, at }`; the old `rejectionReason` stays visible as history until overwritten by the next rejection |
| `published` | set `publishedAt = now` if empty; set `reviewedBy`, `reviewedAt`; clear `rejectionReason`; append log `published` |
| `rejected` | require `rejectionReason`; set `reviewedBy`, `reviewedAt`; append log `rejected` with the reason |
| `draft` (from `published`) | append log `unpublished` |

Errors: throw Payload's `APIError` (status 400, public message) with a human-readable message such as "Only an admin can publish articles." so it appears as a toast in the admin UI. Because the hook runs for REST requests too, the same rule protects direct API calls.

### 7.4 Why not Payload's built-in drafts?

Payload's `versions.drafts` models a *live document with a pending draft*. This project needs a *multi-actor review lifecycle*, which requires a status field anyway. Running both would create two overlapping status systems and subtle bugs. A single `workflowStatus` is the single source of truth for public visibility; `versions` (without drafts) still provides history. Record this in `docs/DECISIONS.md`.

### 7.5 Users, roles and admin screens

**Screens per role** (the sidebar is role-aware: collections use `admin.hidden` as a function of the logged-in user; confirm the option for the installed version):

| Sidebar item | Admin | Editor |
|---|---|---|
| Articles | all articles, all statuses | **only their own articles** |
| Review Queue | shortcut link (see below) | hidden |
| Categories | yes | hidden |
| Media | yes | hidden (they still upload through the article form's image field) |
| Breaking News | yes | hidden |
| Users | yes | hidden |
| Roles | **does not exist** | does not exist |
| My account (`/admin/account`) | yes | yes (change name and password) |

**Review Queue is not a separate collection.** It is the Articles list pre-filtered to `workflowStatus = in_review`. Implement it as one small custom nav link (`admin.components.beforeNavLinks`, rendered only for admins) pointing at `/admin/collections/articles?where[workflowStatus][equals]=in_review` (confirm the exact filter URL syntax in the installed Payload; if the link proves fiddly, drop it and let admins use the list's built-in Status filter). An optional count badge is a stretch item.

**Typical flows**
- *Admin creates an editor:* Users → Create new → email, display name, password → saved with role `editor` (the form may show the role field read-only, or hide it). The editor can log in straight away.
- *Admin removes an editor:* Users → delete → the editor's articles are cascade-deleted, then the user record is removed.
- *Making someone an admin:* not possible in the app; done only by the seed or directly in the database. This is deliberate.

---

## 8. Content language (single language, by design)

NewsPulse is **English only**. Payload's localization feature was considered and deliberately dropped.

- Payload localization stores every localized field once per language, so each article, category and media record would hold duplicated content for each locale in the database, and editors would have to author everything twice. That is real cost in data model, migrations and editorial effort for no requirement in the assignment.
- Consequences of the decision:
  - No `localization` block in `payload.config.ts`; no localized fields anywhere.
  - Public URLs have no language prefix: `/`, `/category/{slug}`, `/article/{slug}`.
  - No language switcher, no locale middleware, no `hreflang`.
  - UI strings are kept as plain English constants in `src/config/copy.ts` so they stay in one place.
  - `<html lang="en">`; dates use `Intl.DateTimeFormat('en-IN')` with timezone `Asia/Kolkata`.
- Record this decision in `docs/DECISIONS.md`. If multi-language is requested later, it can be added as a separate change (Payload localization plus a locale route segment).

---

## 9. Hooks and business logic

### 9.1 Articles hooks

| Hook | Purpose |
|---|---|
| `beforeValidate` (slug) | If slug is empty on create, `slugify(title)` (lowercase, ASCII, hyphens). If the result is empty, use `article-{timestamp}`. Ensure uniqueness by appending `-2`, `-3`, and so on after a lookup. |
| `beforeChange` (author) | On create by an editor, force `author = user.id` **regardless of what the request body says**. Admin may choose an author. |
| `beforeChange` (workflow) | Call `assertTransition({ role, from, to, data })` from `lib/workflow.ts`; apply side effects (Section 7.3). |
| `beforeChange` (derived) | `searchText = title + summary + plainText(body)`; `readingTime = max(1, ceil(words / 200))`. Plain text comes from walking the Lexical JSON tree and joining `text` nodes. |
| `afterChange` | Revalidate public pages (Section 9.2). |
| `afterDelete` | Revalidate public pages. |

### 9.2 Revalidation

- Helper in `lib/revalidate.ts` wraps `revalidatePath` in `try/catch`. **`revalidatePath` throws outside a Next request context** (for example inside the seed scripts), so the wrapper must swallow that error.
- Support `context.disableRevalidate = true` to skip revalidation (the seed scripts set it).
- On article change (when the new or previous status is `published`): revalidate `/`, `/category/{categorySlug}` (and the previous category, if it changed), and `/article/{slug}` (and the previous slug, if it changed).
- On category change: revalidate `/` and that category page.
- On Breaking News change: `revalidatePath('/', 'layout')`, because the ticker lives in the shared layout.

### 9.3 Utility modules (unit tested)

- `workflow.ts`: `assertTransition`, `applyTransitionEffects` (pure; takes data and returns the patch).
- `text.ts`: `slugify`, `lexicalToPlainText`, `readingTimeMinutes`.

---

## 10. Public site specification

### 10.1 Routes

| Route | Content |
|---|---|
| `/` | Home |
| `/category/{slug}?page=n` | Category listing, 12 per page |
| `/article/{slug}` | Article detail |
| `/search?q=...&page=n` | Search results, 10 per page |
| `/preview/{id}` | Authenticated preview (any status), never cached |
| not found | 404 page |

### 10.2 Home page

1. **Breaking ticker** (in the shared layout, above the header; hidden if disabled or empty).
2. **Hero:** the newest `isFeatured` published article; falls back to the newest published article.
3. **Top stories:** the next 3 to 4 newest articles (excluding the hero), as a secondary grid.
4. **Latest news:** the next 9, as a card grid.
5. **By category:** the first 4 categories (by `order`), each with up to 3 articles and a "View all" link.
6. Empty state if there are no articles (never show a blank page).

### 10.3 Article page

- Category chip (links to the category), title, summary, byline (author `displayName`), published date, reading time ("N min read").
- Hero image with caption.
- Body rendered with Payload's Lexical React renderer (confirm the import path for the installed version, typically `@payloadcms/richtext-lexical/react`). Style the prose: headings, lists, blockquotes, links, inline images.
- **Related articles** (Section 10.4).
- `generateMetadata`: title, description (= summary), Open Graph and Twitter image (absolute URL to the `hero` size), canonical URL.
- Not found, or not published, returns `notFound()`.

### 10.4 Related articles and search

**Related** (3 items)
1. Published articles in the **same category**, excluding the current one, newest first.
2. If fewer than 3, top up with the newest other published articles, deduplicated.

**Search**
- GET form in the header (and a larger one on the results page). The query is trimmed; require at least 2 and at most 80 characters; anything else shows a validation message and runs no query.
- Query: published articles where `title`, `summary` or `searchText` **contains** the term (case-insensitive); sorted by `-publishedAt`; paginated. Always parameterised through Payload's query API, never string-built SQL.
- Results show title, summary, category, date. Empty state: "No results for ..." (the term is rendered through React, which escapes it).
- Known limitation, to document in the README: substring matching, no ranking or stemming. Postgres full-text search is a future upgrade.

### 10.5 Breaking-news ticker

- Rendered by a server component in the layout, using `getBreakingNews()`.
- Filter out items whose `expiresAt` is in the past. If the global is disabled or has no live items, render nothing.
- Each item shows its headline; if it links to an article that is still published, the headline links to it, otherwise it is plain text.
- Presentation: a "Breaking" label (red accent) followed by a horizontally scrolling marquee implemented with CSS only. Pause on hover and focus. **Respect `prefers-reduced-motion`**: show a static, wrapping list instead of animating.
- Updating the global revalidates the layout (Section 9.2).

### 10.6 Preview route (for admin review)

- Route `/preview/{id}`, **dynamic** (no caching, response header `Cache-Control: no-store`), with `noindex` metadata.
- Authenticate through the Payload session: call `payload.auth({ headers })` with the request headers. If there is no user, `notFound()`.
- Fetch the article by id **with `overrideAccess: false` and the authenticated `user`**, so the same access rules apply: editors can preview their own articles, admins can preview anything.
- Render with the same article-page component, plus a visible banner "Preview, status: {workflowStatus}".

### 10.7 Data layer rules (`lib/queries.ts`)

- **All public data fetching lives in this one file.** Components never call Payload directly.
- The Local API bypasses access control by default (`overrideAccess` defaults to true). That is acceptable here only because every public query **must** include an explicit `where: { workflowStatus: { equals: 'published' } }` and map results into narrow DTOs (`ArticleCardDTO`, `ArticleDetailDTO`, `CategoryDTO`) that expose only whitelisted fields (for example author `displayName`, never email, role or any workflow field).
- Never pass a raw Payload document to a client component or into page props. This prevents internal fields (`rejectionReason`, `reviewLog`, user emails) leaking into the HTML or the React Server Components payload. The security tests check for this (group J).
- Use `depth` of 1 (2 where needed) and `select` where it reduces payload size.
- Functions: `getHome`, `getCategories`, `getCategoryPage`, `getArticleBySlug`, `getRelatedArticles`, `searchArticles`, `getBreakingNews`.

### 10.8 Rendering and caching

- Home, category and article routes: statically generated with **time-based revalidation as a fallback** (for example `export const revalidate = 300`) **plus on-demand revalidation** from hooks (Section 9.2).
- Article and category pages render on first request and are then cached (no need to pre-generate every slug at build).
- Search and preview routes: `dynamic = 'force-dynamic'`.
- **`next build` needs a reachable database** (the home page prerenders). Start Postgres before building, locally and on EC2.
- Do not enable experimental caching modes (for example cache components). Confirm that the route-segment options above are valid in the installed Next version; otherwise use the equivalent.

### 10.9 Theme (single, fixed) and design direction

No theme switching, no dark mode, no colour customization. One considered design.

| Token | Value | Use |
|---|---|---|
| `--navy` | `#0B1F3A` | header, footer, headings accent |
| `--gold` | `#C79A2B` | accents, links on dark, category chips |
| `--paper` | `#FAF8F3` | page background |
| `--surface` | `#FFFFFF` | cards |
| `--ink` | `#111827` | body text |
| `--muted` | `#5B6472` | meta text |
| `--line` | `#E5E1D8` | borders |
| `--breaking` | `#B3261E` | breaking label |

- Typography: headlines in Noto Serif; body and UI in Inter. Load with `next/font/google`, `display: swap`.
- Layout: max content width about 1200px, 12-column grid on desktop, 2 columns on tablet, 1 on mobile. Category nav scrolls horizontally on small screens.
- Card variants: **hero** (large image, headline over or beside), **standard**, **compact** (text-only list item).
- Images: use the generated `card` / `hero` sizes with `next/image` and the `unoptimized` prop (Payload already produced the sizes, and this avoids extra optimizer configuration). Hero image gets `priority`; others lazy.
- Accessibility: semantic landmarks (`header`, `nav`, `main`, `footer`, `article`), visible focus states, contrast AA or better, alt text from `media.alt`, skip-to-content link, keyboard-operable search.
- Footer includes a small notice: "Demo content created for an assessment. Articles are fictional."

### 10.10 Components

`SiteHeader`, `Logo` (reads `brand.ts`), `CategoryNav`, `SearchForm`, `BreakingTicker`, `ArticleCard` (hero / standard / compact), `ArticleMeta`, `RichTextRenderer`, `RelatedArticles`, `Pagination`, `EmptyState`, `SiteFooter`.

### 10.11 UI copy

All user-facing strings (nav labels, "Latest news", "Top stories", "Related articles", "min read", "Breaking", "No results for ...", pagination labels, 404 text, preview banner, footer notice) live in `src/config/copy.ts` as English constants. No i18n library.

---

## 11. Admin panel specification

- Payload admin lives at `/admin` inside the same app.
- **Branding (fixed, static):** custom `Logo` and `Icon` components registered under `admin.components.graphics`, a favicon, and `admin.meta.titleSuffix` (for example " – NewsPulse CMS"). The logo is an inline SVG mark plus the wordmark text taken from `brand.ts`. Default Payload colours are kept (no colour customization).
- Custom components (Logo, Icon, ReviewQueueLink) need the import map regenerated (`make types`); commit it.
- **Role-aware sidebar** per Section 7.5: editors see only Articles; admins see Articles, Review Queue, Categories, Media, Breaking News and Users. Use `admin.group` to group admin items: **Editorial** (Articles, Categories, Media), **Settings** (Breaking News), **Access** (Users).
- Sensible `admin.description` text on workflow fields so editors understand the process (for example "Set to In review when you are ready for an admin to look at it").
- **Disable GraphQL** (`graphQL: { disable: true }`). REST stays on because the admin panel needs it.
- Set a maximum relationship depth (`maxDepth`, for example 3).
- Set `cors` and `csrf` to the public server URL (`NEXT_PUBLIC_SERVER_URL`) and nothing else.
- Upload size limit 5 MB.
- Cookie settings: keep `secure` false (the deployment is HTTP-only), `sameSite: 'Lax'`, HTTP-only (Payload default).

---

## 12. Seed data

Two idempotent scripts (running either twice must not duplicate data; look up by email or slug first). Both use the Payload Local API and set `context.disableRevalidate = true` on every write.

### 12.1 Essential seed: `pnpm seed` / `make seed`

Only what the app needs to function:
- **Admin user** from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (display name "Site Admin", role `admin`). This is the **only** way an admin exists. Fail with a clear error if the variables are missing.
- **8 categories** (Section 6.3), ordered, with short descriptions.
- **Breaking News** global: created with `enabled = false` and no items.

### 12.2 Dummy-data seed: `pnpm seed:dummy` / `make seed-dummy`

Demo content for reviewers. Runs the essential seed first if the admin does not exist yet.

**Users**
- **2 editors**, created through the Local API (role `editor`): "Aarav Mehta" (`SEED_EDITOR1_EMAIL`) and "Nisha Shah" (`SEED_EDITOR2_EMAIL`), each with a short bio. Passwords come from env.

**20 articles** (fictional explainers; rules at the end of this section)

| # | Title (suggested) | Category | Author | Status |
|---|---|---|---|---|
| 1 | How a SIP Works: Investing ₹5,000 a Month | Personal Finance | Aarav | published, **featured** |
| 2 | IPO Allotment Explained: Why You Didn't Get Shares | IPO | Nisha | published |
| 3 | Reading a Quarterly Result in Five Minutes | Companies | Aarav | published |
| 4 | What Rising Inflation Means for Your Savings | Economy | Nisha | published |
| 5 | How Small Manufacturers in Gujarat Manage Cash Flow (uses an invented example company) | Gujarat | Aarav | published |
| 6 | Fixed Deposits vs Debt Funds: A Plain Comparison | Personal Finance | Nisha | published |
| 7 | How Stock Market Circuit Limits Work | Market | Aarav | published |
| 8 | Understanding the Repo Rate | Economy | Nisha | published |
| 9 | Why Global Oil Prices Move Local Fuel Costs | Global | Aarav | published |
| 10 | How to Read a Government Budget Document | India | Nisha | published |
| 11 | A Beginner's Guide to Mutual Fund Expense Ratios | Market | Aarav | published |
| 12 | How Startups Raise Funds: Seed to Series A | Companies | Nisha | published |
| 13 | Understanding Credit Scores and Why They Matter | Personal Finance | Aarav | **in_review** |
| 14 | What Is a Rights Issue? | Market | Nisha | **in_review** |
| 15 | Trade Deficits Explained with a Simple Example | Global | Aarav | **in_review** |
| 16 | "Five Stocks Guaranteed to Double" | Market | Nisha | **rejected** — reason: "The headline makes an unverifiable guarantee. Rewrite as an educational piece about risk and diversification." |
| 17 | "Gujarat's Next Big Export Boom" | Gujarat | Aarav | **rejected** — reason: "No sources or figures. Add attributed data before resubmitting." |
| 18 | Gold vs Equity: A Long-Term Comparison (short, unfinished body) | Personal Finance | Nisha | **draft** |
| 19 | How GST Input Credit Works for Small Sellers | India | Aarav | **draft** |
| 20 | A title at the maximum length (160 characters) to test layout wrapping | Companies | Nisha | **draft** |

Distribution: **12 published, 3 in review, 2 rejected, 3 draft**, and every category has at least one published article. Alternate authors as shown.

**Per-article details**
- `publishedAt` for published articles spread over the last 30 days (newest first by number is not required; shuffle). `submittedAt` set for in-review, rejected and published articles.
- `reviewLog` and `reviewedBy` / `reviewedAt` populated plausibly for published and rejected articles (reviewer: the admin); rejected articles carry their `rejectionReason`.
- `views` random between 50 and 5000 for published articles (ready for the optional Trending feature).
- Bodies: 3 to 6 paragraphs each; article #1 is the **rich-text showcase** with headings, a bullet list, a numbered list and a blockquote; article #18 is deliberately short.
- Summaries within 280 characters; titles within 160.

**Other dummy data**
- **20 placeholder images**, generated with `sharp` from an SVG template (category-coloured background, category name, article number) and saved as JPEG; each with alt text. No downloads, no licensing issues.
- **Breaking News**: enabled, 3 items: one linked to a published article (#2), one plain-text item, and one with an `expiresAt` in the past (to prove expired items are hidden).

**Content rules (important for a finance-news demo):** articles must be **clearly generic or fictional explainers**. **Do not invent facts, figures or quotes about real companies or real people.** Use invented company names if a company is needed. Rich-text bodies are built by `lexicalFromBlocks([...])` in `src/seed/lexical.ts`.

### 12.3 Resetting

There is no `--reset` flag. To start over: `make seed-reset` (drops the database volume, migrates, runs both seeds). It asks for confirmation and must **not** be run on the live server after submission.

---

## 13. Configuration, environment and commands

### 13.1 Environment

`.env.example` (keep values simple: `KEY=value`, no quotes or spaces, because the Makefile loads this file):

```
# Database
POSTGRES_USER=app
POSTGRES_PASSWORD=change-me
POSTGRES_DB=app
DATABASE_URI=postgres://app:change-me@127.0.0.1:5432/app

# Payload
PAYLOAD_SECRET=generate-a-long-random-string

# Public URL (inlined into the client bundle at BUILD time)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Seed accounts (throwaway)
SEED_ADMIN_EMAIL=admin@example.test
SEED_ADMIN_PASSWORD=change-me
SEED_EDITOR1_EMAIL=aarav@example.test
SEED_EDITOR1_PASSWORD=change-me
SEED_EDITOR2_EMAIL=nisha@example.test
SEED_EDITOR2_PASSWORD=change-me

# Security tests (only needed where you run `make test-security`)
SEC_BASE_URL=http://localhost:3000
SEC_ADMIN_EMAIL=admin@example.test
SEC_ADMIN_PASSWORD=change-me
```

`docker-compose.yml` (Postgres only):

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
```

**Migrations (Postgres adapter).** Schema "push" is a development convenience. For anything deployed, create and commit migrations (`make migrate-create NAME=...`) and apply them with `make migrate` before starting the app. Never rely on push in production.

**`package.json` scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test` (unit only), `test:security` (uses `vitest.security.config.ts`), `seed` (essential), `seed:dummy`, `payload` (Payload CLI), `generate:types`, `generate:importmap`.

### 13.2 Makefile

Create `Makefile` at the repo root. **Recipe lines must be indented with a real TAB character.** Keep `.env` values free of quotes and spaces, because `include` / `export` read the file as Make syntax.

```make
SHELL := /bin/bash
-include .env
export

APP_NAME := newspulse
PNPM     := pnpm
PM2      := pm2
NAME    ?= change

.DEFAULT_GOAL := help
.PHONY: help install dev build start stop restart status logs \
        db-up db-down db-logs db-reset db-backup \
        migrate migrate-create types \
        seed seed-dummy seed-reset \
        lint typecheck test test-security check deploy

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*## "}{printf "  %-16s %s\n", $$1, $$2}'

install: ## Install dependencies from the lockfile
	$(PNPM) install --frozen-lockfile

dev: db-up ## Local development server (starts Postgres first)
	$(PNPM) dev

build: ## Production build (Postgres must be running)
	NODE_OPTIONS=--max-old-space-size=3072 $(PNPM) build

start: ## Production: install deps, free port 3000, start Postgres, migrate, then start app under PM2
	$(PNPM) install --frozen-lockfile
	@echo "Freeing port 3000..."
	-fuser -k 3000/tcp 2>/dev/null || true
	@if fuser 3000/tcp >/dev/null 2>&1; then \
		echo "Port 3000 still in use, retrying with sudo..."; \
		sudo fuser -k 3000/tcp 2>/dev/null || true; \
	fi
	@if fuser 3000/tcp >/dev/null 2>&1; then \
		echo "ERROR: port 3000 could not be freed. Aborting."; exit 1; \
	fi
	@echo "Freeing port 5432..."
	-fuser -k 5432/tcp 2>/dev/null || true
	@if fuser 5432/tcp >/dev/null 2>&1; then \
		echo "Port 5432 still in use, retrying with sudo..."; \
		sudo fuser -k 5432/tcp 2>/dev/null || true; \
	fi
	@if fuser 5432/tcp >/dev/null 2>&1; then \
		echo "ERROR: port 5432 could not be freed. Aborting."; exit 1; \
	fi
	docker compose up -d --wait db
	@echo "Waiting for Postgres to be ready..."
	@for i in $$(seq 1 20); do \
		docker compose exec -T db pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1 && break; \
		echo "  Postgres not ready yet ($$i/20)..."; sleep 2; \
		if [ $$i -eq 20 ]; then echo "ERROR: Postgres did not become ready. Aborting."; exit 1; fi; \
	done
	$(PNPM) payload migrate
	$(PM2) startOrReload ecosystem.config.cjs
	$(PM2) save

stop: ## Stop the app (PM2), free port 3000, and stop Postgres
	-$(PM2) stop $(APP_NAME)
	-$(PM2) delete $(APP_NAME)
	-fuser -k 3000/tcp 2>/dev/null || true
	docker compose stop db

restart: ## Reload the app without downtime
	$(PM2) reload $(APP_NAME)

status: ## Show Postgres and app status
	docker compose ps
	$(PM2) status

logs: ## Tail the app logs
	$(PM2) logs $(APP_NAME) --lines 100

db-up: ## Start Postgres and wait until it is healthy
	docker compose up -d --wait db

db-down: ## Stop Postgres (data is kept)
	docker compose stop db

db-logs: ## Tail Postgres logs
	docker compose logs -f --tail 100 db

db-reset: ## DANGER: delete ALL database data, recreate and migrate
	@read -p "This deletes ALL data. Type 'yes' to continue: " a; [ "$$a" = "yes" ]
	docker compose down -v
	$(MAKE) db-up migrate

db-backup: ## Dump the database to backups/
	@mkdir -p backups
	docker compose exec -T db pg_dump -U $(POSTGRES_USER) $(POSTGRES_DB) > backups/$$(date +%Y%m%d-%H%M%S).sql

migrate: db-up ## Apply database migrations
	$(PNPM) payload migrate

migrate-create: ## Create a migration, e.g. make migrate-create NAME=add-views
	$(PNPM) payload migrate:create $(NAME)

types: ## Regenerate Payload types and the admin import map
	$(PNPM) payload generate:types
	$(PNPM) payload generate:importmap

seed: migrate ## Essential data only: admin account, categories, empty breaking news
	$(PNPM) seed

seed-dummy: seed ## Demo data: 2 editors, 20 articles, images, breaking news
	$(PNPM) seed:dummy

seed-reset: ## DANGER: wipe the database, then run seed and seed-dummy
	$(MAKE) db-reset
	$(MAKE) seed-dummy

lint: ## Run the linter
	$(PNPM) lint

typecheck: ## Run the TypeScript compiler without emitting
	$(PNPM) typecheck

test: ## Unit tests
	$(PNPM) test

test-security: ## REST security tests against SEC_BASE_URL (server must be running)
	$(PNPM) test:security

check: lint typecheck test ## Lint, typecheck and unit tests

deploy: ## Update a running server: pull, install, migrate, build, reload
	git pull --ff-only
	$(MAKE) install migrate build restart
```

Typical use:
- Local development: `make seed-dummy` then `make dev`.
- Server, first time: `make install seed-dummy build start` (then `pm2 startup` once, see Section 16.4).
- Server, update: `make deploy`.

---

## 14. Security (demo level)

Goal: the simple protections that are actually needed for a public demo, proven by tests. Nothing heavier.

### 14.1 Threat model, stated plainly

- **The REST API is public.** Even though the NewsPulse website reads data through the in-process Local API, Payload still serves a REST API at `/api`, and the admin panel is built on top of it, so it cannot be disabled. Anyone with `curl` can call it. Therefore security cannot rely on the admin UI hiding buttons: **every rule is enforced by Payload's access functions and hooks, and tested by calling the REST API directly.**
- The attackers considered:
  1. **Anonymous visitor** probing `/api` for data.
  2. **Logged-in editor** trying to exceed their role (publish, edit others' work, escalate to admin, read others' drafts).
- Not covered (documented limitations): HTTPS (no domain), a WAF or CDN, DDoS protection, password-guessing protection beyond the 5-attempt account lockout, formal penetration testing.

### 14.2 What is in place (the core)

1. **Default deny.** Every collection and global defines all four operations explicitly. Anonymous REST access is denied everywhere except login and image files.
2. **Two fixed roles, least privilege**, at collection level and field level (Sections 7.2 and 7.2.1). Admin accounts exist only through the seed; roles are immutable.
3. **Workflow enforced on the server** (Section 7.3), so direct API calls cannot skip review.
4. **Mass-assignment protection:** protected fields and `role` are ignored if sent by a client; `author` is forced server-side.
5. **Public site hygiene:** published-only filters and DTOs (Section 10.7); preview route requires login and obeys access rules.
6. **Small surface:** GraphQL disabled, API keys off, no self-registration, image-only uploads with a size limit, `maxDepth` capped, login lockout after 5 failed attempts.
7. **Infrastructure basics:** only ports 22 (your IP) and 80 are open; Postgres and Next listen on `127.0.0.1` only; `.env` is git-ignored and `chmod 600`; strong secret and DB password.
8. **Automated REST security tests** (Section 14.5 and 14.6).

### 14.3 RBAC matrix for direct REST calls

Expected result when each caller sends the request directly to the REST API. "Denied" means HTTP 401 or 403 (or 404 where the document is hidden by a query filter); tests accept any of those, but never 200.

| Endpoint / operation | Anonymous | Editor (own doc) | Editor (someone else's doc) | Admin |
|---|---|---|---|---|
| `POST /api/users/login` | allowed (needed); account locks after 5 failures | allowed | n/a | allowed |
| `POST /api/users/first-register` | denied once any user exists | denied | n/a | denied |
| `GET /api/users`, `GET /api/users/:id` | denied | self only | denied | allowed |
| `POST /api/users` (create) | denied | denied | n/a | allowed, **role forced to `editor`** |
| `PATCH /api/users/:id` with `role` | denied | denied (even on self) | denied | **role change ignored** (role is immutable) |
| `DELETE /api/users/:id` | denied | denied | denied | editors only; never an admin; cascade-deletes the editor's articles first |
| `GET /api/articles`, `GET /api/articles/:id` | **denied** | allowed | **denied (any status, even published)** | allowed |
| `POST /api/articles` | denied | allowed as `draft` or `in_review`; `author` forced to self | n/a | allowed |
| `PATCH /api/articles/:id` | denied | only while `draft` or `rejected`; cannot set `published` / `rejected`; protected fields ignored | denied | allowed, subject to transition rules |
| `DELETE /api/articles/:id` | denied | denied | denied | allowed |
| `GET /api/articles/versions`, `.../versions/:id` | denied | own articles only | denied | allowed |
| `GET /api/categories` | **denied** | allowed (read-only) | n/a | allowed |
| `POST/PATCH/DELETE /api/categories` | denied | denied | n/a | allowed |
| `GET /api/media`, `GET /api/media/file/:name` | **allowed** (images only, see 14.4) | allowed | n/a | allowed |
| `POST /api/media` | denied | image ≤ 5 MB only | n/a | allowed |
| `PATCH/DELETE /api/media/:id` | denied | denied | denied | allowed |
| `GET /api/globals/breaking-news` | **denied** | allowed | n/a | allowed |
| `POST /api/globals/breaking-news` | denied | denied | n/a | allowed |
| `POST /api/graphql` | disabled (404) | disabled | disabled | disabled |

No response may ever contain another user's email, and an editor never receives another editor's article.

### 14.4 Known limitations and optional extras

**Media exception (documented limitation).** Anonymous read on `media` is required so visitors' browsers can load article images (visitors are not logged in). Consequence: anyone who calls `GET /api/media` can see the list of uploaded images, including images uploaded for articles that are not yet published. Accepted for this demo because the images are non-sensitive; the **text** of unpublished articles is never exposed this way. State it in the README. Do not upload sensitive images.

**HTTP only.** With no domain there is no HTTPS, so logins and session cookies travel unencrypted. Acceptable only for this assessment with throwaway passwords. State it plainly in the README. Never reuse a real password.

**Optional extras (stretch, do only after Phase 6; none are required for the demo)**
- Security headers and `poweredByHeader: false` in `next.config.mjs` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`).
- `pnpm audit --prod` and fixing high or critical findings.
- UUID-based upload filenames so image URLs are unguessable.
- Pagination caps (`defaultLimit` / `maxLimit`) and the extra security tests: group G (CSRF origin check), I (headers).
- Forgot-password response check.

### 14.5 Security test strategy

- **Direct REST tests** live in `tests/security/` and run with `make test-security` against any base URL (`SEC_BASE_URL`): local during development, and the **live EC2 URL before submission**.
- Tests need only the admin credentials. They create their own temporary users (editor A, editor B, a dedicated lockout-test user) through the admin API, create their own articles, and **delete everything they created** in teardown, so they are safe to run against the live site and never lock the real demo accounts. Deleting a temporary editor automatically cascade-deletes their articles, so teardown order does not matter.
- Authentication in tests: log in with `POST /api/users/login`, then send the returned token (header `Authorization: JWT <token>`; confirm the scheme for the installed version) or the auth cookie.
- Each test asserts the **status code** and, for reads, the **response body** (no forbidden fields or other users' emails).

### 14.6 Required test cases

**Group A: Anonymous access (must pass)**
- `GET /api/articles`, `/api/articles/:id`, `/api/categories`, `/api/users`, `/api/globals/breaking-news`, `/api/articles/versions`: all denied.
- `POST`, `PATCH`, `DELETE` on articles, categories, users, media, globals: all denied.
- `GET /api/media/file/<a real uploaded file>`: 200 with an image content type.
- `POST /api/graphql`: 404 (disabled).

**Group B: Authentication basics (must pass)**
- Wrong password: denied with a generic message that does not reveal whether the email exists.
- Lockout: using the dedicated throwaway user, 5 wrong passwords then a correct password: still denied while locked.
- `first-register` after users exist: refused.
- Missing, malformed or tampered token (change one character of a valid JWT): denied.

**Group C: Editor RBAC (must pass)**
- Editor A creates an article as `draft`: allowed. With `published` or `rejected`: refused with a clear error.
- Editor A includes `author: <editor B id>` in the create body: stored author is still editor A.
- Editor A submits (`in_review`): allowed; then any further PATCH by A: denied (locked).
- Editor A cannot move an article to `published`; cannot set `rejectionReason`.
- Editor B cannot `GET`, `PATCH` or `DELETE` editor A's article **at any status, including after it is published**; it does not appear in B's list or in `where` queries.
- Editor cannot `DELETE` any article, category, media or user.
- Editor cannot `POST /api/users`, cannot read other users.
- Editor cannot create, update or delete categories; cannot update the breaking-news global.
- Media: editor can upload a small image; a non-image file, a file over 5 MB, and an SVG are refused.

**Group D: Admin, workflow and user management (must pass)**
- Admin moves `in_review` → `rejected` without a reason: 400. With a reason shorter than 10 characters: 400. With a valid reason: success, log entry written.
- Admin publishes: `publishedAt`, `reviewedBy`, `reviewedAt` populated. Admin unpublishes: status returns to `draft`, log entry written.
- Admin creates a user with `role: "admin"` in the body: the stored role is `editor`.
- Admin `PATCH`es an editor's `role` to `admin`: role unchanged.
- Admin cannot delete an admin account; can delete an editor — their articles are cascade-deleted first, then the user record is removed.
- Admin can update the breaking-news global and read versions.

**Group E: Mass assignment (must pass)**
- As editor, `PATCH` own draft adding `isFeatured: true`, `publishedAt`, `views: 9999`, `reviewedBy`, `reviewLog`, `slug`: after the call, each of those values is unchanged.
- As editor, `PATCH` own user record with `role: "admin"`: role unchanged, and subsequent admin-only calls (for example creating a user) still denied.

**Group F: Query abuse (must pass)**
- As editor: `GET /api/articles?where[author][not_equals]=<self>` and `where[workflowStatus][equals]=draft`: returns none of another editor's articles.
- As editor: `where[author.email][contains]=...` and `depth=5`: no response ever includes another user's email.

**Group J: Public site leakage (must pass)**
- The slug of a draft, `in_review`, `rejected` and unpublished article returns 404 on `/article/{slug}`.
- `/preview/{id}` returns 404 when not logged in, and for an editor who is not the author.
- The HTML (and embedded server-component payload) of `/`, `/category/{slug}` and a published `/article/{slug}` contain none of: `rejectionReason`, `reviewLog`, `reviewedBy`, `@example.test`.

**Manual check (record the result in `docs/DECISIONS.md`)**
- From a machine outside AWS, ports 3000 and 5432 are not reachable; only 80 responds.

---

## 15. Phased implementation plan

Estimated durations add up to about 9 hours. **Checkpoints:** core content flow and the security tests passing locally by the end of Phase 4; live on EC2 by the end of Phase 6; Phase 7 and any spare time are the buffer and polish window.

### Phase 1: Bootstrap and Payload setup (about 1 h)

**Tasks**
1. Initialise the repo with `create-payload-app` (blank template, Postgres adapter, pnpm, TypeScript). Pin and record versions.
2. Add `docker-compose.yml`, `.env.example`, `.gitignore` (including `media/`, `backups/`, `.env`) and the **Makefile** (Section 13.2). Confirm `make help`, `make db-up`, `make dev` work.
3. Start Postgres; run the app locally; create the first admin user through the admin screen to confirm everything works (this is a one-off local check; real accounts come from the seed).
4. Add `src/config/brand.ts` (name "NewsPulse", tagline) and `src/config/copy.ts`.
5. Configure `cors` / `csrf`, upload limits, GraphQL disable, `maxDepth`, and the `Users` collection with `role` (fixed, Section 6.1), `displayName`, auth lockout, API keys off. **Do not add localization.**
6. Add Tailwind, fonts and the route-group layout skeleton: `(payload)` untouched, `(site)/layout.tsx` rendering `<html lang="en">`.
7. Add Vitest (unit config and security config) and an empty passing test.

**Deliverables:** running local app, admin login works, Makefile in place.
**DoD:** `make check` passes; `/admin` and `/` both load; GraphQL endpoint returns 404; first commit pushed.

### Phase 2: Content model, workflow, access and admin screens (about 2 h 15 min)

**Tasks**
1. `src/access/index.ts` helpers. `Media`, `Categories` (with delete guard), `Articles` with all fields from Section 6.4.
2. `lib/text.ts` (`slugify`, `lexicalToPlainText`, `readingTimeMinutes`) with unit tests.
3. `lib/workflow.ts` (transition matrix and effects) with unit tests covering every row of the Section 7.3 table, including the rejection-reason requirement and editor restrictions.
4. Collection access rules (Section 7.2, default-deny, all four operations explicit on every collection and global) and `readVersions`.
5. `Users` rules (Section 6.1): role create/update access off, first-user hook, admin deletes editors only, delete guard for editors with articles.
6. Hooks: slug, author (forced), workflow, derived fields, revalidation helper (safe wrapper), `afterChange` and `afterDelete`.
7. `BreakingNews` global with access and validation.
8. Role-aware sidebar (Section 7.5): `admin.hidden` per collection, `ReviewQueueLink` nav component for admins.
9. Admin branding: `Logo`, `Icon`, favicon, `titleSuffix`, sidebar groups, field descriptions.
10. `admin.preview` URL wired (route implemented in Phase 5).
11. `make types`, then `make migrate-create NAME=initial`; apply it to a fresh database to prove migrations work.

**Deliverables:** complete admin experience for both roles.
**DoD:**
- As admin: Users → create an editor (role is `editor`); delete an editor (their articles are cascade-deleted); cannot delete an admin.
- As editor: sidebar shows only Articles; create a draft, submit for review, and confirm you cannot publish, cannot edit while in review, and cannot see anyone else's articles.
- As admin: Review Queue link shows in-review articles; publish, reject without a reason (blocked), reject with a reason, unpublish.
- Workflow unit tests green.

### Phase 3: Security layer and REST attack tests (about 40 min)

**Tasks**
1. Field-level access per Section 7.2.1 (read and update rules, `searchText` hidden, `Users.role` immutable).
2. Confirm anonymous REST is denied everywhere except login and media files (Section 14.3).
3. Upload hardening (MIME allowlist, size, no SVG).
4. Write `tests/security/helpers.ts` (login, create temporary users and articles, teardown that deletes everything) and `tests/security/api.security.test.ts` covering groups A, B, C, D, E, F.
5. Fix every failing test by changing the access rules, not the test.

**Deliverables:** a green `make test-security` run against the local server.
**DoD:** groups A to F pass locally; teardown leaves no leftover users or articles; the RBAC matrix in 14.3 matches observed behaviour for every row.

### Phase 4: Seeds (about 45 min)

**Tasks:** implement `src/seed/base.ts` and `src/seed/dummy.ts` (with `dummy-content.ts`, `images.ts`, `lexical.ts`) as specified in Section 12, and add `pnpm seed` and `pnpm seed:dummy`. Confirm the Makefile targets `seed`, `seed-dummy`, `seed-reset`.

**Deliverables:** a fresh database becomes a fully populated demo with one command (`make seed-dummy`).
**DoD:** running either seed twice is safe; admin sees 20 articles across all four statuses, 2 editors, 8 categories, 20 images and an enabled ticker; each editor sees only their own articles; a from-scratch `make seed-reset` works; `make test-security` still passes after seeding.

### Phase 5: Public site (about 2 h)

**Tasks**
1. `copy.ts` strings, `lib/queries.ts` with DTOs (Section 10.7).
2. Layout: header, category nav, search form, footer, breaking ticker.
3. Home page, category page with pagination, article page with rich-text renderer, related articles, search page, preview route (`no-store`), 404.
4. Metadata: `generateMetadata` with Open Graph and canonical URLs.
5. Responsive and accessibility pass; apply the fixed theme tokens.
6. Verify revalidation: publish or edit in admin and observe the public page update without a rebuild.
7. Add security test group J (public-site leakage) and run it.

**Deliverables:** complete public site backed by the dummy data.
**DoD:** all routes in Section 10.1 work; unpublished articles are never reachable publicly (try the slug of a draft: 404); preview works for admin and for the owning editor only; page HTML contains no internal fields; the expired breaking-news item is not shown; no console errors; mobile layout verified at about 375px.

### Phase 6: Deploy to AWS EC2 (about 1 h 30 min)

Follow Section 16 exactly. Deploy the Phase 5 baseline **before** adding stretch items. Run the security suite against the live URL.

**DoD:** public URL serves the site and `/admin`; dummy data present; survives `sudo reboot`; an upload persists across `make restart`; `make test-security` passes against the live URL; ports 3000 and 5432 unreachable from outside.

### Phase 7: Polish and docs (about 45 min)

**Tasks**
1. README (Section 18) and `docs/DECISIONS.md` (single-status-field decision, single-language decision, fixed roles and seed-only admin, media-read exception).
2. Full QA pass (Section 17) on the live URL.
3. Optional extras from Section 14.4 and the stretch list, only if time remains.
4. Final `make deploy`; rerun `make test-security` against live; EBS snapshot or AMI as a backup.

**DoD:** QA checklist fully ticked on the live deployment; submission package complete.

---

## 16. Deployment runbook: AWS EC2 (PM2 + Nginx, Postgres in Docker)

### 16.1 Provision

| Setting | Value |
|---|---|
| Region | `ap-south-1` (Mumbai), closest to Ahmedabad |
| AMI | Ubuntu Server 24.04 LTS |
| Instance | `t3.medium` (4 GB) minimum; `t3.large` (8 GB) if the build runs out of memory. Check current pricing in the AWS pricing calculator and keep a billing alert on the credit balance |
| Storage | 30 GB gp3 |
| Key pair | create one; keep the `.pem` safe |
| Security group | inbound **22** from *your IP only*, **80** from anywhere; nothing else (not 3000, not 5432) |
| Elastic IP | **Allocate and associate one.** Without it the public IP and DNS name change whenever the instance is stopped and started, which would break `NEXT_PUBLIC_SERVER_URL` and the URL you send. Do not stop the instance after submitting; use reboot if needed |

The public URL is the instance's **Public IPv4 DNS** shown in the EC2 console (after associating the Elastic IP), in the form `http://ec2-<ip>.ap-south-1.compute.amazonaws.com`.

### 16.2 Server setup

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git build-essential make nginx curl ca-certificates

# Docker + Compose (or follow Docker's official install guide)
sudo apt -y install docker.io docker-compose-v2
sudo usermod -aG docker $USER      # log out and back in afterwards

# Node 22 (system-wide so PM2 startup works cleanly)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
sudo npm i -g pnpm pm2

# 2 GB swap as insurance for the build
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 16.3 Application setup

```bash
git clone <repo-url> ~/app && cd ~/app        # use a deploy key or a token if the repo is private
cp .env.example .env && nano .env
chmod 600 .env
#   - strong POSTGRES_PASSWORD, matching DATABASE_URI
#   - long random PAYLOAD_SECRET
#   - NEXT_PUBLIC_SERVER_URL=http://<elastic-ip-public-dns>   (NO trailing slash)
#   - throwaway seed passwords

make install
make seed-dummy      # starts Postgres, migrates, essential seed, dummy data
make build           # NEXT_PUBLIC_SERVER_URL must be final before this step; Postgres must be running
make start           # PM2 starts the app (see 16.4 for the one-time startup hook)

# One-time: register PM2 to survive reboots
pm2 startup systemd  # copy and run the exact command it prints
pm2 save             # save the current process list
```

**Order matters:**
- **Run the seed before the app is reachable.** Until an admin exists, Payload's "create first user" screen is open to anyone who finds the URL. Here the seed runs first and PM2 starts afterwards, so there is no open window.
- `NEXT_PUBLIC_SERVER_URL` is baked into the bundle at build time, so set it to the final public DNS **before** `make build`. If the URL ever changes, rebuild.
- **`make build` requires Postgres to be running** (`make seed-dummy` already starts it, so if you run the commands in order above this is not an issue; but if you run `make build` standalone, run `make db-up` first or the home page prerender will fail).

### 16.4 PM2

`ecosystem.config.cjs`:

```js
module.exports = {
  apps: [{
    name: 'newspulse',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000 -H 127.0.0.1',
    exec_mode: 'fork',
    instances: 1,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' },
  }],
}
```

`make start` runs `pm2 startOrReload` and `pm2 save`. The one-time `pm2 startup systemd` command is covered in Section 16.3.

Run a **single instance in fork mode** (no cluster), since the Next cache is per-process.

### 16.5 Nginx

`/etc/nginx/sites-available/newspulse`:

```nginx
server {
  listen 80 default_server;
  server_name _;
  server_tokens off;
  client_max_body_size 10m;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/newspulse /etc/nginx/sites-enabled/newspulse
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 16.6 Verify

1. `http://<public-dns>/` shows the NewsPulse home page with the dummy articles and the breaking ticker.
2. `/admin` loads; admin and both editor logins work; each editor sees only their own articles.
3. Publish an article from admin, then confirm it appears on the public site without a rebuild.
4. Upload an image, run `make restart`, confirm the image is still served.
5. `sudo reboot`; after it comes back, confirm Docker Postgres, the PM2 app and Nginx all returned on their own (`restart: unless-stopped`, `pm2 startup`, nginx enabled). `make status` shows both running.
6. From outside the instance, confirm ports 3000 and 5432 are **not** reachable.
7. Run the security suite from your own machine against the live URL: `SEC_BASE_URL=http://<public-dns> SEC_ADMIN_EMAIL=... SEC_ADMIN_PASSWORD=... make test-security`. All required groups pass.

### 16.7 Updating the live site

`make deploy` (or `scripts/deploy.sh`, which performs the same steps): pull, install, migrate, build, reload.

### 16.8 Backup and cost hygiene

- Before submitting, create an **EBS snapshot** (or AMI) so the working state can be restored; `make db-backup` also dumps the database to `backups/`.
- Set an AWS Budgets alert against the credit. Keep the instance running through the evaluation window, then stop or terminate it and release the Elastic IP (an unattached Elastic IP is billed).
- Do not run `make seed-reset` or `make db-reset` on the live server after submission.

---

## 17. QA and acceptance checklist

**Users and screens**
- [ ] Admin sidebar: Articles, Review Queue, Categories, Media, Breaking News, Users. There is no Roles screen.
- [ ] Editor sidebar: Articles only; the list shows only their own articles.
- [ ] Admin creates an editor from Users; the new user's role is `editor`; the editor can log in.
- [ ] Admin cannot create an admin or change anyone's role from the UI.
- [ ] Admin cannot delete an admin; deleting an editor cascade-deletes their articles first.

**Workflow**
- [ ] Editor creates an article and saves it as `draft`.
- [ ] Editor cannot choose or save `published` or `rejected` (clear error).
- [ ] Editor submits (`in_review`); `submittedAt` and a log entry are set; the editor can no longer edit it.
- [ ] Admin opens it from Review Queue, previews it, and rejects **without** a reason: blocked.
- [ ] Admin rejects **with** a reason; the editor sees the reason and can edit and resubmit.
- [ ] Admin publishes; `publishedAt`, `reviewedBy`, `reviewedAt` set; the article appears publicly at once.
- [ ] Admin unpublishes; the article disappears publicly at once.

**Security (direct REST, not just the UI)**
- [ ] `make test-security` passes locally and **against the live URL**: groups A, B, C, D, E, F, J.
- [ ] Anonymous `GET /api/articles`, `/api/users`, `/api/categories`, `/api/globals/breaking-news` are denied; anonymous image file fetch works; GraphQL returns 404.
- [ ] Editor cannot escalate to admin, cannot publish, cannot read or touch other editors' articles, cannot change categories or the breaking-news global, cannot delete anything.
- [ ] Protected fields and `role` are unchanged after mass-assignment attempts.
- [ ] No response, API or HTML, ever contains another user's email or an editor-inaccessible workflow field.
- [ ] A draft's slug returns 404 publicly; its `/preview/{id}` returns 404 when logged out and for non-owners.
- [ ] Ports 3000 and 5432 unreachable from outside; only 80 is open (plus 22 from your IP).

**Seed and tooling**
- [ ] `make seed-dummy` on an empty database yields 2 editors, 20 articles (12 published, 3 in review, 2 rejected, 3 draft), 8 categories, 20 images, an enabled ticker.
- [ ] Re-running `make seed-dummy` creates no duplicates.
- [ ] `make help` lists all targets; `make start`, `make stop`, `make status`, `make logs` work on the server.

**Public site**
- [ ] Home shows ticker (expired item hidden), hero (the featured article), top stories, latest, category rails.
- [ ] Category pagination works; invalid `page` falls back safely.
- [ ] Article page shows meta, hero, body (article #1 shows headings, lists and quote), related (3 items, same category first).
- [ ] The long-title draft and short-body draft render sensibly in preview.
- [ ] Search finds by title, summary and body text; handles empty and too-short queries.
- [ ] Breaking ticker pauses on hover and is static with reduced motion.
- [ ] Mobile layout is usable at 375px; keyboard navigation works.

**Platform**
- [ ] Fresh database to `make seed-dummy` works from scratch (`make seed-reset` locally).
- [ ] `make check` passes; `make build` passes.
- [ ] Live URL passes every item above; reboot test passed.

**Demo script (3 to 5 minutes):** log in as admin, create a new editor; log in as that editor, write and submit an article; as admin, open Review Queue, preview and reject with a reason; fix as editor and resubmit; publish; open the public site and show the new article; add a breaking-news item and show the ticker update; finally run `make test-security` against the live URL and show it passing.

---

## 18. README requirements and submission

README sections: overview and screenshots; features; architecture diagram; tech stack with exact versions; local setup (Node, pnpm, Docker, env, then `make seed-dummy` and `make dev`); the Makefile command list; **demo accounts** (live deployment only, with a note that they are throwaway); user and role model (two fixed roles, admin seeded only, admin creates editors); the editorial workflow explained with the state diagram; **a Security section** (threat model, the RBAC matrix, how to run `make test-security`, and the known limitations: HTTP-only, public media read, no WAF); project structure; key design decisions and tradeoffs (single status field over built-in drafts; Local API with explicit filters and DTOs plus default-deny REST; single language instead of Payload localization; fixed roles instead of a Roles screen; HTTP-only deployment); known limitations (substring search, no HTTPS, English only); how to deploy and update (`make deploy`).

**Submission package:** live URL, repository link, admin and editor demo credentials (sent separately from the repo), a short note on what was built and why, and optionally a 2 to 3 minute screen recording of the demo script.

---

## 19. Risks, gotchas and items to verify

**Gotchas**
1. **The REST API is public even though the site uses the Local API.** Never assume "internal only". Access rules are the boundary and must be tested over HTTP.
2. **Local API bypasses access control by default.** Always filter public queries explicitly and map to DTOs. (The seeds rely on this bypass on purpose, to create the admin account and set roles.)
3. **Field access is separate from collection access.** A user who can read a document may still get fields they should not see unless field-level read rules are set.
4. **Mass assignment:** protected fields and `role` rely on field-level access; verify with tests rather than assuming.
5. **First-user screen is open while the users table is empty.** Run the seed before exposing the app.
6. **`revalidatePath` outside a Next request context throws** (seed scripts, CLI). Use the safe wrapper and the `disableRevalidate` context flag.
7. **`NEXT_PUBLIC_*` values are inlined at build time.** Changing the public URL needs a rebuild.
8. **Postgres schema push is not for production.** Commit migrations; run `make migrate` on deploy.
9. **Builds can be memory-hungry.** Use `t3.medium` or larger, swap and the `NODE_OPTIONS` heap flag (already in `make build`).
10. **Public IP changes when an instance is stopped** unless an Elastic IP is attached.
11. **Two root layouts:** do not create `app/layout.tsx`; each route group owns its own `<html>`.
12. **Plain HTTP:** do not set Payload cookies to `secure: true`, or login will fail.
13. **Makefile:** recipe lines need real TABs; `.env` values must have no quotes or spaces; Windows needs WSL or Git Bash.
14. **Version drift:** Payload supports only certain Next.js version ranges; do not upgrade Next independently.
15. **Running security tests on the live site:** use temporary users created and deleted by the tests; never point the lockout test at the real demo accounts.

**Verify against the installed version's documentation**
- Script runner command for the seeds (`payload run ...`)
- `graphQL: { disable: true }` option; `maxDepth`
- `admin.hidden` as a function of the user on collections; `admin.components.beforeNavLinks`; the exact filter URL for the Review Queue link
- `admin.preview` signature and `admin.components.graphics` registration
- `maxLoginAttempts` / `lockTime` under `auth`; whether API keys are off by default
- Field-level `create` / `update` / `read` access signatures, and that `create: () => false` leaves the field default in place
- Upload size limit option location; MIME type restriction option
- Token header scheme for REST (`Authorization: JWT <token>`)
- `readVersions` access signature and the `version.*` query syntax
- Behaviour of `first-register` once a user exists
- Lexical React renderer import path
- Route segment options (`revalidate`, `dynamic`) in the installed Next version
- Query operators on the Postgres adapter (`contains`, `in`, `or`/`and` composition)

**Assumptions**
- The product name is **NewsPulse**.
- The category set (Market, Economy, Companies, IPO, Personal Finance, Gujarat, India, Global) reflects a typical Indian business news editorial structure.
