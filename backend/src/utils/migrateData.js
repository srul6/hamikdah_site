/**
 * Migration script to export data from Supabase and import to Neon
 * 
 * Usage:
 * 1. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env
 * 2. Set NEON_DATABASE_URL in .env
 * 3. Run: node src/utils/migrateData.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const neonPool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateProducts() {
    console.log('📦 Migrating products...');
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');

        if (error) throw error;

        for (const product of data) {
            await neonPool.query(
                `INSERT INTO products (
                    id, name_he, name_en, description_he, description_en,
                    price, quantity, homepageimage, extraimages,
                    buildingtime, pieces, height, length, width,
                    recommendedage, children_playing, desktop_hero_images, colors
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
                    updated_at = NOW()`,
                [
                    product.id,
                    product.name_he,
                    product.name_en,
                    product.description_he,
                    product.description_en,
                    product.price,
                    product.quantity,
                    product.homepageimage,
                    product.extraimages,
                    product.buildingtime,
                    product.pieces,
                    product.height,
                    product.length,
                    product.width,
                    product.recommendedage,
                    product.children_playing,
                    product.desktop_hero_images,
                    JSON.stringify(product.colors || [])
                ]
            );
        }
        console.log(`✅ Migrated ${data.length} products`);
    } catch (error) {
        console.error('❌ Error migrating products:', error);
    }
}

async function migrateComments() {
    console.log('💬 Migrating comments...');
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*');

        if (error) throw error;

        for (const comment of data) {
            await neonPool.query(
                `INSERT INTO comments (
                    id, name_he, name_en, text_he, text_en,
                    type, video_url, image_url, rating
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (id) DO UPDATE SET
                    name_he = EXCLUDED.name_he,
                    name_en = EXCLUDED.name_en,
                    text_he = EXCLUDED.text_he,
                    text_en = EXCLUDED.text_en,
                    type = EXCLUDED.type,
                    video_url = EXCLUDED.video_url,
                    image_url = EXCLUDED.image_url,
                    rating = EXCLUDED.rating,
                    updated_at = NOW()`,
                [
                    comment.id,
                    comment.name_he,
                    comment.name_en,
                    comment.text_he,
                    comment.text_en,
                    comment.type,
                    comment.video_url,
                    comment.image_url,
                    comment.rating
                ]
            );
        }
        console.log(`✅ Migrated ${data.length} comments`);
    } catch (error) {
        console.error('❌ Error migrating comments:', error);
    }
}

async function migrateOrders() {
    console.log('📋 Migrating orders...');
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*');

        if (error) throw error;

        for (const order of data) {
            await neonPool.query(
                `INSERT INTO orders (
                    id, form_id, document_id, payment_id, status, amount, currency,
                    customer_name, customer_email, customer_phone,
                    customer_street, customer_house_number, customer_apartment_number,
                    customer_floor, customer_city, customer_country,
                    items, dedication, purchase_timestamp, is_shipped
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
                    updated_at = NOW()`,
                [
                    order.id,
                    order.form_id,
                    order.document_id,
                    order.payment_id,
                    order.status,
                    order.amount,
                    order.currency,
                    order.customer_name,
                    order.customer_email,
                    order.customer_phone,
                    order.customer_street,
                    order.customer_house_number,
                    order.customer_apartment_number,
                    order.customer_floor,
                    order.customer_city,
                    order.customer_country,
                    JSON.stringify(order.items || []),
                    order.dedication,
                    order.purchase_timestamp,
                    order.is_shipped || false
                ]
            );
        }
        console.log(`✅ Migrated ${data.length} orders`);
    } catch (error) {
        console.error('❌ Error migrating orders:', error);
    }
}

async function main() {
    console.log('🚀 Starting data migration from Supabase to Neon...\n');

    try {
        await migrateProducts();
        await migrateComments();
        await migrateOrders();

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await neonPool.end();
    }
}

if (require.main === module) {
    main();
}

module.exports = { migrateProducts, migrateComments, migrateOrders };

