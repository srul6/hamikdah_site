# 🚀 GreenInvoice Integration Setup Guide

## 📋 Overview
This guide will help you set up the complete GreenInvoice integration to replace the previous Cardcom system. The new integration provides a more streamlined payment experience with automatic invoice generation and professional email notifications.

## 🎯 What's New
- ✅ **Single Integration**: One system handles both invoices and payments
- ✅ **Automatic Invoicing**: Professional invoices generated automatically
- ✅ **Email Notifications**: Customers receive beautiful invoice emails
- ✅ **Cardcom Plugin**: Secure payments through GreenInvoice's Cardcom integration
- ✅ **Better UX**: Simplified payment flow for customers

## 🔧 Step 1: GreenInvoice Account Setup

### 1.1 Create GreenInvoice Account
1. Go to [GreenInvoice](https://www.greeninvoice.co.il/)
2. Sign up for a business account
3. Complete your business profile
4. Verify your account

### 1.2 Enable Cardcom Payment Plugin
1. Log into your GreenInvoice account
2. Go to **Settings** → **Payment Methods**
3. Enable **Cardcom** payment plugin
4. Configure your Cardcom credentials (if you have them)
5. Set up payment templates

### 1.3 Get API Credentials
1. Go to **Settings** → **API**
2. Click **Generate API Key**
3. Copy your **API Key** and **User ID**
4. Save these securely - you'll need them for the next step

## 🔧 Step 2: Environment Configuration

### 2.1 Update Render Environment Variables
1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add/update these variables:

```bash
# GreenInvoice API Credentials
GREENINVOICE_API_KEY=your_api_key_from_step_1
GREENINVOICE_USER_ID=your_user_id_from_step_1

# URLs (update with your actual domains)
FRONTEND_URL=https://hamikdah-site-fronteand.onrender.com
BACKEND_URL=https://hamikdah-site.onrender.com

# Remove old Cardcom variables (if they exist)
# CARDCOM_TERMINAL_NUMBER
# CARDCOM_API_NAME
# CARDCOM_API_PASSWORD
```

### 2.2 Verify Configuration
1. Deploy your changes
2. Test the configuration by visiting:
   ```
   https://hamikdah-site.onrender.com/api/greeninvoice/test
   ```
3. You should see:
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

## 🔧 Step 3: Webhook Configuration

### 3.1 Set Up Webhook URL
1. In your GreenInvoice account, go to **Settings** → **Webhooks**
2. Add webhook URL:
   ```
   https://hamikdah-site.onrender.com/api/greeninvoice/webhook
   ```
3. Select events: **Payment Completed**, **Payment Failed**
4. Save the webhook configuration

## 🔧 Step 4: Email Templates

### 4.1 Configure Invoice Email Template
1. Go to **Settings** → **Email Templates**
2. Customize the invoice email template
3. Add your business logo and branding
4. Include your contact information
5. Test the template

## 🧪 Step 5: Testing

### 5.1 Test Payment Flow
1. Go to your website
2. Add items to cart
3. Click "Proceed to Payment"
4. Fill in customer information
5. Complete a test payment
6. Verify invoice is created in GreenInvoice
7. Check that customer receives email

### 5.2 Test Webhook
1. Make a test payment
2. Check backend logs for webhook receipt
3. Verify payment status updates correctly

## 📊 Step 6: Monitoring

### 6.1 Set Up Monitoring
1. **GreenInvoice Dashboard**: Monitor invoices and payments
2. **Render Logs**: Check for any API errors
3. **Email Delivery**: Verify customers receive invoices
4. **Payment Success Rate**: Track payment completion rates

### 6.2 Key Metrics to Watch
- ✅ Invoice creation success rate
- ✅ Payment completion rate
- ✅ Email delivery rate
- ✅ API response times
- ✅ Error rates

## 🚨 Troubleshooting

### Common Issues & Solutions

#### Issue: "GreenInvoice configuration missing"
**Solution**: Check that `GREENINVOICE_API_KEY` and `GREENINVOICE_USER_ID` are set in Render

#### Issue: "Invoice creation failed"
**Solution**: 
1. Check GreenInvoice API logs
2. Verify request payload format
3. Ensure all required fields are provided

#### Issue: "Customer not receiving emails"
**Solution**:
1. Check email template configuration
2. Verify customer email address
3. Check spam folder

#### Issue: "Payment webhook not working"
**Solution**:
1. Verify webhook URL is correct
2. Check webhook is enabled in GreenInvoice
3. Test webhook endpoint manually

## 📞 Support

### GreenInvoice Support
- **Email**: support@greeninvoice.co.il
- **Phone**: +972-3-900-9000
- **Documentation**: https://www.greeninvoice.co.il/api-docs/

### Technical Support
- Check the detailed documentation in `backend/greeninvoice-integration.md`
- Review backend logs for error details
- Test individual API endpoints

## 🎉 Success Checklist

- [ ] GreenInvoice account created and verified
- [ ] Cardcom payment plugin enabled
- [ ] API credentials obtained and configured
- [ ] Environment variables set in Render
- [ ] Webhook URL configured
- [ ] Email templates customized
- [ ] Test payment completed successfully
- [ ] Invoice received by customer
- [ ] Webhook processing working
- [ ] Monitoring set up

## 🔄 Migration Complete

Once you've completed all steps above, your website will be fully integrated with GreenInvoice! The old Cardcom integration has been completely removed and replaced with this more streamlined solution.

### Benefits You'll See:
- 🎯 **Simplified Management**: One system for invoices and payments
- 📧 **Professional Emails**: Beautiful, branded invoice emails
- 📊 **Better Reporting**: Integrated reporting through GreenInvoice
- 🔒 **Enhanced Security**: PCI DSS compliant payment processing
- 💰 **Automatic Tax Handling**: VAT calculated and handled automatically

---

**Need Help?** If you encounter any issues during setup, check the troubleshooting section above or contact the development team for assistance.
