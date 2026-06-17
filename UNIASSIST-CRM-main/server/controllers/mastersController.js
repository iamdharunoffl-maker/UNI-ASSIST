const {
  readSheet,
  insertCountry,
  updateCountryById,
  deleteCountryById,
  insertUniversity,
  updateUniversityById,
  deleteUniversityById,
  insertCourse,
  updateCourseById,
  deleteCourseById,
} = require('../services/databaseService');

// Dispatch table: maps sheetName to the correct direct DB operations and validation rules
// FIX: removed client-side nanoid id generation — the DB auto-assigns the real integer id
// FIX: removed `status` and `createdAt` fields that were never stored by writeSheet
const DB_OPS = {
  Countries: {
    insert: (data) => insertCountry(data.name, data.status || 'active'),
    update: (id, data) => updateCountryById(id, data),
    delete: (id) => deleteCountryById(id),
    requiredFields: ['name'],
  },
  Universities: {
    insert: (data) => insertUniversity(data.name, data.country, data.status || 'active'),
    update: (id, data) => updateUniversityById(id, data),
    delete: (id) => deleteUniversityById(id),
    requiredFields: ['country', 'name'],
  },
  Courses: {
    insert: (data) => insertCourse(data.name, data.status || 'active'),
    update: (id, data) => updateCourseById(id, data),
    delete: (id) => deleteCourseById(id),
    requiredFields: ['name'],
  },
};

// GET /api/masters/:entity — list all items in a master table
const getMasterList = (sheetName) => async (req, res, next) => {
  try {
    const list = await readSheet(sheetName);
    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

// POST /api/masters/:entity — create a new master item
// FIX: uses direct INSERT that returns the DB-assigned id; no more fake nanoid
const createMasterItem = (sheetName) => async (req, res, next) => {
  try {
    const ops = DB_OPS[sheetName];

    // Validate required fields
    for (const field of ops.requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required.` });
      }
    }
    // Normalize status to lowercase to keep DB values consistent
    const body = { ...req.body };
    if (body.status) body.status = body.status.toString().toLowerCase();

    // Insert into DB and return the new row with the real SQLite-assigned id
    const newItem = await ops.insert(body);
    return res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

// PUT /api/masters/:entity/:id — update a master item
// FIX: uses direct UPDATE by id; id is passed as string from URL but SQLite coerces it correctly
// FIX: checks result.changes to know if the row actually existed (no more phantom 200s)
const updateMasterItem = (sheetName) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const ops = DB_OPS[sheetName];

    const body = { ...req.body };
    if (body.status) body.status = body.status.toString().toLowerCase();
    const updated = await ops.update(id, body);
    if (!updated) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Return the merged item so the client stays in sync
    return res.status(200).json({ id: Number(id), ...req.body });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/masters/:entity/:id — delete a master item
// FIX: uses direct DELETE by id; checks result.changes for 404 detection
const deleteMasterItem = (sheetName) => async (req, res, next) => {
  try {
    const { id } = req.params;
    const ops = DB_OPS[sheetName];

    const deleted = await ops.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    return res.status(200).json({ message: 'Item deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Countries
  getCountries:    getMasterList('Countries'),
  createCountry:   createMasterItem('Countries'),
  updateCountry:   updateMasterItem('Countries'),
  deleteCountry:   deleteMasterItem('Countries'),

  // Universities
  getUniversities:   getMasterList('Universities'),
  createUniversity:  createMasterItem('Universities'),
  updateUniversity:  updateMasterItem('Universities'),
  deleteUniversity:  deleteMasterItem('Universities'),

  // Courses
  getCourses:    getMasterList('Courses'),
  createCourse:  createMasterItem('Courses'),
  updateCourse:  updateMasterItem('Courses'),
  deleteCourse:  deleteMasterItem('Courses'),
};
