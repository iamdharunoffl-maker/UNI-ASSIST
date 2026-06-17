const express = require('express');
const router = express.Router();
const mastersController = require('../controllers/mastersController');
const { auth } = require('../middleware/auth');

router.use(auth); // Protect all routes

// Countries
router.get('/countries', mastersController.getCountries);
router.post('/countries', mastersController.createCountry);
router.put('/countries/:id', mastersController.updateCountry);
router.delete('/countries/:id', mastersController.deleteCountry);

// Universities
router.get('/universities', mastersController.getUniversities);
router.post('/universities', mastersController.createUniversity);
router.put('/universities/:id', mastersController.updateUniversity);
router.delete('/universities/:id', mastersController.deleteUniversity);

// Courses
router.get('/courses', mastersController.getCourses);
router.post('/courses', mastersController.createCourse);
router.put('/courses/:id', mastersController.updateCourse);
router.delete('/courses/:id', mastersController.deleteCourse);

module.exports = router;
