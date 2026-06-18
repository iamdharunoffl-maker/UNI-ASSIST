# Database Schema Documentation

**Database:** SQLite 3  
**File:** `server/database/crm.db`  
**Version:** 1.0  
**Created:** 2026-06-17

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
3. [Indexes](#indexes)
4. [Relationships](#relationships)
5. [SQL Schema](#sql-schema)
6. [Migration Tracking](#migration-tracking)

## Overview

The database consists of 8 tables organized into three categories:

- **Transactional:** users, leads, students
- **Reference Data:** countries, universities, courses
- **System:** settings, migrations

### Design Principles

- ✅ Normalized schema (3NF)
- ✅ Integer primary keys
- ✅ TEXT columns for dates (ISO 8601 format)
- ✅ UNIQUE constraints where appropriate
- ✅ Parameterized queries (no SQL injection risk)
- ✅ Transactions for multi-step operations
- ✅ WAL mode for concurrent access

## Tables

### 1. users

**Purpose:** Store user accounts and authentication credentials  
**Records:** 1-10 (typical)  
**Accessed By:** authController.login()

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user ID |
| username | TEXT | UNIQUE NOT NULL | Login username |
| password | TEXT | NOT NULL | Hashed password (bcrypt) |
| role | TEXT | NOT NULL | User role (admin, user) |
| createdAt | TEXT | NOT NULL | Account creation timestamp (ISO 8601) |

**Example Data:**
```sql
INSERT INTO users VALUES (
  1, 
  'admin', 
  '$2a$10$...encrypted_password...', 
  'admin', 
  '2026-06-17 10:00:00'
);
```

**Queries:**
- Authentication: `SELECT * FROM users WHERE username = ?`
- User count: `SELECT COUNT(1) FROM users`

---

### 2. leads

**Purpose:** Store prospective student leads  
**Records:** 100-10,000 (typical)  
**Accessed By:** leadsController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Database row ID |
| leadId | TEXT | UNIQUE NOT NULL | Business lead ID (LD-XXXXXX) |
| name | TEXT | NOT NULL | Lead name |
| phone | TEXT | - | Contact phone number |
| email | TEXT | - | Contact email address |
| countryInterest | TEXT | - | Country of interest for studies |
| university | TEXT | - | Target university |
| course | TEXT | - | Target course |
| source | TEXT | - | Lead source (Google, Facebook, Referral, Walk-in, Other) |
| status | TEXT | NOT NULL | Lead status (Pending, Follow-up, Closed, Confirmed) |
| notes | TEXT | - | Additional notes |
| createdAt | TEXT | NOT NULL | Creation timestamp (ISO 8601) |
| updatedAt | TEXT | NOT NULL | Last update timestamp (ISO 8601) |

**Example Data:**
```sql
INSERT INTO leads VALUES (
  1, 
  'LD-ABC123', 
  'John Doe', 
  '+1-555-1234', 
  'john@example.com', 
  'UK', 
  'Oxford University', 
  'Computer Science', 
  'Referral', 
  'Pending', 
  'Follow up next week', 
  '2026-06-17 10:30:00', 
  '2026-06-17 10:30:00'
);
```

**Indexes:**
- PRIMARY: leadId (UNIQUE)
- INDEX: phone
- INDEX: email
- INDEX: status
- INDEX: countryInterest

**Queries:**
- List all: `SELECT * FROM leads ORDER BY createdAt DESC`
- Search: `SELECT * FROM leads WHERE name LIKE ? OR email LIKE ?`
- Filter: `SELECT * FROM leads WHERE status = ? AND countryInterest = ?`
- By ID: `SELECT * FROM leads WHERE leadId = ?`

**Business Rules:**
- When status becomes 'Confirmed', auto-create student record
- Cannot delete if linked to confirmed student
- Phone and email are searchable

---

### 3. students

**Purpose:** Store enrolled or admitted student records  
**Records:** 50-5,000 (typical)  
**Accessed By:** studentsController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Database row ID |
| studentId | TEXT | UNIQUE NOT NULL | Business student ID (ST-XXXXXX) |
| leadId | TEXT | - | Linked lead ID (can be empty for manual students) |
| name | TEXT | NOT NULL | Student name |
| phone | TEXT | - | Contact phone |
| email | TEXT | - | Contact email |
| country | TEXT | - | Home country |
| university | TEXT | - | Enrolled university |
| course | TEXT | - | Enrolled course |
| status | TEXT | NOT NULL | Student status (Applied, Admitted, Visa Approved, Visa Rejected, Enrolled) |
| intake | TEXT | - | Intake term (Fall 2026, Spring 2027, etc.) |
| notes | TEXT | - | Additional notes |
| createdAt | TEXT | NOT NULL | Creation timestamp (ISO 8601) |
| updatedAt | TEXT | NOT NULL | Last update timestamp (ISO 8601) |

**Example Data:**
```sql
INSERT INTO students VALUES (
  1, 
  'ST-XYZ789', 
  'LD-ABC123', 
  'John Doe', 
  '+1-555-1234', 
  'john@example.com', 
  'US', 
  'Oxford University', 
  'Computer Science', 
  'Admitted', 
  'Fall 2026', 
  'Waiting for visa approval', 
  '2026-06-17 11:00:00', 
  '2026-06-17 11:00:00'
);
```

**Indexes:**
- PRIMARY: studentId (UNIQUE)

**Queries:**
- List all: `SELECT * FROM students ORDER BY createdAt DESC`
- By status: `SELECT * FROM students WHERE status = ? ORDER BY createdAt DESC`
- By country: `SELECT * FROM students WHERE country = ?`
- By university: `SELECT * FROM students WHERE university = ?`

**Business Rules:**
- Can have empty leadId (manually created students)
- Each lead can only convert to one student
- Statuses are predefined and enforced by controller

---

### 4. countries

**Purpose:** Reference data for countries  
**Records:** 195 (typical)  
**Accessed By:** mastersController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique country ID |
| name | TEXT | UNIQUE NOT NULL | Country name |

**Example Data:**
```sql
INSERT INTO countries VALUES (1, 'United Kingdom');
INSERT INTO countries VALUES (2, 'United States');
INSERT INTO countries VALUES (3, 'India');
INSERT INTO countries VALUES (4, 'Australia');
```

**Queries:**
- List all: `SELECT * FROM countries ORDER BY name`
- Find by name: `SELECT * FROM countries WHERE name = ?`

---

### 5. universities

**Purpose:** Reference data for universities  
**Records:** 100-1,000 (typical)  
**Accessed By:** mastersController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique university ID |
| name | TEXT | NOT NULL | University name |
| country | TEXT | - | Country where located |

**Example Data:**
```sql
INSERT INTO universities VALUES (1, 'Oxford University', 'United Kingdom');
INSERT INTO universities VALUES (2, 'Stanford University', 'United States');
INSERT INTO universities VALUES (3, 'IIT Delhi', 'India');
INSERT INTO universities VALUES (4, 'University of Melbourne', 'Australia');
```

**Queries:**
- List all: `SELECT * FROM universities ORDER BY name`
- By country: `SELECT * FROM universities WHERE country = ? ORDER BY name`

---

### 6. courses

**Purpose:** Reference data for courses  
**Records:** 50-500 (typical)  
**Accessed By:** mastersController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique course ID |
| name | TEXT | NOT NULL | Course name |

**Example Data:**
```sql
INSERT INTO courses VALUES (1, 'Computer Science');
INSERT INTO courses VALUES (2, 'Business Administration');
INSERT INTO courses VALUES (3, 'Medicine');
INSERT INTO courses VALUES (4, 'Engineering');
```

**Queries:**
- List all: `SELECT * FROM courses ORDER BY name`
- Search: `SELECT * FROM courses WHERE name LIKE ?`

---

### 7. settings

**Purpose:** Store application configuration  
**Records:** 5-20 (typical)  
**Accessed By:** configController

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique setting ID |
| key | TEXT | UNIQUE NOT NULL | Configuration key |
| value | TEXT | - | Configuration value |

**Example Data:**
```sql
INSERT INTO settings VALUES (1, 'companyName', 'Uni Assist Overseas Education');
INSERT INTO settings VALUES (2, 'currency', 'USD');
INSERT INTO settings VALUES (3, 'allowLeadDeletion', 'true');
INSERT INTO settings VALUES (4, 'autoBackupInterval', '30');
```

**Queries:**
- Get all: `SELECT * FROM settings`
- Get one: `SELECT value FROM settings WHERE key = ?`
- Update: `UPDATE settings SET value = ? WHERE key = ?`

**Standard Keys:**
- `companyName` - Display name
- `currency` - Currency code (USD, GBP, INR, etc.)
- `allowLeadDeletion` - Whether users can delete leads
- `autoBackupInterval` - Backup interval in minutes

---

### 8. migrations

**Purpose:** Track database migrations for idempotency  
**Records:** 1-10 (typical)  
**Accessed By:** databaseService.initializeDb()

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique migration ID |
| name | TEXT | UNIQUE NOT NULL | Migration name/identifier |
| appliedAt | TEXT | NOT NULL | When migration was applied (ISO 8601) |

**Example Data:**
```sql
INSERT INTO migrations VALUES (
  1, 
  'excel_migration_v1', 
  '2026-06-17 10:00:00'
);
```

**Purpose:** Ensures migrations only run once

**Standard Migrations:**
- `excel_migration_v1` - Initial Excel-to-SQLite migration

---

## Indexes

### Performance Indexes

```sql
-- Fast lookups by lead ID
CREATE INDEX idx_leads_leadId ON leads(leadId);

-- Fast lookups by student ID
CREATE INDEX idx_students_studentId ON students(studentId);

-- Search by phone number
CREATE INDEX idx_contacts_phone ON leads(phone);

-- Search by email address
CREATE INDEX idx_contacts_email ON leads(email);

-- Filter by lead status
CREATE INDEX idx_leads_status ON leads(status);

-- Filter by country interest
CREATE INDEX idx_leads_country ON leads(countryInterest);
```

### Index Usage

| Index | Query | Benefit |
|-------|-------|---------|
| idx_leads_leadId | WHERE leadId = ? | Sub-millisecond lookup |
| idx_students_studentId | WHERE studentId = ? | Sub-millisecond lookup |
| idx_contacts_phone | WHERE phone = ? | Fast phone search |
| idx_contacts_email | WHERE email = ? | Fast email search |
| idx_leads_status | WHERE status = ? | Fast status filtering |
| idx_leads_country | WHERE countryInterest = ? | Fast country filtering |

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
└─────────────────┘

┌─────────────────────────────────────────┐
│           leads                         │
│  (prospective students)                 │
│                                         │
│  leadId ──────┐                         │
│  countryInterest ──→ countries.name    │
│  university ──→ universities.name      │
│  course ──────→ courses.name           │
└─────────────────────────────────────────┘
        │ (Confirmed status)
        │ Auto-creates
        ↓
┌─────────────────────────────────────────┐
│        students                         │
│  (enrolled students)                    │
│                                         │
│  leadId ──────→ leads.leadId (optional) │
│  country ──────→ countries.name         │
│  university ──────→ universities.name   │
│  course ──────→ courses.name            │
└─────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  countries   │  │universities  │  │    courses   │
│ (reference)  │  │ (reference)  │  │ (reference)  │
└──────────────┘  └──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│   settings   │  │ migrations   │
│  (config)    │  │ (tracking)   │
└──────────────┘  └──────────────┘
```

### Foreign Key Relationships (Logical)

Note: SQLite foreign keys are not enforced in this schema (PRAGMA foreign_keys OFF by default). The application enforces these relationships:

| Child Table | Child Column | Parent Table | Parent Column | Purpose |
|-------------|--------------|--------------|---------------|---------|
| leads | - | - | - | No enforced relationships |
| students | leadId | leads | leadId | Optional link to lead |
| - | - | - | - | - |

All lookups to reference data (countries, universities, courses) are application-level.

---

## SQL Schema

Complete CREATE TABLE statements:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT,
  createdAt TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  leadId TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  email TEXT,
  countryInterest TEXT,
  university TEXT,
  course TEXT,
  source TEXT,
  status TEXT,
  notes TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId TEXT UNIQUE,
  leadId TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  country TEXT,
  university TEXT,
  course TEXT,
  status TEXT,
  intake TEXT,
  notes TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS universities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  country TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE,
  value TEXT
);

CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  appliedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_leadId ON leads(leadId);
CREATE INDEX IF NOT EXISTS idx_students_studentId ON students(studentId);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(countryInterest);
```

---

## Migration Tracking

### Why Migrations Table?

The `migrations` table ensures database initialization is idempotent:

1. **On First Run:**
   - No migration records exist
   - All tables created
   - Excel data imported
   - Migration record inserted
   - Excel file deleted

2. **On Subsequent Runs:**
   - Migration record already exists
   - Skips import logic
   - Prevents data duplication
   - Allows safe server restarts

### Query Migration Status

```sql
-- Check if migration completed
SELECT * FROM migrations WHERE name = 'excel_migration_v1';

-- Output if migration completed:
-- | id | name | appliedAt |
-- | 1 | excel_migration_v1 | 2026-06-17 10:00:00 |

-- Reset migration (careful!)
DELETE FROM migrations WHERE name = 'excel_migration_v1';
```

---

## Data Types

| Type | Usage | Size | Notes |
|------|-------|------|-------|
| INTEGER | IDs, counters | 8 bytes | 64-bit signed |
| TEXT | Strings, dates | Variable | UTF-8 encoded |
| - | - | - | - |

### Date Format

All dates stored as TEXT in ISO 8601 format:
```
2026-06-17 10:30:45
YYYY-MM-DD HH:MM:SS
```

JavaScript creates these via:
```javascript
new Date().toISOString().slice(0, 19).replace('T', ' ')
// or
dayjs(date).format('YYYY-MM-DD HH:mm:ss')
```

---

## Performance Considerations

### Query Performance

| Operation | Indexed | Time |
|-----------|---------|------|
| SELECT by leadId | YES | < 1ms |
| SELECT by status | YES | < 1ms |
| LIKE search on name | NO | 1-10ms |
| INSERT | - | 1-5ms |
| UPDATE | - | 1-5ms |
| DELETE | - | 1-5ms |

### Scaling

- **Up to 100K records:** No issues
- **100K-1M records:** Consider adding indexes or pagination
- **1M+ records:** Consider sharding or PostgreSQL migration
- **Multiple servers:** Current SQLite not suitable; migrate to PostgreSQL

### WAL Mode

Database uses WAL (Write-Ahead Logging) mode for better concurrency:
- Allows concurrent reads while writing
- Slightly slower single-threaded writes
- Better for multi-connection scenarios
- Recommended for small-to-medium deployments

---

## Backup and Recovery

### Automatic Backups

Location: `backups/crm_YYYY-MM-DDTHH-MM-SS-mmmZ.db`  
Frequency: Every 30 minutes  
Format: Full database copy

### Manual Backup

```bash
# Create backup
cp server/database/crm.db backups/crm_manual_backup.db

# Restore from backup
cp backups/crm_manual_backup.db server/database/crm.db
```

### Recovery from Corruption

```bash
# Check database integrity
sqlite3 server/database/crm.db "PRAGMA integrity_check;"

# Restore from backup if corrupted
rm server/database/crm.db
cp backups/crm_YYYY-MM-DD*.db server/database/crm.db
```

---

## Maintenance

### Regular Tasks

- Monitor database file size: `ls -lh server/database/crm.db`
- Check backup directory: `ls -lh backups/`
- Verify integrity: `sqlite3 server/database/crm.db "PRAGMA integrity_check;"`
- Monitor query performance (application logs)

### Optimization

```sql
-- Analyze table statistics
ANALYZE;

-- Vacuum to compact database
VACUUM;

-- Rebuild indexes
REINDEX;
```

---

## Development Tools

### Open Database in SQL Client

```bash
# Using sqlite3 CLI
sqlite3 server/database/crm.db

# Using DB Browser for SQLite (GUI)
# https://sqlitebrowser.org/
```

### Common Queries

```sql
-- Record count by table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'students', COUNT(*) FROM students;

-- Total data size
SELECT page_count * page_size as size_bytes 
FROM pragma_page_count(), pragma_page_size();

-- Recently added leads
SELECT leadId, name, status, createdAt 
FROM leads 
ORDER BY createdAt DESC 
LIMIT 10;

-- Students by status
SELECT status, COUNT(*) as count 
FROM students 
GROUP BY status;

-- Leads by country
SELECT countryInterest, COUNT(*) as count 
FROM leads 
WHERE countryInterest IS NOT NULL 
GROUP BY countryInterest 
ORDER BY count DESC;
```

---

**Last Updated:** 2026-06-17  
**Version:** 1.0  
**Status:** Production Ready
