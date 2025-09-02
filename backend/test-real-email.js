require('dotenv').config();
const EmailService = require('./src/services/emailService');

// Test sending a real email
async function testRealEmail() {
    try {
        console.log('=== Testing Real Email Notification ===\n');

        const emailService = new EmailService();

        // Simulate real order data
        const orderData = {
            formId: 'real-test-form-' + Date.now(),
            status: 'approved',
            documentId: 'doc-' + Date.now(),
            paymentId: 'pay-' + Date.now(),
            amount: 150,
            currency: 'ILS',
            customerInfo: {
                name: 'ישראל מנור',
                email: 'israelmanor11@gmail.com',
                phone: '0585220266',
                street: 'אליהו 7',
                houseNumber: '7',
                apartmentNumber: '3',
                floor: '2',
                city: 'נתיבות'
            },
            items: [
                {
                    name_he: 'בית כנסת',
                    name_en: 'Synagogue',
                    price: 100,
                    quantity: 1
                },
                {
                    name_he: 'ספר תורה',
                    name_en: 'Torah Scroll',
                    price: 50,
                    quantity: 1
                }
            ],
            purchaseTimestamp: new Date().toISOString(),
            dedication: 'לזכות המשפחה היקרה'
        };

        console.log('Sending email with order data:', JSON.stringify(orderData, null, 2));
        console.log('\nTo email:', process.env.ADMIN_EMAIL || 'NOT CONFIGURED');

        const result = await emailService.sendOrderNotification(orderData);

        if (result) {
            console.log('\n✅ Email sent successfully!');
            console.log('Check your email inbox for the order notification.');
        } else {
            console.log('\n❌ Failed to send email');
            console.log('Check your email configuration in .env file');
        }

    } catch (error) {
        console.error('\n❌ Email test failed:', error.message);
        console.log('\nMake sure you have configured:');
        console.log('- ADMIN_EMAIL=your-email@gmail.com');
        console.log('- ADMIN_EMAIL_PASSWORD=your-app-password');
    }
}

// Run the test
testRealEmail();
