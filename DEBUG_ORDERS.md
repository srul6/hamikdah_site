# 🔍 Debugging Order Creation Issues

## Problem
Orders are not appearing in the admin panel after successful payments.

## Order Creation Flow

1. **Customer completes payment** → Green Invoice processes payment
2. **Green Invoice sends webhook** → `POST ${BACKEND_URL}/api/greeninvoice/webhook`
3. **Webhook handler creates order** → Saves to Neon database with status 'completed'
4. **Admin panel fetches orders** → Displays all orders from database

## Debugging Steps

### 1. Check Backend Logs on Render

Go to your Render dashboard → Backend service → Logs

Look for these log messages:
- `=== GreenInvoice webhook route hit ===` - Webhook was received
- `🎯 Payment webhook received - Form ID: ...` - Webhook data received
- `💾 Saving order to database...` - Attempting to save order
- `✅ Order saved to database successfully. Order ID: ...` - Order created
- `❌ Failed to save order to database:` - Order creation failed (check error details)

### 2. Verify Environment Variables

Check that these are set in Render:
- `BACKEND_URL` - Must be your full backend URL (e.g., `https://hamikdah-site.onrender.com`)
- `NEON_DATABASE_URL` - Your Neon connection string
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - R2 credentials

### 3. Test Webhook Manually

You can test the webhook endpoint directly:

```bash
curl -X POST https://your-backend-url.onrender.com/api/greeninvoice/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-123",
    "document_id": "DOC-TEST",
    "transaction_id": "PAY-TEST",
    "external_data": "{\"customerId\":\"test@example.com\",\"customerName\":\"Test User\",\"amount\":100,\"items\":[{\"id\":1,\"quantity\":1,\"price\":100}]}"
  }'
```

### 4. Check Database Directly

Connect to your Neon database and run:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

This will show if orders are being created but not displayed.

### 5. Check Admin Panel Console

Open browser console on admin panel and look for:
- `📋 Fetching orders from API...`
- `✅ Fetched orders: X orders`
- Any error messages

### 6. Verify Webhook URL in Green Invoice

1. Log into Green Invoice dashboard
2. Check webhook/notification settings
3. Verify the webhook URL matches: `${BACKEND_URL}/api/greeninvoice/webhook`

## Common Issues

### Issue 1: Webhook Not Being Called
**Symptoms:** No webhook logs in Render
**Solution:** 
- Verify `BACKEND_URL` is set correctly
- Check Green Invoice webhook settings
- Ensure webhook URL is publicly accessible

### Issue 2: Order Creation Failing
**Symptoms:** See `❌ Failed to save order to database` in logs
**Solution:**
- Check the error message in logs
- Verify `NEON_DATABASE_URL` is correct
- Check if `orders` table exists in Neon
- Verify all required fields are being sent

### Issue 3: Orders Created But Not Showing
**Symptoms:** Orders exist in database but not in admin panel
**Solution:**
- Check browser console for API errors
- Verify `/api/orders` endpoint is working
- Check if orders have correct status field

### Issue 4: Wrong Status
**Symptoms:** Orders created with status 'pending' instead of 'completed'
**Solution:**
- Check webhook handler sets status to 'completed'
- Verify webhook is being called after payment completion

## Testing Order Creation Locally

1. Set up your `.env` file with all required variables
2. Start backend: `cd backend && npm start`
3. Test webhook endpoint using curl (see above)
4. Check database: `SELECT * FROM orders;`
5. Check admin panel: `http://localhost:3000/admin`

## Next Steps

After checking the logs, you should see:
- Whether the webhook is being called
- If order creation is failing (and why)
- If orders are being created but not displayed

Share the error messages from the logs and we can fix the specific issue.


