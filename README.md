# NewsPulse

> Business news, clearly told.

A full-stack editorial CMS and public news site built with [Payload 3](https://payloadcms.com) and [Next.js 16](https://nextjs.org). Designed for a small editorial team — admins manage the site and review content, editors write and submit articles.

---

## Overview

NewsPulse is a self-hosted news platform with two parts running from a single Next.js app:

- **Public site** — homepage, category pages, article pages, search, and a breaking news ticker
- **Admin CMS** — Payload admin panel for managing articles, categories, media, users, and breaking news

---

## Features

### Public Site
- Homepage with hero article, top stories, latest news, and per-category sections
- Category pages with pagination
- Full article pages with rich text body and related articles sidebar
- Full-text search across title, summary, and body
- Breaking news ticker with expiry support
- Fully server-rendered with Next.js ISR (revalidation on publish/update)
- Responsive layout, accessible markup

### Admin CMS
- Custom branding — logo and favicon in the admin panel
- Review queue shortcut link in the sidebar (admin only)
- Article preview from the admin panel (authenticated, all workflow statuses)

### Editorial Workflow
- Four workflow statuses: `Draft → In Review → Published / Rejected`
- Role-based transitions — editors can only submit; admins publish or reject
- Rejection requires a reason of at least 10 characters
- Auto-set fields: `publishedAt`, `submittedAt`, `reviewedBy`, `reviewedAt`
- Full review log stored per article (who did what and when)
- Article versioning — up to 25 versions per document

### Collections & Globals
| Name | Description |
|---|---|
| **Articles** | Main content collection with workflow, versioning, and full-text search |
| **Categories** | Ordered categories with slug, used for navigation and filtering |
| **Media** | Image uploads with thumbnail / card / hero size variants. Protected delete — cannot remove an image used in an article |
| **Users** | Auth-enabled. Two roles: `admin` and `editor` |
| **Breaking News** | Global — up to 5 ticker items with optional article link and expiry date |

### Access Control
- Editors can only read/edit their own articles
- Admins have full access
- Media is publicly readable (required for image serving)
- Field-level access on sensitive fields (`author`, `publishedAt`, `reviewedBy`, etc.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| CMS | Payload 3 |
| Database | PostgreSQL (via `@payloadcms/db-postgres`) |
| Rich Text | Lexical editor |
| Image processing | Sharp |
| Language | TypeScript |
| Package manager | npm |

---

## Project Structure

```
src/
├── app/
│   ├── (payload)/          # Payload admin routes
│   └── (site)/             # Public site routes
│       ├── page.tsx         # Homepage
│       ├── article/[slug]/  # Article page
│       ├── category/[slug]/ # Category page
│       ├── search/          # Search page
│       └── preview/[id]/    # Authenticated preview
├── collections/
│   ├── Articles/            # Articles collection + hooks + access
│   ├── Categories.ts
│   ├── Media.ts
│   └── Users.ts
├── globals/
│   └── BreakingNews.ts
├── components/
│   ├── admin/               # Admin UI components (Logo, Icon, ReviewQueueLink)
│   └── site/                # Public site components
├── lib/                     # Queries, workflow logic, utilities
├── config/                  # Brand and copy strings
├── seed/                    # Seed scripts
└── migrations/              # Drizzle migrations
```

---

## Local Setup

### Prerequisites
- Node.js `^22.23.4` or `>=24.22.1`
- npm `^10` or later
- PostgreSQL database

### 1. Clone and install

```bash
git clone <repo-url>
cd NewsPulse
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Your PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/newspulse

# Generate a long random string (e.g. openssl rand -hex 32)
PAYLOAD_SECRET=your-secret-here

# Public URL of the app
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Admin account created by the seed script
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=Admin@123

# Editor accounts created by the dummy seed
SEED_EDITOR1_EMAIL=aarav@gmail.com
SEED_EDITOR1_PASSWORD=change-me
SEED_EDITOR2_EMAIL=nisha@gmail.com
SEED_EDITOR2_PASSWORD=change-me
```

### 3. Run migrations

```bash
npm run payload migrate
```

### 4. Seed the database

Seed essential data (admin user + 8 categories + breaking news global):

```bash
npm run seed
```

Optionally seed dummy content (2 editors + 20 articles + placeholder images):

```bash
npm run seed:dummy
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin](http://localhost:3000/admin) for the CMS.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run seed` | Seed admin user, categories, and breaking news global |
| `npm run seed:dummy` | Seed editors, 20 articles, and placeholder images |
| `npm run payload migrate` | Run pending database migrations |
| `npm run payload migrate:create` | Generate a new migration from schema changes |
| `npm run generate:types` | Regenerate `payload-types.ts` |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type check |
| `npm run test` | Run unit tests |
| `npm run test:security` | Run security/access control tests |

---

## Docker (Optional)

To run PostgreSQL locally via Docker instead of a local install:

1. Set `DATABASE_URL=postgres://app:change-me@127.0.0.1:5432/newspulse` in `.env`
2. Update `docker-compose.yml` to use the same DB name
3. Run:

```bash
docker-compose up -d
```

Then continue from [step 3](#3-run-migrations) above.

---

## Default Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@gmail.com` | `Admin@123` |
| Editor 1 | `aarav@gmail.com` | *(set in .env)* |
| Editor 2 | `nisha@gmail.com` | *(set in .env)* |

---

## Categories (pre-seeded)

Market · Economy · Companies · IPO · Personal Finance · Gujarat · India · Global

---

## Questions

Open a [GitHub discussion](https://github.com/payloadcms/payload/discussions) or reach out on the [Payload Discord](https://discord.com/invite/payload).
