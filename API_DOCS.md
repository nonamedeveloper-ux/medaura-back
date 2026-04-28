# MedAura Backend API Documentation

**Base URL:** `http://localhost:3000`  
**Content-Type:** `application/json`  
**Auth:** Bearer Token (JWT) — `Authorization: Bearer <token>`  
**Rate Limit:** 200 requests / 15 minutes

---

## Authentication

### Register
`POST /api/auth/register`

No auth required.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "age": 30,
  "diagnosis": "Hypertension"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | Valid email |
| password | string | Yes | Min 6 characters |
| firstName | string | Yes | |
| lastName | string | Yes | |
| role | string | No | `"patient"` (default), `"doctor"`, `"admin"` |
| age | integer | No | Patient only |
| diagnosis | string | No | Patient only |

**Response `201`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "lastLoginAt": "2026-04-28T10:00:00.000Z"
  }
}
```

---

### Login
`POST /api/auth/login`

No auth required.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "lastLoginAt": "2026-04-28T10:00:00.000Z"
  }
}
```

**Error `401`:** `{ "error": "Invalid credentials" }`  
**Error `403`:** `{ "error": "Account is deactivated" }`

---

### Get Current User
`GET /api/auth/me`

**Auth required.**

**Response `200`:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }
}
```

---

## Patient

> All `/api/patients` endpoints require auth.

### Get My Profile
`GET /api/patients/profile`

**Role:** `patient`

**Response `200`:**
```json
{
  "patient": {
    "id": "uuid",
    "userId": "uuid",
    "age": 30,
    "diagnosis": "Hypertension",
    "points": 150,
    "streak": 5,
    "riskLevel": "medium",
    "riskScore": 42,
    "treatmentPlans": [...]
  },
  "badge": "Silver"
}
```

---

### Update My Profile
`PATCH /api/patients/profile`

**Role:** `patient`

**Request Body (all optional):**
```json
{
  "age": 31,
  "diagnosis": "Type 2 Diabetes",
  "doctorNotes": "Follow up in 2 weeks"
}
```

**Response `200`:**
```json
{
  "patient": { ...updated patient object }
}
```

---

### Record Medication Adherence
`POST /api/patients/adherence`

**Role:** `patient`

Call this when the patient takes their medication. Awards points and updates streak.

**Request Body:** *(empty — no body needed)*

**Response `200`:**
```json
{
  "points_earned": 10,
  "total_points": 160,
  "streak": 6,
  "badge": "Silver"
}
```

---

### List All Patients *(Doctor only)*
`GET /api/patients/`

**Role:** `doctor`, `admin`

**Response `200`:**
```json
{
  "patients": [
    {
      "id": "uuid",
      "age": 30,
      "diagnosis": "Hypertension",
      "riskScore": 80,
      "riskLevel": "high",
      ...
    }
  ]
}
```
Sorted by `riskScore` descending.

---

### Get Single Patient *(Doctor only)*
`GET /api/patients/:id`

**Role:** `doctor`, `admin`

**Response `200`:**
```json
{
  "patient": {
    "id": "uuid",
    "age": 30,
    "diagnosis": "Hypertension",
    "treatmentPlans": [...],
    ...
  }
}
```

---

## Chat (AI Assistant)

> All `/api/chat` endpoints require auth.

### Send Message
`POST /api/chat/message`

**Role:** `patient`

**Request Body:**
```json
{
  "message": "I have a headache today, what should I do?"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| message | string | Yes | Max 2000 characters |

**Response `200`:**
```json
{
  "response": "Based on your condition, I recommend...",
  "requires_doctor_attention": false,
  "sentiment": "concerned",
  "points_earned": 5,
  "total_points": 165
}
```

> If `requires_doctor_attention` is `true`, show a warning banner — doctor will be notified.

---

### Get Chat History
`GET /api/chat/history`

**Role:** `patient`

**Query Params:**

| Param | Type | Default | Max |
|-------|------|---------|-----|
| limit | integer | 50 | 100 |
| offset | integer | 0 | — |

**Example:** `GET /api/chat/history?limit=20&offset=0`

**Response `200`:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "I have a headache",
      "createdAt": "2026-04-28T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Based on your condition...",
      "sentiment": "concerned",
      "requiresDoctorAttention": false,
      "createdAt": "2026-04-28T10:00:01.000Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

Messages are returned in chronological order (oldest first).

---

## Treatment Plans

> All `/api/treatment` endpoints require auth.

### Get Active Plan
`GET /api/treatment/active`

**Role:** `patient`

**Response `200`:**
```json
{
  "plan": {
    "id": "uuid",
    "patientId": "uuid",
    "name": "Hypertension Recovery Plan",
    "description": "30-day plan for blood pressure control",
    "medications": ["Amlodipine 5mg", "Lisinopril 10mg"],
    "totalDays": 30,
    "currentDay": 12,
    "adherenceRate": 40.0,
    "startDate": "2026-04-16",
    "endDate": "2026-05-16",
    "isActive": true,
    "phase": "active"
  }
}
```

Returns `{ "plan": null }` if no active plan exists.

---

### Create Treatment Plan *(Doctor only)*
`POST /api/treatment/`

**Role:** `doctor`, `admin`

**Request Body:**
```json
{
  "patientId": "uuid",
  "name": "Hypertension Recovery Plan",
  "description": "30-day plan for blood pressure control",
  "medications": ["Amlodipine 5mg", "Lisinopril 10mg"],
  "totalDays": 30,
  "startDate": "2026-04-28"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patientId | UUID | Yes | Patient's id |
| name | string | Yes | |
| description | string | No | |
| medications | array\<string\> | No | List of medication names |
| totalDays | integer | Yes | Min 1 |
| startDate | date | Yes | Format: `YYYY-MM-DD` |

> Creating a new plan automatically deactivates the previous active plan.

**Response `201`:**
```json
{
  "plan": { ...created plan object }
}
```

---

### Update Treatment Plan *(Doctor only)*
`PATCH /api/treatment/:id`

**Role:** `doctor`, `admin`

**Request Body (all fields optional):**
```json
{
  "name": "Updated Plan Name",
  "description": "Updated description",
  "medications": ["New Med 10mg"],
  "phase": "maintenance"
}
```

**Response `200`:**
```json
{
  "plan": { ...updated plan object }
}
```

---

### List Patient's Plans *(Doctor only)*
`GET /api/treatment/patient/:patientId`

**Role:** `doctor`, `admin`

**Response `200`:**
```json
{
  "plans": [
    { ...plan object },
    { ...plan object }
  ]
}
```
Sorted newest first.

---

## Reminders

> All `/api/reminders` endpoints require auth.

### Generate AI Reminder
`POST /api/reminders/generate`

**Role:** `patient`

AI generates a personalized motivational/medication reminder based on the patient's active treatment plan.

**Request Body:** *(empty — no body needed)*

**Response `201`:**
```json
{
  "reminder": {
    "id": "uuid",
    "patientId": "uuid",
    "message": "Great job on your 6-day streak! Remember to take Amlodipine with breakfast.",
    "phase": "active",
    "technique": "positive_reinforcement",
    "scheduledAt": "2026-04-28T10:00:00.000Z",
    "isSent": false,
    "sentAt": null
  }
}
```

---

### List Reminders
`GET /api/reminders/`

**Role:** `patient`

Returns the last 20 reminders for the current patient, newest first.

**Response `200`:**
```json
{
  "reminders": [
    {
      "id": "uuid",
      "message": "...",
      "phase": "active",
      "technique": "positive_reinforcement",
      "isSent": false,
      "scheduledAt": "2026-04-28T10:00:00.000Z",
      "sentAt": null
    }
  ]
}
```

---

### Mark Reminder as Sent
`PATCH /api/reminders/:id/sent`

**Role:** `patient`

Call this after displaying the reminder notification to the user.

**Request Body:** *(empty)*

**Response `200`:**
```json
{
  "reminder": {
    "id": "uuid",
    "isSent": true,
    "sentAt": "2026-04-28T10:05:00.000Z",
    ...
  }
}
```

---

## Analytics

> All `/api/analytics` endpoints require auth.

### Patient Dashboard
`GET /api/analytics/dashboard`

**Role:** `patient`

**Response `200`:**
```json
{
  "points": 165,
  "streak": 6,
  "risk_level": "medium",
  "risk_score": 42,
  "active_plan": {
    "name": "Hypertension Recovery Plan",
    "progress": "12/30",
    "adherence_rate": 40.0,
    "phase": "active"
  },
  "engagement": {
    "messages_last_7_days": 14
  }
}
```

`active_plan` is `null` if no active plan.

---

### Run Risk Assessment
`POST /api/analytics/risk-assessment`

**Role:** `patient`

Runs AI-based risk assessment using chat history and adherence data. Updates `riskScore` and `riskLevel` on the patient profile.

**Request Body:** *(empty)*

**Response `200`:**
```json
{
  "risk_score": 55,
  "risk_level": "high",
  "factors": ["low adherence", "missed medications"],
  "recommendations": ["Schedule doctor visit", "Set daily reminders"]
}
```

---

### Doctor Overview *(Doctor only)*
`GET /api/analytics/doctor/overview`

**Role:** `doctor`, `admin`

**Response `200`:**
```json
{
  "total": 120,
  "by_risk": {
    "critical": 5,
    "high": 18,
    "medium": 47,
    "low": 50
  },
  "avg_points": 230,
  "top_risk_patients": [
    { "id": "uuid", "risk_score": 95, "risk_level": "critical" },
    { "id": "uuid", "risk_score": 88, "risk_level": "critical" }
  ]
}
```

---

## Health Check

`GET /health`

No auth required.

**Response `200`:**
```json
{
  "status": "healthy",
  "service": "healthguard-backend"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role permissions |
| 404 | Not Found |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

---

## Authentication Flow (iOS)

```
1. Register/Login  →  Save token to Keychain
2. Every request   →  Add header: Authorization: Bearer <token>
3. Token expires   →  After 7 days, redirect to login
4. On 401 error    →  Clear token, redirect to login screen
```

## Gamification (Points & Badges)

| Action | Points |
|--------|--------|
| Taking medication (`POST /api/patients/adherence`) | +10 |
| Sending a chat message | +5 |
| Streak bonus (2+ days) | +extra |

| Badge | Points Required |
|-------|----------------|
| Bronze | 0–99 |
| Silver | 100–499 |
| Gold | 500–999 |
| Platinum | 1000+ |

*(Exact thresholds may vary — check `src/services/gamification.js`)*
