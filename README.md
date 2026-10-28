# 🌱 EcoTask

Volunteer and eco-activity management web app with separate admin and volunteer dashboards.

**Live demo:** YOUR_VERCEL_URL
**API:** YOUR_RENDER_URL

## Features
- Volunteer sign-up, login and activity registration
- Admin dashboard for managing activities and volunteers
- (add your real features)

## Tech stack
- **Frontend:** React, Vite
- **Backend:** Node.js, Express, MongoDB
- **Hosting:** Vercel (frontend), Render (backend)

## Project structure
- `frontend/` – React client
- `backend/` – REST API

## Run locally

Backend:
```bash
cd backend
copy .env.example .env    # then fill in your values
npm install
npm run dev
```

Frontend (new terminal):
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Note
The backend is on a free Render plan and sleeps when idle, so the first request can take up to a minute.