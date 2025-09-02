require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSimpleEmail() {
    try {
        console.log('=== Simple Email Test ===\n');

        // Check environment variables
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_EMAIL_PASSWORD;

        console.log('Email:', email);
        console.log('Password length:', password ? password.length : 'NOT SET');
        console.log('Password starts with:', password ? password.substring(0, 4) + '...' : 'NOT SET');

        if (!email || !password) {
            console.log('\n❌ Missing email or password in .env file');
            return;
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: email,
                pass: password
            }
        });

        console.log('\n🔧 Testing connection...');

        // Verify connection
        await transporter.verify();
        console.log('✅ Connection successful!');

        // Try to send a simple email
        console.log('\n📧 Sending test email...');
        const info = await transporter.sendMail({
            from: email,
            to: email,
            subject: 'Test Email from Hamikdash Website',
            text: 'This is a test email to verify the email service is working.',
            html: '<h1>Test Email</h1><p>This is a test email to verify the email service is working.</p>'
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);

    } catch (error) {
        console.error('\n❌ Email test failed:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n🔐 Authentication Error Details:');
            console.log('- Response Code:', error.responseCode);
            console.log('- Response:', error.response);
            console.log('\n💡 Solutions:');
            console.log('1. Make sure you generated an App Password (not using regular password)');
            console.log('2. Enable 2-Step Verification in your Google Account');
            console.log('3. Check that the App Password is exactly 16 characters');
            console.log('4. Verify the email address is correct');
        }
    }
}

testSimpleEmail();
