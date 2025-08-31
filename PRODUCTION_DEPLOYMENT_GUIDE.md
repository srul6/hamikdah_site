# 🚀 GreenInvoice Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

**Update your `.env` file with production values:**

```bash
# GreenInvoice API Credentials (PRODUCTION)
GREENINVOICE_API_KEY_ID=your_production_api_key_id_here
GREENINVOICE_API_KEY_SECRET=your_production_api_secret_here

# Environment
NODE_ENV=production

# Production URLs
FRONTEND_URL=https://hamikdah-site-fronteand.onrender.com
BACKEND_URL=https://hamikdah-site.onrender.com

# Other configurations
PORT=5001
MONGO_URI=your_mongo_uri
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Render Dashboard Environment Variables

**Update your Render dashboard with these environment variables:**

```bash
# GreenInvoice API Credentials
GREENINVOICE_API_KEY_ID=your_production_api_key_id_here
GREENINVOICE_API_KEY_SECRET=your_production_api_secret_here

# Environment
NODE_ENV=production

# Production URLs
FRONTEND_URL=https://hamikdah-site-fronteand.onrender.com
BACKEND_URL=https://hamikdah-site.onrender.com

# Other configurations
PORT=5001
MONGO_URI=your_mongo_uri
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 🔧 GreenInvoice Production Setup

### 1. Get Production API Credentials

1. **Log into your GreenInvoice production account**
2. **Go to Settings → API**
3. **Generate NEW API credentials for production**
4. **Copy both API Key ID and Secret**

### 2. Verify Subscription Level

- Ensure your GreenInvoice account has **"Best" subscription or higher**
- Verify that **API access is enabled**

### 3. Test Production Credentials

Run the test script to verify your production credentials:

```bash
cd backend
node test-greeninvoice.js
```

## 🚀 Deployment Steps

### 1. Update Environment Variables

1. **Update your local `.env` file** with production credentials
2. **Update Render dashboard** environment variables
3. **Test locally** with production credentials

### 2. Commit and Push

```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "Prepare GreenInvoice integration for production deployment"

# Push to repository
git push origin main
```

### 3. Deploy to Render

1. **Render will automatically deploy** when you push to main
2. **Monitor the deployment logs** for any errors
3. **Test the production endpoints** once deployed

## 🧪 Testing Production Deployment

### 1. Test API Endpoints

```bash
# Test GreenInvoice authentication
curl -X GET https://hamikdah-site.onrender.com/api/greeninvoice/test

# Test invoice creation (with valid data)
curl -X POST https://hamikdah-site.onrender.com/api/greeninvoice/create-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"name": "Test Product", "price": 100, "quantity": 1}],
    "totalAmount": 100,
    "currency": "ILS",
    "customerInfo": {
      "name": "Test Customer",
      "email": "test@example.com",
      "phone": "123456789",
      "address": "Test Address",
      "city": "Test City",
      "zip": "12345"
    }
  }'
```

### 2. Test Frontend Integration

1. **Visit your production frontend**
2. **Add items to cart**
3. **Proceed to checkout**
4. **Test the GreenInvoice payment flow**

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check API credentials
2. **500 Internal Server Error**: Check environment variables
3. **404 Not Found**: Check API endpoints

### Debug Commands

```bash
# Check environment variables
echo $GREENINVOICE_API_KEY_ID
echo $GREENINVOICE_API_KEY_SECRET

# Test GreenInvoice API directly
curl -X POST https://api.greeninvoice.co.il/api/v1/account/token \
  -H "Content-Type: application/json" \
  -d '{"id": "your_api_key_id", "secret": "your_api_secret"}'
```

## 📞 Support

If you encounter issues:

1. **Check GreenInvoice API documentation**
2. **Verify your API credentials**
3. **Contact GreenInvoice support**
4. **Check Render deployment logs**

## ✅ Success Criteria

- [ ] GreenInvoice API credentials are valid
- [ ] Environment variables are set correctly
- [ ] Backend deploys successfully
- [ ] Frontend can create invoices
- [ ] Payment flow works end-to-end
- [ ] Customers receive confirmation emails

---

**Ready for production deployment! 🎉**
