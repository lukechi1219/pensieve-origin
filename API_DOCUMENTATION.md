# Pensieve API Documentation

**Version**: 0.1.0
**Base URL**: `http://localhost:3000`
**Last Updated**: 2025-11-25

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Notes API](#notes-api)
5. [Journals API](#journals-api)
6. [Projects API](#projects-api)
7. [Response Format](#response-format)
8. [Examples](#examples)

---

## Getting Started

### Starting the Server

```bash
cd _system
npm run serve
```

The server will start on `http://localhost:3000`.

### Configuration

Configure the server in `.env`:

```bash
WEB_PORT=3000
WEB_HOST=localhost
VAULT_PATH=./vault
```

---

## Authentication

**Current Version**: No authentication required.

Future versions may include:
- API key authentication
- JWT tokens
- OAuth integration

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

---

## Notes API

### List Notes

**Endpoint**: `GET /api/notes`

**Query Parameters**:
- `folder` (optional): Filter by PARA folder (`inbox`, `projects`, `areas`, `resources`, `archive`)
- `tag` (optional): Filter by tag
- `code` (optional): Filter by CODE criteria (`inspiring`, `useful`, `personal`, `surprising`)

**Response**:
```json
{
  "count": 1,
  "notes": [
    {
      "id": "20251125170745",
      "title": "Note Title",
      "created": "2025-11-25 17:07:45",
      "modified": "2025-11-25 17:07:45",
      "tags": ["cli", "development"],
      "paraFolder": "inbox",
      "distillationLevel": 0,
      "isInspiring": false,
      "isUseful": true,
      "isPersonal": false,
      "isSurprising": false,
      "status": "active"
    }
  ]
}
```

**Examples**:
```bash
# Get all notes
curl http://localhost:3000/api/notes

# Get notes in inbox
curl "http://localhost:3000/api/notes?folder=inbox"

# Get notes with tag
curl "http://localhost:3000/api/notes?tag=development"

# Get useful notes
curl "http://localhost:3000/api/notes?code=useful"
```

---

### Get Note by ID

**Endpoint**: `GET /api/notes/:id`

**Parameters**:
- `id`: Note ID (timestamp format: YYYYMMDDHHMMSS)

**Response**:
```json
{
  "id": "20251125170745",
  "title": "Note Title",
  "content": "Note content here...",
  "created": "2025-11-25 17:07:45",
  "modified": "2025-11-25 17:07:45",
  "tags": ["cli", "development"],
  "paraFolder": "inbox",
  "paraPath": "0-inbox",
  "distillationLevel": 0,
  "distillationHistory": [...],
  "isInspiring": false,
  "isUseful": true,
  "isPersonal": false,
  "isSurprising": false,
  "status": "active",
  "filePath": "/path/to/note.md"
}
```

**Example**:
```bash
curl http://localhost:3000/api/notes/20251125170745
```

---

### Create Note

**Endpoint**: `POST /api/notes`

**Request Body**:
```json
{
  "title": "New Note Title",
  "content": "Note content here...",
  "tags": ["tag1", "tag2"],
  "isInspiring": false,
  "isUseful": true,
  "isPersonal": false,
  "isSurprising": false
}
```

**Required**: `title`, `content`

**Response**:
```json
{
  "message": "Note created successfully",
  "note": {
    "id": "20251125183052",
    "title": "New Note Title",
    "created": "2025-11-25 18:30:52",
    "filePath": "/vault/0-inbox/20251125183052-new-note-title.md"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Note",
    "content": "Created via API",
    "tags": ["test", "api"],
    "isUseful": true
  }'
```

---

### Update Note

**Endpoint**: `PUT /api/notes/:id`

**Parameters**:
- `id`: Note ID

**Request Body**:
```json
{
  "content": "Updated content...",
  "tags": ["updated", "tags"]
}
```

**Response**:
```json
{
  "message": "Note updated successfully",
  "note": {
    "id": "20251125183052",
    "title": "Note Title",
    "modified": "2025-11-25 19:00:00"
  }
}
```

**Example**:
```bash
curl -X PUT http://localhost:3000/api/notes/20251125183052 \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated via API"}'
```

---

### Delete Note

**Endpoint**: `DELETE /api/notes/:id`

**Parameters**:
- `id`: Note ID

**Response**:
```json
{
  "message": "Note deleted successfully",
  "id": "20251125183052"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/notes/20251125183052
```

---

### Move Note

**Endpoint**: `POST /api/notes/:id/move`

**Parameters**:
- `id`: Note ID

**Request Body**:
```json
{
  "folder": "projects"
}
```

**Valid Folders**: `inbox`, `projects`, `areas`, `resources`, `archive`

**Response**:
```json
{
  "message": "Note moved successfully",
  "from": "inbox",
  "to": "projects"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/notes/20251125183052/move \
  -H "Content-Type: application/json" \
  -d '{"folder": "projects"}'
```

---

## Journals API

### List Journals

**Endpoint**: `GET /api/journals`

**Query Parameters**:
- `month` (optional): Filter by month (format: `YYYY-MM`)
- `start` (optional): Start date (format: `YYYY-MM-DD`)
- `end` (optional): End date (format: `YYYY-MM-DD`)

**Default**: Current month if no parameters provided

**Response**:
```json
{
  "count": 1,
  "journals": [
    {
      "id": "20251125",
      "title": "Journal Entry - November 25, 2025",
      "date": "2025-11-25",
      "mood": "productive",
      "energyLevel": 8,
      "habitsCompleted": ["meditation", "exercise"],
      "tags": ["journal", "daily"]
    }
  ]
}
```

**Examples**:
```bash
# Get current month
curl http://localhost:3000/api/journals

# Get specific month
curl "http://localhost:3000/api/journals?month=2025-11"

# Get date range
curl "http://localhost:3000/api/journals?start=2025-11-01&end=2025-11-30"
```

---

### Get Today's Journal

**Endpoint**: `GET /api/journals/today`

**Response**:
```json
{
  "id": "20251125",
  "title": "Journal Entry - November 25, 2025",
  "date": "2025-11-25",
  "content": "Journal content...",
  "mood": "productive",
  "energyLevel": 8,
  "habitsCompleted": ["meditation", "exercise"],
  "gratitude": ["Good health", "Supportive friends"],
  "tags": ["journal", "daily"],
  "filePath": "/vault/journal/2025/11/20251125.md"
}
```

**Example**:
```bash
curl http://localhost:3000/api/journals/today
```

---

### Get Yesterday's Journal

**Endpoint**: `GET /api/journals/yesterday`

**Response**: Same format as today's journal

**Example**:
```bash
curl http://localhost:3000/api/journals/yesterday
```

---

### Get Journal Streak

**Endpoint**: `GET /api/journals/streak`

**Response**:
```json
{
  "current": 7,
  "message": "7 days streak!"
}
```

**Example**:
```bash
curl http://localhost:3000/api/journals/streak
```

---

### Get Journal Statistics

**Endpoint**: `GET /api/journals/stats`

**Response**:
```json
{
  "totalEntries": 45,
  "currentStreak": 7,
  "longestStreak": 14,
  "averageEnergyLevel": 7.2,
  "mostCommonMood": "productive",
  "totalHabitsCompleted": 156
}
```

**Example**:
```bash
curl http://localhost:3000/api/journals/stats
```

---

### Get Journal by Date

**Endpoint**: `GET /api/journals/:date`

**Parameters**:
- `date`: Date in `YYYY-MM-DD` format

**Response**: Same format as today's journal

**Example**:
```bash
curl http://localhost:3000/api/journals/2025-11-20
```

---

### Update Journal

**Endpoint**: `PUT /api/journals/:date`

**Parameters**:
- `date`: Date in `YYYY-MM-DD` format

**Request Body**:
```json
{
  "content": "Updated journal content...",
  "mood": "focused",
  "energyLevel": 9,
  "habitsCompleted": ["meditation", "exercise", "reading"],
  "gratitude": ["Item 1", "Item 2"]
}
```

**Response**:
```json
{
  "message": "Journal updated successfully",
  "journal": {
    "id": "20251125",
    "date": "2025-11-25",
    "mood": "focused",
    "energyLevel": 9
  }
}
```

**Example**:
```bash
curl -X PUT http://localhost:3000/api/journals/2025-11-25 \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "focused",
    "energyLevel": 9,
    "habitsCompleted": ["meditation", "exercise"]
  }'
```

---

## Projects API

### List Projects

**Endpoint**: `GET /api/projects`

**Response**:
```json
{
  "count": 1,
  "projects": [
    {
      "name": "second-brain",
      "description": "Build a comprehensive second brain system",
      "status": "active",
      "progress": 0,
      "deadline": "2026-01-25",
      "path": "/vault/1-projects/project-second-brain"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3000/api/projects
```

---

### Get Project by Name

**Endpoint**: `GET /api/projects/:name`

**Parameters**:
- `name`: Project name

**Response**:
```json
{
  "name": "second-brain",
  "status": "active",
  "created": "2025-11-25",
  "deadline": "2026-01-25",
  "completionDate": null,
  "description": "Build a comprehensive second brain system",
  "goal": "",
  "successCriteria": [],
  "relatedAreas": [],
  "tags": [],
  "notes": "",
  "progress": {
    "percentComplete": 0,
    "lastUpdated": "2025-11-25",
    "milestones": []
  },
  "archive": {
    "archived": false,
    "archive_date": null,
    "archive_reason": "",
    "lessons_learned": ""
  }
}
```

**Example**:
```bash
curl http://localhost:3000/api/projects/second-brain
```

---

### Create Project

**Endpoint**: `POST /api/projects`

**Request Body**:
```json
{
  "name": "my-project",
  "description": "Project description",
  "deadlineMonths": 3
}
```

**Required**: `name`

**Response**:
```json
{
  "message": "Project created successfully",
  "project": {
    "name": "my-project",
    "status": "active",
    "deadline": "2026-02-25",
    "description": "Project description"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "description": "Build mobile app",
    "deadlineMonths": 6
  }'
```

---

### Update Project

**Endpoint**: `PUT /api/projects/:name`

**Parameters**:
- `name`: Project name

**Request Body**:
```json
{
  "description": "Updated description",
  "goal": "Project goal",
  "successCriteria": ["Criterion 1", "Criterion 2"],
  "relatedAreas": ["career", "learning"],
  "tags": ["software", "development"],
  "notes": "Additional notes..."
}
```

**Response**:
```json
{
  "message": "Project updated successfully",
  "project": {
    "name": "my-project",
    "description": "Updated description"
  }
}
```

**Example**:
```bash
curl -X PUT http://localhost:3000/api/projects/my-project \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated via API"}'
```

---

### Update Project Progress

**Endpoint**: `POST /api/projects/:name/progress`

**Parameters**:
- `name`: Project name

**Request Body**:
```json
{
  "progress": 50
}
```

**Valid Range**: 0-100

**Response**:
```json
{
  "message": "Progress updated successfully",
  "progress": 50
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/projects/my-project/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 50}'
```

---

### Add Milestone

**Endpoint**: `POST /api/projects/:name/milestones`

**Parameters**:
- `name`: Project name

**Request Body**:
```json
{
  "milestoneName": "MVP Launch",
  "dueDate": "2025-12-31"
}
```

**Required**: `milestoneName`

**Response**:
```json
{
  "message": "Milestone added successfully",
  "milestone": {
    "name": "MVP Launch",
    "dueDate": "2025-12-31"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/projects/my-project/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneName": "MVP Launch",
    "dueDate": "2025-12-31"
  }'
```

---

### Complete Project

**Endpoint**: `POST /api/projects/:name/complete`

**Parameters**:
- `name`: Project name

**Request Body**:
```json
{
  "outcome": "Successfully launched product"
}
```

**Response**:
```json
{
  "message": "Project completed successfully",
  "name": "my-project"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/projects/my-project/complete \
  -H "Content-Type: application/json" \
  -d '{"outcome": "Successful launch"}'
```

---

### Archive Project

**Endpoint**: `POST /api/projects/:name/archive`

**Parameters**:
- `name`: Project name

**Request Body**:
```json
{
  "reason": "completed",
  "lessonsLearned": "Key lessons from the project..."
}
```

**Valid Reasons**: `completed`, `cancelled`, `merged`

**Response**:
```json
{
  "message": "Project archived successfully",
  "name": "my-project",
  "reason": "completed"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/projects/my-project/archive \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "completed",
    "lessonsLearned": "Great teamwork"
  }'
```

---

## Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### List Response

```json
{
  "count": 10,
  "items": [...]
}
```

### Error Response

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

---

## Examples

### Complete Workflow: Create and Manage a Note

```bash
# 1. Create a note
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn GraphQL",
    "content": "GraphQL is a query language for APIs",
    "tags": ["learning", "graphql"],
    "isUseful": true
  }'

# Response: {"message":"Note created successfully","note":{"id":"20251125190000",...}}

# 2. Get the note
curl http://localhost:3000/api/notes/20251125190000

# 3. Update the note
curl -X PUT http://localhost:3000/api/notes/20251125190000 \
  -H "Content-Type: application/json" \
  -d '{"content": "GraphQL provides a complete description of data in your API"}'

# 4. Move to projects folder
curl -X POST http://localhost:3000/api/notes/20251125190000/move \
  -H "Content-Type: application/json" \
  -d '{"folder": "projects"}'

# 5. List all notes in projects
curl "http://localhost:3000/api/notes?folder=projects"
```

### Complete Workflow: Journal Entry

```bash
# 1. Get today's journal
curl http://localhost:3000/api/journals/today

# 2. Update today's journal
curl -X PUT http://localhost:3000/api/journals/2025-11-25 \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "productive",
    "energyLevel": 8,
    "habitsCompleted": ["meditation", "exercise", "reading"],
    "gratitude": ["Good health", "Meaningful work"]
  }'

# 3. Check streak
curl http://localhost:3000/api/journals/streak

# 4. Get statistics
curl http://localhost:3000/api/journals/stats
```

### Complete Workflow: Project Management

```bash
# 1. Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mobile-app",
    "description": "Build iOS and Android app",
    "deadlineMonths": 6
  }'

# 2. Add milestone
curl -X POST http://localhost:3000/api/projects/mobile-app/milestones \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneName": "Design Complete",
    "dueDate": "2025-12-31"
  }'

# 3. Update progress
curl -X POST http://localhost:3000/api/projects/mobile-app/progress \
  -H "Content-Type: application/json" \
  -d '{"progress": 25}'

# 4. List all projects
curl http://localhost:3000/api/projects

# 5. Complete project
curl -X POST http://localhost:3000/api/projects/mobile-app/complete \
  -H "Content-Type: application/json" \
  -d '{"outcome": "Successfully launched on both platforms"}'
```

---

## Rate Limiting

**Current Version**: No rate limiting

Future versions may include:
- Request limits per IP
- Request limits per API key
- Rate limit headers in responses

---

## Versioning

**Current Version**: v1 (implicit)

Future versions will use URL versioning:
- `/api/v1/notes`
- `/api/v2/notes`

---

## WebSocket Support

**Coming Soon**: Real-time updates for:
- Note changes
- Journal updates
- Project progress
- Sync notifications

---

## Support

For issues or questions:
- GitHub: [pensieve-origin/issues](https://github.com/anthropics/pensieve-origin/issues)
- Documentation: CLI_USER_MANUAL.md
- Implementation: IMPLEMENTATION_PLAN.md

---

*Last updated: 2025-11-25*
