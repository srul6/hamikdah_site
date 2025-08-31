# GreenInvoice Integration Documentation

## Overview
This document describes the complete GreenInvoice integration that replaces the previous Cardcom integration. The system now handles payments through GreenInvoice's API, which includes their Cardcom payment plugin for secure credit card processing.

## Architecture

### Backend Components
- **Controller**: `backend/src/controllers/greenInvoiceController.js`
- **Routes**: `backend/src/routes/greenInvoice.js`
- **Main App**: Updated `backend/src/app.js` to include GreenInvoice routes

### Frontend Components
- **API Service**: `frontend/src/api/greenInvoice.js`
- **Payment Component**: `frontend/src/pages/GreenInvoicePayment.jsx`
- **Cart Integration**: Updated `frontend/src/pages/CartPage.jsx`
- **Configuration**: Updated `frontend/src/config.js`

## Environment Variables

### Required Environment Variables
```bash
# GreenInvoice API Credentials
GREENINVOICE_API_KEY=your_api_key_here
GREENINVOICE_USER_ID=your_user_id_here

# URLs for redirects and webhooks
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
```

### How to Get GreenInvoice Credentials
1. Log into your GreenInvoice account
2. Go to Settings → API
3. Generate an API key
4. Note your User ID
5. Enable the Cardcom payment plugin in your account

## API Endpoints

### Backend Endpoints

#### 1. Create Invoice with Payment Link
```
POST /api/greeninvoice/create-invoice
```

**Request Body:**
```json
{
  "items": [
    {
      "id": "product-1",
      "name": "Product Name",
      "name_he": "שם המוצר",
      "name_en": "Product Name",
      "price": 100.50,
      "quantity": 2
    }
  ],
  "totalAmount": 201.00,
  "currency": "ILS",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "050-1234567",
    "address": "123 Main St",
    "city": "Tel Aviv",
    "zip": "12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoiceId": "INV_1234567890_abc123",
  "paymentUrl": "https://payment.greeninvoice.co.il/...",
  "invoiceUrl": "https://app.greeninvoice.co.il/...",
  "message": "Invoice created successfully with payment link"
}
```

#### 2. Get Invoice Status
```
GET /api/greeninvoice/status/:invoiceId
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "INV_1234567890_abc123",
    "status": "paid",
    "paymentStatus": "completed",
    "amount": 201.00,
    "customerEmail": "john@example.com"
  }
}
```

#### 3. Payment Webhook
```
POST /api/greeninvoice/webhook
```

**Webhook Payload:**
```json
{
  "documentId": "INV_1234567890_abc123",
  "status": "paid",
  "paymentStatus": "paid",
  "paymentAmount": 201.00,
  "paymentDate": "2024-01-15T10:30:00Z",
  "customerEmail": "john@example.com"
}
```

#### 4. Create Customer
```
POST /api/greeninvoice/customer
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "050-1234567",
  "address": "123 Main St",
  "city": "Tel Aviv",
  "zip": "12345"
}
```

#### 5. Test Connection
```
GET /api/greeninvoice/test
```

**Response:**
```json
{
  "success": true,
  "message": "GreenInvoice test endpoint working",
  "environment": {
    "apiKey": true,
    "userId": true,
    "nodeEnv": "production"
  }
}
```

## Payment Flow

### 1. Customer Initiates Payment
- Customer fills cart and clicks "Proceed to Payment"
- Frontend opens GreenInvoicePayment component
- Customer fills in personal information

### 2. Invoice Creation
- Frontend calls `/api/greeninvoice/create-invoice`
- Backend validates input and creates invoice via GreenInvoice API
- GreenInvoice returns payment URL and invoice details

### 3. Payment Processing
- Customer is redirected to GreenInvoice payment page
- GreenInvoice handles payment through their Cardcom plugin
- Customer enters credit card details securely

### 4. Payment Completion
- GreenInvoice processes payment and sends webhook
- Backend receives webhook and updates order status
- Customer receives confirmation email from GreenInvoice

## Features

### ✅ Implemented Features
- **Secure Payment Processing**: All payments go through GreenInvoice's secure system
- **Automatic Invoice Generation**: Invoices are created automatically with proper tax handling
- **Email Notifications**: Customers receive professional invoice emails
- **Payment Status Tracking**: Real-time payment status updates
- **Customer Management**: Automatic customer creation in GreenInvoice
- **Multi-language Support**: Hebrew and English support
- **Error Handling**: Comprehensive error handling and logging
- **Webhook Processing**: Automatic payment status updates

### 🔧 Technical Features
- **RESTful API**: Clean, RESTful API design
- **Input Validation**: Comprehensive validation on both frontend and backend
- **Error Logging**: Detailed error logging for debugging
- **Environment Configuration**: Secure environment variable management
- **CORS Support**: Proper CORS configuration for cross-origin requests
- **Timeout Handling**: 30-second timeout for API requests

## Security Features

### Data Protection
- All sensitive data is transmitted over HTTPS
- API keys are stored as environment variables
- No sensitive data is logged
- Input validation prevents injection attacks

### Payment Security
- Payments are processed through GreenInvoice's secure system
- Credit card data never touches your servers
- GreenInvoice is PCI DSS compliant
- Cardcom plugin provides additional security layer

## Error Handling

### Common Error Scenarios
1. **Missing Credentials**: API key or user ID not configured
2. **Invalid Input**: Missing required fields or invalid data
3. **API Errors**: GreenInvoice API returns error
4. **Network Issues**: Connection timeouts or network problems
5. **Payment Failures**: Credit card declined or payment failed

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details (development only)"
}
```

## Testing

### Local Testing
1. Set up environment variables in `.env` file
2. Start backend: `cd backend && npm start`
3. Start frontend: `cd frontend && npm start`
4. Test payment flow with test credentials

### Production Testing
1. Configure environment variables in Render dashboard
2. Deploy to production
3. Test with small amounts first
4. Monitor logs for any issues

## Monitoring and Logging

### Log Levels
- **Info**: Normal operations (invoice creation, payment success)
- **Warning**: Non-critical issues (validation warnings)
- **Error**: Critical issues (API failures, payment failures)

### Key Metrics to Monitor
- Invoice creation success rate
- Payment completion rate
- API response times
- Error rates and types
- Webhook processing success

## Troubleshooting

### Common Issues

#### 1. "GreenInvoice configuration missing"
**Cause**: Environment variables not set
**Solution**: Check that `GREENINVOICE_API_KEY` and `GREENINVOICE_USER_ID` are configured

#### 2. "Invoice creation failed"
**Cause**: Invalid request data or API error
**Solution**: Check request payload and GreenInvoice API logs

#### 3. "Payment webhook not received"
**Cause**: Webhook URL not configured in GreenInvoice
**Solution**: Configure webhook URL in GreenInvoice settings

#### 4. "Customer email not received"
**Cause**: Email template not configured
**Solution**: Set up email templates in GreenInvoice

### Debug Steps
1. Check backend logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test API endpoints with curl or Postman
4. Check GreenInvoice dashboard for invoice status
5. Verify webhook URL is accessible

## Migration from Cardcom

### Removed Components
- `backend/src/controllers/cardcomController.js`
- `backend/src/routes/cardcom.js`
- `frontend/src/api/cardcom.js`
- `frontend/src/pages/CardcomPayment.jsx`

### Updated Components
- `backend/src/app.js`: Removed Cardcom routes, added GreenInvoice routes
- `frontend/src/config.js`: Updated API endpoints
- `frontend/src/pages/CartPage.jsx`: Updated to use GreenInvoicePayment
- `frontend/src/translations/translations.js`: Added GreenInvoice-specific translations

### Benefits of Migration
- **Simplified Integration**: Single API for invoices and payments
- **Better User Experience**: Professional invoice emails
- **Automatic Tax Handling**: GreenInvoice handles VAT automatically
- **Reduced Maintenance**: Fewer moving parts and dependencies
- **Better Reporting**: Integrated reporting through GreenInvoice

## Support

### GreenInvoice Support
- API Documentation: https://www.greeninvoice.co.il/api-docs/
- Support Email: support@greeninvoice.co.il
- Phone: +972-3-900-9000

### Technical Support
- Check logs for detailed error messages
- Test endpoints individually
- Verify environment configuration
- Contact development team for assistance

## Future Enhancements

### Potential Improvements
- **Recurring Payments**: Support for subscription payments
- **Partial Payments**: Support for installment payments
- **Advanced Reporting**: Custom reporting and analytics
- **Mobile App**: Native mobile app integration
- **Multi-currency**: Support for USD and other currencies
- **Discount Codes**: Integration with discount system
- **Inventory Sync**: Real-time inventory updates
