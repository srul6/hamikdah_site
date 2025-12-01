# 🚀 Migration Guide: Supabase → Neon + Cloudflare R2

## Overview

This guide will help you migrate from Supabase to:
- **Neon** (PostgreSQL database) - $5-20/month with scale-to-zero
- **Cloudflare R2** (Object storage) - Free tier, then pay-as-you-go

**Benefits:**
- ✅ 60-80% cheaper than Supabase ($25/month)
- ✅ Always-on database (wakes in ~300-500ms if idle)
- ✅ No egress fees on storage
- ✅ Better long-term scaling

---

## Step 1: Set Up Neon Database

### 1.1 Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project
4. Choose a region (closest to your users)

### 1.2 Get Connection String
1. In Neon dashboard, go to your project
2. Click "Connection Details"
3. Copy the **Connection String** (looks like: `postgresql://user:password@host/database?sslmode=require`)
4. Save it - you'll need it for `.env`

### 1.3 Enable Scale-to-Zero (Recommended)
1. In Neon dashboard → Settings
2. Enable "Scale to Zero" (saves money when idle)
3. Wake-up time: ~300-500ms (very fast!)

---

## Step 2: Set Up Cloudflare R2 Storage

### 2.1 Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for free account
3. Add payment method (for R2, but free tier is generous)

### 2.2 Create R2 Bucket
1. Go to Cloudflare Dashboard → R2
2. Click "Create bucket"
3. Name it: `product-images` (or your preferred name)
4. Choose region (closest to your users)

### 2.3 Get R2 Credentials
1. Go to R2 → Manage R2 API Tokens
2. Click "Create API Token"
3. Select your bucket
4. Give it "Object Read & Write" permissions
5. Save:
   - **Account ID**
   - **Access Key ID**
   - **Secret Access Key**
   - **Bucket Name**
   - **Public URL** (for accessing files)

### 2.4 Make Bucket Public (for images)
1. Go to R2 → Your bucket → Settings
2. Enable "Public Access"
3. Or use Custom Domain (recommended for production)

---

## Step 3: Install Required Packages

```bash
cd backend
npm install pg @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Packages:**
- `pg` - PostgreSQL client for Node.js
- `@aws-sdk/client-s3` - AWS SDK (works with R2, S3-compatible)
- `@aws-sdk/s3-request-presigner` - For generating signed URLs

---

## Step 4: Update Environment Variables

Add to `backend/.env`:

```env
# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=product-images
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
# OR use custom domain:
# R2_PUBLIC_URL=https://cdn.yourdomain.com

# Keep old Supabase vars for now (during migration)
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
```

---

## Step 5: Migrate Database Schema

### 5.1 Export Schema from Supabase
1. Go to Supabase Dashboard → SQL Editor
2. Run this to get all table schemas:

```sql
-- Get all table schemas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 5.2 Create Tables in Neon
1. Go to Neon Dashboard → SQL Editor
2. Run the SQL scripts (we'll create these in the migration)

**Tables to create:**
- `products`
- `orders`
- `comments`
- `cart`

---

## Step 6: Migrate Data

### 6.1 Export Data from Supabase
Use the migration script we'll create to export all data.

### 6.2 Import Data to Neon
Import the exported data into Neon.

---

## Step 7: Migrate Files to R2

### 7.1 Download Files from Supabase
1. Go to Supabase Dashboard → Storage
2. Download all files from `product-images` bucket
3. Keep the folder structure

### 7.2 Upload to Cloudflare R2
1. Use R2 dashboard upload
2. Or use the migration script we'll create

---

## Step 8: Update Code

The code will be updated to:
1. Use `pg` instead of `@supabase/supabase-js`
2. Use AWS S3 SDK for R2 storage
3. Keep the same API structure (no frontend changes needed)

---

## Step 9: Test Everything

1. Test database connections
2. Test file uploads
3. Test all CRUD operations
4. Test frontend integration

---

## Step 10: Switch Over

1. Update production `.env` with new credentials
2. Deploy updated backend
3. Monitor for issues
4. Once stable, remove Supabase credentials

---

## Cost Comparison

| Service | Supabase | Neon + R2 |
|---------|----------|-----------|
| Database | $25/month | $5-20/month |
| Storage | Included | Free (10GB) |
| Egress | Included | $0 (no fees!) |
| **Total** | **$25/month** | **$5-20/month** |

**Savings: 60-80% cheaper!** 💰

---

## Rollback Plan

If something goes wrong:
1. Keep Supabase credentials in `.env` as backup
2. Can switch back by changing one environment variable
3. Data remains in Supabase until you delete it

---

## Support

If you encounter issues:
- Neon Docs: https://neon.tech/docs
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

## Next Steps

1. ✅ Set up Neon account
2. ✅ Set up Cloudflare R2
3. ✅ Install packages
4. ✅ Update code (we'll do this next)
5. ✅ Test migration
6. ✅ Deploy

Let's proceed with the code updates!

