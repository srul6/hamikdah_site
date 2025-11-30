/**
 * Migration script to export data from Supabase and import to Neon
 * 
 * This script:
 * - Pulls ALL data from Supabase (products, comments, orders, cart)
 * - Preserves exact data structure, IDs, timestamps
 * - Handles JSONB fields correctly
 * - Preserves NULL values
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env
 * 2. Set NEON_DATABASE_URL in .env
 * 3. Make sure Neon tables are created (run CREATE_TABLES_NEON.sql)
 * 4. Run: node src/utils/migrateData.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

if (!process.env.NEON_DATABASE_URL) {
    console.error('❌ Error: NEON_DATABASE_URL must be set in .env');
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const neonPool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Test connections
async function testConnections() {
    console.log('🔍 Testing connections...\n');

    // Test Supabase
    try {
        const { data, error } = await supabase.from('products').select('id').limit(1);
        if (error) throw error;
        console.log('✅ Supabase connection: OK');
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        throw error;
    }

    // Test Neon
    try {
        await neonPool.query('SELECT 1');
        console.log('✅ Neon connection: OK\n');
    } catch (error) {
        console.error('❌ Neon connection failed:', error.message);
        throw error;
    }
}

// Helper function to handle JSON/array fields
function handleJsonField(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        try {
            // Try to parse if it's a JSON string
            return JSON.parse(value);
        } catch {
            // If not JSON, return as string
            return value;
        }
    }
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return value;
    return value;
}

// Helper function to handle array fields stored as text
function handleArrayField(value) {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            // If not JSON, treat as comma-separated string
            return value.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return value;
}

async function migrateProducts() {
    console.log('📦 Migrating products...');
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  No products found in Supabase');
            return;
        }

        console.log(`   Found ${data.length} products to migrate`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
            const product = data[i];
            try {
                // Handle JSONB fields
                const colors = handleJsonField(product.colors);
                const childrenPlaying = handleArrayField(product.children_playing);
                const desktopHeroImages = handleArrayField(product.desktop_hero_images);
                const extraImages = handleArrayField(product.extraimages);

                await neonPool.query(
                    `INSERT INTO products (
                        id, name_he, name_en, description_he, description_en,
                        price, quantity, homepageimage, extraimages,
                        buildingtime, pieces, height, length, width,
                        recommendedage, children_playing, desktop_hero_images, colors,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                    ON CONFLICT (id) DO UPDATE SET
                        name_he = EXCLUDED.name_he,
                        name_en = EXCLUDED.name_en,
                        description_he = EXCLUDED.description_he,
                        description_en = EXCLUDED.description_en,
                        price = EXCLUDED.price,
                        quantity = EXCLUDED.quantity,
                        homepageimage = EXCLUDED.homepageimage,
                        extraimages = EXCLUDED.extraimages,
                        buildingtime = EXCLUDED.buildingtime,
                        pieces = EXCLUDED.pieces,
                        height = EXCLUDED.height,
                        length = EXCLUDED.length,
                        width = EXCLUDED.width,
                        recommendedage = EXCLUDED.recommendedage,
                        children_playing = EXCLUDED.children_playing,
                        desktop_hero_images = EXCLUDED.desktop_hero_images,
                        colors = EXCLUDED.colors,
                        updated_at = EXCLUDED.updated_at`,
                    [
                        product.id,
                        product.name_he || null,
                        product.name_en || null,
                        product.description_he || null,
                        product.description_en || null,
                        product.price || null,
                        product.quantity || 0,
                        product.homepageimage || null,
                        Array.isArray(extraImages) ? JSON.stringify(extraImages) : extraImages,
                        product.buildingtime || null,
                        product.pieces || null,
                        product.height || null,
                        product.length || null,
                        product.width || null,
                        product.recommendedage || null,
                        Array.isArray(childrenPlaying) ? JSON.stringify(childrenPlaying) : childrenPlaying,
                        Array.isArray(desktopHeroImages) ? JSON.stringify(desktopHeroImages) : desktopHeroImages,
                        colors ? JSON.stringify(colors) : '[]',
                        product.created_at || new Date(),
                        product.updated_at || new Date()
                    ]
                );
                successCount++;
                if ((i + 1) % 10 === 0) {
                    console.log(`   Progress: ${i + 1}/${data.length} products migrated`);
                }
            } catch (err) {
                errorCount++;
                console.error(`   ❌ Error migrating product ID ${product.id}:`, err.message);
            }
        }
        console.log(`✅ Products: ${successCount} migrated, ${errorCount} failed`);
    } catch (error) {
        console.error('❌ Error migrating products:', error);
        throw error;
    }
}

async function migrateComments() {
    console.log('💬 Migrating comments...');
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  No comments found in Supabase');
            return;
        }

        console.log(`   Found ${data.length} comments to migrate`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
            const comment = data[i];
            try {
                await neonPool.query(
                    `INSERT INTO comments (
                        id, name_he, name_en, text_he, text_en,
                        type, video_url, image_url, rating,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO UPDATE SET
                        name_he = EXCLUDED.name_he,
                        name_en = EXCLUDED.name_en,
                        text_he = EXCLUDED.text_he,
                        text_en = EXCLUDED.text_en,
                        type = EXCLUDED.type,
                        video_url = EXCLUDED.video_url,
                        image_url = EXCLUDED.image_url,
                        rating = EXCLUDED.rating,
                        updated_at = EXCLUDED.updated_at`,
                    [
                        comment.id,
                        comment.name_he || null,
                        comment.name_en || null,
                        comment.text_he || null,
                        comment.text_en || null,
                        comment.type || 'text',
                        comment.video_url || null,
                        comment.image_url || null,
                        comment.rating || 5,
                        comment.created_at || new Date(),
                        comment.updated_at || new Date()
                    ]
                );
                successCount++;
            } catch (err) {
                errorCount++;
                console.error(`   ❌ Error migrating comment ID ${comment.id}:`, err.message);
            }
        }
        console.log(`✅ Comments: ${successCount} migrated, ${errorCount} failed`);
    } catch (error) {
        console.error('❌ Error migrating comments:', error);
        throw error;
    }
}

async function migrateOrders() {
    console.log('📋 Migrating orders...');
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  No orders found in Supabase');
            return;
        }

        console.log(`   Found ${data.length} orders to migrate`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
            const order = data[i];
            try {
                // Handle JSONB items field
                const items = handleJsonField(order.items);

                await neonPool.query(
                    `INSERT INTO orders (
                        id, form_id, document_id, payment_id, status, amount, currency,
                        customer_name, customer_email, customer_phone,
                        customer_street, customer_house_number, customer_apartment_number,
                        customer_floor, customer_city, customer_country,
                        items, dedication, purchase_timestamp, is_shipped,
                        created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
                    ON CONFLICT (id) DO UPDATE SET
                        form_id = EXCLUDED.form_id,
                        document_id = EXCLUDED.document_id,
                        payment_id = EXCLUDED.payment_id,
                        status = EXCLUDED.status,
                        amount = EXCLUDED.amount,
                        currency = EXCLUDED.currency,
                        customer_name = EXCLUDED.customer_name,
                        customer_email = EXCLUDED.customer_email,
                        customer_phone = EXCLUDED.customer_phone,
                        customer_street = EXCLUDED.customer_street,
                        customer_house_number = EXCLUDED.customer_house_number,
                        customer_apartment_number = EXCLUDED.customer_apartment_number,
                        customer_floor = EXCLUDED.customer_floor,
                        customer_city = EXCLUDED.customer_city,
                        customer_country = EXCLUDED.customer_country,
                        items = EXCLUDED.items,
                        dedication = EXCLUDED.dedication,
                        purchase_timestamp = EXCLUDED.purchase_timestamp,
                        is_shipped = EXCLUDED.is_shipped,
                        updated_at = EXCLUDED.updated_at`,
                    [
                        order.id,
                        order.form_id || null,
                        order.document_id || null,
                        order.payment_id || null,
                        order.status || 'pending',
                        order.amount || null,
                        order.currency || 'ILS',
                        order.customer_name || null,
                        order.customer_email || null,
                        order.customer_phone || null,
                        order.customer_street || null,
                        order.customer_house_number || null,
                        order.customer_apartment_number || null,
                        order.customer_floor || null,
                        order.customer_city || null,
                        order.customer_country || null,
                        items ? JSON.stringify(items) : '[]',
                        order.dedication || null,
                        order.purchase_timestamp || null,
                        order.is_shipped !== undefined ? order.is_shipped : false,
                        order.created_at || new Date(),
                        order.updated_at || new Date()
                    ]
                );
                successCount++;
                if ((i + 1) % 10 === 0) {
                    console.log(`   Progress: ${i + 1}/${data.length} orders migrated`);
                }
            } catch (err) {
                errorCount++;
                console.error(`   ❌ Error migrating order ID ${order.id}:`, err.message);
            }
        }
        console.log(`✅ Orders: ${successCount} migrated, ${errorCount} failed`);
    } catch (error) {
        console.error('❌ Error migrating orders:', error);
        throw error;
    }
}

async function migrateCart() {
    console.log('🛒 Migrating cart...');
    try {
        const { data, error } = await supabase
            .from('cart')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            console.log('⚠️  No cart items found in Supabase');
            return;
        }

        console.log(`   Found ${data.length} cart items to migrate`);

        // Clear existing cart in Neon first
        await neonPool.query('DELETE FROM cart');

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < data.length; i++) {
            const cartItem = data[i];
            try {
                await neonPool.query(
                    `INSERT INTO cart (
                        id, product_id, quantity, price, created_at
                    ) VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                        product_id = EXCLUDED.product_id,
                        quantity = EXCLUDED.quantity,
                        price = EXCLUDED.price`,
                    [
                        cartItem.id,
                        cartItem.product_id || null,
                        cartItem.quantity || 1,
                        cartItem.price || null,
                        cartItem.created_at || new Date()
                    ]
                );
                successCount++;
            } catch (err) {
                errorCount++;
                console.error(`   ❌ Error migrating cart item ID ${cartItem.id}:`, err.message);
            }
        }
        console.log(`✅ Cart: ${successCount} items migrated, ${errorCount} failed`);
    } catch (error) {
        console.error('❌ Error migrating cart:', error);
        // Cart migration failure is not critical, continue
    }
}

async function main() {
    console.log('🚀 Starting data migration from Supabase to Neon...\n');
    console.log('='.repeat(60));
    console.log('📋 Migration Plan:');
    console.log('   1. Products');
    console.log('   2. Comments');
    console.log('   3. Orders');
    console.log('   4. Cart');
    console.log('='.repeat(60));
    console.log('');

    const startTime = Date.now();

    try {
        // Test connections first
        await testConnections();

        // Migrate data
        await migrateProducts();
        console.log('');
        await migrateComments();
        console.log('');
        await migrateOrders();
        console.log('');
        await migrateCart();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('');
        console.log('='.repeat(60));
        console.log('✅ Migration completed successfully!');
        console.log(`⏱️  Total time: ${duration} seconds`);
        console.log('='.repeat(60));
        console.log('');
        console.log('📊 Next steps:');
        console.log('   1. Verify data in Neon Dashboard');
        console.log('   2. Test your API endpoints');
        console.log('   3. Update USE_NEON=true in production');
        console.log('');

    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('❌ Migration failed:', error.message);
        console.error('='.repeat(60));
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        await neonPool.end();
        console.log('🔌 Database connections closed');
    }
}

if (require.main === module) {
    main();
}

module.exports = { migrateProducts, migrateComments, migrateOrders, migrateCart };

