# Digital Health Record Management System — Build Plan

## BUILD INSTRUCTIONS FOR CODING ASSISTANT

### Operating mode

- **Start with Phase 1 only.**
- The user will explicitly tell you when to execute the next phase. If the user says **"Step 1"**, execute only **Phase 1**. If the user says **"Step 2"**, execute only **Phase 2**, and so on.
- **Never implement a later phase early**, even if a later feature appears easy or is needed conceptually. Create only the minimum interfaces/stubs required by the current phase.
- Before starting **every phase**, re-read this entire `plan.md`, then re-read the target phase and its dependencies.
- Mark a checkbox `[x]` only after the corresponding task is actually implemented and verified.
- Do not mark tasks complete merely because a file exists. Verify the behavior.
- If a task is ambiguous, technically blocked, or conflicts with the existing codebase, **flag it in the response instead of silently guessing**.
- Preserve existing working code when implementing a phase. Do not rewrite unrelated code.
- If a dependency or prerequisite from an earlier phase is incomplete, stop and report the blocker instead of silently implementing the missing earlier phase.
- After completing a phase:
  1. Run the phase's verification commands.
  2. Run the phase's Definition-of-Done checks.
  3. Mark completed checklist items `[x]`.
  4. Report what changed, what was tested, and any blockers.
- Do not modify future-phase checklists until those phases are actually executed.

### Project scope

This is a **clinical information management and summarization system**, not an autonomous medical diagnosis or treatment system.

The AI must:
- summarize information already present in patient records;
- identify documented trends and inconsistencies;
- cite/source important statements back to records;
- clearly distinguish missing information from normal information;
- never present itself as the final clinical decision-maker.

The AI must **not** independently prescribe medication, change dosage, diagnose disease, or issue definitive treatment decisions.

### Coding conventions

- Language: TypeScript throughout frontend and backend.
- Use `camelCase` for variables/functions, `PascalCase` for React components/classes/types, and `UPPER_SNAKE_CASE` only for constants that are truly constant.
- Use clear singular nouns for models/types: `Patient`, `MedicalRecord`, `LabResult`.
- Use REST resource naming with plural nouns: `/api/patients`, `/api/reports`.
- Keep route handlers/controllers thin. Business rules belong in `server/src/services/`.
- Keep database access in `server/src/repositories/`.
- Keep validation schemas in `server/src/validators/`.
- Keep React UI components presentational where possible.
- Do not put business logic directly into JSX.
- Prefer small functions and explicit return types for exported functions.
- Use Zod for runtime input validation.
- Use ESLint + Prettier. No knowingly committed lint errors.
- Avoid `any`. If unavoidable at an external boundary, narrow it immediately.
- Comments should explain **why**, not restate obvious code.
- Use environment variables for secrets and deployment-specific configuration.
- Never commit `.env`, API keys, JWT secrets, database credentials, uploaded medical documents, or patient-identifying sample data.
- Use synthetic/fake patient data for development and demos.
- Commit messages, if Git is used, should follow Conventional Commits, e.g. `feat(auth): add login endpoint`.

---

# 1. PROJECT OVERVIEW

## 1.1 Problem

Doctors often need to review fragmented information across previous consultations, diagnoses, medications, allergies, prescriptions, laboratory reports, and uploaded documents before understanding a patient's current situation.

The project will consolidate these records into one longitudinal digital health record and provide an AI-assisted summary that helps a doctor quickly understand:

- relevant medical history;
- current conditions;
- current and historical medications;
- allergies;
- recent investigations;
- abnormal values;
- longitudinal trends;
- conflicts between records;
- missing/uncertain information;
- evidence/source documents supporting important statements.

The system is an **information-assistance tool**. A doctor remains responsible for clinical interpretation and decisions.

## 1.2 Target users

### Primary user: Doctor

Can:
- log in;
- view authorized patients;
- inspect patient history;
- upload/view reports;
- review structured lab values;
- see trends;
- generate and review AI summaries;
- inspect evidence/source records.

### Secondary user: Patient

Can:
- maintain their profile;
- view their own health records;
- upload documents;
- view reports and medications;
- view generated summaries where permitted.

### Administrative user

Can:
- manage users/roles;
- manage doctor-patient access;
- review audit logs;
- manage system configuration.

Admin functionality should remain limited in the MVP.

## 1.3 Core value proposition

> Convert fragmented medical records into a structured, chronological, evidence-backed patient overview so doctors spend less time searching through records and more time reviewing clinically relevant information.

## 1.4 Product principles

1. **Doctor-in-the-loop:** AI assists; it does not make final clinical decisions.
2. **Evidence-first:** important AI statements should be traceable to source records.
3. **Missing is not normal:** absence of a value must never be interpreted as a normal value.
4. **Patient isolation:** users must never access records outside their authorization scope.
5. **Core EHR independence:** the application must remain useful when the AI service is unavailable.
6. **Synthetic development data:** no real patient data in development/test fixtures.
7. **Minimal AI context:** send only the information needed for a requested summary.
8. **Auditability:** important record access and changes should be traceable.

## 1.5 Recommended tech stack

The requested basis is MERN. Use:

- MongoDB + Mongoose
- Express.js
- React
- Node.js
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query for server state
- React Hook Form + Zod for forms/validation
- Zustand only for small client-only UI state; do not duplicate server state in Zustand
- JWT authentication with short-lived access tokens and refresh-token rotation stored in secure, httpOnly cookies
- bcrypt for password hashing
- Multer for multipart uploads
- PDF.js/pdf-parse or equivalent server-side PDF extraction as supported by implementation
- Tesseract.js for local OCR in the MVP where appropriate
- OpenAI API behind a server-side AI service abstraction for AI summaries
- MongoDB indexes for patient/record/report queries
- Object storage abstraction for uploaded documents; local filesystem storage for local development and S3-compatible storage for deployment
- Vitest for unit tests
- Supertest for Express API tests
- Playwright for critical end-to-end flows
- ESLint + Prettier
- Docker + Docker Compose for local infrastructure where useful

### Recommended version policy

Use currently supported stable versions available at project initialization, but keep the major versions consistent across the project. Do not independently upgrade libraries between phases.

Recommended baseline:

- Node.js `22.x LTS`
- TypeScript `5.x`
- React `19.x`
- Vite `7.x`
- Express `5.x`
- Mongoose `8.x`
- MongoDB `8.x` for local/server compatibility
- Tailwind CSS `4.x`
- TanStack Query `5.x`
- React Hook Form `7.x`
- Zod `4.x`
- Zustand `5.x`
- Vitest `3.x` or latest compatible stable version selected during initialization
- Playwright `1.x`
- bcrypt `6.x`
- jsonwebtoken `9.x`
- Multer `2.x`

Exact lockfile versions selected during Phase 1 are authoritative. Do not change major versions later without a deliberate dependency decision.

---

# 2. ARCHITECTURE

## 2.1 High-level system diagram in words

```text
Browser
  |
  | HTTPS
  v
React + Vite + Tailwind frontend
  |
  | REST/JSON + multipart upload
  v
Express + Node.js API
  |
  +--> Authentication / Authorization
  |
  +--> Patient / Encounter / Medication / Allergy services
  |
  +--> Document upload service
  |       |
  |       +--> Object storage
  |       +--> PDF text extraction / OCR
  |
  +--> Medical data normalization service
  |
  +--> Trend / conflict detection service
  |
  +--> AI summary service
  |       |
  |       +--> OpenAI API
  |
  +--> Audit service
  |
  v
MongoDB
```

The browser communicates only with the backend API. The browser must never contain OpenAI API keys, database credentials, or other server secrets.

## 2.2 Repository structure

Use a monorepo with separate frontend and backend applications:

```text
digital-health-record/
├── plan.md
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── package.json
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── eslint.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── routes/
│   │   │   ├── AppRouter.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── PatientsPage.tsx
│   │   │   ├── PatientOverviewPage.tsx
│   │   │   ├── PatientTimelinePage.tsx
│   │   │   ├── PatientReportsPage.tsx
│   │   │   ├── PatientMedicationsPage.tsx
│   │   │   ├── PatientAIPage.tsx
│   │   │   ├── UploadReportPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── patients/
│   │   │   ├── reports/
│   │   │   ├── medications/
│   │   │   ├── timeline/
│   │   │   └── ai/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── reports/
│   │   │   ├── medications/
│   │   │   └── ai/
│   │   ├── api/
│   │   │   ├── http.ts
│   │   │   ├── authApi.ts
│   │   │   ├── patientApi.ts
│   │   │   ├── reportApi.ts
│   │   │   └── aiApi.ts
│   │   ├── hooks/
│   │   ├── stores/
│   │   │   └── uiStore.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── api.ts
│   └── tests/
│       ├── unit/
│       └── e2e/
│
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.js
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── database.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   ├── encounter.routes.ts
│   │   │   ├── medication.routes.ts
│   │   │   ├── allergy.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── observation.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   └── audit.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── patient.service.ts
│   │   │   ├── report.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── extraction.service.ts
│   │   │   ├── normalization.service.ts
│   │   │   ├── trend.service.ts
│   │   │   ├── conflict.service.ts
│   │   │   ├── ai-summary.service.ts
│   │   │   └── audit.service.ts
│   │   ├── repositories/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Patient.ts
│   │   │   ├── DoctorPatientAccess.ts
│   │   │   ├── Encounter.ts
│   │   │   ├── Condition.ts
│   │   │   ├── Medication.ts
│   │   │   ├── Allergy.ts
│   │   │   ├── MedicalReport.ts
│   │   │   ├── Observation.ts
│   │   │   ├── Document.ts
│   │   │   ├── AISummary.ts
│   │   │   └── AuditLog.ts
│   │   ├── validators/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── upload.middleware.ts
│   │   │   └── request-id.middleware.ts
│   │   ├── lib/
│   │   │   ├── jwt.ts
│   │   │   ├── password.ts
│   │   │   └── logger.ts
│   │   └── types/
│   │       └── express.d.ts
│   └── tests/
│       ├── unit/
│       └── integration/
│
├── shared/
│   ├── package.json
│   └── src/
│       ├── enums.ts
│       ├── schemas.ts
│       └── types.ts
│
└── storage/
    └── .gitkeep
```

## 2.3 Frontend/backend communication

Use **REST + JSON**.

Base URL:

```text
/api
```

Examples:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/patients
POST   /api/patients
GET    /api/patients/:patientId
PATCH  /api/patients/:patientId

GET    /api/patients/:patientId/timeline
GET    /api/patients/:patientId/observations

POST   /api/patients/:patientId/reports
GET    /api/patients/:patientId/reports
GET    /api/reports/:reportId

POST   /api/patients/:patientId/ai-summaries
GET    /api/patients/:patientId/ai-summaries
GET    /api/ai-summaries/:summaryId
```

Use TanStack Query for GET/server-state caching and mutations.

Do not use GraphQL for the MVP. REST keeps the system simpler and easier for a coding assistant to implement phase-by-phase.

## 2.4 Authentication

Use custom authentication with:

- bcrypt password hashing;
- short-lived JWT access token;
- refresh token;
- refresh token stored in secure, httpOnly cookie;
- role-based authorization;
- backend middleware enforcing authorization.

Do not store long-lived JWTs in localStorage.

Core functions:

```text
server/src/services/auth.service.ts
server/src/lib/jwt.ts
server/src/lib/password.ts
server/src/middleware/auth.middleware.ts
server/src/middleware/role.middleware.ts
```

## 2.5 State management

- **TanStack Query:** all server state.
- **React Hook Form:** form state.
- **Zustand:** only small client-only UI state such as sidebar state, modal state, or temporary filters.
- Do not copy patient/server data into Zustand.

## 2.6 Business logic vs UI logic

### Backend business logic

Must live in:

```text
server/src/services/
server/src/repositories/
server/src/validators/
```

Examples:
- authorization;
- patient access;
- report processing;
- unit normalization;
- duplicate detection;
- trend detection;
- conflict detection;
- AI context creation.

### Frontend UI logic

Lives in:

```text
client/src/components/
client/src/pages/
client/src/features/
client/src/hooks/
```

The frontend should call API functions rather than directly implementing medical business rules.

## 2.7 Third-party services/APIs

### Required/primary

- MongoDB Atlas for production database or local MongoDB for development.
- OpenAI API for AI summarization, accessed only from the backend.
- Object storage for uploaded medical documents. Implement a storage abstraction so local disk can be used in development and S3-compatible storage in deployment.

### Optional later

- Email provider for password reset/notifications.
- Cloud OCR service if local OCR quality is insufficient.
- Monitoring/error tracking service.

Do not add payments to the MVP.

## 2.8 Environment/config

Root `.env.example`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/digital_health_record

JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

OPENAI_API_KEY=replace_me
OPENAI_MODEL=replace_me

STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage

S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

MAX_UPLOAD_SIZE_MB=10
```

Rules:
- `.env` is never committed.
- `.env.example` contains names only and safe placeholders.
- The frontend receives only non-secret variables with the `VITE_` prefix.
- OpenAI, MongoDB, JWT, and storage secrets remain server-only.

---

# 3. PAGE-BY-PAGE BREAKDOWN

## 3.1 Login

### Route

`/login`

### Purpose

Authenticate a user.

### Components

- Login form
- Email field
- Password field
- Submit button
- Error alert
- Loading state

### Data

Reads/writes through:

```text
POST /api/auth/login
```

### Actions

- Login
- Navigate to dashboard
- Navigate to registration

### States

- Empty form
- Validation error
- Loading
- Invalid credentials
- Server error
- Success

---

## 3.2 Register

### Route

`/register`

### Purpose

Create an account.

### Components

- Name
- Email
- Password
- Role selection where allowed
- Confirmation field
- Submit button

### Data

```text
POST /api/auth/register
```

### Actions

- Register
- Navigate to login

### States

- Validation
- Loading
- Email already exists
- Server error
- Success

For production, arbitrary users should not be allowed to self-register as doctors/admins. The MVP may allow role selection for development only, but this must be clearly marked as a development assumption.

---

## 3.3 Dashboard

### Route

`/dashboard`

### Purpose

Give the logged-in user a quick overview.

### Doctor view

- Total authorized patients
- Recent patients
- Recent reports
- Pending AI summaries
- Recent activity

### Patient view

- Profile snapshot
- Recent reports
- Current medications
- Recent visits

### Data

```text
GET /api/auth/me
GET /api/patients
GET /api/audit
```

### Actions

- Open patient
- Search patient
- Upload report
- Navigate to profile

### States

- Loading skeleton
- Empty dashboard
- Error
- Loaded

---

## 3.4 Patients

### Route

`/patients`

### Purpose

List patients the doctor is authorized to access.

### Components

- Search
- Filters
- Patient table/cards
- Pagination
- Empty state

### Data

```text
GET /api/patients
```

### Actions

- Search
- Filter
- Open patient
- Create patient where role permits

### States

- Loading
- Empty
- Error
- Results
- Pagination

---

## 3.5 Patient Overview

### Route

`/patients/:patientId`

### Purpose

Central patient summary.

### Components

- Patient header
- Demographics
- Conditions
- Allergies
- Current medications
- Recent observations
- Recent reports
- AI summary preview
- Important conflicts

### Data

Patient profile plus related records.

### Actions

- Edit allowed fields
- View timeline
- View reports
- View medications
- Generate AI summary
- Open evidence document

### States

- Loading
- Patient not found
- Unauthorized
- Partial data
- Loaded

---

## 3.6 Patient Timeline

### Route

`/patients/:patientId/timeline`

### Purpose

Display chronological medical events.

### Components

- Timeline
- Date filters
- Event type filters
- Encounter cards
- Report cards
- Medication changes
- Observation trends

### Data

```text
GET /api/patients/:patientId/timeline
```

### Actions

- Filter
- Expand event
- Open source report

### States

- Loading
- Empty history
- Error
- Loaded

---

## 3.7 Patient Reports

### Route

`/patients/:patientId/reports`

### Purpose

List uploaded medical reports/documents.

### Components

- Report table
- Upload button
- Report type
- Date
- Processing status
- Extraction status
- View/download action

### Data

```text
GET /api/patients/:patientId/reports
```

### Actions

- Upload
- View
- Delete if authorized
- Filter
- Retry processing

### States

- No reports
- Uploading
- Processing
- Completed
- Failed
- Error

---

## 3.8 Upload Report

### Route

`/patients/:patientId/reports/upload`

### Purpose

Upload a medical document.

### Components

- File picker
- Report type
- Clinical event date
- Optional notes
- Patient identity verification preview
- Upload button
- Processing progress/status

### Data

```text
POST /api/patients/:patientId/reports
```

### Actions

- Select file
- Upload
- Cancel
- Retry

### States

- No file
- Invalid type
- Too large
- Uploading
- Processing
- Extraction failed
- Success

---

## 3.9 Patient Medications

### Route

`/patients/:patientId/medications`

### Purpose

View current and historical medication information.

### Components

- Active medication list
- Historical medications
- Medication details
- Start/end dates
- Status badges

### Data

```text
GET /api/patients/:patientId/medications
```

### Actions

- Add medication
- Edit
- Mark discontinued
- View source

### States

- Empty
- Loading
- Error
- Loaded

---

## 3.10 Patient AI Summary

### Route

`/patients/:patientId/ai-summary`

### Purpose

Generate and review an evidence-backed AI summary.

### Components

- Generate summary button
- Summary sections
- Important changes
- Trends
- Conflicts
- Missing information
- Evidence references
- Source links
- Generated timestamp
- Disclaimer

### Data

```text
POST /api/patients/:patientId/ai-summaries
GET  /api/patients/:patientId/ai-summaries
GET  /api/ai-summaries/:summaryId
```

### Actions

- Generate
- Refresh
- View evidence
- Open source record

### States

- No summary yet
- Preparing context
- AI processing
- Success
- AI unavailable
- Insufficient data
- Error

The page must clearly state that the AI summary is informational and requires clinician review.

---

## 3.11 Profile

### Route

`/profile`

### Purpose

View/edit the logged-in user's account information.

### Components

- Name
- Email
- Role
- Password change
- Logout

### Data

```text
GET /api/auth/me
PATCH /api/auth/me
```

### Actions

- Edit profile
- Change password
- Logout

### States

- Loading
- Saving
- Success
- Validation error
- Server error

---

## 3.12 Not Found

### Route

`*`

### Purpose

Handle unknown routes.

### Components

- 404 message
- Return-to-dashboard button

---

# 4. FEATURE LIST

## 4.1 Must-have — MVP

### Authentication

- User registration for development
- Login
- Logout
- Refresh session
- Password hashing
- Role-based authorization

### Patient management

- Create patient
- View patient
- Edit patient
- Patient list
- Search

### Health records

- Encounters
- Conditions
- Allergies
- Medications
- Observations

### Medical documents

- Upload PDF/image
- Store metadata
- Store file
- Extract text
- OCR fallback for supported images/scans
- Processing status
- Link document to patient

### Structured reports

- Basic lab observations
- Value
- Unit
- Reference range
- Observation date
- Source report

### Timeline

- Chronological patient events
- Filter by type/date

### Intelligence layer

- Unit-aware observation storage
- Basic trend detection
- Basic duplicate detection
- Conflict detection
- Missing-data representation

### AI

- Generate patient summary
- Use only selected patient context
- Structured summary format
- Evidence/source references
- Store generated summary
- AI failure handling

### Security

- Authorization middleware
- Patient access checks
- Audit logs for important operations
- Secret management
- No patient data in frontend logs

---

## 4.2 Nice-to-have — v2

- Advanced OCR
- More laboratory report formats
- FHIR import/export
- Doctor-patient invitation/access workflow
- Patient consent management
- Advanced search
- More sophisticated trend visualization
- AI question answering over patient records
- Summary comparison between visits
- Notification system
- Password reset email
- Admin dashboard
- Soft delete + record versioning

---

## 4.3 Stretch goals

- Clinical terminology mapping
- FHIR-compliant resource layer
- Local/private LLM deployment
- Retrieval-augmented generation with vector search
- Structured extraction using medical schemas
- Multilingual report support
- Voice note transcription
- Explainable evidence graph
- AI-generated consultation preparation checklist
- Population-level anonymized analytics
- Deployment with monitoring and automated CI/CD

---

# 5. PHASED BUILD PLAN

## Phase 1 — Foundation and Project Skeleton

### Goal

Create a clean MERN TypeScript monorepo that runs locally, has frontend/backend communication, MongoDB connectivity, environment validation, linting, formatting, and a health endpoint.

### Dependencies

None.

### Files to create

```text
package.json
.env.example
.gitignore
README.md
docker-compose.yml

client/
  package.json
  vite.config.ts
  src/main.tsx
  src/App.tsx
  src/index.css

server/
  package.json
  src/server.ts
  src/app.ts
  src/config/env.ts
  src/config/database.ts
  src/routes/index.ts

shared/
  package.json
  src/types.ts
  src/enums.ts
```

### Tasks

- [x] Initialize the root monorepo with npm workspaces for `client`, `server`, and `shared`.
- [x] Create the React + Vite + TypeScript client in `client/`.
- [x] Create the Express + TypeScript server in `server/`.
- [x] Create the shared TypeScript package in `shared/`.
- [x] Install the approved baseline dependencies from the Tech Stack & Versions section.
- [x] Create `.gitignore` that excludes `.env`, `node_modules`, build output, logs, local storage contents, and test artifacts.
- [x] Create `.env.example` with all required variable names from Section 2.8.
- [x] Create `server/src/config/env.ts` using Zod to validate required environment variables at startup.
- [x] Create `server/src/config/database.ts` with an exported `connectDatabase()` function using Mongoose.
- [x] Create `server/src/app.ts` that configures Express JSON parsing, CORS using `CLIENT_URL`, and the API router.
- [x] Create `server/src/routes/index.ts` with `GET /api/health` returning `{ "status": "ok" }`.
- [x] Create `server/src/server.ts` that validates configuration, connects to MongoDB, and starts the server.
- [x] Configure the Vite development server to run on port `5173`.
- [x] Configure the API server to run on port `5000`.
- [x] Configure a frontend HTTP client base URL through `VITE_API_BASE_URL`.
- [x] Create a minimal frontend page that calls `GET /api/health` and visibly displays backend connectivity.
- [x] Configure ESLint for both client and server.
- [x] Configure Prettier and add formatting scripts.
- [x] Add root scripts for `dev`, `build`, `lint`, `format`, and `test`.
- [x] Add `docker-compose.yml` for local MongoDB only; do not add unrelated infrastructure.
- [x] Add a root `README.md` with local setup commands and environment setup instructions.
- [x] Verify `npm install` succeeds from the repository root.
- [x] Verify the client starts on port `5173`.
- [x] Verify the API starts on port `5000`.
- [x] Verify MongoDB connection succeeds.
- [x] Verify `GET /api/health` returns HTTP 200.
- [x] Verify the frontend successfully displays backend health status.
- [x] Run lint and formatting checks and resolve all errors.

### Definition of Done

A fresh checkout can run the documented setup commands, start MongoDB, start frontend/backend, open `http://localhost:5173`, and see a successful backend health check. `GET /api/health` returns HTTP 200 and lint/build checks pass.

---

## Phase 2 — Application Shell and UI System

### Goal

Create the reusable frontend layout, routing, responsive UI primitives, navigation, and placeholder pages without implementing business logic.

### Dependencies

Phase 1 complete.

### Tasks

- [x] Create `client/src/routes/AppRouter.tsx`.
- [x] Create `client/src/routes/ProtectedRoute.tsx` as a placeholder route guard that can be connected to real auth in Phase 3.
- [x] Create `client/src/pages/LoginPage.tsx`.
- [x] Create `client/src/pages/RegisterPage.tsx`.
- [x] Create `client/src/pages/DashboardPage.tsx`.
- [x] Create `client/src/pages/PatientsPage.tsx`.
- [x] Create `client/src/pages/PatientOverviewPage.tsx`.
- [x] Create `client/src/pages/PatientTimelinePage.tsx`.
- [x] Create `client/src/pages/PatientReportsPage.tsx`.
- [x] Create `client/src/pages/PatientMedicationsPage.tsx`.
- [x] Create `client/src/pages/PatientAIPage.tsx`.
- [x] Create `client/src/pages/UploadReportPage.tsx`.
- [x] Create `client/src/pages/ProfilePage.tsx`.
- [x] Create `client/src/pages/NotFoundPage.tsx`.
- [x] Create reusable layout components under `client/src/components/layout/`.
- [x] Create reusable UI components under `client/src/components/ui/` for button, input, card, badge, modal, table, spinner, empty state, error state, and skeleton.
- [x] Configure Tailwind CSS.
- [x] Configure route navigation between all MVP routes.
- [x] Add a responsive desktop/tablet/mobile application shell.
- [x] Add a clear role-independent navigation structure without pretending that authentication exists yet.
- [x] Add a global error boundary or equivalent route-level error handling.
- [x] Add `client/src/lib/queryClient.ts` and configure TanStack Query provider.
- [x] Add `client/src/stores/uiStore.ts` only for UI state such as sidebar open/closed.
- [x] Verify every defined route renders without a runtime error.
- [x] Verify the application is usable at mobile and desktop widths.

### Definition of Done

Every route listed in Section 3 resolves to a working placeholder screen inside a consistent responsive application shell, and the client builds/lints successfully.

---

## Phase 3 — Authentication and Authorization

### Goal

Implement secure user authentication and backend authorization.

### Dependencies

Phase 1 and Phase 2 complete.

### Backend files

```text
server/src/models/User.ts
server/src/services/auth.service.ts
server/src/controllers/auth.controller.ts
server/src/routes/auth.routes.ts
server/src/validators/auth.validators.ts
server/src/lib/jwt.ts
server/src/lib/password.ts
server/src/middleware/auth.middleware.ts
server/src/middleware/role.middleware.ts
```

### Frontend files

```text
client/src/api/http.ts
client/src/api/authApi.ts
client/src/features/auth/
client/src/hooks/useAuth.ts
```

### Tasks

- [x] Create `User` Mongoose model with name, email, passwordHash, role, createdAt, updatedAt.
- [x] Create unique case-normalized email index.
- [x] Define roles: `patient`, `doctor`, `admin`.
- [x] Create Zod schemas for registration/login.
- [x] Implement password hashing with bcrypt.
- [x] Implement access-token creation in `server/src/lib/jwt.ts`.
- [x] Implement refresh-token creation and verification.
- [x] Implement `register()`, `login()`, `logout()`, `refreshSession()`, and `getCurrentUser()` in `auth.service.ts`.
- [x] Store refresh tokens securely in httpOnly cookies.
- [x] Create auth routes.
- [x] Create authentication middleware that validates the access token.
- [x] Create role middleware.
- [x] Create `GET /api/auth/me`.
- [x] Create frontend auth API functions.
- [x] Create an auth provider/hook that loads the current session using `/api/auth/me`.
- [x] Connect LoginPage to the real login endpoint.
- [x] Connect RegisterPage to the real registration endpoint.
- [x] Connect logout action to the real logout endpoint.
- [x] Make `ProtectedRoute.tsx` redirect unauthenticated users to `/login`.
- [x] Add role-aware navigation foundation through authenticated user state.
- [x] Ensure unauthorized API calls return HTTP 401/403 rather than leaking data.
- [x] Add integration tests for register, login, logout, refresh, and protected endpoint behavior.
- [x] Verify passwords are never returned by API responses.
- [x] Verify JWT secrets are never sent to the client.

### Definition of Done

A new user can register, log in, refresh their session, access `/dashboard`, see their authenticated identity, and log out. An unauthenticated user is redirected to `/login`. Protected API routes reject unauthorized requests.

---

## Phase 4 — Patient and Access Management

### Goal

Implement patient records and doctor-patient access control.

### Dependencies

Phase 3 complete.

### Files

```text
server/src/models/Patient.ts
server/src/models/DoctorPatientAccess.ts
server/src/services/patient.service.ts
server/src/repositories/patient.repository.ts
server/src/routes/patient.routes.ts
server/src/controllers/patient.controller.ts
server/src/validators/patient.validators.ts
server/src/middleware/patient-access.middleware.ts
```

### Tasks

- [x] Create `Patient` model with a stable patient ID, demographics, contact data, and timestamps.
- [x] Create `DoctorPatientAccess` model linking doctor, patient, access status, and timestamps.
- [x] Create unique indexes preventing duplicate active doctor-patient access records.
- [x] Implement patient creation.
- [x] Implement patient retrieval.
- [x] Implement patient update.
- [x] Implement authorized patient listing.
- [x] Implement patient search.
- [x] Implement backend patient-access checks.
- [x] Ensure a doctor cannot retrieve a patient without an access record.
- [x] Implement development-only patient creation/access flow.
- [x] Connect `/patients` to the real API.
- [x] Connect `/patients/:patientId` to the real patient API.
- [x] Add loading/empty/error states.
- [x] Add API tests for authorized and unauthorized patient access.
- [x] Add audit entries for patient creation and sensitive patient access.

### Definition of Done

A doctor can create/list/search authorized patients and open a patient overview. A doctor cannot retrieve an unauthorized patient's record through the API, even if they manually change the URL.

---

## Phase 5 — Core Medical Record Model

### Goal

Implement encounters, conditions, allergies, medications, and observations.

### Dependencies

Phase 4 complete.

### Tasks

- [x] Create `Encounter.ts`.
- [x] Create `Condition.ts`.
- [x] Create `Medication.ts`.
- [x] Create `Allergy.ts`.
- [x] Create `Observation.ts`.
- [x] Add patient references to all medical entities.
- [x] Store clinical event dates separately from document upload timestamps where applicable.
- [x] Implement CRUD service methods for MVP medical entities.
- [x] Add Zod validation schemas.
- [x] Add repository functions for patient-scoped queries.
- [x] Add medication status values: `active`, `discontinued`, `completed`, `unknown`.
- [x] Store observation `value`, `unit`, `referenceLow`, `referenceHigh`, `observedAt`, `sourceDocumentId`.
- [x] Never convert missing observations into zero or normal.
- [x] Create corresponding REST endpoints.
- [x] Connect the Patient Overview page to conditions, allergies, medications, and recent observations.
- [x] Connect Patient Medications page to the API.
- [x] Add forms for authorized users to create/update relevant records.
- [x] Add tests for patient isolation and validation.

### Definition of Done

An authorized doctor can create/view/update a patient's core medical information, and every medical entity is associated with the correct patient. API tests demonstrate cross-patient access is blocked.

---

## Phase 6 — Medical Document Upload and Storage

### Goal

Implement secure report/document upload and metadata management.

### Dependencies

Phase 5 complete.

### Tasks

- [x] Create `Document.ts` and `MedicalReport.ts`.
- [x] Define supported file types for MVP: PDF, PNG, JPEG/JPG.
- [x] Enforce maximum upload size using server configuration.
- [x] Configure Multer for controlled multipart upload handling.
- [x] Create `server/src/services/document.service.ts`.
- [x] Create a storage interface that supports local storage first.
- [x] Store files under a non-public local storage directory.
- [x] Store only metadata/path references in MongoDB.
- [x] Add a file checksum/hash for duplicate detection.
- [x] Create report upload endpoint.
- [x] Store patient ID, report type, clinical event date, original filename, MIME type, size, checksum, processing status.
- [x] Add processing states: `uploaded`, `processing`, `processed`, `failed`.
- [x] Connect UploadReportPage.
- [x] Connect PatientReportsPage.
- [x] Add secure report retrieval that verifies patient access before returning the file.
- [x] Reject unsupported file types.
- [x] Reject oversized files.
- [x] Do not log uploaded document contents.
- [x] Add tests for upload validation and authorization.

### Definition of Done

An authorized user can upload a supported synthetic medical PDF/image, see its metadata and processing status, and retrieve it only when authorized. Unsupported/oversized files are rejected.

---

## Phase 7 — Text Extraction, OCR, and Structured Observation Extraction

### Goal

Convert supported medical reports into structured data while preserving extraction uncertainty.

### Dependencies

Phase 6 complete.

### Tasks

- [x] Create `server/src/services/extraction.service.ts`.
- [x] Implement text extraction for text-based PDFs.
- [x] Implement OCR fallback for supported scanned images/PDF pages using the selected OCR library.
- [x] Store extracted text separately from the original document.
- [x] Add extraction status and error metadata.
- [x] Create `server/src/services/normalization.service.ts`.
- [x] Normalize known MVP lab names such as HbA1c, glucose, hemoglobin, creatinine, cholesterol, and blood pressure.
- [x] Preserve the original extracted text alongside normalized fields.
- [x] Parse numeric value and unit separately.
- [x] Store lab-provided reference ranges when available.
- [x] Store the source document ID for every extracted observation.
- [x] Never infer that missing values are normal.
- [x] Add a confidence/verification status such as `extracted`, `needs_review`, `verified`.
- [x] Add a basic duplicate-report check using checksum and metadata.
- [x] Add synthetic sample reports for development tests.
- [x] Add unit tests for parsing and normalization.
- [x] Add failure handling for unreadable documents.
- [x] Connect report processing status to the frontend.

### Definition of Done

A synthetic text PDF containing supported lab values can be uploaded and processed into structured observations with value, unit, date, reference range where available, and source document linkage. OCR/extraction failure is represented explicitly rather than producing false medical data.

---

## Phase 8 — Timeline, Trends, Missing Data, and Conflicts

### Goal

Build the deterministic clinical-information layer that prepares reliable context for AI.

### Dependencies

Phase 7 complete.

### Tasks

- [x] Create `server/src/services/trend.service.ts`.
- [x] Implement chronological sorting using clinical event dates.
- [x] Implement basic trend categories: `increasing`, `decreasing`, `stable`, `fluctuating`, `insufficient_data`.
- [x] Require at least two comparable observations before declaring a trend.
- [x] Ensure comparisons use compatible units.
- [x] Store/return trend evidence as the underlying observation IDs.
- [x] Create `server/src/services/conflict.service.ts`.
- [x] Detect contradictory allergy statements.
- [x] Detect contradictory medication statuses where feasible.
- [x] Detect duplicate/near-duplicate observations.
- [x] Detect missing expected values without labeling them normal.
- [x] Add timeline endpoint.
- [x] Connect Patient Timeline page.
- [x] Add trend cards/graphs for supported observations.
- [x] Add conflict warnings to Patient Overview.
- [x] Add source/evidence links for trends and conflicts.
- [x] Add unit tests for increasing/decreasing/stable/insufficient-data logic.
- [x] Add tests for contradictory records.

### Definition of Done

A patient with multiple synthetic observations sees a chronological timeline and deterministic trend information. Contradictory records are flagged instead of silently resolved. Missing values remain explicitly missing.

---

## Phase 9 — AI Clinical Summary

### Goal

Add an evidence-backed AI summary using only server-selected structured patient context.

### Dependencies

Phase 8 complete.

### Important safety rule

The AI is not a diagnostic/treatment engine.

The prompt and output schema must explicitly prohibit:
- prescribing;
- medication dosage changes;
- definitive diagnosis not already documented;
- unsupported clinical claims.

### Tasks

- [x] Create `server/src/services/ai-summary.service.ts`.
- [x] Create a server-side AI provider abstraction so OpenAI-specific code is isolated.
- [x] Add `OPENAI_API_KEY` and `OPENAI_MODEL` configuration.
- [x] Create a structured AI input schema containing only required patient context.
- [x] Exclude unnecessary direct identifiers from AI context where possible.
- [x] Include current conditions, medications, allergies, observations, trends, conflicts, and source references.
- [x] Build a strict system prompt defining the AI's role as a clinical information summarizer.
- [x] Require structured output with sections: overview, relevant history, current conditions, medications, allergies, recent investigations, important changes, trends, conflicts/missing information, evidence.
- [x] Require each factual statement to reference one or more internal source IDs.
- [x] Reject/store-as-failed AI output that cannot be validated against the expected schema.
- [x] Never expose raw provider errors containing secrets to the frontend.
- [x] Store `AISummary` with patient ID, generatedAt, model identifier, summary content, source IDs, and generation status.
- [x] Create `POST /api/patients/:patientId/ai-summaries`.
- [x] Create `GET /api/patients/:patientId/ai-summaries`.
- [x] Create `GET /api/ai-summaries/:summaryId`.
- [x] Connect Patient AI Summary page.
- [x] Add loading, unavailable, insufficient-data, and error states.
- [x] Display a clear clinician-review disclaimer.
- [x] Add a test using a mocked AI provider; do not make real provider calls in unit tests.
- [x] Verify generated claims are linked to available source IDs.

### Definition of Done

Given synthetic patient records, a doctor can click "Generate Summary", the backend builds a controlled context, the mocked/real configured AI provider returns a structured summary, the summary is persisted, and the UI displays evidence references. AI failure does not break normal EHR access.

---

## Phase 10 — Security, Auditability, and Data Protection

### Goal

Harden the application for sensitive health information.

### Dependencies

Phases 3–9 complete.

### Tasks

- [x] Create `AuditLog.ts`.
- [x] Create `server/src/services/audit.service.ts`.
- [x] Log login/logout and sensitive patient/document access.
- [x] Log creation/update/deletion of important medical records.
- [x] Log AI summary generation.
- [x] Add request IDs to server logs.
- [x] Ensure sensitive request bodies are not logged.
- [x] Add authorization checks to every patient-scoped endpoint.
- [x] Add rate limiting to authentication endpoints.
- [x] Configure secure HTTP headers.
- [x] Configure production-safe CORS.
- [x] Validate all uploaded file metadata and size limits.
- [x] Ensure uploaded files are never served as unrestricted public static files.
- [x] Ensure secrets exist only server-side.
- [x] Review all API responses for accidental patient data leakage.
- [x] Add tests attempting cross-patient access.
- [x] Add tests attempting role escalation.
- [x] Add tests verifying passwords and secrets are absent from responses/logs.
- [x] Document security assumptions and remaining prototype limitations.

### Definition of Done

Security tests demonstrate that unauthorized users cannot access protected patient data, role restrictions are enforced server-side, sensitive files are not publicly accessible, and important sensitive actions create audit records.

---

## Phase 11 — Testing, UX Polish, and Reliability

### Goal

Make the application stable and demonstrable.

### Dependencies

Phases 1–10 complete.

### Tasks

- [ ] Add unit tests for services and utilities.
- [ ] Add integration tests for auth, patient access, reports, and AI summary endpoints.
- [ ] Add Playwright E2E test for register/login/dashboard.
- [ ] Add Playwright E2E test for doctor -> patient -> report upload.
- [ ] Add Playwright E2E test for doctor -> patient -> AI summary.
- [ ] Add loading skeletons to important pages.
- [ ] Add consistent error messages.
- [ ] Add empty states with useful next actions.
- [ ] Add confirmation for destructive operations.
- [ ] Verify keyboard navigation for primary workflows.
- [ ] Verify responsive layouts.
- [ ] Add pagination where lists can grow.
- [ ] Add API error normalization in the frontend HTTP layer.
- [ ] Add structured server logging.
- [ ] Remove debug logs and temporary test UI.
- [ ] Verify synthetic seed data can populate a demo environment.
- [ ] Run full lint/build/test suite.

### Definition of Done

The three critical workflows pass end-to-end:

1. Register/login -> dashboard.
2. Doctor -> patient -> upload report -> structured observation.
3. Doctor -> patient -> generate AI summary -> evidence-backed result.

No critical console errors, lint errors, build errors, or failing automated tests remain.

---

## Phase 12 — Deployment and Documentation

### Goal

Deploy a reproducible demonstration environment.

### Dependencies

Phase 11 complete.

### Tasks

- [ ] Create production build configuration for client.
- [ ] Create production server configuration.
- [ ] Configure MongoDB Atlas or equivalent production MongoDB.
- [ ] Configure production object storage.
- [ ] Configure production AI API key through deployment secrets.
- [ ] Configure secure cookie settings for HTTPS.
- [ ] Configure production CORS.
- [ ] Add Dockerfile for server.
- [ ] Add Dockerfile for client if the selected deployment requires it.
- [ ] Add deployment documentation to `README.md`.
- [ ] Document all required environment variables.
- [ ] Document synthetic demo account setup.
- [ ] Document AI limitations and clinician-review disclaimer.
- [ ] Document backup/recovery assumptions.
- [ ] Document known limitations around OCR and medical interpretation.
- [ ] Verify deployed frontend can reach deployed API.
- [ ] Verify deployed API can reach MongoDB.
- [ ] Verify a synthetic patient can be created and viewed.
- [ ] Verify report upload works in the deployed environment.
- [ ] Verify AI summary generation works with configured provider.
- [ ] Verify no secret is visible in browser source or network responses.

### Definition of Done

A fresh user can follow the README, configure environment variables, run the application locally, and a deployed demo can execute the complete synthetic patient workflow without exposing secrets.

---

# 6. DATA MODEL

## 6.1 User

```text
User
- _id
- name
- email
- passwordHash
- role: patient | doctor | admin
- createdAt
- updatedAt
```

Relationships:

```text
User 1 --- N DoctorPatientAccess
User 1 --- 1 Patient (for patient role, where applicable)
User 1 --- N AuditLog
```

---

## 6.2 Patient

```text
Patient
- _id
- patientCode
- userId?                  // optional link to patient account
- firstName
- lastName
- dateOfBirth
- sex
- contact
- address
- emergencyContact?
- createdAt
- updatedAt
```

Do not use name as the primary identity key.

---

## 6.3 DoctorPatientAccess

```text
DoctorPatientAccess
- _id
- doctorId
- patientId
- status: active | revoked
- grantedAt
- revokedAt?
- createdAt
- updatedAt
```

Relationship:

```text
Doctor/User
    |
    | 1:N
    v
DoctorPatientAccess
    |
    | N:1
    v
Patient
```

---

## 6.4 Encounter

```text
Encounter
- _id
- patientId
- doctorId
- type
- reason
- notes
- occurredAt
- createdAt
- updatedAt
```

---

## 6.5 Condition

```text
Condition
- _id
- patientId
- name
- status: active | resolved | unknown
- diagnosedAt?
- resolvedAt?
- notes?
- sourceDocumentId?
- createdAt
- updatedAt
```

---

## 6.6 Medication

```text
Medication
- _id
- patientId
- name
- dosage?
- frequency?
- route?
- status: active | discontinued | completed | unknown
- startDate?
- endDate?
- sourceDocumentId?
- notes?
- createdAt
- updatedAt
```

---

## 6.7 Allergy

```text
Allergy
- _id
- patientId
- substance
- reaction?
- status: active | resolved | unknown
- sourceDocumentId?
- recordedAt
- createdAt
- updatedAt
```

---

## 6.8 Observation

```text
Observation
- _id
- patientId
- type
- normalizedName
- originalName
- value
- unit
- referenceLow?
- referenceHigh?
- observedAt
- sourceDocumentId?
- extractionStatus: extracted | needs_review | verified
- createdAt
- updatedAt
```

Important rule:

```text
No observation != normal observation
```

---

## 6.9 Document

```text
Document
- _id
- patientId
- uploadedBy
- originalFileName
- mimeType
- sizeBytes
- storageKey
- checksum
- extractionStatus
- extractedText?
- uploadedAt
- processedAt?
- createdAt
- updatedAt
```

---

## 6.10 MedicalReport

```text
MedicalReport
- _id
- patientId
- documentId
- reportType
- clinicalEventDate
- laboratoryName?
- reportNumber?
- processingStatus
- notes?
- createdAt
- updatedAt
```

---

## 6.11 AISummary

```text
AISummary
- _id
- patientId
- generatedBy
- model
- status: processing | completed | failed
- summary
- sourceIds[]
- generatedAt
- errorCode?
- createdAt
- updatedAt
```

The summary should retain references to the records used to generate it.

---

## 6.12 AuditLog

```text
AuditLog
- _id
- actorUserId
- action
- resourceType
- resourceId
- patientId?
- requestId?
- metadata?
- createdAt
```

Never store unnecessary sensitive document contents in audit metadata.

---

# 7. OPEN QUESTIONS / ASSUMPTIONS

## 7.1 Current assumptions

- The project is primarily a college/final-year portfolio project and will initially use synthetic patient data.
- MERN is mandatory/preferred, so MongoDB + Express + React + Node.js is the base architecture.
- TypeScript is preferred over JavaScript for both frontend and backend.
- REST is preferred over GraphQL for simplicity and phase-by-phase implementation.
- The MVP supports PDF/image medical documents rather than every possible medical data format.
- AI summarization uses a server-side OpenAI integration behind an abstraction layer.
- Local OCR is acceptable for the MVP; cloud OCR is optional later.
- Doctors are the primary AI-summary users.
- The doctor remains responsible for clinical interpretation.
- The application is not intended to provide autonomous diagnosis or treatment.
- MongoDB is used for structured metadata and records.
- Uploaded documents are stored outside MongoDB itself.
- The exact production hosting provider is intentionally undecided.
- The exact OpenAI model is intentionally configured through `OPENAI_MODEL` rather than hard-coded into application logic.
- FHIR compatibility is a future enhancement rather than a strict MVP requirement.

## 7.2 Decisions still required before production

1. **Deployment provider**
   - Suggested possibilities: Render/Railway/Fly.io for the backend, Vercel/Netlify for the frontend, MongoDB Atlas for database.
   - Final choice should be made before Phase 12.

2. **Object storage**
   - Local storage is used for development.
   - S3-compatible storage is recommended for production.

3. **AI provider/model**
   - Use the provider abstraction so the project is not coupled to one model.
   - Select the exact model based on current API availability, cost, structured-output support, latency, and project requirements.

4. **OCR strategy**
   - Start with local OCR.
   - Move to a cloud OCR provider only if synthetic test reports demonstrate insufficient accuracy.

5. **Patient/doctor registration**
   - MVP development may permit controlled role selection.
   - Production should use admin approval/invitation for doctor accounts.

6. **Consent model**
   - The MVP should document that explicit patient-consent workflows are not fully implemented.
   - A real deployment would require a proper consent/access model appropriate to its jurisdiction.

7. **Regulatory/privacy requirements**
   - Before handling real patient data, determine applicable Indian and/or deployment-jurisdiction privacy, security, medical-device, and health-data requirements.
   - Do not represent the college prototype as a certified clinical system.

8. **Medical terminology standard**
   - MVP can use a controlled internal vocabulary.
   - Future versions should evaluate FHIR, SNOMED CT, LOINC, ICD, or other appropriate standards/licensing requirements.

9. **AI evaluation**
   - Before claiming that AI summaries are clinically reliable, define an evaluation dataset, factuality checks, source-grounding tests, and human review process.
   - Do not claim clinical accuracy from a small demo.

10. **Real data**
    - Do not use real identifiable patient records during development or demos unless the necessary authorization, consent, security, and legal requirements have been addressed.

---

# FINAL BUILD ORDER

The coding assistant must follow this exact order:

```text
Phase 1  Foundation
   ↓
Phase 2  Application Shell
   ↓
Phase 3  Authentication
   ↓
Phase 4  Patient + Access Management
   ↓
Phase 5  Core Medical Records
   ↓
Phase 6  Document Upload
   ↓
Phase 7  OCR + Structured Extraction
   ↓
Phase 8  Timeline + Trends + Conflicts
   ↓
Phase 9  AI Summary
   ↓
Phase 10 Security + Audit
   ↓
Phase 11 Testing + Polish
   ↓
Phase 12 Deployment
```

**Execution rule:** Never skip a phase. Never implement future-phase functionality while executing an earlier phase. Each phase must pass its Definition of Done before the next phase is started.
