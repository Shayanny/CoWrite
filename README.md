# CoWrite

**Work in progress for my Final Year Project at ATU Galway.**

CoWrite will be a real-time collaborative document editing platform that enables teams to work together seamlessly. Users can create, edit, and share documents simultaneously through invite links or QR codes, with an integrated discussion box for communication without leaving the editor.

---
## Tech Stack

Frontend: React + TypeScript (Vite)
Backend: Go (Golang)
Database: PostgreSQL
Caching/Sessions: Redis
Infrastructure: Docker Compose

---

## Project Structure so far

CoWrite/
├── client/          # React + TypeScript frontend (Vite)
├── api/             # Go backend
│   ├── config/      # Database configuration
│   ├── handlers/    # HTTP request handlers
│   ├── middleware/  # Authentication middleware
│   ├── models/      # Data models (User, Document)
│   └── utils/       # JWT utilities
├── docker-compose.yml
└── README.md

---

## Current Progress

Docker Environment: Multi-service orchestration (client, api, PostgreSQL, Redis)
User Authentication:

User registration and login
JWT token generation and validation
Password hashing with bcrypt
Authentication middleware for protected routes


Database Migration: Successfully migrated from local PostgreSQL to Neon cloud database
Document CRUD Operations:

Create, Read, Update, Delete documents
Owner validation and permissions
Database schema and handlers implemented


Frontend Foundation: Login page with styling
GitHub Project Board: Task tracking and progress management
- Local validation:
  - **Frontend:** [http://localhost:5173](http://localhost:5173)
  - **API:** [http://localhost:8080](http://localhost:8080)

---

## Next Steps

- Connect the frontend to the backend via API  
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
