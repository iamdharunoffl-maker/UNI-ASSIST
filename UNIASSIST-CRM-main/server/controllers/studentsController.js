const {
  readSheet,
  getStudentByStudentId,
  insertStudent,
  updateStudentById,
  deleteStudentById,
  getStudentsPaginated,
} = require('../services/databaseService');
const { generateStudentId, formatDate } = require('../utils/helpers');
const { STUDENT_STATUS } = require('../config/constants');
const { Parser } = require('json2csv');

// GET /api/students - Paginated list, search, filter, sort
const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy, sortOrder = 'desc', country, university } = req.query;
    const result = await getStudentsPaginated({ page, limit, search, status, sortBy, sortOrder, country, university });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/students/:id - Single student
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX: use direct SQL lookup instead of full table scan + find
    const student = await getStudentByStudentId(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    return res.status(200).json(student);
  } catch (error) {
    next(error);
  }
};

// POST /api/students - Create student manually
const createStudent = async (req, res, next) => {
  try {
    // FIX: added `notes` to the destructuring — it was missing before
    const { name, email, phone, country, university, course, status, intake, notes } = req.body;

    const newStudent = {
      id: generateStudentId(),
      leadId: '', // Manual creation has no lead reference
      name,
      email: email || '',
      phone: phone || '',
      country: country || '',
      university: university || '',
      course: course || '',
      status: status || STUDENT_STATUS.APPLIED,
      intake: intake || '',
      // FIX: notes field is now captured and stored
      notes: notes || '',
      createdAt: formatDate(new Date()),
      updatedAt: formatDate(new Date())
    };

    // FIX: single INSERT instead of DELETE-all + re-insert all rows
    await insertStudent(newStudent);

    return res.status(201).json(newStudent);
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/:id - Update student details
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX: added `notes` to the destructuring — it was missing before
    const { name, email, phone, country, university, course, status, intake, notes } = req.body;

    // FIX: fetch only the single student, not the entire table
    const existingStudent = await getStudentByStudentId(id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const updatedFields = {
      name: name !== undefined ? name : existingStudent.name,
      email: email !== undefined ? email : existingStudent.email,
      phone: phone !== undefined ? phone : existingStudent.phone,
      country: country !== undefined ? country : existingStudent.country,
      university: university !== undefined ? university : existingStudent.university,
      course: course !== undefined ? course : existingStudent.course,
      status: status !== undefined ? status : existingStudent.status,
      intake: intake !== undefined ? intake : existingStudent.intake,
      // FIX: notes is now included in updates
      notes: notes !== undefined ? notes : existingStudent.notes,
      updatedAt: formatDate(new Date())
    };

    // FIX: single UPDATE instead of DELETE-all + re-insert all rows
    await updateStudentById(id, updatedFields);

    return res.status(200).json({ ...existingStudent, ...updatedFields });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/students/:id - Delete student record
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX: single DELETE instead of read-all + filter + write-all
    const deleted = await deleteStudentById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    return res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/export - Export student list to CSV
const exportStudents = async (req, res, next) => {
  try {
    const students = await readSheet('Students');

    // FIX: handle empty students table gracefully instead of crashing
    if (!students || students.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=Students_Export.csv');
      return res.send('id,leadId,name,email,phone,country,university,course,status,intake,notes,createdAt,updatedAt\n');
    }

    const fields = Object.keys(students[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(students);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Students_Export.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudents
};
