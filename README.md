# Ogbemi Heymann Website

Full-stack website and CMS for Ogbemi Heymann.

## Stack

- React 19, Vite, Tailwind CSS v4
- Express API
- MySQL persistence
- Airtable API integration for artwork records
- Nodemailer SMTP notifications

## Local Setup

```bash
cd ogbemi_heymann
npm install
cp .env.example .env
npm run api
npm run dev
```

The public site runs on `http://localhost:5173`. If that port is busy, Vite may use the next available port such as `http://localhost:5174`.
The API runs on `http://localhost:4100`.
The CMS is available at `/admin` on the Vite URL.

Default development CMS credentials come from `.env.example`:

- Email: `admin@example.com`
- Password: `change-me-before-launch`

Change these before deployment.

## Database

Create the MySQL schema:

```bash
mysql -u root -p < database/schema.sql
```

Then update `.env` with the database credentials.

If the Vite port changes while the API is already running, restart `npm run api` so it reloads `.env`.

## Airtable

Airtable credentials can be configured in either place:

- `.env`: `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`
- CMS: `/admin/settings`

The API maps common Airtable fields such as `Title`, `Year`, `Dimensions`, `Material`,
`Series`, `Available`, and `Image`. This can be tightened once the final Airtable schema is set.

## Email

Contact forms and mailing list signups are stored in MySQL. If SMTP settings are configured,
the API also sends a notification email to `ARTIST_EMAIL`.

## Content Model

MySQL stores:

- Exhibitions
- Exhibition works
- Exhibition/downloadable files
- Blog posts as block JSON
- Contact submissions
- Mailing list subscribers
- Site settings
- Airtable connection metadata

Artwork grids on Available Works and Archive are read from Airtable through the server API.
Until Airtable is configured, placeholder records and local placeholder artwork are used.
