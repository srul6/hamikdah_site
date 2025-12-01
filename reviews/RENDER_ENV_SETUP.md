# 🔧 Setting Environment Variables in Render

## Important: Render Doesn't Use Your Local .env File!

When you deploy to Render, your local `.env` file is **NOT used**. Render has its own environment variable system that you must configure in the Render Dashboard.

---

## Step-by-Step: Update Render Environment Variables

### Step 1: Access Render Dashboard

1. Go to https://dashboard.render.com
2. Sign in to your account
3. You'll see your services listed

### Step 2: Select Your Backend Service

1. Click on your backend service (e.g., "hamikdash-backend" or similar name)
2. This opens the service details page

### Step 3: Navigate to Environment Variables

**Option A:**
- Look for **"Environment"** tab in the left sidebar
- Click on it

**Option B:**
- Scroll down on the service page
- Look for **"Environment Variables"** section
- Click **"Add Environment Variable"** or **"Edit"**

### Step 4: Add/Update Variables

You'll see a list of existing environment variables. Add or update these:

#### New Variables (for Neon + R2):

1. **USE_NEON**
   - Key: `USE_NEON`
   - Value: `true`
   - Click **"Save"**

2. **NEON_DATABASE_URL**
   - Key: `NEON_DATABASE_URL`
   - Value: `postgresql://user:password@host/database?sslmode=require`
   - (Use your actual Neon connection string)
   - Click **"Save"**

3. **R2_ACCOUNT_ID**
   - Key: `R2_ACCOUNT_ID`
   - Value: `your_cloudflare_account_id`
   - Click **"Save"**

4. **R2_ACCESS_KEY_ID**
   - Key: `R2_ACCESS_KEY_ID`
   - Value: `your_access_key_id`
   - Click **"Save"**

5. **R2_SECRET_ACCESS_KEY**
   - Key: `R2_SECRET_ACCESS_KEY`
   - Value: `your_secret_access_key`
   - Click **"Save"**

6. **R2_BUCKET_NAME**
   - Key: `R2_BUCKET_NAME`
   - Value: `product-images`
   - Click **"Save"**

7. **R2_PUBLIC_URL**
   - Key: `R2_PUBLIC_URL`
   - Value: `https://your-account-id.r2.cloudflarestorage.com/product-images`
   - Or: `https://cdn.yourdomain.com` (if using custom domain)
   - Click **"Save"**

#### Keep Existing Variables (for rollback):

- **SUPABASE_URL** - Keep it (for rollback if needed)
- **SUPABASE_ANON_KEY** - Keep it (for rollback if needed)
- **ADMIN_USERNAME** - Keep it
- **ADMIN_PASSWORD_HASH** - Keep it
- **PORT** - Keep it (Render sets this automatically)
- Any other existing variables - Keep them

### Step 5: Save and Deploy

1. After adding all variables, Render will automatically:
   - Detect the changes
   - Show a notification about pending deployment
   - Start a new deployment

2. **Or manually trigger deployment**:
   - Go to **"Events"** tab
   - Click **"Manual Deploy"** → **"Deploy latest commit"**

3. **Wait for deployment**:
   - Usually takes 2-5 minutes
   - Watch the deployment logs
   - Look for any errors

### Step 6: Verify Deployment

1. **Check deployment logs**:
   - Go to **"Events"** tab
   - Click on the latest deployment
   - Check for errors

2. **Test your API**:
   - Your backend URL: `https://your-service.onrender.com`
   - Test: `https://your-service.onrender.com/api/products`
   - Should return JSON data

3. **Check console logs**:
   - Go to **"Logs"** tab
   - Should see: `✅ Using Neon PostgreSQL + Cloudflare R2`
   - No connection errors

---

## Visual Guide

```
Render Dashboard
├── Your Services
│   └── hamikdash-backend (click this)
│       ├── Overview
│       ├── Environment ← Click here!
│       │   ├── Add Environment Variable
│       │   │   ├── Key: USE_NEON
│       │   │   └── Value: true
│       │   ├── Key: NEON_DATABASE_URL
│       │   │   └── Value: postgresql://...
│       │   └── ... (other variables)
│       ├── Events (deployment logs)
│       └── Logs (runtime logs)
```

---

## Common Issues

### Issue: "Environment variable not found"

**Solution:**
- Make sure you added the variable in Render Dashboard
- Check spelling (case-sensitive)
- Restart the service after adding variables

### Issue: "Still using Supabase"

**Solution:**
- Check `USE_NEON=true` is set in Render
- Verify all R2 variables are set
- Check deployment logs for errors
- Restart the service

### Issue: "Deployment failed"

**Solution:**
- Check deployment logs for specific errors
- Verify all environment variables are correct
- Check that Neon database is accessible
- Verify R2 credentials are valid

---

## Quick Checklist

- [ ] Added `USE_NEON=true` in Render
- [ ] Added `NEON_DATABASE_URL` in Render
- [ ] Added all `R2_*` variables in Render
- [ ] Saved all changes
- [ ] Deployment started automatically
- [ ] Deployment completed successfully
- [ ] Tested API endpoints
- [ ] Checked logs for errors

---

## Rollback Plan

If something goes wrong:

1. **Quick rollback**:
   - In Render Dashboard → Environment
   - Change `USE_NEON` from `true` to `false`
   - Save changes
   - Render will redeploy (uses Supabase again)

2. **Or remove new variables**:
   - Delete Neon/R2 variables
   - Keep Supabase variables
   - Redeploy

---

## Important Notes

1. **Local .env ≠ Render Environment Variables**
   - Your local `.env` file is for development only
   - Render uses its own environment variables
   - You must set them separately

2. **Sensitive Data**
   - Never commit `.env` to git
   - Render environment variables are secure
   - They're encrypted and only visible to you

3. **Changes Take Effect After Deployment**
   - After changing variables, Render redeploys
   - Wait for deployment to complete
   - Test after deployment finishes

---

## Summary

✅ **Do this:**
- Update environment variables in Render Dashboard
- Wait for automatic deployment
- Test your API

❌ **Don't do this:**
- Only update local `.env` file (won't work in production)
- Forget to update Render variables
- Deploy without setting variables

Good luck! 🚀

