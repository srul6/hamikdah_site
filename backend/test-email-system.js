require('dotenv').config();
const EmailService = require('./src/services/emailService');

async function testEmailSystem() {
    console.log('🧪 Testing Email Notification System...\n');

    // Check environment variables
    console.log('📋 Environment Variables Check:');
    console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? '✅ SET' : '❌ NOT SET');
    console.log('ADMIN_EMAIL_PASSWORD:', process.env.ADMIN_EMAIL_PASSWORD ? '✅ SET (' + process.env.ADMIN_EMAIL_PASSWORD.length + ' chars)' : '❌ NOT SET');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('');

    // Test email service initialization
    console.log('🔧 Testing Email Service Initialization...');
    const emailService = new EmailService();

    if (!emailService.transporter) {
        console.log('❌ Email service failed to initialize - no transporter created');
        return;
    }

    console.log('✅ Email service initialized successfully');
    console.log('');

    // Test with mock order data (simulating real payment)
    console.log('📧 Testing Email Sending with Mock Order Data...');
    const mockOrderData = {
        formId: 'test-form-' + Date.now(),
        status: 'completed',
        documentId: 'doc-' + Date.now(),
        paymentId: 'pay-' + Date.now(),
        amount: 150.00,
        currency: 'ILS',
        customerInfo: {
            name: 'ישראל מנור',
            email: 'test@example.com',
            phone: '050-1234567',
            street: 'רחוב הרצל',
            houseNumber: '123',
            apartmentNumber: '45',
            floor: '3',
            city: 'תל אביב'
        },
        items: [
            {
                name_he: 'ספר תורה',
                name_en: 'Torah Book',
                quantity: 1,
                price: 150.00
            }
        ],
        purchaseTimestamp: new Date().toISOString(),
        dedication: 'לזכות המשפחה'
    };

    console.log('📦 Mock Order Data:', JSON.stringify(mockOrderData, null, 2));
    console.log('');

    try {
        // Test email sending
        console.log('📤 Attempting to send email...');
        const result = await emailService.sendOrderNotification(mockOrderData);

        if (result) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Check your email inbox for the notification');
        } else {
            console.log('❌ Email sending failed');
        }

    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.error('Full error:', error);
    }

    console.log('');
    console.log('🔍 Email System Test Complete');
}

// Run the test
testEmailSystem().catch(console.error);
