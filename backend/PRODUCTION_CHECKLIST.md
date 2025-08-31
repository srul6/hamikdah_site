# 🚀 Cardcom Production Deployment Checklist

## ⚠️ CRITICAL: Before Going Live

### 1. **Cardcom Credentials** ✅
- [ ] Contact Cardcom for production account
- [ ] Receive production Terminal Number
- [ ] Receive production Username  
- [ ] Receive production Password
- [ ] Verify credentials are NOT test/sandbox values

### 2. **Environment Variables** ✅
- [ ] `CARDCOM_TERMINAL_NUMBER` = production terminal number
- [ ] `CARDCOM_USERNAME` = production username
- [ ] `CARDCOM_PASSWORD` = production password
- [ ] `FRONTEND_URL` = HTTPS production frontend URL
- [ ] `BACKEND_URL` = HTTPS production backend URL
- [ ] `NODE_ENV` = production

### 3. **URL Requirements** ✅
- [ ] All URLs use HTTPS (not HTTP)
- [ ] No localhost URLs in production
- [ ] No ngrok URLs in production
- [ ] URLs are publicly accessible
- [ ] SSL certificates are valid
- [ ] Callback URL is accessible from Cardcom servers

### 4. **Required Parameters** ✅
- [ ] SumToBill > 0 and has 2 decimal places
- [ ] CoinID = 1 (ILS) or 2 (USD)
- [ ] ProductName is not empty
- [ ] TransactionId is unique
- [ ] CustomerName is provided
- [ ] CustomerEmail is provided
- [ ] CustomerPhone is provided
- [ ] MaxNumOfPayments = 1
- [ ] MinNumOfPayments = 1
- [ ] NumOfPayments = 1

### 5. **Signature Calculation** ✅
- [ ] Includes TerminalNumber in signature
- [ ] Includes UserName in signature
- [ ] Includes Password in signature
- [ ] All parameters sorted alphabetically
- [ ] MD5 hash calculated correctly

### 6. **Security** ✅
- [ ] No hardcoded credentials in code
- [ ] Environment variables properly set
- [ ] Debug logging disabled in production
- [ ] Sensitive data not logged
- [ ] HTTPS communication enforced

### 7. **Error Handling** ✅
- [ ] Parameter validation implemented
- [ ] Signature verification working
- [ ] Callback handling implemented
- [ ] Response code handling complete
- [ ] Network timeout handling

### 8. **Testing** ✅
- [ ] Test with real credit card
- [ ] Test successful payment flow
- [ ] Test failed payment flow
- [ ] Test callback verification
- [ ] Test payment status query
- [ ] Test Hebrew text encoding

## 🔧 Configuration Examples

### Production Environment Variables
```env
# Cardcom Production Credentials
CARDCOM_TERMINAL_NUMBER=12345
CARDCOM_USERNAME=your_production_username
CARDCOM_PASSWORD=your_production_password

# Production URLs (HTTPS only)
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://your-backend-domain.com

# Environment
NODE_ENV=production
```

### Correct Payment Parameters
```javascript
{
    TerminalNumber: "12345",
    UserName: "your_production_username",
    SumToBill: "100.00",
    CoinID: "1", // ILS
    Language: "he",
    Operation: "1",
    IsIframe: "false",
    IsMobile: "false",
    ProductName: "Product Name",
    SuccessRedirectUrl: "https://your-domain.com/payment/success",
    ErrorRedirectUrl: "https://your-domain.com/payment/error",
    CancelRedirectUrl: "https://your-domain.com/cart",
    IndicatorUrl: "https://your-backend-domain.com/api/cardcom/callback",
    TransactionId: "TXN_1234567890_abc123def456",
    CustomerName: "John Doe",
    CustomerEmail: "john@example.com",
    CustomerPhone: "+972-50-123-4567",
    CustomerAddress: "123 Main St, Tel Aviv",
    MaxNumOfPayments: "1",
    MinNumOfPayments: "1",
    NumOfPayments: "1",
    Signature: "calculated_md5_signature"
}
```

## 🚨 Common Production Issues

### "99999;0;No Operation" Error
**Causes:**
- Using test credentials in production
- Missing required parameters
- Incorrect signature calculation
- Invalid redirect URLs

**Solutions:**
1. Verify production credentials
2. Check all required parameters
3. Ensure signature includes credentials
4. Use HTTPS URLs only

### Callback Not Working
**Causes:**
- Callback URL not accessible
- Firewall blocking requests
- Incorrect URL format

**Solutions:**
1. Test callback URL accessibility
2. Check firewall settings
3. Verify URL format

### Hebrew Text Issues
**Causes:**
- Improper URL encoding
- Character encoding problems

**Solutions:**
1. Use `encodeURIComponent()` for Hebrew text
2. Ensure proper UTF-8 encoding

## 📞 Support Contacts

### Cardcom Support
- **Phone**: +972-3-617-7777
- **Email**: support@cardcom.co.il
- **Website**: https://www.cardcom.co.il/

### Technical Issues
- Check application logs
- Verify environment variables
- Test with Cardcom test environment first

## ✅ Final Verification

Before going live:
1. [ ] All checklist items completed
2. [ ] Production credentials verified
3. [ ] URLs tested and accessible
4. [ ] Payment flow tested end-to-end
5. [ ] Callback handling verified
6. [ ] Error scenarios tested
7. [ ] Monitoring and logging configured

**Remember**: Once live, any changes to credentials or URLs require coordination with Cardcom support.
