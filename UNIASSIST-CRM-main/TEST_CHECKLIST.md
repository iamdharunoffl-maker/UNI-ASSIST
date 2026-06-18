# Test Checklist

**Date:** 2026-06-17  
**Type:** Manual Integration Testing  
**Status:** Ready for User Testing  
**Environment:** Local Development → Staging → Production

## Pre-Test Setup

### Prerequisites

- [ ] Backend running: `npm run dev` in `server/` (port 5000)
- [ ] Frontend running: `npm run dev` in `client/` (port 5173)
- [ ] Database file exists: `server/database/crm.db`
- [ ] All migrations completed
- [ ] Excel file deleted from root
- [ ] No console errors visible

### Verification Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Check database
sqlite3 server/database/crm.db ".tables"

# Check frontend build
ls client/dist
```

---

## Phase 1: Database & Migration Tests

### Test 1.1: Database Initialization

**Objective:** Verify database is created and schema is correct

**Steps:**
1. [ ] Delete `server/database/crm.db` if exists
2. [ ] Delete `migrations` table entries
3. [ ] Start server: `npm run dev`
4. [ ] Check logs for "Database initialized"
5. [ ] Verify file created: `ls -la server/database/crm.db`

**Expected Result:**
- ✅ File `crm.db` created
- ✅ Log message includes "Database initialized"
- ✅ No errors in console

**Failure Action:** Check Node version (v18+), check permissions

---

### Test 1.2: Table Creation

**Objective:** Verify all 8 tables created with correct schema

**Steps:**
1. [ ] Run: `sqlite3 server/database/crm.db ".tables"`
2. [ ] List should include: users, leads, students, countries, universities, courses, settings, migrations
3. [ ] Run: `sqlite3 server/database/crm.db ".schema users"`
4. [ ] Verify columns: id, username, password, role, createdAt

**Expected Result:**
- ✅ All 8 tables exist
- ✅ users table has 5 columns
- ✅ leads table has 13 columns
- ✅ students table has 14 columns

**Failure Action:** Check database file not corrupted, try restoring from backup

---

### Test 1.3: Index Creation

**Objective:** Verify all 6 indexes created

**Steps:**
1. [ ] Run: `sqlite3 server/database/crm.db ".indices"`
2. [ ] List should include all 6 indexes

**Expected Result:**
- ✅ Output includes:
  - idx_leads_leadId
  - idx_students_studentId
  - idx_contacts_phone
  - idx_contacts_email
  - idx_leads_status
  - idx_leads_country

**Failure Action:** Manually create indexes or reinitialize database

---

### Test 1.4: Admin User Seeding

**Objective:** Verify default admin user created

**Steps:**
1. [ ] Run: `sqlite3 server/database/crm.db "SELECT * FROM users;"`
2. [ ] Result should include admin user
3. [ ] Verify columns: username=admin, role=admin

**Expected Result:**
- ✅ One user record exists
- ✅ username: admin
- ✅ role: admin
- ✅ password: hashed (not plaintext)

**Failure Action:** Manually insert admin user

---

### Test 1.5: Migration Tracking

**Objective:** Verify migration only runs once

**Steps:**
1. [ ] Check migrations table: `sqlite3 server/database/crm.db "SELECT * FROM migrations;"`
2. [ ] Should show: excel_migration_v1 with timestamp
3. [ ] Stop and restart server
4. [ ] Check migrations table again - should be unchanged

**Expected Result:**
- ✅ Migration record exists with timestamp
- ✅ Migration record unchanged after restart
- ✅ No "Excel migration completed" message on restart

**Failure Action:** Verify migrations table not corrupted

---

### Test 1.6: Excel File Deletion

**Objective:** Verify Excel file deleted after successful migration

**Steps:**
1. [ ] Check if `StudentManagement.xlsx` exists in project root
2. [ ] If still exists, check server logs for migration errors
3. [ ] If migration successful, file should be deleted

**Expected Result:**
- ✅ File `StudentManagement.xlsx` deleted
- ✅ OR doesn't exist if already migrated

**Failure Action:** If errors, check Excel file permissions, verify file format

---

### Test 1.7: Backup Creation

**Objective:** Verify automatic backups created

**Steps:**
1. [ ] Check backups directory: `ls -la backups/`
2. [ ] Should contain backup files with timestamp
3. [ ] Wait 30+ minutes and check again
4. [ ] New backup should be created

**Expected Result:**
- ✅ Backups directory exists
- ✅ Contains at least one backup file
- ✅ Format: crm_YYYY-MM-DDTHH-MM-SS-mmmZ.db
- ✅ File size similar to crm.db

**Failure Action:** Check file permissions, check disk space

---

## Phase 2: Authentication Tests

### Test 2.1: Login with Valid Credentials

**Objective:** Verify user can login

**Steps:**
1. [ ] Open frontend: http://localhost:5173
2. [ ] Enter username: `admin`
3. [ ] Enter password: `Admin@123`
4. [ ] Click "Login"

**Expected Result:**
- ✅ Page redirects to dashboard
- ✅ No error message
- ✅ Browser cookie set with token
- ✅ Console shows no errors

**Verification:**
```bash
curl -c cookies.txt -b cookies.txt http://localhost:5173
# Check for token cookie
```

**Failure Action:** Verify admin user exists, check password hashing

---

### Test 2.2: Login with Invalid Credentials

**Objective:** Verify error on wrong password

**Steps:**
1. [ ] Enter username: `admin`
2. [ ] Enter password: `wrongpassword`
3. [ ] Click "Login"

**Expected Result:**
- ✅ Error message: "Invalid username or password"
- ✅ Stays on login page
- ✅ No cookie set

**Failure Action:** Check password comparison logic

---

### Test 2.3: Login Rate Limiting

**Objective:** Verify login rate limiting after 10 failed attempts

**Steps:**
1. [ ] Try logging in with wrong password
2. [ ] Repeat 10+ times
3. [ ] On 11th attempt, should see rate limit error

**Expected Result:**
- ✅ After 10 attempts: "Too many requests"
- ✅ Cannot login for 5 minutes
- ✅ After 5 minutes: can try again

**Failure Action:** Check rate limiter middleware

---

### Test 2.4: Get Current User

**Objective:** Verify `/api/auth/me` returns user data

**Steps:**
1. [ ] Login first
2. [ ] Run: `curl -H "Cookie: token=<jwt_token>" http://localhost:5000/api/auth/me`
3. [ ] Should return user data

**Expected Result:**
- ✅ Returns JSON with id, username, role, createdAt

**Failure Action:** Check JWT middleware, verify token in cookie

---

### Test 2.5: Logout

**Objective:** Verify logout clears authentication

**Steps:**
1. [ ] After login, click "Logout" button
2. [ ] Should redirect to login page
3. [ ] Try accessing protected route
4. [ ] Should redirect to login

**Expected Result:**
- ✅ Redirects to login page
- ✅ Cookie cleared
- ✅ Cannot access protected pages

**Failure Action:** Check logout endpoint, check cookie clearing

---

### Test 2.6: Unauthorized Access

**Objective:** Verify 401 error without authentication

**Steps:**
1. [ ] Don't login
2. [ ] Try to access: http://localhost:5173/dashboard
3. [ ] Should redirect to login

**Expected Result:**
- ✅ Redirects to login page
- ✅ Or shows 401 error

**Failure Action:** Check auth middleware, check route protection

---

## Phase 3: Leads CRUD Tests

### Test 3.1: Create Lead

**Objective:** Verify new lead can be created

**Steps:**
1. [ ] Login as admin
2. [ ] Navigate to Leads page
3. [ ] Click "Add New Lead" button
4. [ ] Fill in form:
   - Name: `Test Lead 001`
   - Email: `test@example.com`
   - Phone: `+1-555-0001`
   - Country: `USA`
   - University: `Stanford`
   - Course: `MBA`
   - Source: `Google`
   - Status: `Pending`
5. [ ] Click "Save"

**Expected Result:**
- ✅ Lead created successfully
- ✅ Assigned ID like `LD-XXXXXX`
- ✅ Appears in leads list
- ✅ Timestamp shows current date/time
- ✅ Database confirms insert

**Verification:**
```bash
sqlite3 server/database/crm.db "SELECT COUNT(*) FROM leads;"
# Count increased by 1
```

**Failure Action:** Check form validation, check API response

---

### Test 3.2: View Lead Details

**Objective:** Verify lead details can be viewed

**Steps:**
1. [ ] Click on a lead in the list
2. [ ] Should show all lead details

**Expected Result:**
- ✅ All fields displayed correctly
- ✅ No data truncation
- ✅ Special characters preserved

**Failure Action:** Check field rendering

---

### Test 3.3: Edit Lead

**Objective:** Verify lead can be updated

**Steps:**
1. [ ] Open a lead details
2. [ ] Click "Edit" button
3. [ ] Change status: `Pending` → `Confirmed`
4. [ ] Update notes: Add some text
5. [ ] Click "Save"

**Expected Result:**
- ✅ Lead updated successfully
- ✅ Status changed
- ✅ Updated timestamp shows current time
- ✅ Student record auto-created (see Test 4.1)

**Verification:**
```bash
sqlite3 server/database/crm.db "SELECT status FROM leads WHERE leadId='LD-XXXXX';"
# Should show: Confirmed
```

**Failure Action:** Check update endpoint, check date update

---

### Test 3.4: Delete Lead

**Objective:** Verify lead can be deleted

**Steps:**
1. [ ] Select a lead from list
2. [ ] Click "Delete" button
3. [ ] Confirm deletion

**Expected Result:**
- ✅ Lead deleted from list
- ✅ Database confirms deletion

**Verification:**
```bash
sqlite3 server/database/crm.db "SELECT COUNT(*) FROM leads;"
# Count decreased by 1
```

**Failure Action:** Check delete endpoint

---

### Test 3.5: Search Leads

**Objective:** Verify lead search functionality

**Steps:**
1. [ ] Go to Leads page
2. [ ] Enter search term in search box: `Test Lead`
3. [ ] Results should filter

**Expected Result:**
- ✅ Only matching leads shown
- ✅ Search works on name, email, phone

**Failure Action:** Check search API endpoint

---

### Test 3.6: Filter Leads by Status

**Objective:** Verify status filter works

**Steps:**
1. [ ] Click status filter dropdown
2. [ ] Select `Confirmed`
3. [ ] Only confirmed leads shown

**Expected Result:**
- ✅ Only leads with status=Confirmed shown
- ✅ Count matches database

**Failure Action:** Check filter endpoint

---

### Test 3.7: Export Leads to CSV

**Objective:** Verify leads can be exported

**Steps:**
1. [ ] Go to Leads page
2. [ ] Click "Export" button
3. [ ] Save CSV file

**Expected Result:**
- ✅ CSV file downloaded
- ✅ Filename: `Leads_Export.csv`
- ✅ All columns present
- ✅ All rows included
- ✅ Can open in Excel

**Verification:**
```bash
# Check file
head -5 Leads_Export.csv
```

**Failure Action:** Check export endpoint, verify json2csv working

---

### Test 3.8: Pagination

**Objective:** Verify pagination works

**Steps:**
1. [ ] Go to Leads page
2. [ ] Set page size to 5
3. [ ] Navigate through pages
4. [ ] Check page 2 shows different records

**Expected Result:**
- ✅ Correct number of records per page
- ✅ Pages navigate correctly
- ✅ Total count accurate

**Failure Action:** Check pagination parameters

---

## Phase 4: Students CRUD Tests

### Test 4.1: Auto-Create Student from Lead

**Objective:** Verify student created when lead status → Confirmed

**Steps:**
1. [ ] Create new lead (see Test 3.1)
2. [ ] Edit lead to status: `Confirmed`
3. [ ] Save
4. [ ] Navigate to Students page

**Expected Result:**
- ✅ New student record created
- ✅ Student ID: `ST-XXXXXX`
- ✅ Link to original lead
- ✅ Same name as lead

**Verification:**
```bash
sqlite3 server/database/crm.db "SELECT * FROM students WHERE leadId='LD-XXXXX';"
# Should return student record
```

**Failure Action:** Check auto-convert logic

---

### Test 4.2: Create Student Manually

**Objective:** Verify student can be created without lead

**Steps:**
1. [ ] Go to Students page
2. [ ] Click "Add New Student"
3. [ ] Fill form without lead ID
4. [ ] Save

**Expected Result:**
- ✅ Student created
- ✅ leadId is NULL
- ✅ Standalone record

**Failure Action:** Check form validation

---

### Test 4.3: Edit Student

**Objective:** Verify student data can be updated

**Steps:**
1. [ ] Open student record
2. [ ] Update status: `Applied` → `Admitted`
3. [ ] Update intake: `Fall 2026`
4. [ ] Save

**Expected Result:**
- ✅ Fields updated
- ✅ Timestamp current
- ✅ Changes persisted

**Failure Action:** Check update endpoint

---

### Test 4.4: Delete Student

**Objective:** Verify student can be deleted

**Steps:**
1. [ ] Select a student
2. [ ] Click "Delete"
3. [ ] Confirm

**Expected Result:**
- ✅ Removed from list
- ✅ Database confirms deletion

**Failure Action:** Check delete endpoint

---

### Test 4.5: Export Students to CSV

**Objective:** Verify student export works

**Steps:**
1. [ ] Go to Students page
2. [ ] Click "Export"
3. [ ] Save CSV

**Expected Result:**
- ✅ CSV file downloaded
- ✅ Filename: `Students_Export.csv`
- ✅ All records included

**Failure Action:** Check export endpoint

---

## Phase 5: Masters Data Tests

### Test 5.1: View Masters Data

**Objective:** Verify reference data is accessible

**Steps:**
1. [ ] Navigate to Settings/Masters page
2. [ ] View Countries list
3. [ ] View Universities list
4. [ ] View Courses list

**Expected Result:**
- ✅ All lists display
- ✅ Data readable
- ✅ No errors

**Failure Action:** Check masters endpoints

---

### Test 5.2: Add Country

**Objective:** Verify new country can be added (admin only)

**Steps:**
1. [ ] Go to Masters → Countries
2. [ ] Click "Add Country"
3. [ ] Enter: `New Zealand`
4. [ ] Save

**Expected Result:**
- ✅ Country added to list
- ✅ Can select in lead/student forms

**Failure Action:** Check add country endpoint

---

### Test 5.3: Edit Master Data

**Objective:** Verify master data can be updated

**Steps:**
1. [ ] Select a country
2. [ ] Click "Edit"
3. [ ] Change name
4. [ ] Save

**Expected Result:**
- ✅ Updated in database
- ✅ Updated in dropdowns

**Failure Action:** Check update endpoint

---

### Test 5.4: Delete Master Data

**Objective:** Verify master data can be deleted

**Steps:**
1. [ ] Select a course
2. [ ] Click "Delete"
3. [ ] Confirm

**Expected Result:**
- ✅ Removed from list
- ✅ No longer available in dropdowns

**Failure Action:** Check delete endpoint

---

## Phase 6: Configuration Tests

### Test 6.1: View Configuration

**Objective:** Verify config can be viewed

**Steps:**
1. [ ] Navigate to Settings
2. [ ] Should show current settings

**Expected Result:**
- ✅ Settings displayed:
  - Company Name
  - Currency
  - Allow Lead Deletion
  - Auto Backup Interval

**Failure Action:** Check config endpoint

---

### Test 6.2: Update Configuration

**Objective:** Verify config can be updated (admin only)

**Steps:**
1. [ ] Go to Settings
2. [ ] Change Company Name to: `Global Education Ltd`
3. [ ] Change Currency to: `GBP`
4. [ ] Save

**Expected Result:**
- ✅ Changes saved
- ✅ Reflected on page refresh
- ✅ Database confirms changes

**Failure Action:** Check config update endpoint

---

### Test 6.3: Admin-Only Config Update

**Objective:** Verify non-admin cannot update config

**Steps:**
1. [ ] Login as regular user (create one)
2. [ ] Try to access Settings/Config
3. [ ] Should see error or be redirected

**Expected Result:**
- ✅ Error: "Admin access required"
- ✅ Cannot update

**Failure Action:** Check admin middleware

---

## Phase 7: Performance Tests

### Test 7.1: Large Dataset

**Objective:** Verify performance with many records

**Steps:**
1. [ ] Create script to insert 1000 leads
2. [ ] Run: `node scripts/create-test-data.js`
3. [ ] Navigate to Leads page
4. [ ] Should load within 2 seconds

**Expected Result:**
- ✅ List loads quickly
- ✅ Pagination works
- ✅ Search responsive (< 500ms)
- ✅ No console errors

**Performance Targets:**
- List load: < 2 seconds
- Search: < 500ms
- Export: < 5 seconds

**Failure Action:** Add indexes, optimize queries

---

### Test 7.2: Concurrent Users

**Objective:** Verify system handles concurrent access

**Steps:**
1. [ ] Open 3 browser windows
2. [ ] Login in each with same account
3. [ ] Each user creates/updates records
4. [ ] Verify no conflicts

**Expected Result:**
- ✅ No database locks
- ✅ All operations succeed
- ✅ No data corruption

**Failure Action:** Check database locking

---

## Phase 8: Error Handling Tests

### Test 8.1: Invalid Input

**Objective:** Verify form validation

**Steps:**
1. [ ] Try to create lead without name
2. [ ] Try to enter very long name (> 1000 chars)
3. [ ] Try to enter invalid email

**Expected Result:**
- ✅ Form shows error messages
- ✅ Cannot submit invalid form
- ✅ User-friendly error text

**Failure Action:** Check form validation

---

### Test 8.2: Database Error Handling

**Objective:** Verify graceful handling of DB errors

**Steps:**
1. [ ] Stop database
2. [ ] Try to perform CRUD operation
3. [ ] Should show user-friendly error

**Expected Result:**
- ✅ Error message shown
- ✅ Not raw database error
- ✅ Application continues running

**Failure Action:** Check error handling middleware

---

### Test 8.3: Network Error Handling

**Objective:** Verify handling of API failures

**Steps:**
1. [ ] Open Network tab in DevTools
2. [ ] Throttle network to "Offline"
3. [ ] Try API operation
4. [ ] Should show error

**Expected Result:**
- ✅ Error message shown
- ✅ No infinite loading
- ✅ Retry option available

**Failure Action:** Check API error interceptor

---

## Phase 9: Security Tests

### Test 9.1: XSS Protection

**Objective:** Verify XSS attacks prevented

**Steps:**
1. [ ] Try to create lead with name: `<script>alert('XSS')</script>`
2. [ ] Save
3. [ ] View lead
4. [ ] Check console

**Expected Result:**
- ✅ Script not executed
- ✅ Displayed as text
- ✅ No console errors

**Failure Action:** Check input sanitization

---

### Test 9.2: SQL Injection Protection

**Objective:** Verify SQL injection prevented

**Steps:**
1. [ ] Try to search with: `' OR '1'='1`
2. [ ] Should not return all records

**Expected Result:**
- ✅ Parameterized queries used
- ✅ Only exact match found (none)
- ✅ No SQL error

**Failure Action:** Verify parameterized queries

---

### Test 9.3: CSRF Protection

**Objective:** Verify CSRF attacks prevented

**Steps:**
1. [ ] Check for CSRF token in forms
2. [ ] Try form submission without token

**Expected Result:**
- ✅ Token present in forms
- ✅ Request rejected without token
- ✅ 403 error returned

**Failure Action:** Check CSRF middleware

---

### Test 9.4: Authentication Token Security

**Objective:** Verify JWT tokens secure

**Steps:**
1. [ ] Get JWT token from cookie
2. [ ] Verify it's in httpOnly cookie (not accessible via JS)
3. [ ] Verify Secure flag set (only HTTPS)

**Expected Result:**
- ✅ httpOnly flag present
- ✅ Secure flag present
- ✅ SameSite flag set

**Verification:**
```bash
# In browser console
document.cookie
# Token should NOT appear
```

**Failure Action:** Check cookie settings

---

## Phase 10: Browser Compatibility

### Test 10.1: Chrome

**Objective:** Verify app works in Chrome

**Steps:**
1. [ ] Open in Chrome (latest)
2. [ ] Perform Tests 3.1-3.7 (Leads)
3. [ ] Check console for errors

**Expected Result:**
- ✅ No console errors
- ✅ All features work
- ✅ Layout correct

---

### Test 10.2: Firefox

**Objective:** Verify app works in Firefox

**Steps:**
1. [ ] Open in Firefox (latest)
2. [ ] Perform Tests 3.1-3.7 (Leads)
3. [ ] Check console for errors

**Expected Result:**
- ✅ No console errors
- ✅ All features work

---

### Test 10.3: Safari

**Objective:** Verify app works in Safari (if Mac available)

**Steps:**
1. [ ] Open in Safari
2. [ ] Perform basic operations

**Expected Result:**
- ✅ Works correctly

---

## Phase 11: Deployment Tests

### Test 11.1: Production Build

**Objective:** Verify production build works

**Steps:**
1. [ ] Backend: `NODE_ENV=production npm start`
2. [ ] Frontend: `npm run build` → serve dist/
3. [ ] Test all features

**Expected Result:**
- ✅ App loads
- ✅ All API calls work
- ✅ No development warnings

**Failure Action:** Check production config

---

### Test 11.2: Render Deployment

**Objective:** Verify app works on Render

**Steps:**
1. [ ] Deploy backend to Render
2. [ ] Deploy frontend to Vercel
3. [ ] Test full flow

**Expected Result:**
- ✅ Frontend loads from Vercel
- ✅ API calls work to Render
- ✅ Database accessible

**Failure Action:** Check environment variables, check CORS

---

## Final Verification

### Pre-Release Checklist

- [ ] All tests passed ✅
- [ ] No console errors
- [ ] No network errors
- [ ] Database backups working
- [ ] Admin credentials changed
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Logging configured
- [ ] Error handling implemented
- [ ] Documentation complete

### Sign-Off

**Tested By:** ________________  
**Date:** ________________  
**Status:** ✅ Ready for Production

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-17  
**Next Review:** After first production deployment
