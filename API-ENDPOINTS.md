# API Endpoints

This file documents every endpoint in the Content Delivery Backend with request details, access rules, and expected responses.

## Base URL

- Local: `http://localhost:3000`

## Authentication

Most protected endpoints require a bearer token:

```http
Authorization: Bearer <jwt_token>
```

## Roles

- `teacher` - uploads content and views own upload status.
- `principal` - reviews pending content and approves/rejects it.

## Health

### GET /health

Public endpoint used to verify the server and database status.

Request:

- No body

Response example:

```json
{
  "status": "ok",
  "database": "connected",
  "message": "Content delivery backend is running",
  "timestamp": "2026-04-25T12:00:00.000Z"
}
```

## Auth Endpoints

### POST /api/auth/register

Creates a new user account.

Access:

- Public

Body:

```json
{
  "name": "John Teacher",
  "email": "teacher@example.com",
  "password": "password123",
  "role": "teacher"
}
```

Rules:

- `name`, `email`, `password`, and `role` are required.
- `role` must be either `teacher` or `principal`.
- Email must be unique.

Success response:

```json
{
  "user": {
    "id": 1,
    "name": "John Teacher",
    "email": "teacher@example.com",
    "role": "teacher",
    "created_at": "2026-04-25T12:00:00.000Z"
  }
}
```

### POST /api/auth/login

Logs in a user and returns a JWT.

Access:

- Public

Body:

```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Teacher",
    "email": "teacher@example.com",
    "role": "teacher"
  }
}
```

## Teacher Endpoints

### POST /api/content/upload

Uploads a new content item.

Access:

- Protected
- Role: `teacher`

Content type:

- `multipart/form-data`

Form fields:

- `file` - required image file (`jpg`, `png`, `gif`)
- `title` - required
- `subject` - required
- `description` - optional
- `start_time` - optional ISO datetime
- `end_time` - optional ISO datetime
- `rotation_duration` - optional number of seconds

Example form payload:

- title: `Spring Welcome`
- subject: `science`
- description: `Morning class welcome slide`
- start_time: `2026-04-25T08:00:00.000Z`
- end_time: `2026-04-25T10:00:00.000Z`
- rotation_duration: `15`
- file: uploaded image

Rules:

- Uploads start with status `pending`.
- File size is limited by `MAX_UPLOAD_SIZE_MB`.
- Only jpg/png/gif are allowed.

Success response:

```json
{
  "message": "Content uploaded and pending approval",
  "content": {
    "id": 10,
    "title": "Spring Welcome",
    "subject": "science",
    "status": "pending"
  }
}
```

### GET /api/content/my

Returns the logged-in teacher's uploads and their status.

Access:

- Protected
- Role: `teacher`

Response example:

```json
{
  "content": [
    {
      "id": 10,
      "title": "Spring Welcome",
      "subject": "science",
      "status": "pending",
      "rejection_reason": null,
      "start_time": null,
      "end_time": null,
      "created_at": "2026-04-25T12:00:00.000Z"
    }
  ]
}
```

## Principal Endpoints

### GET /api/approval/:status

Lists all content with status.

'all' for all content regardless of status

Access:

- Protected
- Role: `principal`

Response example:

```json
{
  "pending": [
    {
      "id": 10,
      "title": "Spring Welcome",
      "subject": "science",
      "file_path": "uploads/12345.png"
    }
  ]
}
```

### PATCH /api/approval/:id/review

Approves or rejects a pending content item.

Access:

- Protected
- Role: `principal`

Path params:

- `id` - content ID

Body:

```json
{
  "action": "approve"
}
```

Or:

```json
{
  "action": "reject",
  "rejection_reason": "Image resolution is too low"
}
```

Rules:

- `action` must be `approve` or `reject`.
- `rejection_reason` is required when rejecting.
- Only `pending` content can be reviewed.

Success response:

```json
{
  "message": "Content approved",
  "content": {
    "id": 10,
    "status": "approved",
    "rejection_reason": null,
    "approved_by": 2,
    "approved_at": "2026-04-25T12:05:00.000Z"
  }
}
```

## Public Content Endpoint

### GET /api/content/live/:teacherId

Returns the currently active approved content for a teacher.

Access:

- Public

Path params:

- `teacher` - teacher id, case-sensitive

Examples:

- `/api/content/live/1`

Behavior:

- Returns only approved items.
- Filters by schedule window:
  - `start_time` is null or already started
  - `end_time` is null or not expired
- Rotates among scheduled items using `duration_seconds`.
- If no valid content exists, returns a friendly empty response.

Success response:

```json
{
  "content": {
    "id": 10,
    "title": "Spring Welcome",
    "description": "Morning class welcome slide",
    "subject": "science",
    "file_url": "/uploads/12345.png",
    "file_type": "image/png",
    "start_time": "2026-04-25T08:00:00.000Z",
    "end_time": "2026-04-25T10:00:00.000Z",
    "duration_seconds": 15,
    "rotation_order": 1
  }
}
```

Empty response example:

```json
{
  "message": "No content available",
  "content": []
}
```

## Route Reference

- `src/routes/authRoutes.js` - authentication endpoints.
- `src/routes/contentRoutes.js` - upload, teacher content list, live content.
- `src/routes/approvalRoutes.js` - principal review endpoints.

## Implementation Notes

- Protected routes require a valid JWT bearer token.
- Uploads are stored on disk in `uploads/`.
- Database tables are created automatically on startup.
- Live rotation is computed in `src/services/rotationService.js`.
