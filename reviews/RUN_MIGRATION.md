# 🚀 Run Data Migration: Supabase → Neon

## Quick Start

### Step 1: Make Sure Tables Exist in Neon

1. Go to Neon Dashboard → SQL Editor
2. Copy and paste the entire contents of `backend/CREATE_TABLES_NEON.sql`
3. Click "Run"
4. Verify tables were created

### Step 2: Set Environment Variables

Make sure `backend/.env` has:

```env
    # Supabase (source)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Neon (destination)
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Step 3: Run Migration

```bash
cd backend
node src/utils/migrateData.js
```

---

## What the Script Does

✅ **Pulls ALL data from Supabase:**
- Products (all fields, including JSONB)
- Comments (all fields)
- Orders (all fields, including JSONB items)
- Cart (all items)

✅ **Preserves exact data:**
- All IDs (keeps same IDs)
- All timestamps (created_at, updated_at)
- All NULL values
- JSONB fields (colors, items) handled correctly
- Array fields (children_playing, desktop_hero_images) handled correctly

✅ **Smart error handling:**
- Continues even if one record fails
- Shows progress for large datasets
- Reports success/failure counts

---

## Expected Output

```
🚀 Starting data migration from Supabase to Neon...

============================================================
📋 Migration Plan:
   1. Products
   2. Comments
   3. Orders
   4. Cart
============================================================

🔍 Testing connections...

✅ Supabase connection: OK
✅ Neon connection: OK

📦 Migrating products...
   Found 15 products to migrate
   Progress: 10/15 products migrated
✅ Products: 15 migrated, 0 failed

💬 Migrating comments...
   Found 6 comments to migrate
✅ Comments: 6 migrated, 0 failed

📋 Migrating orders...
   Found 25 orders to migrate
   Progress: 10/25 orders migrated
   Progress: 20/25 orders migrated
✅ Orders: 25 migrated, 0 failed

🛒 Migrating cart...
   Found 3 cart items to migrate
✅ Cart: 3 items migrated, 0 failed

============================================================
✅ Migration completed successfully!
⏱️  Total time: 12.34 seconds
============================================================

📊 Next steps:
   1. Verify data in Neon Dashboard
   2. Test your API endpoints
   3. Update USE_NEON=true in production

🔌 Database connections closed
```

---

## Troubleshooting

### Error: "relation 'products' does not exist"

**Solution:**
- Run `CREATE_TABLES_NEON.sql` in Neon SQL Editor first
- Make sure all tables are created

### Error: "Connection refused" or "Cannot connect"

**Solution:**
- Check `NEON_DATABASE_URL` is correct
- Check `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Verify network connection

### Error: "Some records failed"

**Solution:**
- Check the error messages for specific record IDs
- Common issues:
  - Invalid JSON in JSONB fields
  - Missing required fields
  - Data type mismatches
- The script continues even if some records fail
- You can run it again (it uses ON CONFLICT, so safe to rerun)

### Empty tables after migration

**Solution:**
- Check Supabase has data first
- Verify you're using correct Supabase project
- Check connection to Supabase
- Look for error messages in output

---

## Verify Migration

### Check in Neon Dashboard:

1. Go to Neon Dashboard → SQL Editor
2. Run these queries:

```sql
-- Count products
SELECT COUNT(*) FROM products;

-- Count comments
SELECT COUNT(*) FROM comments;

-- Count orders
SELECT COUNT(*) FROM orders;

-- Count cart items
SELECT COUNT(*) FROM cart;

-- View sample product
SELECT * FROM products LIMIT 1;

-- View sample order
SELECT * FROM orders LIMIT 1;
```

### Compare with Supabase:

1. Go to Supabase Dashboard
2. Check counts match
3. Compare sample records

---

## Safe to Rerun

✅ **The script is safe to run multiple times:**
- Uses `ON CONFLICT` - updates existing records
- Won't create duplicates
- Can rerun if some records failed

---

## After Migration

1. ✅ Verify data in Neon Dashboard
2. ✅ Test API endpoints locally
3. ✅ Update `USE_NEON=true` in Render
4. ✅ Deploy and test production

Good luck! 🚀

