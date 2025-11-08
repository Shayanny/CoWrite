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

client/ → React + TypeScript frontend (Vite)
api/ → FastAPI backend
docker-compose.yml → Manages all services (client, api, PostgreSQL, Redis)
Dockerfiles/ → Separate builds for frontend and backend

---

## Current Progress

- Frontend and backend run successfully through `docker compose up`   
- Local validation:
  - **Frontend:** [http://localhost:5173](http://localhost:5173)
  - **API:** [http://localhost:8080](http://localhost:8080)

---

## Next Steps

- Connect the frontend to the backend via API  
- Add database logic to FastAPI  
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
