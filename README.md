# CoWrite

**Final Year Project at ATU Galway — B.Sc. (Hons) Software Development**

CoWrite will be a real-time collaborative document editing platform that enables teams to work together seamlessly. Users can create, edit, and share documents simultaneously through invite links or QR codes, with an integrated discussion box for communication without leaving the editor.

---
## Tech Stack

Frontend: React + TypeScript (Vite)
Backend: Go (Golang)
Database: PostgreSQL (Neon Cloud)
Caching/Sessions: Redis
Infrastructure: Docker Compose
Real-time: WebSockets (Gorilla) + Google Diff-Match-Patch
Caching: Redis

---

## Current Progress

**Backend (Go):**
- User registration and login with JWT authentication
- Password hashing with bcrypt
- Authentication middleware for protected routes
- Full Document CRUD API (Create, Read, Update, Delete)
- Owner validation and permission checks
- WebSocket server with room management
- Diff-Match-Patch patch-based synchronisation
- Redis caching for active documents with PostgreSQL fallback
- Email invitations via Gmail SMTP
- CORS configuration for frontend integration
- Automatic flush to PostgreSQL when last user leaves

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


GitHub Project Board: Task tracking and progress management

- Local validation:
  - **Frontend:** [http://localhost:5173](http://localhost:5173)
  - **API:** [http://localhost:8080](http://localhost:8080)

---

## Next Steps

- Version history

---

## Key Features (Planned)

Real-time collaborative editing 
User authentication and session management
Document sharing via unique URLs and QR codes
Integrated discussion box
User presence indicators
Sub-300ms edit latency
Version history tracking
PDF export

---

## Future Plans

Currently running locally with Docker.
The long-term goal is to deploy the full system to the cloud,
potentially using AWS or another provider once development stabilizes.
