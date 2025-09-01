// Load environment variables
require('dotenv').config();

const GreenInvoiceController = require('./src/controllers/greenInvoiceController');

// Mock Express request and response objects
const mockRequest = {
    body: {
        items: [
            {
                name_he: 'מוצר לדוגמה',
                price: 100,
                quantity: 1
            }
        ],
        totalAmount: 100,
        currency: 'ILS',
        customerInfo: {
            name: 'ישראל מנור',
            email: 'test@example.com',
            phone: '050-1234567',
            address: 'רחוב הרצל 1',
            city: 'תל אביב',
            zip: '12345'
        }
    }
};

const mockResponse = {
    status: function (code) {
        console.log(`Response status: ${code}`);
        return this;
    },
    json: function (data) {
        console.log('Response data:', JSON.stringify(data, null, 2));
        return this;
    }
};

async function testErrorHandling() {
    console.log('=== Testing Green Invoice Error Handling ===\n');

    const controller = new GreenInvoiceController();

    try {
        console.log('Testing payment form creation...');
        await controller.getPaymentForm(mockRequest, mockResponse);
    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

// Run the test
testErrorHandling();
