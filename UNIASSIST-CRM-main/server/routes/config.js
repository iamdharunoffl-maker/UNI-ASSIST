const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth); // Protect all routes

router.get('/', configController.getConfig);
router.put('/', adminOnly, configController.updateConfig); // Only admin can update settings

module.exports = router;
