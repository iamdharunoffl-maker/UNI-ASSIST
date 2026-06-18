const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { auth } = require('../middleware/auth');
const { validateRequired } = require('../middleware/validator');

router.use(auth); // Protect all lead routes

router.get('/', leadsController.getLeads);
router.get('/export', leadsController.exportLeads);
router.get('/:id', leadsController.getLeadById);
router.post('/', validateRequired(['name']), leadsController.createLead);
router.put('/:id', leadsController.updateLead);
router.delete('/:id', leadsController.deleteLead);

module.exports = router;
