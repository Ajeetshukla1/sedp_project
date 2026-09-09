# Decision Log

This file records meaningful engineering decisions made while changing this repository. It is not a chronological activity log; routine edits and commands are intentionally omitted.

## 2026-08-23 — Use a repository decision log

**Context:** The project needs an auditable record of significant implementation choices, including library selection, architectural patterns, and accepted tradeoffs.

**Alternatives considered:** Keep rationale only in commit messages or pull requests; create a separate record for every change; or maintain one repository-level log.

**Decision:** Maintain this root-level `decision.md` and require the `karpathy-guidelines` skill to update it alongside relevant code changes.

**Rationale:** A single, version-controlled document is easy to discover and keeps the explanation adjacent to the code history without turning routine work into documentation overhead.

**Consequences:** Entries are limited to meaningful decisions; the log will not capture mechanical actions, routine formatting, or ordinary test execution.

## 2026-08-23 — Establish a three-workspace TypeScript monorepo

**Context:** Phase 1 needs independently runnable React and Express applications with a shared TypeScript package, while keeping installation and common checks simple.

**Alternatives considered:** Separate repositories; a single package with client and server code mixed together; or npm workspaces for `client`, `server`, and `shared`.

**Decision:** Use npm workspaces, with root scripts delegating development, linting, building, formatting, and tests to each package.

**Rationale:** Workspaces preserve a clear frontend/backend boundary and make shared code available without publishing a package or adding monorepo tooling beyond npm.

**Consequences:** All packages share one lockfile and are installed from the repository root. A workspace package must expose its own scripts when it participates in a root check.

## 2026-08-23 — Keep the Phase 1 API surface to a health check

**Context:** The foundation must prove frontend/backend communication without introducing authentication or medical-record behavior scheduled for later phases.

**Alternatives considered:** Implement future resource routes as placeholders; use a mocked API; or expose only `GET /api/health`.

**Decision:** Expose only `GET /api/health`, returning `{ "status": "ok" }`, and have the React page call it through `VITE_API_BASE_URL`.

**Rationale:** This provides an observable integration path while maintaining the plan's phase boundary.

**Consequences:** The page shows an unavailable status until the API and MongoDB are started. No application routes, authentication, or clinical data behavior exists yet.

## 2026-08-23 — Resolve configuration from the repository root

**Context:** npm workspace commands run with a package working directory, while the project specifies one root `.env` file.

**Alternatives considered:** Duplicate `.env` files in each workspace; require shell-exported variables; or resolve the root file from the server and configure Vite to use it.

**Decision:** The server loads `.env` from its current directory or its parent, and Vite uses the repository root as its environment directory.

**Rationale:** One environment file keeps local configuration consistent without putting server secrets in the client package.

**Consequences:** Only `VITE_`-prefixed values are exposed to browser code; server-only variables remain available only to the Express process.

## 2026-08-25 — Establish a placeholder application shell for Phase 2

**Context:** Phase 2 requires every MVP frontend route to render inside a consistent responsive shell before authentication and clinical business logic exist.

**Alternatives considered:** Keep the Phase 1 health-check page, build pages independently without routing, or add a permissive placeholder guard and shared shell now.

**Decision:** Use React Router with a permissive `ProtectedRoute`, a sidebar application shell, TanStack Query for the dashboard health query, and Zustand only for sidebar UI state. Keep all route screens informational placeholders until their backend phases are implemented.

**Rationale:** This satisfies the Phase 2 navigation and layout contract while preserving the explicit Phase 3 authentication boundary and the Phase 1 health integration.

**Consequences:** Routes are navigable without real authentication, and the placeholder guard must be replaced with session-aware behavior in Phase 3. `lucide-react` is added for consistent accessible icon controls.

## 2026-08-26 — Use short-lived access tokens with cookie refresh tokens

**Context:** Phase 3 needs browser authentication without exposing refresh credentials or server secrets to React.

**Alternatives considered:** Store both tokens in browser storage; use a server session store; or keep the access token in client memory and refresh through an httpOnly cookie.

**Decision:** Return a short-lived access token from login/register, keep it in the in-memory auth provider, and issue a rotated refresh token in a `SameSite=Lax`, httpOnly cookie scoped to `/api/auth`.

**Rationale:** Protected API calls can use the access token while refresh credentials remain inaccessible to JavaScript. Public registration always creates a `patient` account so privileged roles cannot be self-assigned.

**Consequences:** A full browser reload restores the session through `/api/auth/refresh`. Stateless refresh tokens do not yet support server-side revocation; persistent revocation belongs with later security hardening.

## 2026-08-26 — Keep medical records under patient-scoped routes

**Context:** Phase 5 introduces several related clinical entities that must share the Phase 4 patient-isolation boundary.

**Alternatives considered:** Expose top-level record endpoints with repeated access checks, or mount each entity beneath `/api/patients/:patientId` and reuse one access middleware.

**Decision:** Use patient-nested REST routes for encounters, conditions, medications, allergies, and observations. Every repository mutation and query includes `patientId`, and only doctors/admins can write records.

**Rationale:** The URL and query shape make the ownership boundary explicit and prevent record IDs from becoming an alternate path around patient authorization.

**Consequences:** Cross-patient access is rejected centrally, while future report/document references can be added without changing the core medical-record contract.

## 2026-08-26 — Keep uploaded files private and metadata in MongoDB

**Context:** Phase 6 needs synthetic PDF/image uploads without exposing medical files as public static assets or storing binary content in MongoDB.

**Alternatives considered:** Store file bytes in MongoDB, serve a public upload directory, or use a storage provider abstraction with private local development storage.

**Decision:** Accept one controlled multipart file in memory, hash it with SHA-256, persist it under a generated private storage key, and store only metadata and the storage key in MongoDB. Local storage is the active provider; S3 remains an extension point.

**Rationale:** Patient access is checked before retrieval, generated keys avoid trusting filenames, and checksums provide deterministic duplicate detection without exposing document contents.

**Consequences:** Upload processing remains in the `uploaded` state until Phase 7 adds extraction. Production must configure a private S3-compatible provider before handling real documents.

## 2026-09-05 — Require an explicit role during login

**Context:** A login request without a selected role could bypass the patient/doctor account-type check.

**Alternatives considered:** Keep the role optional, infer it from the account, or require the selected role at the API boundary.

**Decision:** Require `patient` or `doctor` in every login request and compare it with the stored account role.

**Rationale:** The server must enforce the same account type selected in the UI; omitted roles must fail instead of silently authenticating.

**Consequences:** All login clients must send an explicit role, and admin accounts require a separate controlled authentication path.

## 2026-09-05 — Build the patient dashboard from scoped records

**Context:** Patient users need a dashboard matching the product reference while preserving patient-level data isolation.

**Alternatives considered:** Use placeholder counts, add a patient-only API endpoint, or compose the dashboard from the existing patient, medical-record, timeline, and report endpoints.

**Decision:** Compose the patient dashboard from existing scoped endpoints and switch shell navigation based on the authenticated role. Doctors and admins keep the clinician dashboard.

**Rationale:** Reusing existing authorization boundaries avoids duplicating server behavior and keeps displayed counts, activity, and trends tied to the patient record.

**Consequences:** The patient dashboard shows empty states until the patient's record contains data; the existing dashboard API requests remain active for clinician users.

## 2026-09-05 — Let public registration choose patient or doctor

**Context:** Account creation needs to offer the same patient and doctor choices as login.

**Alternatives considered:** Keep public registration patient-only, accept arbitrary roles from the client, or accept only the two public roles and reject admin escalation.

**Decision:** Require a `patient` or `doctor` role during registration and persist the validated value. Public registration cannot create an admin account.

**Rationale:** The requested account type is explicit and consistent across registration and login, while privileged admin creation remains outside the public flow.

**Consequences:** Existing callers must include one of the two registration roles; admin accounts must continue to be provisioned through a controlled server-side process.

## 2026-09-05 — Enforce the selected login role

**Context:** The login screen needs separate doctor and patient options, and selecting the wrong option must not merely change presentation.

**Alternatives considered:** Use a client-only selector, add separate login endpoints, or send the selected role through the existing endpoint and validate it against the stored account.

**Decision:** Keep one `/auth/login` endpoint, send `patient` or `doctor` from the client, and reject a role mismatch with the existing generic invalid-credentials response. Omitted roles remain accepted for existing API callers.

**Rationale:** This keeps the public API small while making the two login paths meaningful and preventing account-type confusion or client-side bypasses.

**Consequences:** The client exposes only patient and doctor login options; admin accounts are not selectable through this UI and existing callers without a role retain compatibility.

## 2026-09-05 — Require a role on every login request

**Context:** Login role matching could be bypassed by omitting the role from a direct or stale client request.

**Alternatives considered:** Keep role optional for backward compatibility, infer a role from the account, or require the selected patient/doctor role at the API boundary.

**Decision:** Make `role` required in the login schema and accept only `patient` or `doctor`.

**Rationale:** Authentication must validate the same account type the user selected; omission must fail instead of silently choosing an account role.

**Consequences:** All login clients must send an explicit role, and admin accounts require a separate controlled authentication path.

## 2026-08-26 — Preserve extraction uncertainty in structured observations

**Context:** Phase 7 converts synthetic reports into observations while avoiding unsupported clinical inference.

**Alternatives considered:** Treat extracted text as authoritative, silently discard unreadable reports, or persist source text, extraction status, confidence, units, and source document links together.

**Decision:** Use `pdf-parse` for text PDFs and Tesseract for image OCR. Persist extracted text and explicit `completed`/`failed` metadata, create only values directly parsed from supported lab names, and mark generated observations as `extracted` with their source document ID.

**Rationale:** Clinicians can distinguish extracted data from verified data, review the original text, and see when processing failed. Missing values are ignored rather than represented as normal values.

**Consequences:** OCR quality and parser coverage remain limited to the MVP vocabulary; broader formats and human verification workflows remain future work.

## 2026-08-26 — Compute timeline intelligence deterministically

**Context:** Phase 8 needs reliable clinical context before any AI summary is introduced.

**Alternatives considered:** Ask the AI to infer trends and conflicts, return raw records only, or compute deterministic results from compatible observations and record statuses.

**Decision:** Sort timeline events by clinical dates, require two same-unit observations for a trend, classify changes as increasing/decreasing/stable/fluctuating/insufficient, and flag contradictory statuses and duplicate observations with evidence IDs.

**Rationale:** Deterministic rules are testable, transparent, and prevent missing or incompatible values from being presented as clinical conclusions.

**Consequences:** Current conflict detection covers status contradictions and exact observation duplicates; more advanced near-duplicate and expected-value rules remain future refinements.

## 2026-08-26 — Gate AI summaries behind structured source validation

**Context:** Phase 9 adds summarization over the deterministic clinical layer without turning the system into a diagnostic or treatment engine.

**Alternatives considered:** Return free-form provider text, send raw patient records directly to OpenAI, or use a server-side provider abstraction with a minimal structured context and validated source citations.

**Decision:** Build AI context from timeline records, trends, conflicts, and evidence IDs; require a structured schema where every factual statement cites source IDs; persist invalid/provider-failed generations as `failed`; and expose only sanitized errors to the client.

**Rationale:** Source validation makes summaries auditable, preserves the clinician-in-the-loop boundary, and keeps provider credentials on the server.

**Consequences:** OpenAI generation is unavailable until server environment variables are configured. Mocked providers cover tests, while provider-specific behavior remains isolated for later replacement or evaluation.

## 2026-08-26 — Add baseline HTTP and audit hardening

**Context:** Phase 10 needs a consistent security baseline across protected patient, document, and AI routes.

**Alternatives considered:** Add hardening ad hoc within each controller, rely on application logs only, or centralize request IDs, Helmet headers, auth rate limiting, and response-level audit events.

**Decision:** Apply request IDs and Helmet at app level, rate-limit the auth router, preserve credentialed allowlisted CORS, and audit successful sensitive patient operations without recording request bodies or document contents.

**Rationale:** Central middleware reduces missed endpoints and gives sensitive operations a request-correlated audit trail while preserving existing route behavior.

**Consequences:** Audit persistence is failure-tolerant and stateless refresh-token revocation, distributed rate limiting, and external log retention remain production hardening work.

## 2026-08-26 — Keep uploaded files private and metadata in MongoDB

**Context:** Phase 6 needs synthetic PDF/image uploads without exposing medical files as public static assets or storing binary content in MongoDB.

**Alternatives considered:** Store file bytes in MongoDB, serve a public upload directory, or use a storage provider abstraction with private local development storage.

**Decision:** Accept one controlled multipart file in memory, hash it with SHA-256, persist it under a generated private storage key, and store only metadata and the storage key in MongoDB. Local storage is the active provider; S3 remains an extension point.

**Rationale:** Patient access is checked before retrieval, generated keys avoid trusting filenames, and checksums provide deterministic duplicate detection without exposing document contents.

**Consequences:** Upload processing remains in the `uploaded` state until Phase 7 adds extraction. Production must configure a private S3-compatible provider before handling real documents.
