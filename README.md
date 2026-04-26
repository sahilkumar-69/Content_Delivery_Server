# Content Delivery Backend

Backend for the Content Broadcasting System technical assignment.

## What This Project Does

- Authenticates users with JWT and bcrypt-hashed passwords.
- Separates access into `principal` and `teacher` roles.
- Lets teachers upload content assets with scheduling metadata.
- Lets principals approve or reject pending uploads.
- Serves live, subject-based content rotation for public playback.
- Persists data in PostgreSQL and stores uploads locally in `uploads/`.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- JWT
- bcryptjs
- Multer
- dotenv

## Project Structure

- `src/server.js` - Express app entry point and route registration.
- `src/config/` - PostgreSQL pool and schema bootstrap.
- `src/controllers/` - request handlers.
- `src/routes/` - API route definitions.
- `src/middlewares/` - auth, role, upload, and error handling.
- `src/services/` - scheduling and rotation logic.
- `uploads/` - local uploaded files.

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 13+ running locally or remotely
- Docker Desktop if you want to use the included Compose file

## Setup

1. Install dependencies:
   npm install
2. Create a local environment file:
   copy `.env.example` to `.env` and update the database credentials if needed.
3. Start PostgreSQL:
   docker compose up -d
4. Start the backend:
   npm run dev

## Environment Variables

See `.env.example` for the full list.

- `PORT` - HTTP port for the API.
- `DB_HOST` - PostgreSQL host.
- `DB_PORT` - PostgreSQL port.
- `DB_USER` - PostgreSQL user.
- `DB_PASSWORD` - PostgreSQL password.
- `DB_NAME` - PostgreSQL database name.
- `DB_SSL` - enable SSL for hosted databases.
- `JWT_SECRET` - signing secret for access tokens.
- `JWT_EXPIRES_IN` - JWT lifetime.
- `MAX_UPLOAD_SIZE_MB` - upload size limit.

## Database Initialization

On startup, the app creates these tables if they do not exist:

- `users`
- `content`
- `content_slots`
- `content_schedule`

## API Documentation

Detailed route documentation lives in [API-ENDPOINTS.md](API-ENDPOINTS.md).

## Quick Endpoint Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/content/upload`
- `GET /api/content/my`
- `GET /api/content/live/:subject`
- `GET /api/approval/pending`
- `PATCH /api/approval/:id/review`
- `GET /health`

## Running with Docker PostgreSQL

If you use the included `docker-compose.yml`, PostgreSQL starts with:

- host: `localhost`
- port: `5432`
- database: `content_delivery_db`
- user: `postgres`
- password: `postgres`

## Notes

- Teacher uploads begin in `pending` state.
- Only principals can approve or reject content.
- Rejection requires a `rejection_reason`.
- Live content only returns approved items within the active schedule window.
- If no content is available for a subject, the API returns a friendly empty response instead of an error.

## Useful Scripts

- `npm run dev` - start in development mode.
- `npm start` - start the production server.

## Assumptions

- Local disk storage is used for uploads instead of S3.
- PostgreSQL schema is bootstrapped automatically at runtime.
- Live rotation is implemented with duration-based deterministic selection per subject.
