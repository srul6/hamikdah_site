# Cardcom Production Deployment Checklist

This checklist ensures your Cardcom payment integration is ready for production deployment.

## ✅ Cardcom Credentials

- [ ] **Terminal Number**: Production terminal number from Cardcom
- [ ] **API Name**: Production API username from Cardcom  
- [ ] **API Password**: Production API password from Cardcom
- [ ] **Test Credentials**: Verified test credentials work correctly

## ✅ Environment Variables

- [ ] `CARDCOM_TERMINAL_NUMBER`: Set to production terminal number
- [ ] `CARDCOM_API_NAME`: Set to production API name
- [ ] `CARDCOM_API_PASSWORD`: Set to production API password
- [ ] `FRONTEND_URL`: HTTPS URL for frontend (no localhost)
- [ ] `BACKEND_URL`: HTTPS URL for backend (no localhost)
- [ ] `NODE_ENV`: Set to "production"

## ✅ Required Parameters

- [ ] **Amount**: Validated as positive number
- [ ] **Currency**: Set to ILS (Israeli Shekel)
- [ ] **Customer Info**: Name, email, phone validated
- [ ] **Product Details**: Name, price, quantity included
- [ ] **Return Value**: Unique order identifier generated

## ✅ API Endpoints

- [ ] `/api/cardcom/create-lowprofile`: Creates LowProfile deals
- [ ] `/api/cardcom/process-transaction`: Direct transaction processing
- [ ] `/api/cardcom/callback`: Handles Cardcom callbacks
- [ ] `/api/cardcom/status/:lowProfileId`: Payment status queries

## ✅ Security Configuration

- [ ] **HTTPS Only**: All URLs use HTTPS
- [ ] **Credential Protection**: API credentials in environment variables
- [ ] **Input Validation**: All parameters validated
- [ ] **Error Handling**: Comprehensive error responses
- [ ] **Timeout Protection**: 30-second API timeouts

## ✅ Error Handling

- [ ] **LowProfile Creation**: Handles creation failures
- [ ] **Transaction Processing**: Handles processing errors
- [ ] **Callback Processing**: Handles callback failures
- [ ] **Status Queries**: Handles status check errors
- [ ] **Network Errors**: Handles connectivity issues

## ✅ Testing

- [ ] **LowProfile Flow**: Test complete LowProfile payment flow
- [ ] **Direct Transaction**: Test direct transaction processing
- [ ] **Callback Handling**: Test callback processing
- [ ] **Status Queries**: Test payment status checks
- [ ] **Error Scenarios**: Test various error conditions
- [ ] **Mobile Testing**: Test on mobile devices
- [ ] **Browser Testing**: Test on multiple browsers

## ✅ Production URLs

- [ ] **Frontend URL**: Publicly accessible HTTPS URL
- [ ] **Backend URL**: Publicly accessible HTTPS URL
- [ ] **Callback URL**: Backend callback endpoint accessible
- [ ] **Success URL**: Frontend success page accessible
- [ ] **Failure URL**: Frontend failure page accessible
- [ ] **Cancel URL**: Frontend cancel page accessible

## ✅ Monitoring

- [ ] **Log Monitoring**: Set up payment transaction logging
- [ ] **Error Alerting**: Configure error notifications
- [ ] **Performance Monitoring**: Monitor API response times
- [ ] **Callback Monitoring**: Monitor callback success rates

## Example Correct LowProfile Request

```json
{
  "TerminalNumber": 12345,
  "ApiName": "your_api_name",
  "ApiPassword": "your_api_password",
  "Operation": "ChargeOnly",
  "ReturnValue": "ORDER_1234567890_abc123",
  "Amount": 100.50,
  "SuccessRedirectUrl": "https://your-domain.com/payment/success",
  "FailedRedirectUrl": "https://your-domain.com/payment/error",
  "CancelRedirectUrl": "https://your-domain.com/cart",
  "WebHookUrl": "https://your-backend.com/api/cardcom/callback",
  "ProductName": "Product 1, Product 2",
  "Language": "he",
  "ISOCoinId": 1,
  "Document": {
    "Name": "John Doe",
    "Email": "john@example.com",
    "AddressLine1": "123 Main St",
    "Mobile": "050-1234567",
    "IsSendByEmail": false,
    "IsAllowEditDocument": false,
    "IsShowOnlyDocument": true,
    "Language": "he",
    "DocumentTypeToCreate": "Receipt",
    "Products": [
      {
        "Description": "Product 1",
        "Quantity": 2,
        "UnitCost": 50.25,
        "TotalLineCost": 100.50,
        "IsVatFree": false
      }
    ]
  }
}
```

## Common Production Issues

### "99999;0;No Operation" Error
- **Cause**: Missing or invalid required parameters
- **Solution**: Verify all required fields are provided and valid

### Callback Not Received
- **Cause**: Webhook URL not publicly accessible
- **Solution**: Ensure callback endpoint is accessible from internet

### Payment Page Not Loading
- **Cause**: Invalid LowProfile creation or redirect URLs
- **Solution**: Check LowProfile creation response and URL validity

### Authentication Errors
- **Cause**: Invalid API credentials
- **Solution**: Verify production credentials are correct

### Network Timeouts
- **Cause**: Slow network or Cardcom server issues
- **Solution**: Implement proper timeout handling and retry logic

## Final Verification

Before going live:

1. **Test with Real Cards**: Use real credit cards (not test cards)
2. **Verify Callbacks**: Ensure callbacks are received and processed
3. **Check Logs**: Monitor logs for any errors or issues
4. **Test Error Scenarios**: Test various failure conditions
5. **Performance Test**: Ensure acceptable response times
6. **Security Review**: Verify all security measures are in place

## Support Contacts

- **Cardcom Support**: +972-3-617-7777
- **Cardcom Email**: support@cardcom.co.il
- **Technical Documentation**: Check Cardcom API documentation
