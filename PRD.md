# Escape Society School Management System
## Backend Product Requirements Document (PRD)

Version: 2.0  
Date: 2026-02-26  
Audience: Backend engineers, tech lead, QA, DevOps, product owner

## 1. Purpose
This PRD defines the production backend required for the current school management product.

The frontend already implements full workflows for:
- Admin portal
- Teacher portal
- Parent portal
- Student portal

Today these workflows are powered mostly by browser `localStorage`. This document specifies the backend needed to make all workflows secure, multi-user, persistent, and production-ready.

## 2. Repository Audit Summary (Current State)
### 2.1 Implemented today
- Frontend: Next.js App Router (`app/*`), role-based dashboards and modules.
- Route guard: `middleware.ts` uses cookies `auth_token` and `user_type`.
- Client auth: `lib/authStore.ts` with local user store (`esm_users`) and plaintext password check.
- Data persistence: module state in many `esm_*` localStorage keys.
- Backend service: `app/main.py` FastAPI app with only `GET /` and input validation (`app/validation.py`).
- Infra: Docker + Docker Compose with MySQL service configured but no real schema/service layer.

### 2.2 Primary gap
There is no production backend domain model/API yet. All critical business data and authorization decisions currently happen in the browser.

### 2.3 Resulting risks
- No durable cross-device persistence
- No secure auth/session lifecycle
- No server-side RBAC/tenant isolation
- No auditability for sensitive operations
- No reliable integrations or reporting pipeline

## 3. Product Goals
1. Replace browser state as source-of-truth with backend APIs + relational DB.
2. Enforce school-tenant isolation (`school_id`) server-side for every request.
3. Implement secure auth for `admin`, `teacher`, `parent`, `student`.
4. Support all currently implemented UI workflows without functional regression.
5. Provide clear API contracts and migration path from existing `esm_*` data.

## 4. Non-Goals (v1)
- Subscription/billing plan monetization logic
- OAuth social auth providers
- Real-time websocket messaging (REST + polling acceptable for v1)
- Advanced timetable optimization/AI scheduling

## 5. Personas and Roles
- `admin`: school admin; full school-level control
- `teacher`: class/assignment/gradebook/attendance operations for assigned classes
- `parent`: read and acknowledge linked child data; submit notes/payments
- `student`: read own records; submit notes/acknowledgements

## 6. Scope
Backend must provide APIs and persistence for these domains:
- Auth and sessions
- School onboarding/profile
- User profiles and settings
- Students, teachers, parents, parent-student links
- Teacher classes, assignments, gradebook
- Attendance + excuses + correction flags + acknowledgements
- Results and report cards
- Fees and payment tracking
- Events
- Documents and foldering
- Messages (threads/messages/read states)
- Notifications
- Reports and schedules
- Support tickets
- Activity/audit logs

## 7. Access Control Matrix (Minimum)
| Module | Admin | Teacher | Parent | Student |
|---|---|---|---|---|
| School profile | CRUD | R (own school basic) | R (basic) | R (basic) |
| Students | CRUD | CRU (assigned classes only), limited D | R (linked only) | R (self) |
| Teachers | CRUD | R (directory) + U (self profile) | R (directory basic) | R (directory basic) |
| Parents | CRUD | R (class parents basic) | RU (self + links) | - |
| Parent-student links | CRUD | R | RU (self) | - |
| Teacher classes | R | CRUD (own) | R (child classes) | R (self classes) |
| Assignments | R | CRUD (own) | R (linked child) | R (self) |
| Gradebook/results | CRUD | CRUD (assigned classes) | R + acknowledge/note (linked) | R + acknowledge/note (self) |
| Attendance | CRUD | CRUD (assigned classes) | R + excuse/ack (linked) | R + note/flag (self) |
| Fees/payments | CRUD | R | R + payment action (linked) | R + payment action (self) |
| Events | CRUD | R | R | R |
| Documents | CRUD | R | R + read status | R + read status |
| Messages | CRUD | CRUD (role-scoped) | CRUD (role-scoped) | CRUD (role-scoped) |
| Notifications | CRUD | R/mark read | R/mark read | R/mark read |
| Reports/schedules | CRUD | R (if permitted) | - | - |
| Support tickets | CRUD | CRU | CRU | CRU |
| Settings/profile | RU (self + admin prefs) | RU (self) | RU (self) | RU (self) |

## 8. Functional Requirements by Domain

### 8.1 Authentication and Sessions
- Register/login/logout/me endpoints.
- Email must be unique system-wide.
- Password hashing required (Argon2id preferred, bcrypt acceptable).
- Session transport:
  - secure HttpOnly cookie session OR
  - JWT access token + refresh rotation
- Remember-me behavior (extended expiry).
- Login rate limiting and lockout policy.

### 8.2 School Onboarding
- Create school + first admin account atomically.
- Persist school profile fields already collected in UI:
  - name, type, establishedYear, address, city, state, country, postalCode
  - email, phone, website
  - academicBoard, mediumOfInstruction
  - totalStudents, totalTeachers, classesOffered
- Generate school public ID format: `SCH-XXXXXX`.

### 8.3 Profiles and Preferences
- Separate profile and preference records per role.
- Persist preference groups:
  - locale settings (language/timezone/dateFormat)
  - dashboard defaults
  - notification preferences (email/sms/digest/security toggles)
- Update endpoints must enforce role-safe writable fields.

### 8.4 Student Management
- Create/update/delete/list students.
- Required logical fields used by frontend:
  - `studentId` (public code), `rollNumber`, `name`, `grade`, `section`, `contact`, `email`, `status`, `schoolId`
- Rules:
  - `rollNumber` unique within school
  - `studentId` format: `STD-0001` (school-scoped sequence)
  - status values required by UI: `Active`, `Inactive`

### 8.5 Teacher Management
- Create/update/delete/list teachers.
- Required fields:
  - `empId`, `name`, `department`, `subjects[]`, `email`, `phone`, `status`, `schoolId`
- Rules:
  - `empId` format: `EMP-001` and unique per school
  - status values: `Active`, `On Leave`

### 8.6 Parent Management and Linking
- Parent CRUD + child linking.
- Required fields:
  - `parentId`, `name`, `email`, `phone`, `relationship`, `linkedStudentIds[]`, `schoolId`, `status`
- Linking validation:
  - child must exist
  - child must belong to same school tenant
  - link deduplicated
- Rules:
  - `parentId` format: `PAR-0001`
  - status: `Active` if linked children > 0 else `Pending`

### 8.7 Teacher Classes
- Teacher can CRUD classes.
- Fields:
  - `grade`, `section`, `subject`, `room`, `schedule`, `students`
- Must support class roster derivation by grade+section.

### 8.8 Assignments
- Teacher can CRUD assignments by class.
- Fields:
  - `classId`, `title`, `dueDate`, `status`, `submissions`, `total`, `description`
- Status enum: `Open`, `Closed`.

### 8.9 Attendance
- Save attendance session by class/date (or grade+section/date).
- Per-student status map required by UI.
- Canonical uniqueness: one session per `(school_id, grade, section, date)`.
- Supported statuses:
  - core storage: `present` / `absent`
  - derived views: `Excused` when parent excuse note exists
- Additional flows:
  - parent excuse notes
  - parent acknowledgement per child/date
  - student correction flags and notes

### 8.10 Results and Gradebook
- Teacher grade entries feed aggregated result rows.
- Result row fields used by UI:
  - `rollNo`, `name`, `classGrade`, `section`
  - `math`, `english`, `science`, `history`, `total`, `percentage`, `grade`, `remarks`
- Grade thresholds used by app:
  - `A+` >= 90
  - `A` >= 80
  - `B` >= 70
  - `C` >= 60
  - `D` < 60
- Parent/student note + acknowledge state must be persisted.

### 8.11 Fees and Payments
- CRUD fee records and payment actions.
- Required fields:
  - `student`, `rollNo`, `grade`, `section`, `year`, `term`, `method`
  - `totalFees`, `amountPaid`, `balanceDue`, `status`, `lastPayment`
- Status values: `Paid`, `Pending`, `Overdue`.
- Derived rules:
  - `balanceDue = max(totalFees - amountPaid, 0)`
  - clamp `amountPaid <= totalFees`

### 8.12 Events
- Event CRUD with filtering.
- Required enums:
  - type: `academic`, `administrative`, `training`, `cultural`, `sports`
  - priority: `high`, `medium`, `low`
- Fields:
  - title, date, time, location, attendees, type, priority, organizer, description

### 8.13 Documents and Folders
- Folder/category CRUD.
- Document metadata + file upload/download.
- Fields:
  - `name`, `category`, `owner`, `updated`, `type`, `size`, `status`, `fileUrl`, `fileName`
- Status values: `Draft`, `In Review`, `Approved`, `Expiring Soon`.
- Role-specific read status tracking:
  - parent read map
  - student read map
- Production storage: object storage (S3-compatible); DB stores metadata only.

### 8.14 Messaging
- Thread CRUD + message send/list/read.
- Thread model:
  - participants (role/name/title/email/userId)
  - `lastMessage`, `time`, `status`, `unreadBy` per role
- Thread status enum: `Online`, `Offline`, `Busy`.

### 8.15 Notifications
- Notification feed CRUD/read-state operations.
- Notification enums:
  - type: `Alert`, `Announcement`, `Reminder`, `Update`
  - status: `Unread`, `Read`, `Urgent`
- Behavior rule already in UI:
  - mark-all-read must not downgrade `Urgent` items.
- Event-triggered notification generation required for:
  - student/teacher/parent creation
  - attendance save
  - fee status changes
  - new event/document/report/message

### 8.16 Reports and Scheduling
- Generate report records from module data.
- Report fields:
  - `name`, `type`, `generated`, `owner`, `status`, `size`, `records`, `createdAt`, `readyAt`
- Status lifecycle used in UI:
  - `Processing` -> `Ready`
  - manual/ops states: `Needs Review`, `Scheduled`
- Schedule fields:
  - `name`, `reportId`, `frequency`, `nextRun`, `recipients`

### 8.17 Support Tickets
- Ticket CRUD/list/filter/search.
- Ticket format: `SUP-####` (UI seeds from `SUP-2000`).
- Status lifecycle: `Open`, `In Progress`, `Waiting`, `Resolved`.

## 9. Canonical Data Model (Backend)

### 9.1 Core tables
- `schools`
- `users`
- `user_passwords`
- `user_sessions`
- `user_profiles`
- `user_preferences`
- `user_notification_preferences`
- `students`
- `teachers`
- `parents`
- `parent_student_links`
- `teacher_classes`
- `teacher_assignments`
- `gradebook_entries`
- `results`
- `attendance_sessions`
- `attendance_entries`
- `attendance_excuse_notes`
- `attendance_acknowledgements`
- `attendance_correction_requests`
- `fee_records`
- `fee_transactions`
- `events`
- `document_folders`
- `documents`
- `document_reads`
- `message_threads`
- `message_participants`
- `messages`
- `message_reads`
- `notifications`
- `notification_reads`
- `reports`
- `report_schedules`
- `support_tickets`
- `activity_logs`
- `audit_logs`

### 9.2 Required common columns
- `id` (UUID internal primary key)
- `school_id` on all tenant-scoped entities
- `created_at`, `updated_at`
- `created_by`, `updated_by` when relevant
- `deleted_at` for soft delete on business-critical entities

### 9.3 Public/business identifiers
- School public ID: `SCH-XXXXXX`
- Student code: `STD-0001`
- Teacher employee ID: `EMP-001`
- Parent ID: `PAR-0001`
- Support ticket number: `SUP-####`

### 9.4 Key uniqueness/constraints
- `users.email` unique (case-insensitive)
- `students (school_id, roll_number)` unique
- `students (school_id, student_code)` unique
- `teachers (school_id, employee_id)` unique
- `parents (school_id, parent_public_id)` unique
- `parent_student_links (parent_id, student_id)` unique
- `attendance_sessions (school_id, grade, section, date)` unique

### 9.5 Enum set (initial)
- Roles: `admin`, `teacher`, `parent`, `student`
- Student status: `Active`, `Inactive`
- Teacher status: `Active`, `On Leave`
- Parent status: `Active`, `Pending`, `Inactive`
- Attendance core: `present`, `absent`
- Assignment status: `Open`, `Closed`
- Fee status: `Paid`, `Pending`, `Overdue`
- Event type: `academic`, `administrative`, `training`, `cultural`, `sports`
- Event priority: `high`, `medium`, `low`
- Document status: `Draft`, `In Review`, `Approved`, `Expiring Soon`
- Message thread status: `Online`, `Offline`, `Busy`
- Notification type: `Alert`, `Announcement`, `Reminder`, `Update`
- Notification status: `Unread`, `Read`, `Urgent`
- Report status: `Processing`, `Ready`, `Needs Review`, `Scheduled`
- Support ticket status: `Open`, `In Progress`, `Waiting`, `Resolved`

## 10. API Contract (REST v1)

### 10.1 Standards
- Base path: `/api/v1`
- JSON response wrappers:
  - success: `{ "data": ..., "meta": ... }`
  - error: `{ "error": { "code": "...", "message": "...", "details": ... } }`
- Pagination on list endpoints: `page`, `page_size`, `sort`, `order`
- Tenant scoping enforced server-side from authenticated user context, not client payload

### 10.2 Endpoint groups (minimum)
- Auth:
  - `POST /auth/register/{role}`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `GET /auth/me`
- School:
  - `POST /schools`
  - `GET /schools/{school_id}`
  - `PATCH /schools/{school_id}`
- Profiles/settings:
  - `GET /profiles/me`
  - `PATCH /profiles/me`
  - `GET /settings/preferences`
  - `PATCH /settings/preferences`
  - `GET /settings/notifications`
  - `PATCH /settings/notifications`
- Students:
  - `GET /students`
  - `POST /students`
  - `GET /students/{student_id}`
  - `PATCH /students/{student_id}`
  - `DELETE /students/{student_id}`
- Teachers:
  - `GET /teachers`
  - `POST /teachers`
  - `PATCH /teachers/{teacher_id}`
  - `DELETE /teachers/{teacher_id}`
- Parents:
  - `GET /parents`
  - `POST /parents`
  - `PATCH /parents/{parent_id}`
  - `POST /parents/{parent_id}/links`
  - `DELETE /parents/{parent_id}/links/{student_id}`
- Teacher classes/assignments/gradebook:
  - `GET /teacher/classes`
  - `POST /teacher/classes`
  - `PATCH /teacher/classes/{id}`
  - `DELETE /teacher/classes/{id}`
  - `GET /teacher/assignments`
  - `POST /teacher/assignments`
  - `PATCH /teacher/assignments/{id}`
  - `DELETE /teacher/assignments/{id}`
  - `GET /teacher/gradebook`
  - `POST /teacher/gradebook`
  - `PATCH /teacher/gradebook/{id}`
  - `DELETE /teacher/gradebook/{id}`
- Attendance:
  - `GET /attendance/sessions`
  - `POST /attendance/sessions` (idempotent by school+grade+section+date)
  - `GET /attendance/students/{student_id}`
  - `POST /attendance/excuse-notes`
  - `POST /attendance/acknowledge`
  - `POST /attendance/correction-requests`
- Results:
  - `GET /results`
  - `POST /results`
  - `PATCH /results/{id}`
  - `DELETE /results/{id}`
  - `POST /results/{id}/ack`
  - `POST /results/{id}/notes`
- Fees:
  - `GET /fees`
  - `POST /fees`
  - `PATCH /fees/{id}`
  - `POST /fees/{id}/payments`
- Events:
  - `GET /events`
  - `POST /events`
  - `PATCH /events/{id}`
  - `DELETE /events/{id}`
- Documents:
  - `GET /documents`
  - `POST /documents` (multipart)
  - `GET /documents/{id}/download`
  - `PATCH /documents/{id}`
  - `DELETE /documents/{id}`
  - `GET /document-folders`
  - `POST /document-folders`
  - `POST /documents/{id}/reads`
- Messages:
  - `GET /messages/threads`
  - `POST /messages/threads`
  - `GET /messages/threads/{id}`
  - `POST /messages/threads/{id}/messages`
  - `POST /messages/threads/{id}/read`
- Notifications:
  - `GET /notifications`
  - `POST /notifications`
  - `PATCH /notifications/{id}`
  - `POST /notifications/mark-all-read`
- Reports:
  - `GET /reports`
  - `POST /reports/generate`
  - `POST /reports/schedules`
  - `GET /reports/{id}/download`
- Support:
  - `GET /support/tickets`
  - `POST /support/tickets`
  - `PATCH /support/tickets/{id}`

## 11. Notification Triggers (Required)
On successful completion of these actions, publish notifications:
- New student/teacher/parent created
- Attendance session created
- Fee status transitions to `Overdue` or `Paid`
- Event created
- Document created
- Report created/ready
- New message in thread

## 12. Non-Functional Requirements

### 12.1 Security
- Password hash + salt only (no plaintext storage)
- Secure cookies (`HttpOnly`, `Secure`, `SameSite`) if cookie sessions
- CSRF protection for cookie-auth mutating endpoints
- RBAC check on every endpoint
- Tenant isolation enforced by server query filters
- Rate limits for login and high-risk operations
- File upload validation (type, size, malware scan hook)

### 12.2 Performance
- P95 read latency <= 300 ms
- P95 write latency <= 500 ms
- Pagination required on collection APIs
- Indexes for common filters: `school_id`, `status`, `grade`, `section`, `created_at`

### 12.3 Reliability and operations
- Daily backups + restore test runbook
- Structured logs with request/trace IDs
- Metrics + health endpoints (`/health/live`, `/health/ready`)
- Error alerting for auth failures, queue failures, and DB issues

## 13. Migration Plan from Frontend Storage

### 13.1 Source keys (current)
Primary local keys include:
- `esm_users`, `esm_user_session`
- `esm_school_profile`, `esm_profile`, role profiles/preferences/prefs
- `esm_students`, `esm_teachers`, `esm_parents`, `esm_parent_links`
- `esm_teacher_classes`, `esm_teacher_assignments`, `esm_teacher_gradebook`
- `esm_attendance_history`, `esm_attendance_excuses`, `esm_attendance_ack`
- `esm_results`, `esm_parent_result_notes`, `esm_parent_results_ack`, `esm_student_result_notes`, `esm_student_results_ack`
- `esm_payments`
- `esm_events`
- `esm_documents`, `esm_document_folders`, `esm_parent_document_reads`, `esm_student_document_reads`
- `esm_message_threads`, `esm_thread_messages`
- `esm_notifications`
- `esm_reports`, `esm_report_schedules`
- `esm_support_tickets`

### 13.2 Migration approach
1. Build DB schema + APIs first.
2. Add API client layer in frontend behind feature flags.
3. Migrate auth + master entities first (school/users/students/teachers/parents/links).
4. Migrate transactional modules (attendance/results/fees/events/documents/messages).
5. Migrate analytics/support modules (notifications/reports/support).
6. Remove localStorage business persistence from production path.

## 14. Delivery Phases

### Phase 1: Foundation
- Auth/session/RBAC/tenant middleware
- School onboarding
- Profile/settings
- Students/teachers/parents + parent-student linking

### Phase 2: Academic Core
- Teacher classes, assignments, gradebook
- Attendance domain (sessions, entries, excuses, corrections)
- Results domain + acknowledgements/notes

### Phase 3: Operations Core
- Fees/payments
- Events
- Documents/folders/read-tracking
- Messaging and notifications

### Phase 4: Admin Ops
- Reports and schedules
- Support tickets
- Audit/activity logs and observability hardening

## 15. Testing and Acceptance Criteria
Backend is accepted when all conditions are met:
1. Existing frontend flows operate with backend as source-of-truth.
2. No required workflow depends on `localStorage` in production mode.
3. RBAC and tenant isolation tests pass for all role/module combinations.
4. End-to-end scenarios pass:
   - school registration and admin login
   - teacher/parent/student registration and login
   - student CRUD and parent-child linking
   - attendance save + role-based retrieval + excuse/correction workflows
   - gradebook entry updates result rows
   - fee payment updates balances/statuses
   - event/document/message/notification/report/support flows
5. Security baseline verified (hashing, secure session handling, rate limits, audit logging).
6. API and schema docs are versioned and published.

## 16. Open Decisions
1. Session strategy finalization: cookie sessions vs JWT+refresh.
2. Async processing stack for reports/notifications (Celery/RQ/other).
3. Object storage provider and retention policy for documents.
4. Long-term messaging model: polling only vs websocket upgrade.
5. Whether email uniqueness remains global or becomes school-scoped in future.
