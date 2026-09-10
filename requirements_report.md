# Requirements Report

## Digital Health Record Management System

**Source documents:** [srs.md](srs.md), [plan.md](plan.md), [flow.md](flow.md), and `CareFrame_Complete_UML_Diagram.pdf`  
**Report date:** 2026-09-10  
**Project status:** MVP implementation review

## 1. Executive Summary

CareFrame is a clinical information management and summarization system for consolidating fragmented patient records into a chronological, evidence-backed view. The system supports doctors, patients, and administrators while preserving server-side authorization and clinician responsibility.

The current requirements are coherent with the system's stated MVP scope. The most important requirements are patient isolation, private report handling, evidence-linked summaries, explicit uncertainty, and continued record access when AI generation is unavailable.

The UML document describes seven complementary system views:

1. Use case diagram
2. Class diagram
3. AI clinical summary sequence diagram
4. Report processing and AI activity diagram
5. Component diagram
6. Deployment diagram
7. Report processing state machine diagram

## 2. Stakeholders and User Needs

| Stakeholder       | Primary needs                                                                                    | Main requirement groups                                              |
| ----------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Doctor            | Quickly review authorized patient history, records, reports, trends, conflicts, and AI summaries | Access, patient management, records, timeline, AI, audit             |
| Patient           | View and maintain permitted personal information and upload reports                              | Authentication, patient scope, reports, profile, permitted summaries |
| Administrator     | Manage users and access, review audit events, configure limited system behavior                  | Administration, authorization, audit, security                       |
| Clinical reviewer | Verify that generated statements are supported by source evidence                                | Evidence, provenance, uncertainty, AI safety                         |
| System operator   | Deploy, monitor, secure, and maintain the platform                                               | Deployment, reliability, performance, configuration                  |

## 3. Requirements Summary

### 3.1 Functional requirements by area

| Area                  | Requirement IDs                    | Summary                                                                                     | Priority |
| --------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- | -------- |
| Authentication        | FR-AUTH-001 to FR-AUTH-011         | Registration, role-aware login, token lifecycle, session restoration, logout, rate limiting | Must     |
| Authorization         | FR-ACCESS-001 to FR-ACCESS-007     | Patient-scoped access, role enforcement, cross-patient isolation, auditing                  | Must     |
| Patient management    | FR-PAT-001 to FR-PAT-007           | Create, list, search, view, update, validate, and audit patient profiles                    | Must     |
| Medical records       | FR-REC-001 to FR-REC-010           | Manage encounters, conditions, medications, allergies, observations, and provenance         | Must     |
| Reports               | FR-REPORT-001 to FR-REPORT-010     | Private PDF/image upload, metadata, download, deletion, status, and audit                   | Must     |
| Extraction            | FR-EXTRACT-001 to FR-EXTRACT-007   | PDF/OCR extraction, failure state, normalization, source linkage, uncertainty               | Must     |
| Timeline intelligence | FR-TIMELINE-001 to FR-TIMELINE-008 | Chronology, compatible trends, conflict detection, evidence, insufficient data              | Must     |
| AI summaries          | FR-AI-001 to FR-AI-012             | Minimal context, structured output, evidence citations, clinician review, safe failures     | Must     |
| Administration        | FR-ADMIN-001 to FR-ADMIN-005       | User/access management, audit review, safe audit data                                       | Should   |
| Frontend UX           | FR-UI-001 to FR-UI-007             | Routes, protected screens, role-aware actions, state handling, responsive interface         | Must     |

### 3.2 Non-functional requirements by quality attribute

| Attribute       | Key requirements               | Expected outcome                                                                 |
| --------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Security        | NFR-SEC-001 to NFR-SEC-007     | Protected transport, cookies, headers, rate limits, authorization, private files |
| Privacy         | Section 7.2 and Section 6.3    | Technical readiness for privacy review and controlled data retention             |
| Performance     | NFR-PERF-001 to NFR-PERF-004   | Responsive API/UI and isolated intensive processing                              |
| Reliability     | NFR-REL-001 to NFR-REL-004     | AI and extraction failures do not destroy core record availability               |
| Maintainability | NFR-MAINT-001 to NFR-MAINT-004 | Separated layers, shared types, consistent checks, focused tests                 |
| Accessibility   | NFR-UX-001 to NFR-UX-003       | Keyboard-accessible, responsive, browser-compatible interface                    |

## 4. UML-to-Requirements Traceability

| UML view                                 | Main behavior represented                                                                              | Related requirements                                           | Traceability assessment                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Use Case Diagram                         | User interactions with authentication, patient records, reports, and AI assistance                     | FR-AUTH, FR-ACCESS, FR-PAT, FR-REC, FR-REPORT, FR-AI, FR-ADMIN | Covers the primary actor-to-system boundary. Detailed authorization rules remain in the SRS.                                   |
| Class Diagram                            | Domain entities and relationships such as users, patients, records, reports, summaries, and audit data | Sections 4, 6.1, and 6.2                                       | Supports the required ownership and provenance model. Field-level constraints must be verified against implementation schemas. |
| Sequence Diagram: AI Clinical Summary    | Request, authorization, context construction, provider call, validation, persistence, and response     | FR-AI-001 to FR-AI-012, FR-ACCESS-005, FR-EXTRACT-005          | Directly supports evidence-backed generation and failure handling.                                                             |
| Activity Diagram: Report Processing + AI | Upload, extraction/OCR, normalization, timeline/context preparation, AI generation, and result states  | FR-REPORT, FR-EXTRACT, FR-TIMELINE, FR-AI                      | Covers the principal processing workflow and its decision points.                                                              |
| Component Diagram                        | Frontend, API, services, repositories, database, storage, extraction, and AI provider boundaries       | Sections 3.1, 3.2, 5.3, and 5.4                                | Consistent with the layered TypeScript monorepo architecture.                                                                  |
| Deployment Diagram                       | Browser/client, backend, database, storage, and external AI service deployment boundaries              | Sections 3.1, 3.3, 5, NFR-SEC, NFR-REL                         | Supports the requirement that secrets and provider access remain server-side.                                                  |
| State Machine: Report Processing         | Report lifecycle states from upload through processing, success, or failure                            | FR-REPORT-009, FR-EXTRACT-003, NFR-REL-002                     | Supports visible processing status and preservation of failed reports.                                                         |

## 5. Critical Requirement Analysis

### 5.1 Patient isolation

Patient isolation is the highest-risk access requirement. It must be enforced in backend middleware, services, repositories, and database filters. Frontend route visibility is not sufficient.

**Verification evidence required:**

- authorized doctor can access an assigned patient;
- unauthorized doctor receives forbidden response;
- patient cannot access another patient's records;
- report download, deletion, and AI-summary endpoints enforce the same boundary;
- automated integration tests cover every patient-scoped resource.

### 5.2 AI safety and evidence

AI output is acceptable only when it summarizes existing records, distinguishes uncertainty, and cites source evidence. The system must reject or mark as failed any output that contains unsupported factual claims or violates the clinical boundary.

**Verification evidence required:**

- provider receives minimal, authorized context;
- every factual item contains valid evidence identifiers;
- generated content displays clinician-review labeling;
- provider failure leaves records and deterministic timeline available;
- no prompt or response contains server secrets.

### 5.3 Document privacy and processing

Uploaded reports contain sensitive information and must remain private. The system should store metadata in MongoDB and file bytes in private storage using generated keys. Extraction failures must preserve the original report and expose a failed status.

**Verification evidence required:**

- unsupported, oversized, duplicate, and unauthorized uploads are rejected;
- public static access cannot retrieve a report;
- authorized download succeeds;
- extracted observations link back to the source report;
- failed extraction does not create normal-valued observations.

### 5.4 Missing data and uncertainty

Missing values, incompatible units, unreadable documents, and insufficient observations must remain explicit. The system must not infer normality from absence.

**Verification evidence required:**

- one observation produces an insufficient trend state;
- incompatible units do not produce a trend;
- unreadable report produces an extraction failure state;
- AI context distinguishes missing information from documented normal information.

## 6. Requirements Risks and Gaps

| ID    | Risk or gap                                                                            | Impact | Recommended action                                                                                                    |
| ----- | -------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| R-001 | Production regulatory and privacy obligations are not yet selected                     | High   | Obtain deployment jurisdiction, data-processing, retention, and incident-response decisions before real patient data. |
| R-002 | Doctor identity and credential verification are not defined                            | High   | Define controlled onboarding and account approval for production doctors.                                             |
| R-003 | AI provider retention and data-processing terms are open                               | High   | Approve provider, model, retention behavior, and contractual controls before production use.                          |
| R-004 | OCR quality threshold and human verification flow are open                             | High   | Define supported document quality, confidence handling, and clinician correction workflow.                            |
| R-005 | Refresh-token revocation policy is deployment-dependent                                | Medium | Define session listing, revocation, expiry, and compromise response.                                                  |
| R-006 | Performance targets use qualitative wording such as “promptly”                         | Medium | Add measurable latency targets and expected concurrent-user load.                                                     |
| R-007 | Report and summary retention periods are not specified                                 | Medium | Define retention, deletion, backup, and legal-hold behavior.                                                          |
| R-008 | UML diagrams are image-based and not field-readable through text extraction            | Low    | Keep this report aligned with the SRS and inspect diagram images manually during formal review.                       |
| R-009 | External hospital, laboratory, pharmacy, and terminology integrations are out of scope | Medium | Confirm this boundary with stakeholders to prevent unplanned integration commitments.                                 |

## 7. Verification and Validation Plan

| Verification level | Required checks                                                                                  | Applicable requirements                          |
| ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Unit tests         | Validation, normalization, trend classification, conflict detection, token and policy helpers    | FR-REC, FR-EXTRACT, FR-TIMELINE, FR-AUTH         |
| Integration tests  | Auth lifecycle, role checks, patient isolation, reports, extraction, AI validation, audit events | FR-AUTH, FR-ACCESS, FR-REPORT, FR-AI, FR-ADMIN   |
| API security tests | Missing/invalid credentials, cross-patient access, upload abuse, rate limits, safe errors        | FR-ACCESS, FR-REPORT, NFR-SEC                    |
| Frontend tests     | Protected routes, role-aware navigation, loading/error/empty states, responsive behavior         | FR-UI, NFR-UX                                    |
| End-to-end tests   | Login, patient review, report upload, timeline review, AI-summary review                         | Acceptance criteria, UML sequence/activity flows |
| Operational tests  | Database connectivity, private storage, provider unavailable behavior, audit observability       | NFR-REL, NFR-SEC, deployment requirements        |
| Clinical review    | Source citations, uncertainty, missing data, prohibited recommendations                          | Safety and clinical boundaries                   |

## 8. MVP Acceptance Checklist

- [ ] Registration accepts only approved public roles.
- [ ] Login enforces the selected role.
- [ ] Session refresh and logout work without storing long-lived tokens in browser storage.
- [ ] Protected routes and API endpoints enforce authentication.
- [ ] Patient-scoped authorization blocks cross-patient access.
- [ ] Patient profiles and structured records support validation and auditing.
- [ ] Supported reports upload privately and expose processing status.
- [ ] Duplicate, oversized, unsupported, and unauthorized uploads fail safely.
- [ ] Extraction and OCR preserve source links and failure states.
- [ ] Timeline trends require compatible and sufficient observations.
- [ ] Conflicts include evidence identifiers.
- [ ] AI summaries are structured, source-linked, and clinician-review labeled.
- [ ] AI failure does not block records, reports, or deterministic timeline access.
- [ ] Audit events exclude secrets, tokens, document contents, and full request bodies.
- [ ] Lint, formatting, build, and automated tests pass.

## 9. Conclusion

The requirements describe a feasible MVP for evidence-backed digital health record management. The implementation should prioritize authorization, document privacy, evidence validation, and explicit uncertainty because these requirements carry the greatest clinical and security risk.

The UML model and SRS are broadly aligned at the architecture and workflow level. Formal sign-off should focus on the open production decisions, measurable performance targets, clinician verification of AI behavior, and manual inspection of the image-based UML diagrams for field-level consistency.

## 10. Source and Tooling Note

The UML PDF text layer exposes its title, authorship, contents, and diagram names, but the detailed diagrams are image-based. `pdftotext` was available for text extraction; `pdfinfo` and `rg` were unavailable in the current environment. This report therefore uses the confirmed UML diagram set and the repository's current SRS/plan/flow documents rather than claiming field-level details that could not be text-extracted.
