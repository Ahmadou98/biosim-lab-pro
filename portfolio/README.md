# Ahmadou Lamine Diouf — Personal Portfolio

A bilingual (EN/FR) executive portfolio and advocacy site connected to a private Supabase CMS.

## Public site and admin
- Website: https://ahmadou-lamine-diouf.pages.dev
- Owner administration: https://ahmadou-lamine-diouf.pages.dev/admin.html
- Setup guide: [ADMIN-SETUP.md](./ADMIN-SETUP.md)
- Supabase schema: [supabase/schema.sql](./supabase/schema.sql)

## Architecture
- Static HTML5, Tailwind CSS CDN and vanilla JavaScript.
- Cloudflare Pages deployment from GitHub branch `personal-portfolio`, root directory `portfolio/`.
- Supabase project `ALD-Portfolio` (`kjrgvpxmqrbhbejqedcm`), region `eu-west-3`.
- Supabase Auth (email/password), Postgres RLS, and public-read image bucket `portfolio-media`.
- Tables: `events`, `experiences`, `diplomas`, `initiatives`, `profile`.

## Digital business card
- Public contact card: https://ahmadou-lamine-diouf.pages.dev/carte.html
- QR code opens this interactive card; phone, email, WhatsApp and LinkedIn are clickable on the page.
- Download a shareable PNG, use native mobile sharing, or save a vCard.
- Profile details and portrait are loaded from the Supabase `profile` row so card updates do not require source edits.

## Content management
Use `admin.html` to add, edit, publish/unpublish or remove events, experiences, diplomas/certifications, initiatives and the main profile. Images can be selected from a phone or computer, are resized/compressed in the browser, then uploaded to Supabase Storage. Existing images can be removed from a record's editor.

Public content reads are restricted to published records. Database writes and Storage uploads/updates/deletions are restricted by RLS to the owner email `ahmadoulaminediouf39@gmail.com`. Only the Supabase publishable key appears in browser code; no service-role or secret key is present.

See [ADMIN-SETUP.md](./ADMIN-SETUP.md) before first sign-in, especially the Supabase Auth Site URL and redirect URL settings.

## Public multi-user BioPage platform
- Platform home: [platform.html](./platform.html)
- Public portfolio creation: [create.html](./create.html)
- Private user studio: [studio.html](./studio.html)
- Dynamic public portfolio and digital card: [u.html](./u.html?id=amara-diallo)
- Isolated schema migration: [supabase/public-platform-schema.sql](./supabase/public-platform-schema.sql)
- Edge Function: [supabase/functions/public-platform/index.ts](./supabase/functions/public-platform/index.ts)

New profiles receive a one-time 256-bit recovery code after creation. Users must download or securely save it. It can recover a forgotten identifier and reset the 6-digit PIN; a recovery action rotates the code and invalidates existing sessions. Existing users who created accounts before recovery was added can generate their first recovery code from the Profile section of their private studio. The recovery code is not sent by email; it is displayed once and stored server-side only as a SHA-256 digest.
