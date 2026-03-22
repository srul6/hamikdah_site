# 🚀 Quick Start: Migrate to Neon + Cloudflare R2

## ✅ Code is Ready!

All code has been updated to support Neon + Cloudflare R2. You can switch between Supabase and Neon with a single environment variable.

---

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

This will install:
- `pg` - PostgreSQL client
- `@aws-sdk/client-s3` - For Cloudflare R2 (S3-compatible)
- `@aws-sdk/s3-request-presigner` - For signed URLs

---

## Step 2: Set Up Neon Database

1. **Create account**: https://neon.tech
2. **Create project** (choose closest region)
3. **Get connection string** from dashboard:
   
   **How to get the connection string:**
   
   a. **Log in to Neon**: Go to https://console.neon.tech
   
   b. **Select your project**: Click on the project you created
   
   c. **Find Connection Details**:
      - In the project dashboard, look for **"Connection Details"** or **"Connect"** button
      - Or click on your project name → Look for **"Connection string"** section in the sidebar
   
   d. **Copy the connection string**:
      - You'll see a connection string that looks like:
        ```
        postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
        ```
      - Click the **"Copy"** button next to it
      - **Important**: Use the **"Pooled connection"** string (recommended for serverless/always-on)
   
   e. **Save it**: You'll add this to your `backend/.env` file as `NEON_DATABASE_URL`
   
   **Visual guide:**
   - Dashboard → Your Project → "Connection Details" → Copy connection string
   - Or: Dashboard → Your Project → Sidebar → "Connection string" → Copy

4. **Run SQL**: Copy `backend/CREATE_TABLES_NEON.sql` and run in Neon SQL Editor

---

## Step 3: Set Up Cloudflare R2

**What is Cloudflare R2?**
- **R2** = Cloudflare's object storage service (like AWS S3, but cheaper)
- It stores your files (images, videos) in the cloud
- **Benefits**: 
  - Free tier: 10GB storage, 1M operations/month
  - **No egress fees** (unlike AWS S3) - saves money!
  - Fast global CDN delivery
  - S3-compatible API (works with AWS SDK)

**Setup Steps:**

1. **Create Cloudflare account**: 
   - Go to https://cloudflare.com
   - Sign up for free account
   - Add payment method (for R2, but free tier is generous)

2. **Go to R2 Dashboard**:
   - After logging in, look for **"R2"** in the left sidebar menu
   - Or go directly to: https://dash.cloudflare.com → Click **"R2"** in sidebar
   - If you don't see R2, you may need to enable it in your account settings

3. **Create a bucket**:
   - Click **"Create bucket"** button
   - Name it: `product-images` (or your preferred name)
   - Choose a region (closest to your users)
   - Click **"Create bucket"**

4. **Create API token** (for backend access):
   - In R2 dashboard, click **"Manage R2 API Tokens"** (usually in top right or sidebar)
   - Click **"Create API Token"**
   - Give it a name (e.g., "Hamikdash Backend")
   - Select your bucket: `product-images`
   - Set permissions: **"Object Read & Write"**
   - Click **"Create API Token"**
   - **IMPORTANT**: Copy and save these credentials immediately (you won't see them again!):
     - **Account ID** - This is your Cloudflare account ID (found in dashboard, not from token)
     - **Access Key ID** - This is from the token (starts with something like `xxxxx...`)
     - **Secret Access Key** - This is from the token (long secret string)
   
   **Where to find Account ID:**
   - Go to Cloudflare Dashboard (main dashboard, not R2)
   - Look in the right sidebar → Your **Account ID** is displayed there
   - Or: Go to any Cloudflare service → Account ID is usually shown in the URL or sidebar
   - It looks like: `a1b2c3d4e5f6g7h8i9j0` (alphanumeric string)
   
   **What you get from the API token:**
   - **Access Key ID**: The "username" part of the token
   - **Secret Access Key**: The "password" part of the token (keep this secret!)

5. **Get Public URL** (for accessing files):

   **Option A: Use R2's default public URL** (Easier, good for testing)
   - In your bucket settings, enable "Public Access"
   - The URL will be: `https://[account-id].r2.cloudflarestorage.com/product-images`
   - Use this URL in your `.env` as `R2_PUBLIC_URL`
   
   **Option B: Set up custom domain** (Recommended for production)
   
   **Step-by-step for custom domain:**
   
   a. **Prerequisites**:
      - Your domain must be managed by Cloudflare (add it to Cloudflare if not already)
      - If your domain is NOT on Cloudflare, you'll need to transfer DNS to Cloudflare first
   
   b. **In R2 Dashboard**:
      - Go to your bucket (`product-images`)
      - Click on **"Settings"** tab
      - Scroll down to **"Custom Domain"** section
      - Click **"Connect Domain"** or **"Add Custom Domain"**
   
   c. **Enter your subdomain**:
      - **Important**: Use a SUBDOMAIN of your main website domain, NOT the main domain itself
      - If your website is `bmikdash.com`, use a subdomain like:
        - `cdn.bmikdash.com` (recommended)
        - `storage.bmikdash.com`
        - `files.bmikdash.com`
        - `media.bmikdash.com`
      - **Do NOT use**: `bmikdash.com` (this is your main website)
      - **Do use**: `cdn.bmikdash.com` (this is a subdomain for file storage)
      - Enter the subdomain (e.g., `cdn.bmikdash.com`)
      - Click **"Connect"** or **"Add"**
   
   **Example:**
   - Main website: `bmikdash.com` (stays the same, no changes)
   - R2 storage subdomain: `cdn.bmikdash.com` (new subdomain for images/videos)
   - Your images will be at: `https://cdn.bmikdash.com/products/image.jpg`
   
   d. **Cloudflare will show DNS instructions**:
      - It will create a CNAME record automatically
      - Or it will show you what DNS record to add
      - Usually something like:
        ```
        Type: CNAME
        Name: cdn (or your subdomain)
        Target: [bucket-name].[account-id].r2.cloudflarestorage.com
        Proxy: Enabled (orange cloud)
        ```
   
   e. **Verify DNS** (if not automatic):
      - Go to Cloudflare Dashboard → Your Domain → **"DNS"** section
      - Check that the CNAME record was created
      - Wait a few minutes for DNS to propagate
   
   f. **Get your custom URL**:
      - Once connected, your files will be accessible at:
        `https://cdn.yourdomain.com/filename.jpg`
      - Use this in your `.env` as `R2_PUBLIC_URL=https://cdn.yourdomain.com`
   
   **Important Notes:**
   - Custom domain setup can take 5-15 minutes to activate
   - Make sure your domain is on Cloudflare (not just DNS, but full Cloudflare management)
   - The custom domain will have Cloudflare's CDN benefits (faster, cached)
   - For testing, you can use Option A first, then switch to custom domain later

---

## Step 4: Update Environment Variables

Add to `backend/.env`:

```env
# Switch to Neon (set to 'true' to use Neon, 'false' for Supabase)
USE_NEON=true

# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id  # Found in Cloudflare Dashboard (right sidebar)
R2_ACCESS_KEY_ID=your_access_key_id      # From API token (starts with xxxxx...)
R2_SECRET_ACCESS_KEY=your_secret_key      # From API token (long secret string)
R2_BUCKET_NAME=product-images
R2_PUBLIC_URL=https://your-account-id.r2.cloudflarestorage.com/product-images
# OR custom domain:
# R2_PUBLIC_URL=https://cdn.yourdomain.com

# Keep Supabase vars for migration (can remove later)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

---

## Step 5: Migrate Data

### 5.1 Create Tables in Neon
Run `backend/CREATE_TABLES_NEON.sql` in Neon SQL Editor.

### 5.2 Migrate Data
```bash
cd backend
node src/utils/migrateData.js
```

This will:
- Export all products, comments, and orders from Supabase
- Import them into Neon
- Preserve all IDs and relationships

### 5.3 Migrate Files to R2

**Step 1: Download all files from Supabase**

**Option A: Using the automated script (Recommended)**
```bash
cd backend
node src/utils/downloadSupabaseFiles.js
```

This will:
- Scan your `product-images` bucket
- Download all files to `./supabase-backup` folder
- Preserve folder structure (products/, comments/, etc.)
- Show progress and summary

**Option B: Manual download**
- See `DOWNLOAD_SUPABASE_FILES.md` for detailed instructions
- Use Supabase Dashboard or CLI

**Step 2: Upload to Cloudflare R2**

**Option A: Using R2 Dashboard**
1. Go to Cloudflare R2 Dashboard
2. Open your `product-images` bucket
3. Upload folders/files maintaining the same structure:
   - `products/` folder → Upload to R2 `products/` folder
   - `comments/` folder → Upload to R2 `comments/` folder
   - etc.

**Option B: Using R2 API (for automation)**
- See Cloudflare R2 documentation for bulk upload scripts
- Or use AWS S3 CLI (R2 is S3-compatible)

**Important**: Keep the same folder structure so your file paths remain valid!

---

## Step 6: Test Locally First! ✅

**Important**: Test everything locally before deploying to production!

### Quick Local Test:

1. **Update `backend/.env`**:
   ```env
   USE_NEON=true
   NEON_DATABASE_URL=postgresql://...
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=product-images
   R2_PUBLIC_URL=...
   ```

2. **Start backend**:
   ```bash
   cd backend
   npm start
   ```

3. **Test in browser**:
   - http://localhost:5001/api/products
   - http://localhost:5001/api/comments
   - http://localhost:5001/api/orders
   
   Should return JSON data (or empty arrays if no data yet)

4. **Start frontend**:
   ```bash
   cd frontend
   npm start
   ```

5. **Test frontend**:
   - http://localhost:3000
   - Products should load
   - No console errors

**See `TEST_LOCALLY.md` for detailed testing guide!**

---

## Step 7: Test Everything (Production)

2. **Test endpoints**:

   **Method 1: Using Browser (Easiest)**
   
   Open these URLs in your browser:
   - `http://localhost:5001/api/products` - Should show JSON with products
   - `http://localhost:5001/api/comments` - Should show JSON with comments
   - `http://localhost:5001/api/orders` - Should show JSON with orders
   
   **Method 2: Using curl (Terminal)**
   
   ```bash
   # Test products endpoint
   curl http://localhost:5001/api/products
   
   # Test comments endpoint
   curl http://localhost:5001/api/comments
   
   # Test orders endpoint
   curl http://localhost:5001/api/orders
   ```
   
   **Method 3: Using Postman or Insomnia**
   
   - Create GET requests to:
     - `http://localhost:5001/api/products`
     - `http://localhost:5001/api/comments`
     - `http://localhost:5001/api/orders`
   
   **Method 4: Test File Upload (using curl)**
   
   ```bash
   # Test file upload endpoint
   curl -X POST http://localhost:5001/api/upload/image \
     -F "image=@/path/to/your/test-image.jpg" \
     -F "folder=products"
   ```
   
   Replace `/path/to/your/test-image.jpg` with an actual image file path.
   
   **Expected Results:**
   - ✅ Products endpoint: Returns array of products with all fields
   - ✅ Comments endpoint: Returns array of comments
   - ✅ Orders endpoint: Returns object with `{ success: true, orders: [...] }`
   - ✅ Upload endpoint: Returns `{ success: true, url: "...", path: "..." }`
   
   **If you see errors:**
   - Check backend console for error messages
   - Verify `.env` has correct credentials
   - Make sure database connection is working
   - Check that tables exist in Neon database

3. **Test frontend**:
   - Products should load
   - Images should display
   - Admin panel should work

---

## Step 8: Switch Over

Once everything works locally:

### Important: Update Render Environment Variables

**⚠️ Render uses its own environment variables, NOT your local `.env` file!**

You need to update environment variables in **Render Dashboard**:

1. **Go to Render Dashboard**:
   - https://dashboard.render.com
   - Sign in to your account

2. **Select your backend service**:
   - Click on your backend service (e.g., "hamikdash-backend")

3. **Go to Environment**:
   - Click on **"Environment"** tab in the left sidebar
   - Or look for **"Environment Variables"** section

4. **Add/Update these variables**:
   
   **Add new variables:**
   ```
   USE_NEON=true
   NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=product-images
   R2_PUBLIC_URL=https://your-account-id.r2.cloudflarestorage.com/product-images
   ```
   
   **Keep existing variables** (for now, as backup):
   ```
   SUPABASE_URL=... (keep for rollback)
   SUPABASE_ANON_KEY=... (keep for rollback)
   ```

5. **Save changes**:
   - Click **"Save Changes"** button
   - Render will automatically redeploy your service

6. **Wait for deployment**:
   - Render will rebuild and redeploy
   - Check deployment logs for errors
   - Usually takes 2-5 minutes

7. **Test production**:
   - Test your production API endpoints
   - Check that data loads correctly
   - Verify file uploads work

8. **Monitor for issues**:
   - Check Render logs for errors
   - Test all functionality
   - If something breaks, you can quickly switch back by setting `USE_NEON=false` in Render

9. **Once stable** (after a few days):
   - Remove Supabase credentials from Render environment variables
   - Keep them in local `.env` for reference if needed

### Local vs Production

- **Local development**: Uses `backend/.env` file
- **Render production**: Uses environment variables set in Render Dashboard
- **Both need to be updated separately!**

---

## Rollback Plan

If something goes wrong:

1. **Set `USE_NEON=false`** in `.env`
2. **Restart backend** - Will use Supabase again
3. **Data is safe** - Nothing deleted from Supabase

---

## Cost Savings

| Service | Before | After | Savings |
|---------|--------|-------|---------|
| Database | $25/month | $5-20/month | 60-80% |
| Storage | Included | Free (10GB) | 100% |
| **Total** | **$25/month** | **$5-20/month** | **60-80%** |

---

## Support

- **Neon Docs**: https://neon.tech/docs
- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Migration Guide**: See `MIGRATION_TO_NEON_R2.md`

---

## What Changed?

✅ **New Files**:
- `backend/src/controllers/databaseController.js` - Neon PostgreSQL controller
- `backend/src/controllers/storageController.js` - Cloudflare R2 controller
- `backend/src/config/database.js` - Switch between Supabase/Neon
- `backend/src/utils/migrateData.js` - Data migration script
- `backend/CREATE_TABLES_NEON.sql` - Database schema

✅ **Updated Files**:
- All routes and controllers now use config-based database/storage
- Can switch with `USE_NEON` environment variable

✅ **No Frontend Changes**:
- Frontend code unchanged
- All APIs work the same

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Neon
3. ✅ Set up Cloudflare R2
4. ✅ Update `.env`
5. ✅ Run migration
6. ✅ Test everything
7. ✅ Deploy!

Good luck! 🚀

