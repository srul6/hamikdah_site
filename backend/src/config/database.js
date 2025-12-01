// backend/src/config/database.js
// Configuration file for Neon PostgreSQL + Cloudflare R2

const databaseController = require('../controllers/databaseController');
const storageController = require('../controllers/storageController');

console.log('✅ Using Neon PostgreSQL + Cloudflare R2');

module.exports = { databaseController, storageController };
