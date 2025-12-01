# 🔧 Fix CORS Error

## Problem
```
Error: The CORS policy for this site does not allow access from the specified Origin.
```

## Solution

The CORS configuration needs to include your frontend's origin. I've updated the code, but you need to:

### Option 1: If Frontend and Backend are on Same Domain

If your frontend is also served from `https://hamikdah-site.onrender.com` (same as backend), then CORS shouldn't be an issue. The error might be from a different source.

### Option 2: If Frontend is on Different Domain

If your frontend is on a different URL (like `https://bmikdash.com` or a different Render service), you need to:

1. **Find your frontend URL**:
   - Where is your frontend deployed?
   - Is it on `https://bmikdash.com`?
   - Or on a different Render service?

2. **Add it to CORS allowed origins**:
   - The code now includes common Render URLs
   - But if your frontend is on a custom domain, add it

3. **Or use environment variable**:
   - Set `FRONTEND_URL` in Render environment variables
   - The code will automatically allow it

---

## Quick Fix

### Step 1: Check Where Frontend is Hosted

- Is frontend on `https://bmikdash.com`?
- Is frontend on a different Render service?
- Is frontend on the same Render service as backend?

### Step 2: Update CORS Configuration

The code has been updated to:
- Allow `https://bmikdash.com` ✅
- Allow `FRONTEND_URL` from environment variable ✅
- Allow common Render domains ✅
- Log blocked origins for debugging ✅

### Step 3: Set FRONTEND_URL in Render

1. Go to Render Dashboard → Your Backend Service → Environment
2. Add/Update:
   ```
   FRONTEND_URL=https://your-frontend-url.com
   ```
3. Save and redeploy

---

## After Fix

1. **Redeploy backend** (code is updated)
2. **Set FRONTEND_URL** in Render environment variables
3. **Test again** - CORS error should be gone

The updated code will log blocked origins so you can see exactly what's being blocked.

