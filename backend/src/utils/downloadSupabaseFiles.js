/**
 * Download all files from Supabase Storage bucket
 * 
 * Usage:
 * 1. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are in .env
 * 2. Run: node src/utils/downloadSupabaseFiles.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = 'product-images'; // Your bucket name
const downloadPath = './supabase-backup';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create download directory
if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
    console.log(`📁 Created directory: ${downloadPath}`);
}

/**
 * Download a file from Supabase Storage
 */
function downloadFile(filePath, localPath) {
    return new Promise((resolve, reject) => {
        const url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(localPath);

        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else if (response.statusCode === 404) {
                reject(new Error(`File not found: ${filePath}`));
            } else {
                reject(new Error(`Failed to download ${filePath}: HTTP ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(localPath, () => { }); // Delete file on error
            reject(err);
        });
    });
}

/**
 * Recursively list all files in a folder
 */
async function listAllFiles(folder = '', allFiles = []) {
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list(folder, {
                limit: 1000,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });

        if (error) {
            console.error(`❌ Error listing folder ${folder}:`, error.message);
            return allFiles;
        }

        if (!data || data.length === 0) {
            return allFiles;
        }

        for (const item of data) {
            const fullPath = folder ? `${folder}/${item.name}` : item.name;

            if (item.id === null) {
                // It's a folder, recurse
                console.log(`📂 Found folder: ${fullPath}`);
                await listAllFiles(fullPath, allFiles);
            } else {
                // It's a file
                allFiles.push({
                    path: fullPath,
                    name: item.name,
                    size: item.metadata?.size || 0,
                    updated: item.updated_at
                });
            }
        }

        return allFiles;
    } catch (error) {
        console.error(`❌ Error listing files in ${folder}:`, error.message);
        return allFiles;
    }
}

/**
 * Main function to download all files
 */
async function downloadAllFiles() {
    console.log('📥 Starting download from Supabase Storage...\n');
    console.log(`Bucket: ${bucketName}`);
    console.log(`Download path: ${path.resolve(downloadPath)}\n`);

    try {
        // List all files
        console.log('🔍 Scanning bucket for files...');
        const files = await listAllFiles();

        if (files.length === 0) {
            console.log('⚠️  No files found in bucket');
            return;
        }

        console.log(`\n✅ Found ${files.length} files to download\n`);
        console.log('Files:');
        files.forEach((file, index) => {
            const sizeKB = (file.size / 1024).toFixed(2);
            console.log(`  ${index + 1}. ${file.path} (${sizeKB} KB)`);
        });
        console.log('');

        // Download each file
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const localPath = path.join(downloadPath, file.path);
            const dir = path.dirname(localPath);

            // Create directory if it doesn't exist
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            try {
                await downloadFile(file.path, localPath);
                successCount++;
                const progress = `[${i + 1}/${files.length}]`;
                console.log(`✅ ${progress} Downloaded: ${file.path}`);
            } catch (error) {
                failCount++;
                console.error(`❌ Failed to download ${file.path}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Download Summary:');
        console.log(`   Total files: ${files.length}`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failCount}`);
        console.log(`   📁 Saved to: ${path.resolve(downloadPath)}`);
        console.log('='.repeat(50));

        if (failCount > 0) {
            console.log('\n⚠️  Some files failed to download. Check errors above.');
        } else {
            console.log('\n✅ All files downloaded successfully!');
        }

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    downloadAllFiles().catch(console.error);
}

module.exports = { downloadAllFiles, listAllFiles };

