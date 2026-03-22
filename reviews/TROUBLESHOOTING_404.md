# 🔧 Troubleshooting 404 Error: /api/products/1

## Error: `hamikdah-site.onrender.com/api/products/1` returns 404

---

## Possible Causes & Solutions

### 1. Backend Not Deployed with Latest Code ⚠️

**Problem**: Render is running old code that doesn't have the updated routes.

**Solution**:
1. **Check Render deployment**:
   - Go to Render Dashboard → Your Service → "Events" tab
   - Check if latest commit is deployed
   - Look for deployment errors

2. **Redeploy manually**:
   - Render Dashboard → Your Service → "Manual Deploy" → "Deploy latest commit"
   - Wait for deployment to complete (2-5 minutes)

3. **Verify code is pushed to Git**:
   ```bash
   git status
   git add .
   git commit -m "Update backend routes"
   git push
   ```
   Then trigger deployment in Render

---

### 2. Database Connection Failing ⚠️

**Problem**: Backend can't connect to Neon database, so routes fail.

**Check**:
1. **Render Logs**:
   - Go to Render Dashboard → Your Service → "Logs" tab
   - Look for errors like:
     - "Error connecting to database"
     - "Invalid credentials"
     - "Connection refused"

2. **Verify Environment Variables in Render**:
   - Go to Render Dashboard → Your Service → "Environment" tab
   - Check these are set:
     ```
     USE_NEON=true
     NEON_DATABASE_URL=postgresql://...
     ```
   - Make sure `NEON_DATABASE_URL` is correct (no typos)

3. **Test Database Connection**:
   - Try accessing: `https://hamikdah-site.onrender.com/api/products` (without ID)
   - If this also fails, it's a database connection issue

---

### 3. Product ID 1 Doesn't Exist ⚠️

**Problem**: The product with ID 1 doesn't exist in Neon database.

**Check**:
1. **Test all products endpoint**:
   ```
   https://hamikdah-site.onrender.com/api/products
   ```
   - If this works, check what product IDs exist
   - Product ID 1 might not exist

2. **Check Neon Database**:
   - Go to Neon Dashboard → SQL Editor
   - Run: `SELECT id FROM products ORDER BY id;`
   - See what IDs actually exist

3. **Try a different ID**:
   - If products exist, try: `/api/products/2` or `/api/products/3`
   - See if those work

---

### 4. Route Not Matching ⚠️

**Problem**: The route `/api/products/:id` isn't being matched correctly.

**Check**:
1. **Test the route directly**:
   ```bash
   curl https://hamikdah-site.onrender.com/api/products/1
   ```

2. **Check Render logs**:
   - Look for request logs
   - Should see: `GET /api/products/1`
   - If you see different path, route isn't matching

3. **Verify route order in app.js**:
   - `/api/products` route should be before catch-all route
   - Check `backend/src/app.js` - routes should be in correct order

---

### 5. Environment Variable Error ⚠️

**Problem**: Missing or incorrect environment variable causing backend to crash.

**Check Render Environment Variables**:

1. **Required Variables**:
   ```
   USE_NEON=true (or false if still using Supabase)
   NEON_DATABASE_URL=... (if USE_NEON=true)
   SUPABASE_URL=... (if USE_NEON=false)
   SUPABASE_ANON_KEY=... (if USE_NEON=false)
   ```

2. **Check for errors in logs**:
   - Look for messages like:
     - "Environment variable X is not set"
     - "Invalid environment variable"
     - "Missing required env: ..."

3. **Common missing variables**:
   - `FRONTEND_URL` (for payment redirects)
   - `PORT` (usually auto-set by Render)
   - Database credentials

---

## Quick Diagnostic Steps

### Step 1: Test Base Endpoint
```
https://hamikdah-site.onrender.com/api/products
```
- ✅ Works = Database connection OK, route exists
- ❌ Fails = Database or route issue

### Step 2: Check Render Logs
- Go to Render Dashboard → Logs
- Look for:
  - Connection errors
  - Route not found errors
  - Environment variable errors

### Step 3: Test Different Product ID
```
https://hamikdah-site.onrender.com/api/products/2
https://hamikdah-site.onrender.com/api/products/3
```
- If these work, ID 1 doesn't exist
- If all fail, route or database issue

### Step 4: Verify Environment Variables
- Render Dashboard → Environment tab
- Check all required variables are set
- No typos in values

---

## Common Error Messages

### "Cannot GET /api/products/1"
- **Cause**: Route doesn't exist or backend not running
- **Fix**: Check route is defined, redeploy backend

### "Product not found"
- **Cause**: Product ID 1 doesn't exist in database
- **Fix**: Check database, use correct ID

### "Connection refused" or "Database error"
- **Cause**: Can't connect to Neon database
- **Fix**: Check `NEON_DATABASE_URL` in Render environment variables

### "Environment variable X is required"
- **Cause**: Missing environment variable
- **Fix**: Add missing variable in Render Dashboard

---

## Quick Fix Checklist

- [ ] Check Render deployment is latest code
- [ ] Verify environment variables in Render Dashboard
- [ ] Check Render logs for errors
- [ ] Test `/api/products` (without ID) - does it work?
- [ ] Test different product ID (2, 3, etc.)
- [ ] Verify product ID 1 exists in database
- [ ] Check database connection is working
- [ ] Redeploy backend if needed

---

## Still Not Working?

1. **Check Render Logs** - Most errors show up here
2. **Test locally first** - Make sure it works on your computer
3. **Verify database** - Check Neon has data
4. **Check route order** - Routes must be before catch-all

Let me know what you see in the Render logs! 🔍

