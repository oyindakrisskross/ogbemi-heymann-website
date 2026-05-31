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

## Docker Deployment

The production Docker setup builds the React app and serves it from the Express server. The API,
CMS, uploaded files, and public frontend all run on port `4100` inside the app container.

Create a production env file:

```bash
cp .env.production.example .env
```

Update `.env` before deployment:

- `CLIENT_ORIGIN=https://ogbemiheymann.dududev.cloud`
- `MYSQL_APP_USER`, `MYSQL_PASSWORD`, and `MYSQL_ROOT_PASSWORD`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET`
- SMTP and Airtable settings when ready

Run locally or on the VPS:

```bash
docker compose up -d --build
docker compose logs -f app
```

The compose file binds the app to `127.0.0.1:4100`, so it is intended to sit behind Nginx.
An Nginx server block is included at:

```bash
deploy/nginx/ogbemiheymann.dududev.cloud.conf
```

On the VPS, copy that file into Nginx and enable HTTPS:

```bash
sudo cp deploy/nginx/ogbemiheymann.dududev.cloud.conf /etc/nginx/sites-available/ogbemiheymann.dududev.cloud
sudo ln -s /etc/nginx/sites-available/ogbemiheymann.dududev.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d ogbemiheymann.dududev.cloud
```

The MySQL schema is mounted into the MySQL container and runs automatically the first time the
`mysql_data` Docker volume is created.

## GitHub Actions Deployment

Pushes to `main` build the Docker image, publish it to GitHub Container Registry, then SSH into the
VPS and restart Docker Compose with the latest image.

Add these GitHub repository secrets:

- `VPS_HOST`: VPS IP address or hostname
- `VPS_USER`: SSH user on the VPS
- `VPS_PORT`: SSH port, usually `22`
- `VPS_SSH_KEY`: private SSH key allowed to log into the VPS
- `DEPLOY_PATH`: absolute path to this project on the VPS, for example `/var/www/ogbemi-heymann`

One-time VPS setup:

```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin nginx certbot python3-certbot-nginx
sudo usermod -aG docker $USER
```

Log out and back in after adding the user to the `docker` group..

Clone the repository on the VPS and create `.env`:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/oyindakrisskross/ogbemi-heymann-website.git ogbemi-heymann
cd ogbemi-heymann
cp .env.production.example .env
nano .env
```

Then push to `main` from your local machine. The workflow will pull the newest container image and
run:

```bash
docker compose pull app
docker compose up -d --no-build --remove-orphans
```
