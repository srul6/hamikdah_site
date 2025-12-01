// backend/src/config/database.js
// Configuration file to dynamically switch between Supabase and Neon/R2 based on USE_NEON environment variable

let databaseController;
let storageController;

if (process.env.USE_NEON === 'true') {
    console.log('✅ Using Neon PostgreSQL + Cloudflare R2');
    databaseController = require('../controllers/databaseController');
    storageController = require('../controllers/storageController');
} else {
    console.log('✅ Using Supabase (legacy)');
    databaseController = require('../controllers/supabaseController');
    // For storage, we'll use a wrapper that uses Supabase storage
    storageController = {
        uploadImage: async (file, folder) => {
            const supabaseController = require('../controllers/supabaseController');
            return await supabaseController.uploadImage(file, folder);
        },
        deleteImage: async (filePath) => {
            const supabaseController = require('../controllers/supabaseController');
            return await supabaseController.deleteImage(filePath);
        }
    };
}

module.exports = { databaseController, storageController };
