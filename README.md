# CoWrite

**Final Year Project at ATU Galway — B.Sc. (Hons) Software Development**

CoWrite is a real-time collaborative document editing platform that enables teams to work together seamlessly. Users can create, edit, and share documents simultaneously through invite links, email invitations, or QR codes, with an integrated discussion box for communication without leaving the editor.

**Live:** [https://cowrite.up.railway.app](https://cowrite.up.railway.app)

---

## Tech Stack

Frontend: React + TypeScript (Vite)
Backend: Go (Golang)
Database: PostgreSQL (Neon Cloud)
Caching/Sessions: Redis
Infrastructure: Docker Compose
Real-time: WebSockets (Gorilla) + Google Diff-Match-Patch

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
- Redis caching for active documents with PostgreSQL fallback
- Automatic flush to PostgreSQL when last user leaves
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
- Auto-save with unsaved changes tracking
- PDF export with formatting preserved

---

## Deployment

- **Live URL:** [https://cowrite.up.railway.app](https://cowrite.up.railway.app)
- **Platform:** Railway (backend + frontend)
- **Database:** Neon PostgreSQL (cloud-hosted)
- **Local development:** Docker Compose

```bash
docker compose up --build
```

- Local Frontend: [http://localhost:5173](http://localhost:5173)
- Local API: [http://localhost:8080](http://localhost:8080)

---

## Future Work

- Version history / document snapshots

---

## Project Management

GitHub Project Board: Task tracking and progress management throughout development.