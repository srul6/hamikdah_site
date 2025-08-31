# Cardcom Payment Integration

This document describes the Cardcom payment integration implementation based on the official Cardcom API v11.

## Environment Variables

The following environment variables must be configured:

```env
# Cardcom Credentials
CARDCOM_TERMINAL_NUMBER=your_terminal_number
CARDCOM_API_NAME=your_api_name
CARDCOM_API_PASSWORD=your_api_password

# Application URLs
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-backend-domain.com

# Environment
NODE_ENV=production
```

## Getting Cardcom Production Credentials

To obtain production credentials, contact Cardcom and request:
1. **Terminal Number** - Your unique terminal identifier
2. **API Name** - Your API username for authentication
3. **API Password** - Your API password for authentication

## Payment Flow

### 1. LowProfile Payment Flow (Recommended)

1. **Create LowProfile Deal**: Call `/api/cardcom/create-lowprofile` with order details
2. **Redirect to Cardcom**: User is redirected to Cardcom's secure payment page
3. **Payment Processing**: User completes payment on Cardcom's page
4. **Callback**: Cardcom sends payment result to your webhook URL
5. **Redirect**: User is redirected back to your success/failure page

### 2. Direct Transaction Flow (Alternative)

1. **Process Transaction**: Call `/api/cardcom/process-transaction` with card details
2. **Direct Processing**: Transaction is processed directly without redirect
3. **Response**: Receive immediate transaction result

## API Endpoints

### Create LowProfile Deal
```
POST /api/cardcom/create-lowprofile
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
      "price": 100.00,
      "quantity": 2
    }
  ],
  "totalAmount": 200.00,
  "currency": "ILS",
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "050-1234567",
    "address": "123 Main St"
  }
}
```

**Response:**
```json
{
  "success": true,
  "lowProfileId": "guid-here",
  "url": "https://secure.cardcom.solutions/payment-page",
  "returnValue": "ORDER_1234567890_abc123",
  "message": "LowProfile deal created successfully"
}
```

### Process Direct Transaction
```
POST /api/cardcom/process-transaction
```

**Request Body:**
```json
{
  "cardNumber": "4111111111111111",
  "cvv": "123",
  "expirationMonth": "12",
  "expirationYear": "25",
  "amount": 100.00,
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "050-1234567",
    "id": "123456789"
  }
}
```

### Get Payment Status
```
GET /api/cardcom/status/:lowProfileId
```

### Handle Callback
```
POST /api/cardcom/callback
```

## Required Parameters Validation

The system validates the following required parameters:

- **Items**: Array of products with name, price, and quantity
- **Total Amount**: Must be greater than 0
- **Customer Information**: Name, email, and phone are required
- **Currency**: Defaults to ILS (Israeli Shekel)

## Security Features

- **HTTPS Only**: All communication with Cardcom uses HTTPS
- **Credential Protection**: API credentials are stored in environment variables
- **Input Validation**: All input parameters are validated before processing
- **Error Handling**: Comprehensive error handling and logging
- **Timeout Protection**: 30-second timeout for API calls

## Response Code Handling

The system handles Cardcom response codes according to the official API:

- **ResponseCode: 0** - Success
- **ResponseCode: 1-999** - Various error conditions
- **IsSuccess: true/false** - Payment success indicator

## Callback Processing

The callback handler processes the following data from Cardcom:

- `ResponseCode` - Transaction result code
- `Description` - Human-readable description
- `LowProfileId` - Unique deal identifier
- `ApprovalNumber` - Bank approval number
- `Amount` - Transaction amount
- `ReturnValue` - Your custom order identifier
- `DealNumber` - Cardcom deal number
- `TransactionId` - Unique transaction identifier

## Error Handling

The system provides detailed error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "responseCode": 123
}
```

## Testing

### Test Credentials
For testing, use Cardcom's test environment:
- Terminal Number: 1000
- API Name: "MyApiDemo"
- API Password: (provided by Cardcom)

### Test Cards
Use Cardcom's test card numbers for testing transactions.

## Production Deployment

Before going live:

1. **Obtain Production Credentials**: Contact Cardcom for production terminal credentials
2. **Update Environment Variables**: Set production credentials in your deployment environment
3. **Configure Webhook URLs**: Ensure callback URLs are publicly accessible
4. **Test Thoroughly**: Test all payment flows in production environment
5. **Monitor Logs**: Set up monitoring for payment transactions

## Troubleshooting Common Issues

### "99999;0;No Operation" Error
- Check that all required parameters are provided
- Verify API credentials are correct
- Ensure URLs are properly formatted
- Check that amounts are valid numbers

### Callback Not Received
- Verify webhook URL is publicly accessible
- Check server logs for callback attempts
- Ensure callback endpoint returns "OK" response
- Verify network connectivity to Cardcom servers

### Payment Page Not Loading
- Check LowProfile creation response
- Verify redirect URLs are valid
- Ensure proper HTTPS configuration
- Check browser console for errors

## Support

For technical support with Cardcom integration:
- Check Cardcom API documentation
- Review server logs for detailed error information
- Contact Cardcom support for API-specific issues
