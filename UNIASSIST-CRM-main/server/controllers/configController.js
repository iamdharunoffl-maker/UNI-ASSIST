const { readSheet, upsertSettings } = require('../services/databaseService');

// GET /api/config - Get config settings as key-value map
const getConfig = async (req, res, next) => {
  try {
    const configList = await readSheet('Config');
    const configMap = {};
    configList.forEach(item => {
      if (item.key) {
        configMap[item.key] = item.value;
      }
    });
    return res.status(200).json(configMap);
  } catch (error) {
    next(error);
  }
};

// PUT /api/config - Update config settings
// FIX: replaced writeSheet (DELETE all + re-insert) with upsertSettings
//      which uses INSERT ... ON CONFLICT(key) DO UPDATE — safe, atomic, no data loss
const updateConfig = async (req, res, next) => {
  try {
    const newSettings = req.body; // Key-value pairs e.g. { companyName: "New Name", ... }

    if (!newSettings || typeof newSettings !== 'object' || Object.keys(newSettings).length === 0) {
      return res.status(400).json({ message: 'No settings provided.' });
    }

    await upsertSettings(newSettings);

    // Return the full updated config map
    const configList = await readSheet('Config');
    const responseMap = {};
    configList.forEach(item => {
      if (item.key) {
        responseMap[item.key] = item.value;
      }
    });

    return res.status(200).json(responseMap);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConfig,
  updateConfig
};
