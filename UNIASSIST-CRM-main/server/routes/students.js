const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/studentsController');
const { auth } = require('../middleware/auth');
const { validateRequired } = require('../middleware/validator');

router.use(auth); // Protect all student routes

router.get('/', studentsController.getStudents);
router.get('/export', studentsController.exportStudents);
router.get('/:id', studentsController.getStudentById);
router.post('/', validateRequired(['name']), studentsController.createStudent);
router.put('/:id', studentsController.updateStudent);
router.delete('/:id', studentsController.deleteStudent);

module.exports = router;
