const { customAlphabet } = require('nanoid');
const dayjs = require('dayjs');

// Create standard alphanumeric ID generator (uppercase letters and numbers)
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateShortId = customAlphabet(alphabet, 6);

const generateLeadId = () => `LD-${generateShortId()}`;
const generateStudentId = () => `ST-${generateShortId()}`;

const formatDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatDateOnly = (date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

module.exports = {
  generateLeadId,
  generateStudentId,
  formatDate,
  formatDateOnly
};
