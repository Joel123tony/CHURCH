# Church Platform

Premium church platform scaffold with three deployable parts:

- `apps/web`: public church website
- `apps/admin`: private admin dashboard
- `server`: Node.js and Express API

## Stack

- React, Vite, Tailwind CSS, Framer Motion, React Router, React Query
- Node.js, Express.js, MongoDB Atlas, Cloudinary
- JWT auth with refresh tokens
- YouTube Data API integration for live detection and sermon sync

## Architecture

```text
church-platform/
  apps/
    web/
    admin/
  server/
  package.json
  tsconfig.base.json
```

## Features covered

- Responsive public church website
- Separate admin dashboard
- Editable navbar, footer, theme, and homepage layout
- Page builder and section builder data model
- Media uploads through Cloudinary
- Events, pastors, sermons, prayer requests, analytics
- YouTube live stream detection and sermon sync hooks
- JWT-protected admin API

## Running locally

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies for each workspace.
3. Run the API and the two frontends separately.
4. Seed the database if you want a default admin account.

Example commands:

```bash
npm install
npm run dev:server
npm run dev:web
npm run dev:admin
npm run seed --workspace server
```

The seed script creates a default site settings document and, if `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set, an initial admin user.

If `MONGODB_URI` is not set, the backend automatically falls back to mock mode so the full stack still runs locally without MongoDB.

For Atlas-backed preview mode, put your connection string in the repo-root `.env`, then run:

```bash
npm run seed --workspace server
```

The preview seed populates the same public pages, sections, pastors, events, sermons, media, and admin account used by the mock demo.

## Deployment

- Deploy `apps/web` to the public domain, such as `church.com`
- Deploy `apps/admin` to a separate domain, such as `admin.church.com`
- Deploy `server` to your API host of choice, such as Render or a container platform

Make sure the admin app is not publicly linked from the public site.
