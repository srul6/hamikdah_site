require('dotenv').config();

console.log('=== Email Configuration Check ===\n');

const config = {
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_EMAIL_PASSWORD: process.env.ADMIN_EMAIL_PASSWORD,
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 587
};

console.log('Email Configuration:');
console.log('- ADMIN_EMAIL:', config.ADMIN_EMAIL ? '✅ SET' : '❌ NOT SET');
console.log('- ADMIN_EMAIL_PASSWORD:', config.ADMIN_EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('- SMTP_HOST:', config.SMTP_HOST);
console.log('- SMTP_PORT:', config.SMTP_PORT);

if (!config.ADMIN_EMAIL || !config.ADMIN_EMAIL_PASSWORD) {
    console.log('\n❌ Email configuration incomplete!');
    console.log('\nAdd to your .env file:');
    console.log('ADMIN_EMAIL=your-email@gmail.com');
    console.log('ADMIN_EMAIL_PASSWORD=your-app-password');
    console.log('\nFor Gmail, use an App Password (not your regular password)');
} else {
    console.log('\n✅ Email configuration looks good!');
    console.log('You can now run: node test-real-email.js');
}
