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

## Content management
Use `admin.html` to add, edit, publish/unpublish or remove events, experiences, diplomas/certifications, initiatives and the main profile. Images can be selected from a phone or computer, are resized/compressed in the browser, then uploaded to Supabase Storage. Existing images can be removed from a record's editor.

Public content reads are restricted to published records. Database writes and Storage uploads/updates/deletions are restricted by RLS to the owner email `ahmadoulaminediouf39@gmail.com`. Only the Supabase publishable key appears in browser code; no service-role or secret key is present.

See [ADMIN-SETUP.md](./ADMIN-SETUP.md) before first sign-in, especially the Supabase Auth Site URL and redirect URL settings.
