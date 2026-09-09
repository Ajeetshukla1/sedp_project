# Digital Health Record Management System

Phase 1 provides a TypeScript MERN monorepo with a frontend-to-backend health check. It uses only synthetic data when later phases introduce records.

## Prerequisites

- Node.js 22 or later
- Docker Desktop (for local MongoDB)

## Local setup

1. Copy `.env.example` to `.env` and replace placeholders before using sensitive integrations.
2. Start MongoDB: `docker compose up -d mongodb`
3. Install packages: `npm install`
4. Start the client and API: `npm run dev`
5. Open `http://localhost:5173`. The page displays the API health status from `GET http://localhost:5000/api/health`.

Authentication is available at `/register` and `/login`. New public registrations receive the `patient` role. Start MongoDB before using authentication; refresh tokens are kept in secure httpOnly cookies and access tokens are held in client memory.

## Checks

```bash
npm run lint
npm run format:check
npm run build
npm test
```

Do not commit `.env`, credentials, uploaded documents, or patient-identifying data.
