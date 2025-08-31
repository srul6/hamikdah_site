# Payment Platform Configuration Guide

## Cardcom Payment Integration

This project uses Cardcom as the payment processor for Israeli customers.

### ⚠️ **CRITICAL PRODUCTION REQUIREMENTS**

Before going live, ensure you have:

1. **Production Cardcom Account**: Contact Cardcom to get production credentials
2. **HTTPS URLs**: All redirect URLs must use HTTPS in production
3. **Public Callback URL**: The callback URL must be publicly accessible
4. **Valid SSL Certificate**: Required for production Cardcom integration

### Required Environment Variables

Add these to your `.env` file:

```env
# Cardcom Configuration (PRODUCTION CREDENTIALS ONLY)
CARDCOM_TERMINAL_NUMBER=your_production_terminal_number
CARDCOM_USERNAME=your_production_username
CARDCOM_PASSWORD=your_production_password

# Frontend and Backend URLs (MUST BE HTTPS IN PRODUCTION)
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-backend-domain.com

# Environment
NODE_ENV=production
```

### Getting Cardcom Production Credentials

1. **Contact Cardcom**: Call Cardcom at +972-3-617-7777 or email support@cardcom.co.il
2. **Request Production Account**: Ask for production terminal credentials
3. **Provide Business Details**: Submit your business registration and bank details
4. **Wait for Approval**: Cardcom will review and approve your account
5. **Receive Credentials**: You'll get production Terminal Number, Username, and Password

### Test Mode vs Production Mode

The system automatically detects the environment:
- **Development**: Uses test URLs and credentials
- **Production**: Uses live URLs and credentials

### Production URL Requirements

All URLs in production MUST:
- Use HTTPS protocol
- Be publicly accessible
- Not contain localhost or ngrok
- Match your domain exactly

```javascript
// ✅ CORRECT (Production)
FRONTEND_URL=https://hamikdah-site-fronteand.onrender.com
BACKEND_URL=https://hamikdah-site.onrender.com

// ❌ INCORRECT (Will cause 99999;0;No Operation errors)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
FRONTEND_URL=https://ngrok.io/your-site
```

### Payment Flow

1. Customer adds items to cart
2. Customer proceeds to checkout
3. Customer fills in contact information
4. System validates all required parameters
5. System creates payment URL with Cardcom (includes signature)
6. Customer is redirected to Cardcom payment page
7. After payment, customer is redirected back to success/error page
8. Cardcom sends callback to backend for confirmation
9. Backend verifies callback signature and processes result

### Required Parameters Validation

The system now validates all required parameters:

- ✅ **SumToBill**: Must be > 0, formatted with 2 decimal places
- ✅ **CoinID**: 1=ILS, 2=USD
- ✅ **ProductName**: Cannot be empty, Hebrew text properly encoded
- ✅ **TransactionId**: Unique ID generated with crypto.randomBytes
- ✅ **CustomerName**: Required, trimmed
- ✅ **CustomerEmail**: Required, trimmed
- ✅ **CustomerPhone**: Required, trimmed
- ✅ **CustomerAddress**: Optional, trimmed
- ✅ **MaxNumOfPayments**: Set to 1 (single payment)
- ✅ **MinNumOfPayments**: Set to 1
- ✅ **NumOfPayments**: Set to 1

### Signature Calculation

The signature now includes ALL parameters including credentials:

```javascript
// Includes TerminalNumber, UserName, Password in signature
const allParams = {
    ...params,
    TerminalNumber: this.terminalNumber,
    UserName: this.userName,
    Password: this.password
};
```

### Supported Features

- ✅ Credit card payments
- ✅ Israeli Shekel (ILS) currency
- ✅ Hebrew language interface
- ✅ Customer information collection
- ✅ Payment success/error handling
- ✅ Transaction tracking
- ✅ Callback verification with signature
- ✅ Parameter validation
- ✅ Proper error handling
- ✅ Production-ready URL encoding

### Security Features

- ✅ MD5 signature verification
- ✅ HTTPS communication required
- ✅ Transaction ID generation with crypto.randomBytes
- ✅ Callback validation
- ✅ Parameter sanitization
- ✅ No sensitive data in logs (production)
- ✅ Input validation

### Response Code Handling

The system now properly handles all Cardcom response codes:

- **0, 1**: Payment successful
- **2**: Transaction declined
- **3**: Transaction error
- **4**: Transaction timeout
- **Other**: Unknown response code

### Testing in Production

1. Use real credit cards (not test cards)
2. Test both success and failure scenarios
3. Verify callback handling
4. Check payment status queries
5. Monitor logs for any errors

### Troubleshooting Common Issues

#### "99999;0;No Operation" Error
**Causes:**
- Invalid credentials (using test credentials in production)
- Missing required parameters
- Incorrect signature calculation
- Invalid redirect URLs (localhost/ngrok in production)

**Solutions:**
1. Verify production credentials from Cardcom
2. Check all required parameters are present
3. Ensure signature includes credentials
4. Use HTTPS URLs only in production

#### Callback Not Received
**Causes:**
- Callback URL not publicly accessible
- Firewall blocking incoming requests
- Incorrect callback URL format

**Solutions:**
1. Ensure callback URL is publicly accessible
2. Check firewall settings
3. Verify URL format matches exactly

### Support

For Cardcom support:
- **Phone**: +972-3-617-7777
- **Email**: support@cardcom.co.il
- **Website**: https://www.cardcom.co.il/

For technical issues with this integration, check the logs and ensure all environment variables are correctly set.
