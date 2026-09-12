# Execution Flow

This document maps the repository's actual runtime paths. It should be updated whenever a code change adds or changes an entry point, module dependency, function call, or execution order.

## Entry points

```text
npm run dev
  -> root package.json `dev`
  -> concurrently starts server and client workspace development commands

Server path
  -> server/src/server.ts:startServer() ← modified in Phase 1
  -> server/src/config/env.ts:env ← modified in Phase 1
  -> server/src/config/database.ts:connectDatabase() ← modified in Phase 1
  -> MongoDB
  -> server/src/app.ts:createApp() ← modified in Phase 1
  -> Express listens on PORT (default 5000)

Client path
  -> Vite serves client/index.html on port 5173
  -> client/src/main.tsx
  -> client/src/App.tsx:App() ← modified in Phase 2
  -> client/src/routes/AppRouter.tsx:AppRouter() ← modified in Phase 2
  -> client/src/routes/ProtectedRoute.tsx:ProtectedRoute() ← modified in Phase 2
  -> client/src/components/layout/AppShell.tsx:AppShell() ← modified in Phase 2
  -> route-specific page component
```

## Health-check request flow

```text
Browser
  -> client/src/pages/DashboardPage.tsx:health query
  -> http://localhost:5000/api/health (default VITE_API_BASE_URL)
  -> server/src/app.ts:createApp()
  -> Express CORS and JSON middleware
  -> server/src/routes/index.ts:apiRouter GET /health ← modified in Phase 1
  -> HTTP 200 { "status": "ok" }
  -> TanStack Query caches the health response
  -> browser displays “Connected” on the dashboard
```

## Phase 1 status

The complete Phase 1 path is verified: MongoDB is connected, the API listens on port 5000, and the client at `http://localhost:5173` displays “Backend connected.”

## Phase 2 status

The application shell, route map, responsive navigation, placeholder screens, reusable UI primitives, TanStack Query provider, and UI-only sidebar store are initialized. Authentication remains a permissive placeholder until Phase 3.

## Phase 3 status

Authentication is complete: login/register issue an access token and an httpOnly refresh cookie, the client restores sessions through `/api/auth/refresh`, protected routes require authenticated user state, and the lifecycle is covered by database-backed integration tests.

## Authentication flow

```text
LoginPage or RegisterPage
  -> client/src/api/authApi.ts
  -> client/src/api/http.ts with credentials included
  -> server/src/routes/auth.routes.ts
  -> server/src/controllers/auth.controller.ts
  -> server/src/services/auth.service.ts (selected login role is checked against the stored role) ← modified
  -> server/src/models/User.ts -> MongoDB
  -> access token response + httpOnly refresh cookie

LoginPage role selection
  -> client/src/pages/LoginPage.tsx (patient or doctor) ← modified
  -> client/src/features/auth/AuthProvider.tsx
  -> client/src/api/authApi.ts
  -> POST /api/auth/login with role ← modified

RegisterPage role selection
  -> client/src/pages/RegisterPage.tsx (patient or doctor) ← modified
  -> client/src/features/auth/AuthProvider.tsx
  -> client/src/api/authApi.ts
  -> POST /api/auth/register with role ← modified

Patient dashboard flow
  -> client/src/pages/DashboardPage.tsx:PatientDashboard() ← modified
  -> GET /api/patients to resolve the authenticated patient's record
  -> GET /api/patients/:patientId/{conditions,medications,allergies,observations}
  -> GET /api/patients/:patientId/timeline
  -> GET /api/patients/:patientId/reports
  -> summary cards, recent activity, and health trends

Browser reload
  -> client/src/features/auth/AuthProvider.tsx:restoreSession()
  -> POST /api/auth/refresh
  -> rotated refresh cookie + access token
  -> GET /api/auth/me with Bearer access token
  -> ProtectedRoute.tsx redirects to /login when no user is restored
```

## Phase 4 status

Patient management is complete for the MVP slice: authenticated doctors can create patients, receive active access, list/search authorized patients, open and update records, while unauthorized doctors receive `403`. Patient creation, viewing, and updating write audit events.

## Patient flow

```text
PatientsPage
  -> client/src/api/patientApi.ts
  -> GET /api/patients with Bearer access token
  -> server/src/routes/patient.routes.ts
  -> server/src/middleware/auth.middleware.ts
  -> server/src/controllers/patient.controller.ts
  -> server/src/services/patient.service.ts
  -> server/src/repositories/patient.repository.ts
  -> Patient + DoctorPatientAccess models -> MongoDB

PatientOverviewPage
  -> GET /api/patients/:patientId
  -> requirePatientAccess()
  -> doctor access record or patient ownership check
  -> patient.viewed audit event
```

## Phase 5 status

Core medical records are complete: authorized users can manage encounters, conditions, medications, allergies, and observations through patient-scoped routes. The overview and medications screens read these records through TanStack Query, and the API tests cover validation and cross-patient isolation.

## Medical record flow

```text
PatientOverviewPage or PatientMedicationsPage
  -> client/src/api/patientApi.ts
  -> /api/patients/:patientId/:resource
  -> server/src/routes/medical-record.routes.ts
  -> requirePatientAccess()
  -> server/src/controllers/medical-record.controller.ts
  -> server/src/services/medical-record.service.ts
  -> server/src/repositories/medical-record.repository.ts
  -> entity model -> MongoDB
```

## Phase 6 status

Document upload is complete for the MVP boundary: authorized users can upload supported PDF/PNG/JPEG files, view metadata and processing status, download private files, and delete reports. Unsupported, oversized, duplicate, and unauthorized requests are rejected.

## Report upload flow

```text
UploadReportPage
  -> client/src/api/reportApi.ts multipart request
  -> server/src/routes/patient.routes.ts
  -> requirePatientAccess()
  -> handleReportUpload() / Multer memory storage
  -> server/src/controllers/report.controller.ts
  -> server/src/services/report.service.ts
  -> server/src/services/document.service.ts
  -> SHA-256 duplicate check
  -> private storage provider + Document/MedicalReport models -> MongoDB

PatientReportsPage download
  -> GET /api/patients/:patientId/reports/:reportId
  -> requirePatientAccess()
  -> document.service.ts read
  -> authenticated file response
```

## Phase 7 status

Report processing is complete for the MVP extraction boundary: text PDFs are parsed, supported images use OCR, extracted text and failures are persisted, known lab values become source-linked observations, and processing status is visible in the reports UI.

## Extraction flow

```text
report.service.ts:processReport()
  -> extraction.service.ts:extractText()
  -> PDFParse or Tesseract
  -> Document.extractedText / extractionStatus
  -> normalization.service.ts:normalizeObservations()
  -> Observation records with sourceDocumentId and extractionStatus
  -> MedicalReport.processingStatus = processed or failed
```

## Phase 8 status

Timeline intelligence is complete: authorized patient timelines combine encounters, conditions, medications, allergies, observations, and reports; deterministic trends require compatible observations; conflicts and their evidence IDs appear in timeline and overview views.

## Timeline intelligence flow

```text
GET /api/patients/:patientId/timeline
  -> requirePatientAccess()
  -> timeline.service.ts:getPatientTimeline()
  -> timeline.repository.ts patient-scoped record reads
  -> trend.service.ts:calculateTrends()
  -> conflict.service.ts:detectConflicts()
  -> sorted events + trend evidence + conflict evidence
```

## Phase 9 status

AI summaries are complete for the MVP boundary: doctors/admins can generate structured summaries from server-selected context, every factual item must cite available evidence IDs, invalid output is persisted as failed, and the client displays clinician-review and provider-unavailable states.

## AI summary flow

```text
PatientAIPage
  -> client/src/api/aiApi.ts
  -> POST /api/patients/:patientId/ai-summaries
  -> requirePatientAccess()
  -> ai-summary.controller.ts role check
  -> ai-summary.service.ts context + source validation
  -> ai-provider.service.ts server-only provider
  -> AISummary model -> MongoDB
  -> structured summary with evidence IDs
```

## Phase 10 status

Baseline security hardening is complete: requests receive IDs, Helmet sets secure headers, authentication is rate-limited, patient-scoped operations enforce access checks, and successful sensitive operations create audit records without storing request bodies or document contents.

## Security flow

```text
HTTP request
  -> request-id.middleware.ts
  -> helmet()
  -> credentialed CORS
  -> auth rate limiter for /api/auth
  -> requireAuth / requirePatientAccess
  -> route handler
  -> auditSensitiveResponse for patient-scoped sensitive routes
  -> AuditLog with actor, action, resource, patient, and request ID
```

## Phase 6 status

Document upload is complete for the MVP boundary: authorized users can upload supported PDF/PNG/JPEG files, view metadata and processing status, download private files, and delete reports. Unsupported, oversized, duplicate, and unauthorized requests are rejected.

## Report upload flow

```text
UploadReportPage
  -> client/src/api/reportApi.ts multipart request
  -> server/src/routes/patient.routes.ts
  -> requirePatientAccess()
  -> handleReportUpload() / Multer memory storage
  -> server/src/controllers/report.controller.ts
  -> server/src/services/report.service.ts
  -> SHA-256 duplicate check
  -> private storage provider + Document/MedicalReport models -> MongoDB

PatientReportsPage download
  -> GET /api/patients/:patientId/reports/:reportId
  -> requirePatientAccess()
  -> private storage provider read
  -> authenticated file response
```

## Update format for future code changes

For each runtime path, document the precise sequence and mark changed nodes with `← modified`:

```text
<entry command or handler>
  -> <file>:<exported function>
  -> <file>:<function>
  -> <module or external boundary> ← modified
```
