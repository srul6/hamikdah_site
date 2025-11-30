/**
 * Database configuration - Switch between Supabase and Neon
 * Set USE_NEON=true in .env to use Neon, otherwise uses Supabase
 */

const USE_NEON = process.env.USE_NEON === 'true';

let databaseController;
let storageController;

if (USE_NEON) {
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

module.exports = {
    databaseController,
    storageController,
    USE_NEON
};

