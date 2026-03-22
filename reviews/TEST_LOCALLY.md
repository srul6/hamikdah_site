# 🧪 How to Test Locally

## Quick Local Testing Guide

Test everything locally before deploying to production.

---

## Step 1: Set Up Local Environment

### Update `backend/.env`:

```env
# Switch to Neon (set to 'true' to test Neon, 'false' for Supabase)
USE_NEON=true

# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=product-images
R2_PUBLIC_URL=https://your-account-id.r2.cloudflarestorage.com/product-images

# Keep Supabase for comparison (optional)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

---

## Step 2: Make Sure Tables Exist in Neon

1. **Go to Neon Dashboard** → SQL Editor
2. **Run** `backend/CREATE_TABLES_NEON.sql`
3. **Verify tables created**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   Should show: `products`, `comments`, `orders`, `cart`

---

## Step 3: Run Migration (If Needed)

If Neon tables are empty:

```bash
cd backend
node src/utils/migrateData.js
```

This will:
- Pull all data from Supabase
- Upload to Neon
- Show progress and results

---

## Step 4: Start Backend

```bash
cd backend
npm start
```

**Expected output:**
```
🔧 Backend running on port 5001
🔄 Development mode - detailed logging enabled
✅ Using Neon PostgreSQL + Cloudflare R2 - always accessible!
✅ Connected to Neon PostgreSQL database
```

**If you see errors:**
- Check `.env` file has correct credentials
- Check Neon connection string is correct
- Check tables exist in Neon

---

## Step 5: Test API Endpoints

### Method 1: Browser (Easiest)

Open these URLs in your browser:

1. **Products**: http://localhost:5001/api/products
   - Should show JSON array of products
   - If empty `[]`, data not migrated yet

2. **Comments**: http://localhost:5001/api/comments
   - Should show JSON array of comments

3. **Orders**: http://localhost:5001/api/orders
   - Should show JSON: `{ success: true, orders: [...] }`

### Method 2: Terminal (curl)

```bash
# Test products
curl http://localhost:5001/api/products

# Test comments
curl http://localhost:5001/api/comments

# Test orders
curl http://localhost:5001/api/orders
```

### Method 3: Check Backend Console

Look at the terminal where backend is running. You should see:
```
GET /api/products
✅ Connected to Neon PostgreSQL database
```

**If you see errors:**
- Check the error message
- Common errors:
  - "relation 'products' does not exist" → Run CREATE_TABLES_NEON.sql
  - "Connection refused" → Check NEON_DATABASE_URL
  - "Invalid credentials" → Check connection string

---

## Step 6: Test File Upload

### Using curl:

```bash
curl -X POST http://localhost:5001/api/upload/image \
  -F "image=@/path/to/test-image.jpg" \
  -F "folder=products"
```

**Expected response:**
```json
{
  "success": true,
  "message": "image uploaded successfully",
  "url": "https://...",
  "path": "products/123-abc.jpg"
}
```

**Check:**
- File appears in Cloudflare R2 dashboard
- URL is accessible

---

## Step 7: Test Frontend

### Start Frontend:

```bash
cd frontend
npm start
```

**Open**: http://localhost:3000

### What to Check:

1. **Homepage loads**:
   - Products display
   - Images load correctly
   - No console errors

2. **Product pages work**:
   - Click on a product
   - Product details load
   - Images display

3. **Admin panel works**:
   - Go to http://localhost:3000/admin
   - Login
   - Check Products tab - should show products
   - Check Comments tab - should show comments
   - Check Orders tab - should show orders

4. **File upload works**:
   - Go to Admin → Products
   - Edit a product
   - Upload an image
   - Should upload to R2 successfully

---

## Step 8: Compare with Supabase

### Test with Supabase (for comparison):

1. **Change in `.env`**:
   ```env
   USE_NEON=false
   ```

2. **Restart backend**:
   ```bash
   # Stop backend (Ctrl+C)
   npm start
   ```

3. **Test again**:
   - Should work with Supabase
   - Compare results

4. **Switch back to Neon**:
   ```env
   USE_NEON=true
   ```
   Restart backend

---

## Common Issues & Fixes

### Issue: "relation 'products' does not exist"

**Fix:**
1. Go to Neon Dashboard → SQL Editor
2. Run `CREATE_TABLES_NEON.sql`
3. Verify tables exist

### Issue: "Connection refused" or "Cannot connect"

**Fix:**
1. Check `NEON_DATABASE_URL` in `.env`
2. Test connection string in Neon Dashboard
3. Make sure connection string includes `?sslmode=require`

### Issue: Empty arrays `[]`

**Fix:**
1. Run migration: `node src/utils/migrateData.js`
2. Check Neon has data
3. Verify migration completed successfully

### Issue: Images not loading

**Fix:**
1. Check `R2_PUBLIC_URL` in `.env`
2. Verify R2 bucket is public
3. Check file paths in database

### Issue: CORS error

**Fix:**
- Shouldn't happen locally (same origin)
- If it does, check `allowedOrigins` in `backend/src/app.js`
- Make sure `http://localhost:3000` is in the list

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Console shows: "✅ Using Neon PostgreSQL + Cloudflare R2"
- [ ] Console shows: "✅ Connected to Neon PostgreSQL database"
- [ ] `GET /api/products` returns products (or empty array if no data)
- [ ] `GET /api/comments` returns comments
- [ ] `GET /api/orders` returns orders
- [ ] Frontend loads without errors
- [ ] Products display on homepage
- [ ] Images load correctly
- [ ] Admin panel works
- [ ] Can upload files (if R2 is set up)
- [ ] Can create/edit products
- [ ] Can create/edit comments

---

## Quick Test Commands

```bash
# Test backend is running
curl http://localhost:5001/api/products

# Test with pretty JSON (if you have jq)
curl http://localhost:5001/api/products | jq

# Test specific product
curl http://localhost:5001/api/products/1

# Test file upload
curl -X POST http://localhost:5001/api/upload/image \
  -F "image=@test.jpg" \
  -F "folder=products"
```

---

## What Success Looks Like

### Backend Console:
```
✅ Using Neon PostgreSQL + Cloudflare R2
✅ Connected to Neon PostgreSQL database
GET /api/products
GET /api/comments
GET /api/orders
```

### Browser (http://localhost:5001/api/products):
```json
[
  {
    "id": 1,
    "name_he": "...",
    "name_en": "...",
    "price": 100,
    ...
  },
  ...
]
```

### Frontend (http://localhost:3000):
- ✅ Products display
- ✅ No console errors
- ✅ Images load
- ✅ Everything works

---

## If Something Doesn't Work

1. **Check backend console** - Look for error messages
2. **Check browser console** - Look for JavaScript errors
3. **Check `.env` file** - Verify all credentials are set
4. **Check Neon dashboard** - Verify tables exist and have data
5. **Check R2 dashboard** - Verify bucket exists and is accessible

Share the error messages and I can help fix them! 🔍

