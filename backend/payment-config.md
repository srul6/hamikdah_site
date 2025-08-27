# Payment Platform Configuration Guide

## Cardcom Payment Integration

This project uses Cardcom as the payment processor for Israeli customers.

### Required Environment Variables

Add these to your `.env` file:

```env
# Cardcom Configuration
CARDCOM_TERMINAL_NUMBER=your_terminal_number
CARDCOM_USERNAME=your_username
CARDCOM_PASSWORD=your_password

# Frontend and Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001
```

### Getting Cardcom Credentials

1. **Sign up for Cardcom**: Visit [Cardcom's website](https://www.cardcom.co.il/) and register for a merchant account
2. **Get Terminal Number**: Your terminal number will be provided by Cardcom
3. **Get Username and Password**: These will be provided in your welcome email
4. **Test Mode**: Use test credentials first before going live

### Test Mode vs Production Mode

The system automatically detects the environment:
- **Development**: Uses test URLs and credentials
- **Production**: Uses live URLs and credentials

### Payment Flow

1. Customer adds items to cart
2. Customer proceeds to checkout
3. Customer fills in contact information
4. System creates payment URL with Cardcom
5. Customer is redirected to Cardcom payment page
6. After payment, customer is redirected back to success/error page
7. Cardcom sends callback to backend for confirmation

### Supported Features

- ✅ Credit card payments
- ✅ Israeli Shekel (ILS) currency
- ✅ Hebrew language interface
- ✅ Customer information collection
- ✅ Payment success/error handling
- ✅ Transaction tracking
- ✅ Callback verification

### Security Features

- ✅ MD5 signature verification
- ✅ HTTPS communication
- ✅ Transaction ID generation
- ✅ Callback validation

### Testing

1. Use test credit card numbers provided by Cardcom
2. Test both success and failure scenarios
3. Verify callback handling
4. Check payment status queries

### Support

For Cardcom support, contact their customer service or refer to their API documentation.
