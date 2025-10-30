# MiniDocs

**Work in progress for my Final Year Project at ATU Galway.**

MiniDocs is a collaborative document editing platform built for real-time teamwork.  
Users can create, edit, and share documents together through invite links or QR codes,  
with a built-in chat for discussion.

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

## Future Plans

Currently running locally with Docker.  
The long-term goal is to deploy the full system to the cloud,  
potentially using AWS or another provider once development stabilizes.
