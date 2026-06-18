# API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost:5000` (dev) or `https://your-backend.onrender.com` (production)  
**Authentication:** JWT Token via Cookie  
**Response Format:** JSON

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Leads](#leads-endpoints)
3. [Students](#students-endpoints)
4. [Masters](#masters-endpoints)
5. [Configuration](#configuration-endpoints)
6. [Error Codes](#error-codes)
7. [Rate Limiting](#rate-limiting)

---

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user with username and password

**Request:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401 - Failure):**
```json
{
  "message": "Invalid username or password"
}
```

**Headers:**
```
Cookie: token=<jwt_token>; HttpOnly; Secure; MaxAge=86400
```

**Rate Limit:** 10 attempts per 5 minutes

**Notes:**
- Password must be at least 6 characters
- JWT token valid for 24 hours
- Token stored in httpOnly cookie
- CORS credentials required on frontend

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get profile of authenticated user

**Authentication:** Required (JWT token in cookie)

**Request:**
```bash
curl -H "Cookie: token=<jwt_token>" http://localhost:5000/api/auth/me
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "createdAt": "2026-06-17 10:00:00"
}
```

**Response (401 - Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Clear authentication cookie and logout user

**Authentication:** Required (JWT token in cookie)

**Request:**
```bash
curl -X POST -H "Cookie: token=<jwt_token>" http://localhost:5000/api/auth/logout
```

**Response (200 - Success):**
```json
{
  "message": "Logout successful"
}
```

**Notes:**
- Clears httpOnly token cookie
- No database changes
- Token remains valid until 24 hours (stateless JWT)

---

## Leads Endpoints

### Get All Leads

**Endpoint:** `GET /api/leads`

**Description:** Retrieve list of leads with optional search, filter, and pagination

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search by name, email, or phone |
| status | string | No | Filter by status: Pending, Follow-up, Closed, Confirmed |
| countryInterest | string | No | Filter by country of interest |
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 10, max: 100) |
| sort | string | No | Sort field: name, createdAt, status (default: createdAt) |
| order | string | No | Sort order: asc, desc (default: desc) |

**Request:**
```bash
curl "http://localhost:5000/api/leads?search=John&status=Pending&page=1&limit=20" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "data": [
    {
      "id": 1,
      "leadId": "LD-ABC123",
      "name": "John Doe",
      "phone": "+1-555-1234",
      "email": "john@example.com",
      "countryInterest": "UK",
      "university": "Oxford University",
      "course": "Computer Science",
      "source": "Referral",
      "status": "Pending",
      "notes": "Follow up next week",
      "createdAt": "2026-06-17 10:30:00",
      "updatedAt": "2026-06-17 10:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

**Response (400 - Invalid Parameters):**
```json
{
  "message": "Invalid page or limit parameter"
}
```

---

### Get Single Lead

**Endpoint:** `GET /api/leads/:leadId`

**Description:** Retrieve details of a specific lead

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (e.g., LD-ABC123) |

**Request:**
```bash
curl "http://localhost:5000/api/leads/LD-ABC123" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "leadId": "LD-ABC123",
  "name": "John Doe",
  "phone": "+1-555-1234",
  "email": "john@example.com",
  "countryInterest": "UK",
  "university": "Oxford University",
  "course": "Computer Science",
  "source": "Referral",
  "status": "Pending",
  "notes": "Follow up next week",
  "createdAt": "2026-06-17 10:30:00",
  "updatedAt": "2026-06-17 10:30:00"
}
```

**Response (404 - Not Found):**
```json
{
  "message": "Lead not found"
}
```

---

### Create Lead

**Endpoint:** `POST /api/leads`

**Description:** Create a new lead

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-5678",
  "countryInterest": "USA",
  "university": "Stanford University",
  "course": "Business Administration",
  "source": "Google",
  "status": "Pending",
  "notes": "Interested in MBA program"
}
```

**Required Fields:**
- `name`

**Optional Fields:**
- `email`, `phone`, `countryInterest`, `university`, `course`, `source`, `status`, `notes`

**Response (201 - Created):**
```json
{
  "id": 2,
  "leadId": "LD-XYZ789",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-5678",
  "countryInterest": "USA",
  "university": "Stanford University",
  "course": "Business Administration",
  "source": "Google",
  "status": "Pending",
  "notes": "Interested in MBA program",
  "createdAt": "2026-06-17 11:00:00",
  "updatedAt": "2026-06-17 11:00:00"
}
```

**Response (400 - Missing Required Field):**
```json
{
  "message": "Name is required"
}
```

**Business Logic:**
- If `status` is "Confirmed", automatically creates student record

---

### Update Lead

**Endpoint:** `PUT /api/leads/:leadId`

**Description:** Update an existing lead

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (e.g., LD-ABC123) |

**Request Body:**
```json
{
  "status": "Confirmed",
  "notes": "Admission approved"
}
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "leadId": "LD-ABC123",
  "name": "John Doe",
  "phone": "+1-555-1234",
  "email": "john@example.com",
  "countryInterest": "UK",
  "university": "Oxford University",
  "course": "Computer Science",
  "source": "Referral",
  "status": "Confirmed",
  "notes": "Admission approved",
  "createdAt": "2026-06-17 10:30:00",
  "updatedAt": "2026-06-17 14:00:00"
}
```

**Response (404 - Not Found):**
```json
{
  "message": "Lead not found"
}
```

**Business Logic:**
- If `status` changes to "Confirmed" from other status, auto-creates student record

---

### Delete Lead

**Endpoint:** `DELETE /api/leads/:leadId`

**Description:** Delete a lead

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| leadId | string | Yes | Lead ID (e.g., LD-ABC123) |

**Request:**
```bash
curl -X DELETE "http://localhost:5000/api/leads/LD-ABC123" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "message": "Lead deleted successfully"
}
```

**Response (404 - Not Found):**
```json
{
  "message": "Lead not found"
}
```

---

### Export Leads to CSV

**Endpoint:** `GET /api/leads/export`

**Description:** Export all leads as CSV file

**Authentication:** Required

**Request:**
```bash
curl "http://localhost:5000/api/leads/export" \
  -H "Cookie: token=<jwt_token>" \
  -o leads_export.csv
```

**Response (200 - Success):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename=Leads_Export.csv

id,leadId,name,email,phone,countryInterest,university,course,source,status,notes,createdAt,updatedAt
1,LD-ABC123,John Doe,john@example.com,+1-555-1234,UK,Oxford University,Computer Science,Referral,Pending,Follow up next week,2026-06-17 10:30:00,2026-06-17 10:30:00
```

---

## Students Endpoints

### Get All Students

**Endpoint:** `GET /api/students`

**Description:** Retrieve list of students with optional search and filter

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Search by name, email, or phone |
| status | string | No | Filter by status: Applied, Admitted, Visa Approved, Visa Rejected, Enrolled |
| country | string | No | Filter by country |
| university | string | No | Filter by university |
| page | number | No | Page number (default: 1) |
| limit | number | No | Results per page (default: 10, max: 100) |

**Request:**
```bash
curl "http://localhost:5000/api/students?search=John&status=Admitted&page=1" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "data": [
    {
      "id": 1,
      "studentId": "ST-XYZ789",
      "leadId": "LD-ABC123",
      "name": "John Doe",
      "phone": "+1-555-1234",
      "email": "john@example.com",
      "country": "US",
      "university": "Oxford University",
      "course": "Computer Science",
      "status": "Admitted",
      "intake": "Fall 2026",
      "notes": "Visa approved",
      "createdAt": "2026-06-17 11:00:00",
      "updatedAt": "2026-06-17 11:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "pages": 1
}
```

---

### Get Single Student

**Endpoint:** `GET /api/students/:studentId`

**Description:** Retrieve details of a specific student

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | Yes | Student ID (e.g., ST-XYZ789) |

**Request:**
```bash
curl "http://localhost:5000/api/students/ST-XYZ789" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "studentId": "ST-XYZ789",
  "leadId": "LD-ABC123",
  "name": "John Doe",
  "phone": "+1-555-1234",
  "email": "john@example.com",
  "country": "US",
  "university": "Oxford University",
  "course": "Computer Science",
  "status": "Admitted",
  "intake": "Fall 2026",
  "notes": "Visa approved",
  "createdAt": "2026-06-17 11:00:00",
  "updatedAt": "2026-06-17 11:00:00"
}
```

---

### Create Student

**Endpoint:** `POST /api/students`

**Description:** Create a new student

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-5678",
  "country": "USA",
  "university": "Stanford University",
  "course": "Business Administration",
  "status": "Applied",
  "intake": "Spring 2027",
  "notes": "MBA applicant"
}
```

**Required Fields:**
- `name`

**Optional Fields:**
- `leadId`, `email`, `phone`, `country`, `university`, `course`, `status`, `intake`, `notes`

**Response (201 - Created):**
```json
{
  "id": 2,
  "studentId": "ST-ABC456",
  "leadId": null,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1-555-5678",
  "country": "USA",
  "university": "Stanford University",
  "course": "Business Administration",
  "status": "Applied",
  "intake": "Spring 2027",
  "notes": "MBA applicant",
  "createdAt": "2026-06-17 11:30:00",
  "updatedAt": "2026-06-17 11:30:00"
}
```

---

### Update Student

**Endpoint:** `PUT /api/students/:studentId`

**Description:** Update an existing student

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | Yes | Student ID (e.g., ST-XYZ789) |

**Request Body:**
```json
{
  "status": "Visa Approved",
  "notes": "Visa received from UK embassy"
}
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "studentId": "ST-XYZ789",
  "leadId": "LD-ABC123",
  "name": "John Doe",
  "phone": "+1-555-1234",
  "email": "john@example.com",
  "country": "US",
  "university": "Oxford University",
  "course": "Computer Science",
  "status": "Visa Approved",
  "intake": "Fall 2026",
  "notes": "Visa received from UK embassy",
  "createdAt": "2026-06-17 11:00:00",
  "updatedAt": "2026-06-17 14:30:00"
}
```

---

### Delete Student

**Endpoint:** `DELETE /api/students/:studentId`

**Description:** Delete a student

**Authentication:** Required

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | Yes | Student ID (e.g., ST-XYZ789) |

**Request:**
```bash
curl -X DELETE "http://localhost:5000/api/students/ST-XYZ789" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "message": "Student deleted successfully"
}
```

---

### Export Students to CSV

**Endpoint:** `GET /api/students/export`

**Description:** Export all students as CSV file

**Authentication:** Required

**Request:**
```bash
curl "http://localhost:5000/api/students/export" \
  -H "Cookie: token=<jwt_token>" \
  -o students_export.csv
```

**Response (200 - Success):**
CSV file with all students

---

## Masters Endpoints

### Countries

#### Get All Countries

**Endpoint:** `GET /api/masters/countries`

**Response (200 - Success):**
```json
[
  {
    "id": 1,
    "name": "United Kingdom"
  },
  {
    "id": 2,
    "name": "United States"
  }
]
```

#### Create Country

**Endpoint:** `POST /api/masters/countries`

**Authentication:** Required (admin only)

**Request Body:**
```json
{
  "name": "Canada"
}
```

**Response (201 - Created):**
```json
{
  "id": 3,
  "name": "Canada"
}
```

#### Update Country

**Endpoint:** `PUT /api/masters/countries/:id`

**Authentication:** Required (admin only)

**Request Body:**
```json
{
  "name": "Great Britain"
}
```

**Response (200 - Success):**
```json
{
  "id": 1,
  "name": "Great Britain"
}
```

#### Delete Country

**Endpoint:** `DELETE /api/masters/countries/:id`

**Authentication:** Required (admin only)

**Response (200 - Success):**
```json
{
  "message": "Country deleted successfully"
}
```

### Universities

**Endpoints:** Similar to Countries

- `GET /api/masters/universities` - List all
- `POST /api/masters/universities` - Create
- `PUT /api/masters/universities/:id` - Update
- `DELETE /api/masters/universities/:id` - Delete

**Example:**
```json
{
  "id": 1,
  "name": "Oxford University",
  "country": "United Kingdom"
}
```

### Courses

**Endpoints:** Similar to Countries

- `GET /api/masters/courses` - List all
- `POST /api/masters/courses` - Create
- `PUT /api/masters/courses/:id` - Update
- `DELETE /api/masters/courses/:id` - Delete

**Example:**
```json
{
  "id": 1,
  "name": "Computer Science"
}
```

---

## Configuration Endpoints

### Get Configuration

**Endpoint:** `GET /api/config`

**Description:** Get application settings

**Authentication:** Required

**Request:**
```bash
curl "http://localhost:5000/api/config" \
  -H "Cookie: token=<jwt_token>"
```

**Response (200 - Success):**
```json
{
  "companyName": "Uni Assist Overseas Education",
  "currency": "USD",
  "allowLeadDeletion": "true",
  "autoBackupInterval": "30"
}
```

---

### Update Configuration

**Endpoint:** `PUT /api/config`

**Description:** Update application settings

**Authentication:** Required (admin only)

**Request Body:**
```json
{
  "companyName": "Global Education Services",
  "currency": "GBP"
}
```

**Response (200 - Success):**
```json
{
  "companyName": "Global Education Services",
  "currency": "GBP",
  "allowLeadDeletion": "true",
  "autoBackupInterval": "30"
}
```

**Response (403 - Forbidden):**
```json
{
  "message": "Admin access required"
}
```

---

## Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Bad Request | Invalid request format | Check request body and parameters |
| 401 | Unauthorized | Missing or invalid token | Login again |
| 403 | Forbidden | Insufficient permissions | Use admin account for admin-only endpoints |
| 404 | Not Found | Resource doesn't exist | Check ID in URL |
| 409 | Conflict | Resource already exists | Use different name or ID |
| 422 | Unprocessable Entity | Validation failed | Check required fields |
| 429 | Too Many Requests | Rate limit exceeded | Wait before trying again |
| 500 | Internal Server Error | Server error | Check server logs |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/auth/login | 10 attempts | 5 minutes |
| All API endpoints | 300 requests | 15 minutes |

**Response (429 - Rate Limited):**
```json
{
  "message": "Too many requests, please try again later"
}
```

---

## Common Response Headers

```
Content-Type: application/json
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Credentials: true
X-Response-Time: 45ms
```

---

## Frontend Integration Example

```javascript
// Using Axios
const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  withCredentials: true  // Send cookies
});

// Login
const login = async (username, password) => {
  const response = await apiClient.post('/api/auth/login', {
    username,
    password
  });
  return response.data;
};

// Get Leads
const getLeads = async (page = 1, limit = 10) => {
  const response = await apiClient.get('/api/leads', {
    params: { page, limit }
  });
  return response.data;
};

// Create Lead
const createLead = async (leadData) => {
  const response = await apiClient.post('/api/leads', leadData);
  return response.data;
};
```

---

**Last Updated:** 2026-06-17  
**Version:** 1.0  
**Status:** Production Ready
