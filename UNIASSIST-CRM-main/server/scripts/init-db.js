const { initializeDb } = require('../services/databaseService');

(async () => {
  try {
    await initializeDb();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  }
})();
