const {
  readSheet,
  getLeadByLeadId,
  insertLead,
  updateLeadById,
  deleteLeadById,
  getLeadsPaginated,
  insertStudent,
  getStudentByLeadId,
} = require('../services/databaseService');
const { generateLeadId, generateStudentId, formatDate } = require('../utils/helpers');
const { LEAD_STATUS } = require('../config/constants');
const { Parser } = require('json2csv');

// GET /api/leads - Search, filter, sort, paginate
const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, source, sortBy, sortOrder = 'desc', countryInterest } = req.query;
    const result = await getLeadsPaginated({ page, limit, search, status, source, sortBy, sortOrder, countryInterest });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/leads/:id - Single lead
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX: use direct SQL lookup instead of full table scan + find
    const lead = await getLeadByLeadId(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    return res.status(200).json(lead);
  } catch (error) {
    next(error);
  }
};

// POST /api/leads - Create lead
const createLead = async (req, res, next) => {
  try {
    const { name, email, phone, countryInterest, source, status, notes } = req.body;

    const newLead = {
      id: generateLeadId(),
      name,
      email: email || '',
      phone: phone || '',
      countryInterest: countryInterest || '',
      source: source || 'Other',
      status: status || LEAD_STATUS.PENDING,
      notes: notes || '',
      createdAt: formatDate(new Date()),
      updatedAt: formatDate(new Date())
    };

    // FIX: single INSERT instead of DELETE-all + re-insert all rows
    await insertLead(newLead);

    // If created as Confirmed, auto convert to student
    if (newLead.status === LEAD_STATUS.CONFIRMED) {
      await autoConvertToStudent(newLead);
    }

    return res.status(201).json(newLead);
  } catch (error) {
    next(error);
  }
};

// PUT /api/leads/:id - Update lead
const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, countryInterest, source, status, notes } = req.body;

    // FIX: fetch only the single lead, not the entire table
    const existingLead = await getLeadByLeadId(id);
    if (!existingLead) {
      return res.status(404).json({ message: 'Lead not found.' });
    }

    const oldStatus = existingLead.status;

    const updatedFields = {
      name: name !== undefined ? name : existingLead.name,
      email: email !== undefined ? email : existingLead.email,
      phone: phone !== undefined ? phone : existingLead.phone,
      countryInterest: countryInterest !== undefined ? countryInterest : existingLead.countryInterest,
      source: source !== undefined ? source : existingLead.source,
      status: status !== undefined ? status : existingLead.status,
      notes: notes !== undefined ? notes : existingLead.notes,
      updatedAt: formatDate(new Date())
    };

    // FIX: single UPDATE instead of DELETE-all + re-insert all rows
    await updateLeadById(id, updatedFields);

    const updatedLead = { ...existingLead, ...updatedFields };

    // If status became Confirmed, trigger auto convert
    if (updatedLead.status === LEAD_STATUS.CONFIRMED && oldStatus !== LEAD_STATUS.CONFIRMED) {
      await autoConvertToStudent(updatedLead);
    }

    return res.status(200).json(updatedLead);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/leads/:id - Delete lead
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    // FIX: single DELETE instead of read-all + filter + write-all
    const deleted = await deleteLeadById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    return res.status(200).json({ message: 'Lead deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/leads/export - Export all leads to CSV file
const exportLeads = async (req, res, next) => {
  try {
    const leads = await readSheet('Leads');

    // FIX: handle empty leads table gracefully instead of crashing
    if (!leads || leads.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=Leads_Export.csv');
      return res.send('id,name,email,phone,countryInterest,university,course,source,status,notes,createdAt,updatedAt\n');
    }

    const fields = Object.keys(leads[0]);
    const parser = new Parser({ fields });
    const csv = parser.parse(leads);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=Leads_Export.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Helper: Auto-create a Student record from a Lead
const autoConvertToStudent = async (lead) => {
  // FIX: use direct SQL lookup by leadId instead of full table scan
  const existing = await getStudentByLeadId(lead.id);
  if (existing) return;

  const newStudent = {
    id: generateStudentId(),
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    country: lead.countryInterest || '',
    university: lead.university || '',
    course: lead.course || '',
    status: 'Applied',
    intake: '',
    // FIX: carry over the lead's notes instead of dropping them
    notes: lead.notes || '',
    createdAt: formatDate(new Date()),
    updatedAt: formatDate(new Date())
  };

  await insertStudent(newStudent);
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  exportLeads
};
