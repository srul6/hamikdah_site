# 🧪 How to Test API Endpoints

## Quick Test Guide

After setting up Neon + Cloudflare R2, test that everything works.

---

## Prerequisites

1. **Backend is running**:
   ```bash
   cd backend
   npm start
   ```
   
   You should see:
   ```
   🔧 Backend running on port 5001
   ✅ Using Neon PostgreSQL + Cloudflare R2
   ```

2. **Environment variables set**:
   - `USE_NEON=true` in `backend/.env`
   - `NEON_DATABASE_URL` is set
   - `R2_*` credentials are set

---

## Test Methods

### Method 1: Browser (Easiest) ✅

Just open these URLs in your browser:

1. **Products**: http://localhost:5001/api/products
   - Should show JSON array of products

2. **Comments**: http://localhost:5001/api/comments
   - Should show JSON array of comments

3. **Orders**: http://localhost:5001/api/orders
   - Should show JSON: `{ success: true, orders: [...] }`

**What to look for:**
- ✅ JSON data appears (not error page)
- ✅ No CORS errors in browser console
- ✅ Data structure looks correct

---

### Method 2: Terminal (curl) ✅

Open a new terminal and run:

```bash
# Test products
curl http://localhost:5001/api/products

# Test comments
curl http://localhost:5001/api/comments

# Test orders
curl http://localhost:5001/api/orders
```

**Expected output:**
- JSON data printed to terminal
- No error messages

**Pretty print JSON:**
```bash
# Install jq (optional, for pretty JSON)
# macOS: brew install jq
# Then:
curl http://localhost:5001/api/products | jq
```

---

### Method 3: Postman/Insomnia ✅

1. **Download Postman**: https://www.postman.com/downloads/
   Or **Insomnia**: https://insomnia.rest/download

2. **Create GET requests**:
   - URL: `http://localhost:5001/api/products`
   - Method: GET
   - Click "Send"

3. **Check response**:
   - Status: 200 OK
   - Body: JSON array with products

---

### Method 4: Test File Upload ✅

**Using curl:**
```bash
curl -X POST http://localhost:5001/api/upload/image \
  -F "image=@/path/to/test-image.jpg" \
  -F "folder=products"
```

Replace `/path/to/test-image.jpg` with an actual image file.

**Expected response:**
```json
{
  "success": true,
  "message": "image uploaded successfully",
  "url": "https://...",
  "path": "products/123-abc.jpg"
}
```

**Using Postman:**
1. Method: POST
2. URL: `http://localhost:5001/api/upload/image`
3. Body → form-data
4. Key: `image` (type: File)
5. Key: `folder` (type: Text, value: `products`)
6. Select a test image file
7. Click "Send"

---

## Expected Results

### ✅ Success Indicators:

**Products Endpoint:**
```json
[
  {
    "id": 1,
    "name_he": "...",
    "name_en": "...",
    "price": 100,
    "homepageimage": "...",
    ...
  },
  ...
]
```

**Comments Endpoint:**
```json
[
  {
    "id": 1,
    "name_he": "...",
    "name_en": "...",
    "type": "text",
    ...
  },
  ...
]
```

**Orders Endpoint:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "customer_name": "...",
      "amount": 100,
      ...
    }
  ],
  "totalOrders": 5
}
```

---

## Common Errors & Solutions

### Error: "Cannot GET /api/products"

**Solution:**
- Check backend is running: `npm start` in backend folder
- Check port: Should be 5001 (or PORT from .env)
- Check route exists in `backend/src/app.js`

### Error: "Connection refused"

**Solution:**
- Backend not running - start it with `npm start`
- Wrong port - check `backend/.env` for PORT

### Error: "relation 'products' does not exist"

**Solution:**
- Tables not created in Neon
- Run `CREATE_TABLES_NEON.sql` in Neon SQL Editor
- Check `NEON_DATABASE_URL` in `.env`

### Error: "Invalid credentials" or "Authentication failed"

**Solution:**
- Check `NEON_DATABASE_URL` is correct
- Check `R2_*` credentials are set
- Verify `USE_NEON=true` in `.env`

### Error: CORS error in browser

**Solution:**
- Check `allowedOrigins` in `backend/src/app.js`
- Add your frontend URL if needed
- Restart backend after changes

### Empty arrays returned `[]`

**Solution:**
- Data not migrated yet
- Run migration: `node src/utils/migrateData.js`
- Check Neon database has data

---

## Complete Test Checklist

- [ ] Backend starts without errors
- [ ] `GET /api/products` returns products
- [ ] `GET /api/comments` returns comments
- [ ] `GET /api/orders` returns orders
- [ ] `POST /api/upload/image` uploads file successfully
- [ ] Uploaded file appears in Cloudflare R2
- [ ] No errors in backend console
- [ ] No CORS errors in browser console

---

## Advanced Testing

### Test with Frontend

1. **Start frontend**:
   ```bash
   cd frontend
   npm start
   ```

2. **Open**: http://localhost:3000

3. **Check**:
   - Products load on homepage
   - Images display correctly
   - Admin panel works
   - Can create/edit products

### Test Database Connection

```bash
# Using psql (if installed)
psql $NEON_DATABASE_URL

# Then run:
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM comments;
SELECT COUNT(*) FROM orders;
```

### Test R2 Storage

1. Upload a file via API
2. Check Cloudflare R2 Dashboard
3. Verify file appears in bucket
4. Try accessing public URL

---

## Quick Test Script

Create `test-endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5001"

echo "🧪 Testing API Endpoints..."
echo ""

echo "1. Testing Products..."
curl -s "$BASE_URL/api/products" | head -c 100
echo "..."
echo ""

echo "2. Testing Comments..."
curl -s "$BASE_URL/api/comments" | head -c 100
echo "..."
echo ""

echo "3. Testing Orders..."
curl -s "$BASE_URL/api/orders" | head -c 100
echo "..."
echo ""

echo "✅ Tests complete!"
```

Run it:
```bash
chmod +x test-endpoints.sh
./test-endpoints.sh
```

---

## Need Help?

If endpoints don't work:
1. Check backend console for errors
2. Verify `.env` file has all credentials
3. Check database connection
4. Verify tables exist in Neon
5. Check R2 bucket exists and is accessible

Good luck! 🚀

