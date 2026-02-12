# CoWrite

**Work in progress for my Final Year Project at ATU Galway.**

CoWrite will be a real-time collaborative document editing platform that enables teams to work together seamlessly. Users can create, edit, and share documents simultaneously through invite links or QR codes, with an integrated discussion box for communication without leaving the editor.

---
## Tech Stack

Frontend: React + TypeScript (Vite)
Backend: Go (Golang)
Database: PostgreSQL (Neon Cloud)
Caching/Sessions: Redis
Infrastructure: Docker Compose

---

## Current Progress

Backend (Go):

User registration and login with JWT authentication
Password hashing with bcrypt
Authentication middleware for protected routes
Full Document CRUD API (Create, Read, Update, Delete)
Owner validation and security patterns
CORS configuration for frontend integration
Neon PostgreSQL cloud database integration

Frontend (React + TypeScript):

User authentication flow (login/register pages)
JWT token management with localStorage
Complete API service layer architecture
Dashboard with document management:

Grid layout displaying all user documents
Create new documents via modal
Delete documents with confirmation
Document preview and metadata


Document Editor:

Load and edit documents by ID
Editable title and content fields
Save functionality with status indicators
Auto-Save functionality with 3 second debouncing
Unsaved changes tracking and user warnings
Rich text editor integration (Quill.js) - in progress
Navigation between dashboard and editor

Client-side routing system
Professional UI styling with gradient theme

Frontend Foundation: Login page with styling
GitHub Project Board: Task tracking and progress management
- Local validation:
  - **Frontend:** [http://localhost:5173](http://localhost:5173)
  - **API:** [http://localhost:8080](http://localhost:8080)

---

## Next Steps

- Resolve React 19 compatibility with react-quill library
- Complete rich text formatting (bold, italic, headers, lists, links)
- Implement WebSocket services for real-time document editing
- Add discussion box functionality

---
## Key Features (Planned)

Real-time collaborative editing 
User authentication and session management
Document sharing via unique URLs and QR codes
Integrated discussion box
User presence indicators
Sub-300ms edit latency
Version history tracking

---

## Future Plans

Currently running locally with Docker.  
The long-term goal is to deploy the full system to the cloud,  
potentially using AWS or another provider once development stabilizes.
