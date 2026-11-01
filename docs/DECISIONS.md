# Decisions and Deviations

## npm instead of pnpm

**Spec says:** pnpm (preferred by Payload).
**Actual:** npm — `create-payload-app` defaulted to npm in the interactive setup and a `package-lock.json` was generated. Switching package managers mid-setup adds no value for a demo project. All Makefile targets use `npm` accordingly.

## Node.js version

**Spec says:** Node 22 LTS.
**Actual:** Node v22.15.0 — Payload 3.92.1 requires `^22.23.4 || >=24.22.1`. The app runs fine on v22.15.0 with npm warnings suppressed via `--no-deprecation`. For production EC2 install the latest Node 22 LTS via NodeSource which will satisfy the constraint.

## Single-status field instead of Payload built-in drafts

Payload's `versions.drafts` models a live document with a pending draft. This project needs a multi-actor review lifecycle with four states (`draft`, `in_review`, `published`, `rejected`). A single `workflowStatus` field is the source of truth. `versions` (without drafts) is still enabled for history and diff view.

## English only — no Payload localization

Payload localization duplicates every field per locale. There is no multi-language requirement, so localization is not configured. UI strings live in `src/config/copy.ts`.

## Fixed roles — no Roles collection

Roles are two fixed values (`admin`, `editor`) defined as a select field on Users. There is no Roles screen or role management UI. Admin accounts exist only through the seed script.

## Media anonymous read exception

Anonymous REST access is denied by default except for `GET /api/media/file/:name` so browsers can load article images without a session. The trade-off is that the image list is publicly enumerable — acceptable because images are non-sensitive demo content.

## HTTP-only deployment

No domain means no HTTPS. Payload cookies are kept with `secure: false`. Throwaway passwords only — never reuse real credentials.
