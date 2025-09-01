# Green Invoice Error Handling Documentation

## Overview

This document explains the improved error handling implementation for the Green Invoice API integration. The system now properly captures and returns detailed error information from Green Invoice API responses, including error codes, messages, and HTTP status codes.

## Key Improvements

### 1. Enhanced Service Layer Error Handling

The `GreenInvoiceService` class now properly handles Axios errors and creates custom error objects with full Green Invoice API error details:

```javascript
// Before: Basic error throwing
throw error;

// After: Enhanced error handling with full details
const customError = new Error('GreenInvoice API Error');
customError.isAxiosError = true;
customError.response = errorDetails;
customError.greenInvoiceError = error.response.data;
throw customError;
```

### 2. Comprehensive Controller Error Handling

The `GreenInvoiceController` now handles different types of errors:

#### Green Invoice API Errors (with full details)
```javascript
if (error.isAxiosError && error.greenInvoiceError) {
    res.status(statusCode).json({
        success: false,
        message: 'GreenInvoice API Error',
        error: error.greenInvoiceError.errorMessage || error.message,
        errorCode: error.greenInvoiceError.errorCode,
        greenInvoiceError: error.greenInvoiceError,
        status: statusCode
    });
}
```

#### Network/Request Errors
```javascript
else if (error.isAxiosError && error.request) {
    res.status(503).json({
        success: false,
        message: 'No response received from GreenInvoice API',
        error: error.message,
        status: 503
    });
}
```

#### Generic Errors
```javascript
else {
    res.status(500).json({
        success: false,
        message: 'Failed to create payment form',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
}
```

## Error Response Examples

### Success Response
```json
{
    "success": true,
    "message": "Payment form created successfully",
    "paymentFormUrl": "https://payment.greeninvoice.co.il/form/12345",
    "formId": "12345",
    "status": "created"
}
```

### Green Invoice API Error Response (400 Bad Request)
```json
{
    "success": false,
    "message": "GreenInvoice API Error",
    "error": "Invalid client information",
    "errorCode": "INVALID_CLIENT",
    "greenInvoiceError": {
        "errorCode": "INVALID_CLIENT",
        "errorMessage": "Invalid client information",
        "details": "Client email format is invalid"
    },
    "status": 400
}
```

### Network Error Response (503 Service Unavailable)
```json
{
    "success": false,
    "message": "No response received from GreenInvoice API",
    "error": "No response received from GreenInvoice API",
    "status": 503
}
```

### Generic Error Response (500 Internal Server Error)
```json
{
    "success": false,
    "message": "Failed to create payment form",
    "error": "Unexpected error occurred",
    "details": "Error stack trace (only in development)"
}
```

## Implementation Details

### Service Layer (`GreenInvoiceService`)

All API methods (`getPaymentForm`, `createInvoice`, `getDocument`) now include:

1. **Response Error Handling**: Captures full error details when Green Invoice returns non-2xx status codes
2. **Request Error Handling**: Handles cases where no response is received
3. **Setup Error Handling**: Handles errors that occur during request setup
4. **Custom Error Creation**: Creates structured error objects with `greenInvoiceError` property

### Controller Layer (`GreenInvoiceController`)

The `getPaymentForm` method now:

1. **Validates Input**: Checks required parameters before making API calls
2. **Handles Service Errors**: Properly processes errors from the service layer
3. **Returns Appropriate Status Codes**: Maps Green Invoice errors to correct HTTP status codes
4. **Provides Detailed Error Information**: Returns full error details to the client

## Testing

Use the provided test file to verify error handling:

```bash
node test-error-handling.js
```

## Best Practices

1. **Always check for `error.isAxiosError`** before accessing response properties
2. **Use the `greenInvoiceError` property** to access Green Invoice specific error details
3. **Return appropriate HTTP status codes** based on the error type
4. **Log detailed error information** for debugging purposes
5. **Provide meaningful error messages** to clients while keeping sensitive information secure

## Common Green Invoice Error Codes

- `INVALID_CLIENT`: Invalid client information
- `INVALID_AMOUNT`: Invalid payment amount
- `INVALID_CURRENCY`: Unsupported currency
- `AUTHENTICATION_FAILED`: Invalid API credentials
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVICE_UNAVAILABLE`: Green Invoice service temporarily unavailable

## Troubleshooting

1. **Check API credentials**: Ensure `GREENINVOICE_API_KEY_ID` and `GREENINVOICE_API_KEY_SECRET` are set correctly
2. **Verify request format**: Ensure all required fields are provided in the correct format
3. **Monitor logs**: Check console logs for detailed error information
4. **Test connectivity**: Use the `/test` endpoint to verify Green Invoice connectivity
