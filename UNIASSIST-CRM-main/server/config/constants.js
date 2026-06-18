const LEAD_STATUS = {
  PENDING: 'Pending',
  FOLLOW_UP: 'Follow-up',
  CLOSED: 'Closed',
  CONFIRMED: 'Confirmed'
};

const LEAD_SOURCES = {
  GOOGLE: 'Google',
  FACEBOOK: 'Facebook',
  REFERRAL: 'Referral',
  WALK_IN: 'Walk-in',
  OTHER: 'Other'
};

const STUDENT_STATUS = {
  APPLIED: 'Applied',
  ADMITTED: 'Admitted',
  VISA_APPROVED: 'Visa Approved',
  VISA_REJECTED: 'Visa Rejected',
  ENROLLED: 'Enrolled'
};

const DEFAULT_CONFIG = {
  companyName: 'Uni Assist Overseas Education',
  currency: 'USD',
  allowLeadDeletion: 'true',
  autoBackupInterval: '30' // in minutes
};

module.exports = {
  LEAD_STATUS,
  LEAD_SOURCES,
  STUDENT_STATUS,
  DEFAULT_CONFIG
};
