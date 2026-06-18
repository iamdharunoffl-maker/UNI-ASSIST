const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const { DEFAULT_CONFIG } = require('../config/constants');

const dbDir = path.resolve(__dirname, '../database');
const dbFile = path.join(dbDir, 'crm.db');
const backupsDir = path.resolve(__dirname, '../../backups');

const ensureDirectory = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

let db; // sqlite wrapper (from sqlite.open)

const openDb = async () => {
  if (db) return db;
  ensureDirectory(dbDir);
  db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });
  // Enable WAL for better concurrency
  await db.exec('PRAGMA journal_mode = WAL;');
  return db;
};

// ─── SCHEMA & SEED ─────────────────────────────────────────────────────────────

// Initialize DB: create tables, seed admin + default config, run one-time migration if Excel present
const initializeDb = async () => {
  const conn = await openDb();

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      createdAt TEXT,
      must_change_password INTEGER DEFAULT 0
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
      name TEXT UNIQUE,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      country TEXT,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      university TEXT NOT NULL,
      status TEXT DEFAULT 'active'
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
  `;

  await conn.exec(schema);

  // Ensure new columns exist for older DBs (safe migrations)
  const addColumnIfMissing = async (table, column, definition) => {
    const info = await conn.all(`PRAGMA table_info(${table});`);
    const exists = info.some(i => i.name === column);
    if (!exists) {
      // Add the column preserving existing data
      await conn.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
      console.log(`Migration: added column ${column} to ${table}`);
    }
  };

  // Add missing columns if upgrading from older schema
  await addColumnIfMissing('users', 'must_change_password', "INTEGER DEFAULT 0");
  await addColumnIfMissing('countries', 'status', "TEXT DEFAULT 'active'");
  await addColumnIfMissing('universities', 'status', "TEXT DEFAULT 'active'");
    await addColumnIfMissing('courses', 'university', "TEXT");
  await addColumnIfMissing('courses', 'status', "TEXT DEFAULT 'active'");

  // Repair existing rows that may have NULL status
  try {
    await conn.run("UPDATE countries SET status = 'active' WHERE status IS NULL OR status = '';");
    await conn.run("UPDATE universities SET status = 'active' WHERE status IS NULL OR status = '';");
    await conn.run("UPDATE courses SET status = 'active' WHERE status IS NULL OR status = '';");
      const orphanCourses = await conn.all("SELECT id, name FROM courses WHERE university IS NULL OR university = '' LIMIT 20");
      if (orphanCourses && orphanCourses.length > 0) {
        console.warn(`Migration warning: ${orphanCourses.length} course(s) missing 'university' value. Example rows:`);
        orphanCourses.forEach(r => console.warn(`  id=${r.id} name=${r.name}`));
      }
  } catch (e) {
    console.warn('Status repair migration encountered an issue:', e.message || e);
  }

  // Seed admin user if none exist. Use environment variables for username/password.
  const userRow = await conn.get('SELECT COUNT(1) as cnt FROM users');
  if (userRow && userRow.cnt === 0) {
    const adminUser = process.env.DEFAULT_ADMIN_USERNAME;
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD;
    if (adminUser && adminPass) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(adminPass, salt);
      // Force first-login password change by default
      await conn.run(
        'INSERT INTO users (username, password, role, createdAt, must_change_password) VALUES (?, ?, ?, ?, ?)',
        [adminUser, hash, 'admin', new Date().toISOString(), 1]
      );
      console.log('Default admin user seeded. PLEASE change the password on first login.');
    } else {
      console.warn('No admin user found and DEFAULT_ADMIN_USERNAME/DEFAULT_ADMIN_PASSWORD not set. Skipping admin seed.');
    }
  }

  // FIX: Seed default config/settings if empty (was never seeded before)
  const settingRow = await conn.get('SELECT COUNT(1) as cnt FROM settings');
  if (settingRow && settingRow.cnt === 0) {
    const stmt = await conn.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
      await stmt.run(key, String(value));
    }
    await stmt.finalize?.();
    console.log('Default configuration settings seeded.');
  }

  // One-time migration from Excel if present
  const excelPath = path.resolve(__dirname, '../../StudentManagement.xlsx');
  if (fs.existsSync(excelPath)) {
    const mig = await conn.get('SELECT 1 FROM migrations WHERE name = ?', ['excel_migration_v1']);
    if (!mig) {
      console.log('Found StudentManagement.xlsx — migrating data into SQLite...');
      try {
        await migrateFromExcel(excelPath);
        await conn.run('INSERT INTO migrations (name, appliedAt) VALUES (?, ?)', ['excel_migration_v1', new Date().toISOString()]);
        // Remove the original Excel file to eliminate Excel-specific artifact
        try { fs.unlinkSync(excelPath); } catch (e) { /* ignore */ }
        console.log('Migration complete. Excel file removed.');
      } catch (err) {
        console.error('Migration failed:', err);
      }
    }
  }
};

const migrateFromExcel = async (excelPath) => {
  const conn = await openDb();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);

  // Wrap in transaction
  await conn.run('BEGIN TRANSACTION');
  try {
    // Users
    const usersSheet = workbook.getWorksheet('Users') || workbook.getWorksheet('users');
    if (usersSheet) {
      const insert = await conn.prepare('INSERT OR IGNORE INTO users (username, password, role, createdAt) VALUES (?, ?, ?, ?)');
      const userPromises = [];
      usersSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const vals = row.values;
        const username = vals[1] || '';
        const password = vals[2] || '';
        const role = vals[3] || 'user';
        userPromises.push(insert.run(username.toString(), password.toString(), role.toString(), new Date().toISOString()));
      });
      await Promise.all(userPromises);
      await insert.finalize?.();
    }

    // Leads
    const leadsSheet = workbook.getWorksheet('Leads') || workbook.getWorksheet('leads');
    if (leadsSheet) {
      const headers = [];
      const rows = [];
      leadsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const vals = row.values;
        if (rowNumber === 1) {
          for (let i = 1; i < vals.length; i++) headers.push((vals[i] || '').toString());
          return;
        }
        const obj = {};
        for (let i = 1; i < vals.length; i++) obj[headers[i - 1] || `c${i}`] = vals[i];
        rows.push(obj);
      });
      const stmt = await conn.prepare('INSERT OR IGNORE INTO leads (leadId, name, phone, email, countryInterest, university, course, source, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const leadPromises = [];
      for (const r of rows) {
        const id = r.id || r.leadId || r.LeadID || '';
        leadPromises.push(stmt.run(id || '', r.name || r.studentName || '', r.phone || '', r.email || '', r.countryInterest || r.country || '', r.university || '', r.course || '', r.source || '', r.status || '', r.notes || r.remarks || '', r.createdAt || new Date().toISOString(), r.updatedAt || new Date().toISOString()));
      }
      await Promise.all(leadPromises);
      await stmt.finalize?.();
    }

    // Students
    const studentsSheet = workbook.getWorksheet('Students') || workbook.getWorksheet('students');
    if (studentsSheet) {
      const headers = [];
      const rows = [];
      studentsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const vals = row.values;
        if (rowNumber === 1) {
          for (let i = 1; i < vals.length; i++) headers.push((vals[i] || '').toString());
          return;
        }
        const obj = {};
        for (let i = 1; i < vals.length; i++) obj[headers[i - 1] || `c${i}`] = vals[i];
        rows.push(obj);
      });
      const stmt = await conn.prepare('INSERT OR IGNORE INTO students (studentId, leadId, name, phone, email, country, university, course, status, intake, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const studentPromises = [];
      for (const r of rows) {
        const id = r.id || r.studentId || r.StudentID || '';
        studentPromises.push(stmt.run(id || '', r.leadId || '', r.name || r.studentName || '', r.phone || '', r.email || '', r.country || '', r.university || '', r.course || '', r.status || '', r.intake || '', r.notes || r.remarks || '', r.createdAt || new Date().toISOString(), r.updatedAt || new Date().toISOString()));
      }
      await Promise.all(studentPromises);
      await stmt.finalize?.();
    }

    // Countries
    const countriesSheet = workbook.getWorksheet('Countries') || workbook.getWorksheet('countries');
    if (countriesSheet) {
      await conn.run('DELETE FROM countries');
      const stmt = await conn.prepare('INSERT INTO countries (name) VALUES (?)');
      const countryPromises = [];
      countriesSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const name = (row.values[2] || row.values[1] || '').toString().trim();
        if (name && name !== 'ID' && name !== 'Name') {
          countryPromises.push(stmt.run(name));
        }
      });
      await Promise.all(countryPromises);
      await stmt.finalize?.();
    }

    // Universities
    const unisSheet = workbook.getWorksheet('Universities') || workbook.getWorksheet('universities');
    if (unisSheet) {
      await conn.run('DELETE FROM universities');
      const stmt = await conn.prepare('INSERT INTO universities (name, country) VALUES (?, ?)');
      const uniPromises = [];
      unisSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const country = (row.values[2] || '').toString().trim();
        const name = (row.values[3] || row.values[2] || '').toString().trim();
        if (name && name !== 'ID' && name !== 'Name' && name !== 'Country') {
          uniPromises.push(stmt.run(name, country));
        }
      });
      await Promise.all(uniPromises);
      await stmt.finalize?.();
    }

    // Courses
    const coursesSheet = workbook.getWorksheet('Courses') || workbook.getWorksheet('courses');
    if (coursesSheet) {
      await conn.run('DELETE FROM courses');
      const stmt = await conn.prepare('INSERT INTO courses (name, university, status) VALUES (?, ?, ?)');
      const coursePromises = [];
      coursesSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        // Expected columns: ID, Name, University, Status (flexible fallback)
        const name = (row.values[2] || row.values[1] || '').toString().trim();
        const university = (row.values[3] || '').toString().trim();
        const status = (row.values[4] || row.values[3] || 'active').toString().trim();
        if (name && name !== 'ID' && name !== 'Name') {
          coursePromises.push(stmt.run(name, university, status));
        }
      });
      await Promise.all(coursePromises);
      await stmt.finalize?.();
    }

    // Config -> settings
    const configSheet = workbook.getWorksheet('Config') || workbook.getWorksheet('config');
    if (configSheet) {
      const stmt = await conn.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
      const configPromises = [];
      configSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const key = row.values[1];
        const value = row.values[2];
        if (key) configPromises.push(stmt.run(key.toString(), value ? value.toString() : ''));
      });
      await Promise.all(configPromises);
      await stmt.finalize?.();
    }

    await conn.run('COMMIT');
  } catch (err) {
    await conn.run('ROLLBACK');
    throw err;
  }
};

// ─── READ (for list views) ─────────────────────────────────────────────────────

// Generic readSheet to preserve controller expectations (returns arrays of objects)
const readSheet = async (sheetName) => {
  const conn = await openDb();
  const name = (sheetName || '').toLowerCase();
  if (name === 'users') {
    const rows = await conn.all('SELECT username, password, role, createdAt, must_change_password FROM users');
    return rows.map(r => ({ username: r.username, password: r.password, role: r.role, createdAt: r.createdAt, must_change_password: r.must_change_password }));
  }
  if (name === 'leads') {
    const rows = await conn.all('SELECT leadId, name, phone, email, countryInterest, university, course, source, status, notes, createdAt, updatedAt FROM leads ORDER BY createdAt DESC');
    return rows.map(r => ({ id: r.leadId, name: r.name, email: r.email, phone: r.phone, countryInterest: r.countryInterest, university: r.university, course: r.course, source: r.source, status: r.status, notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt }));
  }
  if (name === 'students') {
    const rows = await conn.all('SELECT studentId, leadId, name, phone, email, country, university, course, status, intake, notes, createdAt, updatedAt FROM students ORDER BY createdAt DESC');
    return rows.map(r => ({ id: r.studentId, leadId: r.leadId, name: r.name, email: r.email, phone: r.phone, country: r.country, university: r.university, course: r.course, status: r.status, intake: r.intake, notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt }));
  }
  if (name === 'countries') {
    return await conn.all('SELECT id, name, status FROM countries ORDER BY name');
  }
  if (name === 'universities') {
    return await conn.all('SELECT id, name, country, status FROM universities ORDER BY name');
  }
  if (name === 'courses') {
    return await conn.all('SELECT id, name, university, status FROM courses ORDER BY name');
  }
  if (name === 'config' || name === 'settings') {
    return await conn.all('SELECT id, key, value FROM settings');
  }

  return [];
};

// ─── DIRECT LEAD CRUD ─────────────────────────────────────────────────────────

const _mapLeadRow = (r) => ({
  id: r.leadId,
  name: r.name,
  email: r.email,
  phone: r.phone,
  countryInterest: r.countryInterest,
  university: r.university,
  course: r.course,
  source: r.source,
  status: r.status,
  notes: r.notes,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const getLeadByLeadId = async (leadId) => {
  const conn = await openDb();
  const r = await conn.get(
    'SELECT leadId, name, phone, email, countryInterest, university, course, source, status, notes, createdAt, updatedAt FROM leads WHERE leadId = ?',
    [leadId]
  );
  return r ? _mapLeadRow(r) : null;
};

const insertLead = async (data) => {
  const conn = await openDb();
  if (data.id) {
    const existing = await getLeadByLeadId(data.id);
    if (existing) throw Object.assign(new Error('Lead with the given id already exists.'), { status: 409 });
  }
  await conn.run(
    'INSERT INTO leads (leadId, name, phone, email, countryInterest, university, course, source, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.id, data.name || '', data.phone || '', data.email || '',
      data.countryInterest || '', data.university || '', data.course || '',
      data.source || '', data.status || '', data.notes || '',
      data.createdAt, data.updatedAt
    ]
  );
};

const updateLeadById = async (leadId, fields) => {
  const conn = await openDb();
  const result = await conn.run(
    'UPDATE leads SET name=?, phone=?, email=?, countryInterest=?, university=?, course=?, source=?, status=?, notes=?, updatedAt=? WHERE leadId=?',
    [
      fields.name, fields.phone, fields.email, fields.countryInterest,
      fields.university, fields.course, fields.source, fields.status,
      fields.notes, fields.updatedAt, leadId
    ]
  );
  return result.changes > 0;
};

const deleteLeadById = async (leadId) => {
  const conn = await openDb();
  // Delete associated students to avoid orphans
  await conn.run('DELETE FROM students WHERE leadId = ?', [leadId]);
  const result = await conn.run('DELETE FROM leads WHERE leadId = ?', [leadId]);
  return result.changes > 0;
};

// Paginated leads query with server-side search/filter/sort
const getLeadsPaginated = async ({ page = 1, limit = 20, search, status, source, sortBy, sortOrder = 'desc', countryInterest } = {}) => {
  const conn = await openDb();
  // Validate paging
  const pageNum = Math.max(1, parseInt(page) || 1);
  let limitNum = Math.max(1, parseInt(limit) || 20);
  limitNum = Math.min(100, limitNum);
  const offset = (pageNum - 1) * limitNum;

  // Inspect columns to safely build queries
  const info = await conn.all("PRAGMA table_info('leads')");
  const cols = new Set(info.map(c => c.name));

  // Build WHERE clauses
  const where = [];
  const params = [];

  if (search) {
    const term = `%${search}%`;
    const searchCols = ['first_name', 'last_name', 'name', 'email', 'phone'].filter(c => cols.has(c));
    if (searchCols.length > 0) {
      const ors2 = [];
      for (const c of ['first_name', 'last_name', 'name', 'email', 'phone']) {
        if (cols.has(c)) {
          ors2.push(`${c} LIKE ?`);
          params.push(term);
        }
      }
      if (ors2.length > 0) where.push(`(${ors2.join(' OR ')})`);
    }
  }

  if (status && cols.has('status')) {
    where.push('status = ?');
    params.push(status);
  }
  if (source && cols.has('source')) {
    where.push('source = ?');
    params.push(source);
  }
  if (countryInterest && cols.has('countryInterest')) {
    where.push('countryInterest = ?');
    params.push(countryInterest);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  // Whitelist and map sort columns
  const sortMap = {
    'created_at': cols.has('createdAt') ? 'createdAt' : (cols.has('created_at') ? 'created_at' : 'createdAt'),
    'first_name': cols.has('first_name') ? 'first_name' : 'name',
    'last_name': cols.has('last_name') ? 'last_name' : 'name',
    'status': 'status',
    'source': 'source'
  };
  const sortKey = (sortBy || 'created_at').toLowerCase();
  const sortCol = sortMap[sortKey] && cols.has(sortMap[sortKey]) ? sortMap[sortKey] : (cols.has('createdAt') ? 'createdAt' : 'rowid');
  const order = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Total count
  const countSql = `SELECT COUNT(1) as total FROM leads ${whereClause}`;
  const countRow = await conn.get(countSql, params);
  const total = countRow ? countRow.total : 0;

  // Data query
  const dataSql = `SELECT leadId, name, phone, email, countryInterest, university, course, source, status, notes, createdAt, updatedAt FROM leads ${whereClause} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`;
  const dataParams = params.concat([limitNum, offset]);
  const rows = await conn.all(dataSql, dataParams);
  const data = rows.map(r => _mapLeadRow(r));

  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
};

// ─── DIRECT STUDENT CRUD ──────────────────────────────────────────────────────

const _mapStudentRow = (r) => ({
  id: r.studentId,
  leadId: r.leadId,
  name: r.name,
  email: r.email,
  phone: r.phone,
  country: r.country,
  university: r.university,
  course: r.course,
  status: r.status,
  intake: r.intake,
  notes: r.notes,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});

const getStudentByStudentId = async (studentId) => {
  const conn = await openDb();
  const r = await conn.get(
    'SELECT studentId, leadId, name, phone, email, country, university, course, status, intake, notes, createdAt, updatedAt FROM students WHERE studentId = ?',
    [studentId]
  );
  return r ? _mapStudentRow(r) : null;
};

const getStudentByLeadId = async (leadId) => {
  const conn = await openDb();
  const r = await conn.get('SELECT studentId FROM students WHERE leadId = ?', [leadId]);
  return r || null;
};

const insertStudent = async (data) => {
  const conn = await openDb();
  // If leadId provided, ensure the lead exists to maintain referential integrity
  if (data.leadId) {
    const lead = await getLeadByLeadId(data.leadId);
    if (!lead) throw Object.assign(new Error('Referenced lead not found.'), { status: 400 });
  }
  await conn.run(
    'INSERT INTO students (studentId, leadId, name, phone, email, country, university, course, status, intake, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      data.id, data.leadId || '', data.name || '', data.phone || '',
      data.email || '', data.country || '', data.university || '',
      data.course || '', data.status || '', data.intake || '',
      data.notes || '', data.createdAt, data.updatedAt
    ]
  );
};

const updateStudentById = async (studentId, fields) => {
  const conn = await openDb();
  const result = await conn.run(
    'UPDATE students SET name=?, phone=?, email=?, country=?, university=?, course=?, status=?, intake=?, notes=?, updatedAt=? WHERE studentId=?',
    [
      fields.name, fields.phone, fields.email, fields.country,
      fields.university, fields.course, fields.status, fields.intake,
      fields.notes, fields.updatedAt, studentId
    ]
  );
  return result.changes > 0;
};

const deleteStudentById = async (studentId) => {
  const conn = await openDb();
  const result = await conn.run('DELETE FROM students WHERE studentId = ?', [studentId]);
  return result.changes > 0;
};

// Paginated students query with server-side search/filter/sort
const getStudentsPaginated = async ({ page = 1, limit = 20, search, status, sortBy, sortOrder = 'desc', country, university } = {}) => {
  const conn = await openDb();
  const pageNum = Math.max(1, parseInt(page) || 1);
  let limitNum = Math.max(1, parseInt(limit) || 20);
  limitNum = Math.min(100, limitNum);
  const offset = (pageNum - 1) * limitNum;

  const info = await conn.all("PRAGMA table_info('students')");
  const cols = new Set(info.map(c => c.name));

  const where = [];
  const params = [];

  if (search) {
    const term = `%${search}%`;
    for (const c of ['first_name', 'last_name', 'name', 'email', 'phone']) {
      if (cols.has(c)) {
        where.push(`${c} LIKE ?`);
        params.push(term);
      }
    }
    if (where.length > 0) {
      // combine the last N pushed search clauses into a single OR group
      const searchCount = params.filter(p => p === term).length;
      // rebuild where: remove last search clauses and replace with grouped OR
      const newWhere = where.slice(0, -searchCount);
      const ors = [];
      for (const c of ['first_name', 'last_name', 'name', 'email', 'phone']) {
        if (cols.has(c)) ors.push(`${c} LIKE ?`);
      }
      if (ors.length > 0) newWhere.push(`(${ors.join(' OR ')})`);
      // replace where
      where.length = 0;
      for (const w of newWhere) where.push(w);
    }
  }

  if (status && cols.has('status')) { where.push('status = ?'); params.push(status); }
  if (country && cols.has('country')) { where.push('country = ?'); params.push(country); }
  if (university && cols.has('university')) { where.push('university = ?'); params.push(university); }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const sortMap = {
    'created_at': cols.has('createdAt') ? 'createdAt' : (cols.has('created_at') ? 'created_at' : 'createdAt'),
    'first_name': cols.has('first_name') ? 'first_name' : 'name',
    'last_name': cols.has('last_name') ? 'last_name' : 'name',
    'status': 'status'
  };
  const sortKey = (sortBy || 'created_at').toLowerCase();
  const sortCol = sortMap[sortKey] && cols.has(sortMap[sortKey]) ? sortMap[sortKey] : (cols.has('createdAt') ? 'createdAt' : 'rowid');
  const order = sortOrder && sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const countSql = `SELECT COUNT(1) as total FROM students ${whereClause}`;
  const countRow = await conn.get(countSql, params);
  const total = countRow ? countRow.total : 0;

  const dataSql = `SELECT studentId, leadId, name, phone, email, country, university, course, status, intake, notes, createdAt, updatedAt FROM students ${whereClause} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`;
  const dataParams = params.concat([limitNum, offset]);
  const rows = await conn.all(dataSql, dataParams);
  const data = rows.map(r => _mapStudentRow(r));

  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };
};

// Get user by username (returns password hash and must_change_password flag)
const getUserByUsername = async (username) => {
  const conn = await openDb();
  const r = await conn.get('SELECT id, username, password, role, createdAt, must_change_password FROM users WHERE username = ?', [username]);
  return r || null;
};

// Update user's password and must_change_password flag
const updateUserPasswordAndFlag = async (username, hashedPassword, mustChange = 0) => {
  const conn = await openDb();
  const result = await conn.run('UPDATE users SET password = ?, must_change_password = ? WHERE username = ?', [hashedPassword, mustChange, username]);
  return result.changes > 0;
};

// ─── DIRECT MASTERS CRUD ──────────────────────────────────────────────────────

// Countries
const insertCountry = async (name, status = 'Active') => {
  const conn = await openDb();
  const result = await conn.run('INSERT INTO countries (name, status) VALUES (?, ?)', [name, status]);
  return { id: result.lastID, name, status };
};

const updateCountryById = async (id, fields) => {
  const conn = await openDb();
  const status = (fields.status || 'active').toString();
  const result = await conn.run('UPDATE countries SET name=?, status=? WHERE id=?', [fields.name, status, id]);
  return result.changes > 0;
};

const deleteCountryById = async (id) => {
  const conn = await openDb();
  const result = await conn.run('DELETE FROM countries WHERE id=?', [id]);
  return result.changes > 0;
};

// Universities
const insertUniversity = async (name, country, status = 'Active') => {
  const conn = await openDb();
  const result = await conn.run('INSERT INTO universities (name, country, status) VALUES (?, ?, ?)', [name, country || '', status]);
  return { id: result.lastID, name, country: country || '', status };
};

const updateUniversityById = async (id, fields) => {
  const conn = await openDb();
  const status = (fields.status || 'active').toString();
  const result = await conn.run(
    'UPDATE universities SET name=?, country=?, status=? WHERE id=?',
    [fields.name, fields.country || '', status, id]
  );
  return result.changes > 0;
};

const deleteUniversityById = async (id) => {
  const conn = await openDb();
  const result = await conn.run('DELETE FROM universities WHERE id=?', [id]);
  return result.changes > 0;
};

// Courses
const insertCourse = async (name, university, status = 'Active') => {
  const conn = await openDb();
  const result = await conn.run('INSERT INTO courses (name, university, status) VALUES (?, ?, ?)', [name, university || '', status]);
  return { id: result.lastID, name, university: university || '', status };
};

const updateCourseById = async (id, fields) => {
  const conn = await openDb();
  const status = (fields.status || 'active').toString();
  const result = await conn.run('UPDATE courses SET name=?, university=?, status=? WHERE id=?', [fields.name, fields.university, status, id]);
  return result.changes > 0;
};

const deleteCourseById = async (id) => {
  const conn = await openDb();
  const result = await conn.run('DELETE FROM courses WHERE id=?', [id]);
  return result.changes > 0;
};

// ─── CONFIG / SETTINGS ────────────────────────────────────────────────────────

// Upsert one or many settings — uses SQLite ON CONFLICT to safely insert or update
const upsertSettings = async (keyValueMap) => {
  const conn = await openDb();
  const stmt = await conn.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  for (const [key, value] of Object.entries(keyValueMap)) {
    await stmt.run(key, String(value));
  }
  await stmt.finalize?.();
};

// ─── BACKUP ───────────────────────────────────────────────────────────────────

const backupDb = async () => {
  ensureDirectory(backupsDir);
  if (!fs.existsSync(dbFile)) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(backupsDir, `crm_${timestamp}.db`);
  fs.copyFileSync(dbFile, out);
};

const startBackupSchedule = () => {
  // Read interval from settings table, fallback to DEFAULT_CONFIG.autoBackupInterval (minutes)
  (async () => {
    try {
      const conn = await openDb();
      const row = await conn.get("SELECT value FROM settings WHERE key = ?", ['autoBackupInterval']);
      const minutes = row && row.value ? parseInt(row.value, 10) : parseInt(DEFAULT_CONFIG.autoBackupInterval, 10);
      const intervalMinutes = (!isNaN(minutes) && minutes > 0) ? minutes : parseInt(DEFAULT_CONFIG.autoBackupInterval, 10);
      const ms = Math.max(1, intervalMinutes) * 60 * 1000;
      setInterval(() => {
        backupDb().catch(err => console.error('Backup failed:', err));
      }, ms);
      console.log(`Backup scheduler started. Interval: ${intervalMinutes} minute(s)`);
    } catch (e) {
      console.error('Failed to start backup scheduler, using default 30 minutes:', e.message || e);
      setInterval(() => {
        backupDb().catch(err => console.error('Backup failed:', err));
      }, parseInt(DEFAULT_CONFIG.autoBackupInterval, 10) * 60 * 1000);
    }
  })();
};

module.exports = {
  initializeDb,
  readSheet,
  backupDb,
  startBackupSchedule,

  // Direct Lead CRUD
  getLeadByLeadId,
  insertLead,
  updateLeadById,
  deleteLeadById,
  // Paginated queries
  getLeadsPaginated,

  // Direct Student CRUD
  getStudentByStudentId,
  getStudentByLeadId,
  insertStudent,
  updateStudentById,
  deleteStudentById,
  // Paginated queries
  getStudentsPaginated,

  // Direct Masters CRUD — Countries
  insertCountry,
  updateCountryById,
  deleteCountryById,

  // Direct Masters CRUD — Universities
  insertUniversity,
  updateUniversityById,
  deleteUniversityById,

  // Direct Masters CRUD — Courses
  insertCourse,
  updateCourseById,
  deleteCourseById,

  // Config
  upsertSettings,
  // User helpers
  getUserByUsername,
  updateUserPasswordAndFlag,
};
