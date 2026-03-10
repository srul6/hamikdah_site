// backend/src/config/database.js
// Configuration file for Neon PostgreSQL + Cloudflare R2

const databaseController = require('../controllers/databaseController');
const storageController = require('../controllers/storageController');

module.exports = { databaseController, storageController };
