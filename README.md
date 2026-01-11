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

## Project Structure so far

CoWrite/
├── client/          # React + TypeScript frontend (Vite)
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboard, Editor
│   │   ├── services/    # API, Auth, Document services
│   │   └── App.tsx      # Client-side routing
├── api/             # Go backend
│   ├── config/      # Database configuration
│   ├── handlers/    # HTTP request handlers (auth, documents)
│   ├── middleware/  # Authentication middleware
│   ├── models/      # Data models (User, Document)
│   └── utils/       # JWT utilities
├── docker-compose.yml
└── README.md

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

- Integrate Quill.js for rich text editing
- Implement auto-save functionality
- Implement WebSocket services for real-time document editing and chat  

---
## Key Features (Planned)

Real-time collaborative editing (supporting 4+ simultaneous users)
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
