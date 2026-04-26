# CoWrite

**Final Year Project at ATU Galway — B.Sc. (Hons) Software Development**

CoWrite is a real-time collaborative document editing platform that enables teams to work together seamlessly. Users can create, edit, and share documents simultaneously through invite links, email invitations, or QR codes, with an integrated discussion box for communication without leaving the editor.

**Live:** [https://cowrite.up.railway.app](https://cowrite.up.railway.app)
**Screencast:** (https://atlantictu-my.sharepoint.com/:v:/g/personal/g00400975_atu_ie/IQBBZLHFXNfGToc2aGqXCYOaAelCpRzJ61OO_vXSr8DMbJY?e=LaWhXQ)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Go (Golang) |
| Database | PostgreSQL (Neon Cloud) |
| Caching/Sessions | Redis |
| Infrastructure | Docker Compose |
| Real-time | WebSockets (Gorilla) + Google Diff-Match-Patch |

---

## Features

**Backend (Go):**
- User registration and login with JWT authentication
- Password hashing with bcrypt
- Authentication middleware for protected routes
- Full Document CRUD API (Create, Read, Update, Delete)
- Owner validation and permission checks
- WebSocket server with room management
- Diff-Match-Patch patch-based synchronisation with fallback to full content
- Redis caching for active documents (`doc:{id}:content`, 24hr TTL) with PostgreSQL fallback
- Automatic flush to PostgreSQL when last user leaves a session
- Email invitations via Gmail SMTP
- CORS configuration for Railway deployment

**Frontend (React + TypeScript):**
- User authentication flow (login/register pages)
- JWT token management with localStorage
- Dashboard with document management and shared document indicators
- Rich text editor (Quill.js) with formatting toolbar
- Real-time collaborative editing with active user presence
- Discussion box with join/leave activity feed
- Email invite modal with QR code generation
- Copy link button with confirmation state
- Word and character count in editor footer
- Immediate save on each validated edit with unsaved changes indicator
- PDF export with formatting preserved

---

## Local Setup

Create a `.env` file in the `/api` directory:

```env
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_secret_key
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
SMTP_USER=your_gmail
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
CLIENT_URL=http://localhost:5173
VITE_API_BASE=http://localhost:8080
VITE_WS_BASE=ws://localhost:8080
```

Then start all services with Docker Compose:

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |

---

## Deployment

- **Live URL:** [https://cowrite.up.railway.app](https://cowrite.up.railway.app)
- **Platform:** Railway (backend + frontend as separate services)
- **Database:** Neon PostgreSQL (serverless, cloud-hosted)
- **Redis:** Railway managed add-on
- **Local development:** Docker Compose (Redis + PostgreSQL run as containers)

---

## Future Work

- Version history / document snapshots
- Server-side timestamping for accurate cross-client latency measurement
- Full in-editor cursor visualisation for collaborators

---

## Project Management

Development was tracked using a GitHub Project board (Kanban) linked to this repository, maintained throughout the project alongside a Gantt chart produced at the proposal stage.
