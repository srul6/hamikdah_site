require('dotenv').config();
const sgMail = require('@sendgrid/mail');

console.log('=== Testing SendGrid Email Service ===\n');

// Check if API key is configured
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_VERIFIED_EMAIL || process.env.SENDGRID_FROM_EMAIL;
const toEmail = process.env.ADMIN_EMAIL || 'gilmanor8@gmail.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'Hamikdash Website';

console.log('Configuration Check:');
console.log('✓ API Key:', apiKey ? '✅ Found (SG.' + apiKey.substring(3, 10) + '...)' : '❌ NOT FOUND');
console.log('✓ From Email:', fromEmail || '❌ NOT SET');
console.log('✓ From Name:', fromName);
console.log('✓ To Email:', toEmail);
console.log('');

if (!apiKey) {
    console.error('❌ ERROR: SENDGRID_API_KEY not found in .env file');
    console.log('\nPlease add to your .env file:');
    console.log('SENDGRID_API_KEY=SG.your_api_key_here');
    process.exit(1);
}

if (!fromEmail) {
    console.error('❌ ERROR: SENDGRID_VERIFIED_EMAIL not found in .env file');
    console.log('\nPlease add to your .env file:');
    console.log('SENDGRID_VERIFIED_EMAIL=your_verified_email@domain.com');
    process.exit(1);
}

// Set API key
sgMail.setApiKey(apiKey);

// Create test email
const testEmail = {
    to: toEmail,
    from: {
        email: fromEmail,
        name: fromName
    },
    replyTo: toEmail,
    subject: '🧪 Test Email - SendGrid Configuration Test',
    text: `
This is a test email from your Hamikdash Website backend.

If you're receiving this, SendGrid is working correctly! ✅

Configuration Details:
- From Email: ${fromEmail}
- To Email: ${toEmail}
- From Name: ${fromName}

Next Steps:
1. Check your spam folder if you don't see this in your inbox
2. If received successfully, your email notifications will work!
3. Make a test purchase to verify order emails

Test Time: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
    `,
    html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #e55a3d 0%, #c73d22 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .success-box { background-color: #d4edda; border: 2px solid #28a745; color: #155724; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
                .info-box { background-color: white; padding: 20px; border-radius: 5px; border-left: 4px solid #e55a3d; margin: 20px 0; }
                .field { margin: 10px 0; }
                .field strong { color: #e55a3d; }
                h1 { margin: 0; font-size: 28px; }
                h2 { color: #e55a3d; margin-top: 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧪 SendGrid Test Email</h1>
                <p>Configuration Test - Hamikdash Website</p>
            </div>
            
            <div class="content">
                <div class="success-box">
                    <h2 style="color: #28a745; margin: 0;">✅ Success!</h2>
                    <p style="margin: 10px 0 0 0; font-size: 18px;">
                        If you're reading this, SendGrid is working correctly!
                    </p>
                </div>

                <div class="info-box">
                    <h2>Configuration Details</h2>
                    <div class="field"><strong>From Email:</strong> ${fromEmail}</div>
                    <div class="field"><strong>To Email:</strong> ${toEmail}</div>
                    <div class="field"><strong>From Name:</strong> ${fromName}</div>
                    <div class="field"><strong>Test Time:</strong> ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</div>
                </div>

                <div class="info-box">
                    <h2>Next Steps</h2>
                    <ol style="margin: 10px 0;">
                        <li>✅ Check your spam folder if you don't see this in your inbox</li>
                        <li>✅ Mark this email as "Not Spam" to improve deliverability</li>
                        <li>✅ If received successfully, your order notifications will work!</li>
                        <li>✅ Make a test purchase (₪2) to verify order emails</li>
                    </ol>
                </div>

                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>This is an automated test email from your Hamikdash Website backend</p>
                    <p>Powered by SendGrid ✉️</p>
                </div>
            </div>
        </body>
        </html>
    `
};

// Send the email
console.log('📧 Sending test email...\n');

sgMail.send(testEmail)
    .then((response) => {
        console.log('✅ SUCCESS! Email sent successfully!');
        console.log('');
        console.log('Response Details:');
        console.log('├─ Status Code:', response[0].statusCode);
        console.log('├─ Status Message:', response[0].statusCode === 202 ? 'Accepted' : 'Unknown');
        console.log('└─ Headers:', JSON.stringify(response[0].headers, null, 2));
        console.log('');
        console.log('🎉 SendGrid is working correctly!');
        console.log('📬 Check your email:', toEmail);
        console.log('⚠️  Don\'t forget to check your spam folder!');
        console.log('');
        console.log('Next step: Make a test purchase to verify order emails work end-to-end.');
    })
    .catch((error) => {
        console.error('❌ FAILED! Error sending email:');
        console.error('');

        if (error.response) {
            console.error('SendGrid Error Response:');
            console.error('├─ Status Code:', error.response.statusCode);
            console.error('├─ Body:', JSON.stringify(error.response.body, null, 2));
            console.error('');

            // Provide helpful error messages
            if (error.response.statusCode === 401) {
                console.error('🔑 Authentication Error:');
                console.error('   Your API key is invalid or expired.');
                console.error('   Please generate a new API key in SendGrid dashboard.');
            } else if (error.response.statusCode === 403) {
                console.error('🚫 Forbidden:');
                console.error('   Your sender email might not be verified.');
                console.error('   Go to SendGrid → Sender Authentication → Single Sender Verification');
            } else if (error.response.body.errors) {
                console.error('📋 Error Details:');
                error.response.body.errors.forEach((err, index) => {
                    console.error(`   ${index + 1}. ${err.message}`);
                    if (err.field) console.error(`      Field: ${err.field}`);
                });
            }
        } else {
            console.error('Error:', error.message);
        }

        console.error('');
        console.error('Common Issues:');
        console.error('1. Invalid API key - Generate a new one');
        console.error('2. Sender not verified - Verify your sender in SendGrid');
        console.error('3. Using Gmail/Yahoo as FROM - Must use verified email');
        process.exit(1);
    });

