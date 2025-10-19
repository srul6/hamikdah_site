/**
 * Password Hash Generator
 * Run this script to generate a secure bcrypt hash for your admin password
 * Usage: node generate-password-hash.js your-password-here
 */

const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.log('❌ Please provide a password');
    console.log('Usage: node generate-password-hash.js your-password-here');
    process.exit(1);
}

console.log('\n🔐 Generating secure password hash...\n');

// Generate hash with salt rounds of 10 (industry standard)
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('❌ Error generating hash:', err);
        process.exit(1);
    }

    console.log('✅ Password hash generated successfully!\n');
    console.log('📋 Add this to your .env file:\n');
    console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
    console.log('⚠️  NEVER commit this hash to git!');
    console.log('⚠️  Keep it only in your .env file!\n');
});

