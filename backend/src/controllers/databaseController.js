const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});

/** Paid / completed purchase statuses stored by the payment webhook */
const PAID_ORDER_STATUSES = new Set(['completed', 'paid', 'approved']);

let ordersConversionSchemaReady = null;

/**
 * Ensure ads conversion / checkout-session columns exist (idempotent).
 * checkout_session_id is the public orderId from success URLs (Date.now() at checkout).
 */
function ensureOrdersConversionSchema() {
    if (!ordersConversionSchemaReady) {
        ordersConversionSchemaReady = (async () => {
            await pool.query(`
                ALTER TABLE orders
                    ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;
            `);
            await pool.query(`
                ALTER TABLE orders
                    ADD COLUMN IF NOT EXISTS ads_conversion_sent BOOLEAN NOT NULL DEFAULT false;
            `);
            await pool.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_session_id_uidx
                ON orders (checkout_session_id)
                WHERE checkout_session_id IS NOT NULL;
            `);
        })().catch((err) => {
            ordersConversionSchemaReady = null;
            throw err;
        });
    }
    return ordersConversionSchemaReady;
}

function normalizeCheckoutSessionId(value) {
    if (value == null || value === '') return null;
    return String(value);
}

/** Ensure extraImages is always an array of strings (for storage and API). */
function normalizeExtraImagesList(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.filter(x => typeof x === 'string' && x.trim()).map(s => s.trim());
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

/**
 * Normalize media fields before saving to DB.
 * Accepts arrays, JSON-strings, comma-separated strings, or corrupted/nested URL strings.
 * Returns an array of clean strings, with cache-busting params stripped.
 */
function normalizeMediaListForDb(value) {
    const out = [];

    const stripCacheBuster = (s) => {
        if (typeof s !== 'string') return '';
        // remove only our cache-busting param (keep other query params if any)
        return s.replace(/([?&])t=\d+(?=&|$)/g, '$1').replace(/[?&]$/g, '');
    };

    const cleanOne = (raw) => {
        if (raw == null) return [];
        if (typeof raw !== 'string') return [];

        let s = raw.trim();
        if (!s) return [];

        // Remove wrapping quotes (handles strings like "\"https://...\"" )
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.slice(1, -1).trim();
        }

        // Try to extract real URLs from corrupted strings like:
        // https://cdn.../["https://cdn.../file.jpg"?t=... or https://cdn.../"https://cdn.../file.jpg"
        const urlMatches = s.match(/https?:\/\/[^\s"'\\\]\[]+/g);
        if (urlMatches && urlMatches.length > 0) {
            return urlMatches
                .map(u => stripCacheBuster(u).trim())
                .map(u => u.replace(/\\+/g, '')) // remove stray escapes
                .filter(Boolean);
        }

        // If it's JSON, try to parse repeatedly (handles nested stringification)
        if (s.startsWith('[') || s.startsWith('{') || s.startsWith('"')) {
            let cur = s;
            for (let i = 0; i < 3; i++) {
                try {
                    const parsed = JSON.parse(cur);
                    if (Array.isArray(parsed)) {
                        return parsed.flatMap(x => cleanOne(String(x)));
                    }
                    if (typeof parsed === 'string') {
                        cur = parsed;
                        continue;
                    }
                    break;
                } catch (_) {
                    break;
                }
            }
        }

        // Comma-separated fallback
        if (s.includes(',')) {
            return s.split(',').flatMap(part => cleanOne(part));
        }

        s = stripCacheBuster(s).trim().replace(/\\+/g, '');
        return s ? [s] : [];
    };

    if (Array.isArray(value)) {
        value.forEach(v => out.push(...cleanOne(typeof v === 'string' ? v : JSON.stringify(v))));
    } else {
        out.push(...cleanOne(typeof value === 'string' ? value : JSON.stringify(value)));
    }

    // de-dupe while preserving order
    const seen = new Set();
    return out.filter(s => {
        if (!s || seen.has(s)) return false;
        seen.add(s);
        return true;
    });
}

/** Ensure each color has extraImages as an array before saving to DB. */
function normalizeColorsForDb(colors) {
    if (!Array.isArray(colors)) return [];
    return colors.map(c => ({
        ...c,
        extraImages: normalizeExtraImagesList(c && c.extraImages)
    }));
}

class DatabaseController {
    // ===== PRODUCTS =====

    async getAllProducts() {
        try {
            const result = await pool.query(
                'SELECT * FROM products ORDER BY id ASC'
            );
            return result.rows || [];
        } catch (error) {
            console.error('❌ Error fetching products from Neon:', error);
            console.error('   Error message:', error.message);
            console.error('   Error code:', error.code);
            console.error('   Error detail:', error.detail);
            // Re-throw so productController can handle it properly
            throw error;
        }
    }

    async getProductById(id) {
        try {
            // Validate ID - handle string IDs from URL params
            if (!id) {
                throw new Error('Product ID is required');
            }

            // Convert to number (handles both string "1" and number 1)
            const numericId = parseInt(id, 10);
            if (isNaN(numericId) || numericId <= 0) {
                throw new Error(`Invalid product ID: ${id}`);
            }

            const result = await pool.query(
                'SELECT * FROM products WHERE id = $1',
                [numericId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error fetching product:', error);
            console.error('   Product ID:', id);
            console.error('   Error message:', error.message);
            throw error;
        }
    }

    async createProduct(productData) {
        try {
            // Handle array fields - convert to JSON string if needed
            const childrenPlayingArr = normalizeMediaListForDb(productData.children_playing);
            const desktopHeroImagesArr = normalizeMediaListForDb(productData.desktop_hero_images);
            const extraImagesArr = normalizeMediaListForDb(productData.extraimages);

            const childrenPlaying = childrenPlayingArr.length ? JSON.stringify(childrenPlayingArr) : null;
            const desktopHeroImages = desktopHeroImagesArr.length ? JSON.stringify(desktopHeroImagesArr) : null;
            const extraImages = extraImagesArr.length ? JSON.stringify(extraImagesArr) : null;

            const result = await pool.query(
                `INSERT INTO products (
                    name_he, name_en, description_he, description_en, 
                    price, quantity, homepageimage, extraimages,
                    buildingtime, pieces, height, length, width,
                    recommendedage, children_playing, desktop_hero_images, colors
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING *`,
                [
                    productData.name_he || null,
                    productData.name_en || null,
                    productData.description_he || null,
                    productData.description_en || null,
                    productData.price || null,
                    productData.quantity || 0,
                    productData.homepageimage || null,
                    extraImages || null,
                    (productData.buildingtime ?? productData.buildingTime) || null,
                    productData.pieces || null,
                    productData.height || null,
                    productData.length || null,
                    productData.width || null,
                    (productData.recommendedage ?? productData.recommendedAge) || null,
                    childrenPlaying || null,
                    desktopHeroImages || null,
                    JSON.stringify(normalizeColorsForDb(productData.colors || []))
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    async updateProduct(id, updateData) {
        try {
            console.log('📝 Updating product:', id, 'with data:', updateData);

            // Build dynamic update query
            const fields = [];
            const values = [];
            let paramIndex = 1;

            // Whitelist of allowed updatable fields (API & DB column names)
            const allowedProductKeys = new Set([
                // DB column names
                'name_he',
                'name_en',
                'description_he',
                'description_en',
                'price',
                'quantity',
                'homepageimage',
                'extraimages',
                'buildingtime',
                'pieces',
                'height',
                'length',
                'width',
                'recommendedage',
                'children_playing',
                'desktop_hero_images',
                'colors',
                // camelCase variants used by API/frontend
                'buildingTime',
                'recommendedAge',
                'childrenPlaying',
                'desktopHeroImages',
                'extraImages'
            ]);

            // Map camelCase from frontend to DB column names (lowercase)
            const dbKey = (key) => {
                if (key === 'buildingTime') return 'buildingtime';
                if (key === 'recommendedAge') return 'recommendedage';
                if (key === 'childrenPlaying') return 'children_playing';
                if (key === 'desktopHeroImages') return 'desktop_hero_images';
                if (key === 'extraImages') return 'extraimages';
                return key;
            };
            Object.keys(updateData).forEach(key => {
                // Skip keys that are not explicitly allowed
                if (!allowedProductKeys.has(key)) {
                    return;
                }
                if (updateData[key] !== undefined) {
                    const mappedKey = dbKey(key);
                    fields.push(`${mappedKey} = $${paramIndex}`);
                    // Handle JSON/array fields
                    if (key === 'colors' && Array.isArray(updateData[key])) {
                        values.push(JSON.stringify(normalizeColorsForDb(updateData[key])));
                    } else if (mappedKey === 'children_playing' || mappedKey === 'desktop_hero_images' || mappedKey === 'extraimages') {
                        const cleaned = normalizeMediaListForDb(updateData[key]);
                        values.push(cleaned.length ? JSON.stringify(cleaned) : null);
                    } else {
                        values.push(updateData[key]);
                    }
                    paramIndex++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);
            const query = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

            const result = await pool.query(query, values);

            console.log('✅ Product updated successfully:', result.rows[0]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error updating product:', error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            await pool.query('DELETE FROM products WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // ===== SITE FEEDBACK =====

    async ensureSiteFeedbackTable() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS site_feedback (
                id SERIAL PRIMARY KEY,
                client_id TEXT UNIQUE NOT NULL,
                message TEXT NOT NULL,
                language TEXT NULL,
                email TEXT NULL,
                ip TEXT NULL,
                user_agent TEXT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
    }

    /**
     * Creates a feedback row.
     * Returns inserted row on success, or null if client already submitted.
     */
    async createSiteFeedback({ clientId, message, language, email, ip, userAgent }) {
        await this.ensureSiteFeedbackTable();

        const result = await pool.query(
            `INSERT INTO site_feedback (client_id, message, language, email, ip, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (client_id) DO NOTHING
             RETURNING *`,
            [clientId, message, language || null, email || null, ip || null, userAgent || null]
        );

        return result.rows[0] || null;
    }

    // ===== CART =====

    async getCart() {
        try {
            const result = await pool.query('SELECT * FROM cart');
            return result.rows || [];
        } catch (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
    }

    async saveCart(cartItems) {
        try {
            // Validate input
            if (!Array.isArray(cartItems)) {
                throw new Error('cartItems must be an array');
            }

            // Clear existing cart
            await pool.query('DELETE FROM cart');

            // Insert new cart items (only if there are items)
            if (cartItems.length > 0) {
                const values = cartItems.map((item, index) => {
                    const base = index * 3;
                    return `($${base + 1}, $${base + 2}, $${base + 3})`;
                }).join(', ');

                const params = cartItems.flatMap(item => [
                    item.product_id || null,
                    item.quantity || 1,
                    item.price || null
                ]);

                await pool.query(
                    `INSERT INTO cart (product_id, quantity, price) VALUES ${values}`,
                    params
                );
            }

            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            throw error;
        }
    }

    // ===== COMMENTS =====

    async getAllComments() {
        try {
            const result = await pool.query(
                'SELECT * FROM comments ORDER BY id ASC'
            );
            return result.rows || [];
        } catch (error) {
            console.error('❌ Error fetching comments:', error);
            throw error;
        }
    }

    async getCommentById(id) {
        try {
            const result = await pool.query(
                'SELECT * FROM comments WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error fetching comment:', error);
            throw error;
        }
    }

    async createComment(commentData) {
        try {
            const result = await pool.query(
                `INSERT INTO comments (name_he, name_en, text_he, text_en, type, video_url, image_url, rating)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *`,
                [
                    commentData.name_he,
                    commentData.name_en,
                    commentData.text_he,
                    commentData.text_en,
                    commentData.type,
                    commentData.video_url,
                    commentData.image_url,
                    commentData.rating
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error creating comment:', error);
            throw error;
        }
    }

    async updateComment(id, commentData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            // Whitelist of allowed updatable comment fields
            const allowedCommentKeys = new Set([
                'name_he',
                'name_en',
                'text_he',
                'text_en',
                'type',
                'video_url',
                'image_url',
                'rating'
            ]);

            Object.keys(commentData).forEach(key => {
                // Skip keys that are not explicitly allowed
                if (!allowedCommentKeys.has(key)) {
                    return;
                }
                if (commentData[key] !== undefined) {
                    fields.push(`${key} = $${paramIndex}`);
                    values.push(commentData[key]);
                    paramIndex++;
                }
            });

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);
            const query = `UPDATE comments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error updating comment:', error);
            throw error;
        }
    }

    async deleteComment(id) {
        try {
            await pool.query('DELETE FROM comments WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            throw error;
        }
    }

    // ===== PRODUCT QUANTITY =====

    async reduceProductQuantity(productId, quantityToReduce) {
        try {
            console.log(`🔄 Reducing quantity for product ${productId} by ${quantityToReduce}`);

            const result = await pool.query(
                'UPDATE products SET quantity = GREATEST(0, quantity - $1) WHERE id = $2 RETURNING quantity',
                [quantityToReduce, productId]
            );

            if (result.rows.length === 0) {
                throw new Error(`Product ${productId} not found`);
            }

            const newQuantity = result.rows[0].quantity;

            console.log(`✅ Successfully reduced product ${productId} quantity to ${newQuantity}`);
            return { success: true, newQuantity };
        } catch (error) {
            console.error('❌ Error reducing product quantity:', error);
            throw error;
        }
    }

    // ===== ORDERS =====

    async getAllOrders() {
        try {
            const result = await pool.query(
                'SELECT * FROM orders ORDER BY created_at DESC'
            );
            console.log(`✅ Fetched ${result.rows.length} orders from database`);
            return result.rows || [];
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            console.error('   Error message:', error.message);
            console.error('   Error code:', error.code);
            console.error('   Error detail:', error.detail);
            throw error;
        }
    }

    async getOrderById(id) {
        try {
            const result = await pool.query(
                'SELECT * FROM orders WHERE id = $1',
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error fetching order:', error);
            throw error;
        }
    }

    async getOrderByFormId(formId) {
        try {
            const result = await pool.query(
                'SELECT * FROM orders WHERE form_id = $1',
                [formId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error fetching order by form_id:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            await ensureOrdersConversionSchema();

            let parsedTimestamp = new Date();

            if (orderData.purchaseTimestamp) {
                try {
                    const timestampStr = orderData.purchaseTimestamp;
                    const [datePart, timePart] = timestampStr.split(', ');
                    const [day, month, year] = datePart.split('.');
                    const [hours, minutes, seconds] = timePart.split(':');

                    parsedTimestamp = new Date(
                        parseInt(year),
                        parseInt(month) - 1,
                        parseInt(day),
                        parseInt(hours),
                        parseInt(minutes),
                        parseInt(seconds)
                    );

                    console.log(`📅 Parsed timestamp: ${timestampStr} → ${parsedTimestamp.toISOString()}`);
                } catch (parseError) {
                    console.error('⚠️  Failed to parse purchase timestamp, using current time:', parseError);
                }
            }

            // Validate required fields
            if (!orderData.customerInfo) {
                throw new Error('customerInfo is required');
            }
            if (!orderData.items || !Array.isArray(orderData.items)) {
                throw new Error('items must be an array');
            }

            const checkoutSessionId = normalizeCheckoutSessionId(orderData.checkoutSessionId);

            // First, check if order with this form_id already exists
            const existingOrder = await pool.query(
                'SELECT id FROM orders WHERE form_id = $1',
                [orderData.formId]
            );

            if (existingOrder.rows.length > 0) {
                // Order exists, update it (do not reset ads_conversion_sent)
                console.log('ℹ️  Order with form_id already exists, updating...');
                const updateResult = await pool.query(
                    `UPDATE orders SET
                        document_id = $1,
                        payment_id = $2,
                        status = $3,
                        amount = $4,
                        currency = $5,
                        customer_name = $6,
                        customer_email = $7,
                        customer_phone = $8,
                        customer_street = $9,
                        customer_house_number = $10,
                        customer_apartment_number = $11,
                        customer_floor = $12,
                        customer_city = $13,
                        customer_country = $14,
                        items = $15,
                        marketing_consent = $16,
                        dedication = $17,
                        purchase_timestamp = $18,
                        checkout_session_id = COALESCE($19, checkout_session_id),
                        updated_at = NOW()
                    WHERE form_id = $20
                    RETURNING *`,
                    [
                        orderData.documentId || null,
                        orderData.paymentId || null,
                        orderData.status || 'pending',
                        orderData.amount || null,
                        orderData.currency || 'ILS',
                        orderData.customerInfo.name || null,
                        orderData.customerInfo.email || null,
                        orderData.customerInfo.phone || null,
                        orderData.customerInfo.street || null,
                        orderData.customerInfo.houseNumber || null,
                        orderData.customerInfo.apartmentNumber || null,
                        orderData.customerInfo.floor || null,
                        orderData.customerInfo.city || null,
                        orderData.customerInfo.country || null,
                        JSON.stringify(orderData.items || []),
                        orderData.marketingConsent || false,
                        orderData.dedication || null,
                        parsedTimestamp,
                        checkoutSessionId,
                        orderData.formId
                    ]
                );
                console.log('✅ Order updated successfully. Order ID:', updateResult.rows[0].id);
                return updateResult.rows[0];
            }

            // Order doesn't exist, create new one
            // Use ON CONFLICT to handle duplicate form_id gracefully (in case of race condition)
            const result = await pool.query(
                `INSERT INTO orders (
                    form_id, document_id, payment_id, status, amount, currency,
                    customer_name, customer_email, customer_phone,
                    customer_street, customer_house_number, customer_apartment_number,
                    customer_floor, customer_city, customer_country,
                    items, marketing_consent, dedication, purchase_timestamp,
                    checkout_session_id, ads_conversion_sent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, false)
                ON CONFLICT (form_id) 
                DO UPDATE SET
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
                    marketing_consent = EXCLUDED.marketing_consent,
                    dedication = EXCLUDED.dedication,
                    purchase_timestamp = EXCLUDED.purchase_timestamp,
                    checkout_session_id = COALESCE(EXCLUDED.checkout_session_id, orders.checkout_session_id),
                    updated_at = NOW()
                RETURNING *`,
                [
                    orderData.formId || null,
                    orderData.documentId || null,
                    orderData.paymentId || null,
                    orderData.status || 'pending',
                    orderData.amount || null,
                    orderData.currency || 'ILS',
                    orderData.customerInfo.name || null,
                    orderData.customerInfo.email || null,
                    orderData.customerInfo.phone || null,
                    orderData.customerInfo.street || null,
                    orderData.customerInfo.houseNumber || null,
                    orderData.customerInfo.apartmentNumber || null,
                    orderData.customerInfo.floor || null,
                    orderData.customerInfo.city || null,
                    orderData.customerInfo.country || null,
                    JSON.stringify(orderData.items || []),
                    orderData.marketingConsent || false,
                    orderData.dedication || null,
                    parsedTimestamp,
                    checkoutSessionId
                ]
            );

            console.log('✅ Order created successfully. Order ID:', result.rows[0].id);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error creating order:', error);
            console.error('   Error message:', error.message);
            console.error('   Error code:', error.code);
            console.error('   Error detail:', error.detail);
            console.error('   Error hint:', error.hint);
            console.error('   Order data that failed:', JSON.stringify(orderData, null, 2));
            throw error;
        }
    }

    /**
     * Public ecommerce summary for a paid order (by checkout_session_id / success URL orderId).
     * Read-only — does not touch ads_conversion_sent. No PII returned.
     *
     * @returns {{ notFound: true } | { unpaid: true, status: string } | { paid: true, value, currency, transactionId, items }}
     */
    async getPaidOrderPurchaseSummary(checkoutSessionId) {
        await ensureOrdersConversionSchema();
        const sessionId = normalizeCheckoutSessionId(checkoutSessionId);
        if (!sessionId) {
            return { notFound: true };
        }

        const existing = await pool.query(
            `SELECT amount, currency, checkout_session_id, status, items
             FROM orders
             WHERE checkout_session_id::text = $1`,
            [sessionId]
        );

        if (!existing.rows[0]) {
            return { notFound: true };
        }

        const order = existing.rows[0];
        const status = String(order.status || '').toLowerCase();
        if (!PAID_ORDER_STATUSES.has(status)) {
            return { unpaid: true, status: order.status };
        }

        let items = order.items;
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch {
                items = [];
            }
        }
        if (!Array.isArray(items)) {
            items = [];
        }

        return {
            paid: true,
            value: Number(order.amount),
            currency: order.currency || 'ILS',
            transactionId: String(order.checkout_session_id),
            items
        };
    }

    /**
     * Atomically claim Google Ads conversion for a paid order looked up by public
     * checkout_session_id (the orderId in success URLs).
     *
     * @returns {{ notFound: true } | { unpaid: true, status: string } | { alreadySent: true } | { alreadySent: false, value, currency, transactionId }}
     * Diagnostic fields (logging only): dbStatus, adsConversionSentBefore/After, rowUpdated
     */
    async markAdsConversionSent(checkoutSessionId, { requestId } = {}) {
        const tag = requestId?.tag || '[Ads Conversion]';
        const timestamp = new Date().toISOString();
        const isDev = process.env.NODE_ENV === 'development';
        const devLog = (...args) => {
            if (isDev) {
                console.info(...args);
            }
        };

        devLog(`${tag} markAdsConversionSent entered`, {
            timestamp,
            checkoutSessionId,
            requestId: requestId?.uuid || null
        });

        await ensureOrdersConversionSchema();
        const sessionId = normalizeCheckoutSessionId(checkoutSessionId);
        if (!sessionId) {
            devLog(`${tag} markAdsConversionSent — empty session id → notFound`, {
                timestamp: new Date().toISOString(),
                checkoutSessionId
            });
            return {
                notFound: true,
                dbStatus: null,
                adsConversionSentBefore: null,
                adsConversionSentAfter: null,
                rowUpdated: false
            };
        }

        const existing = await pool.query(
            `SELECT id, status, amount, currency, checkout_session_id, ads_conversion_sent
             FROM orders
             WHERE checkout_session_id::text = $1`,
            [sessionId]
        );

        if (!existing.rows[0]) {
            devLog(`${tag} markAdsConversionSent — no row for checkout_session_id`, {
                timestamp: new Date().toISOString(),
                sessionId,
                dbStatus: null,
                adsConversionSentBefore: null,
                adsConversionSentAfter: null,
                rowUpdated: false
            });
            return {
                notFound: true,
                dbStatus: null,
                adsConversionSentBefore: null,
                adsConversionSentAfter: null,
                rowUpdated: false
            };
        }

        const order = existing.rows[0];
        const adsBefore = Boolean(order.ads_conversion_sent);
        const status = String(order.status || '').toLowerCase();

        devLog(`${tag} markAdsConversionSent — DB row found`, {
            timestamp: new Date().toISOString(),
            sessionId,
            orderPk: order.id,
            dbStatus: order.status,
            adsConversionSentBefore: adsBefore,
            amount: order.amount,
            currency: order.currency
        });

        if (!PAID_ORDER_STATUSES.has(status)) {
            devLog(`${tag} markAdsConversionSent — unpaid, refusing claim`, {
                timestamp: new Date().toISOString(),
                sessionId,
                dbStatus: order.status,
                adsConversionSentBefore: adsBefore,
                adsConversionSentAfter: adsBefore,
                rowUpdated: false
            });
            return {
                unpaid: true,
                status: order.status,
                dbStatus: order.status,
                adsConversionSentBefore: adsBefore,
                adsConversionSentAfter: adsBefore,
                rowUpdated: false
            };
        }

        // Atomic check-and-set — only one concurrent caller wins
        const claimed = await pool.query(
            `UPDATE orders
             SET ads_conversion_sent = true, updated_at = NOW()
             WHERE checkout_session_id::text = $1
               AND ads_conversion_sent = false
             RETURNING id, amount, currency, checkout_session_id, ads_conversion_sent`,
            [sessionId]
        );

        if (claimed.rows.length === 0) {
            devLog(`${tag} markAdsConversionSent — UPDATE matched 0 rows (already claimed)`, {
                timestamp: new Date().toISOString(),
                sessionId,
                dbStatus: order.status,
                adsConversionSentBefore: adsBefore,
                adsConversionSentAfter: true,
                rowUpdated: false
            });
            return {
                alreadySent: true,
                dbStatus: order.status,
                adsConversionSentBefore: adsBefore,
                adsConversionSentAfter: true,
                rowUpdated: false
            };
        }

        const row = claimed.rows[0];
        const adsAfter = Boolean(row.ads_conversion_sent);
        devLog(`${tag} markAdsConversionSent — row claimed (updated)`, {
            timestamp: new Date().toISOString(),
            sessionId,
            dbStatus: order.status,
            adsConversionSentBefore: adsBefore,
            adsConversionSentAfter: adsAfter,
            rowUpdated: true,
            value: Number(row.amount),
            currency: row.currency || 'ILS',
            transactionId: String(row.checkout_session_id)
        });

        return {
            alreadySent: false,
            value: Number(row.amount),
            currency: row.currency || 'ILS',
            // Public transaction id = checkout session id (matches success URL orderId)
            transactionId: String(row.checkout_session_id),
            dbStatus: order.status,
            adsConversionSentBefore: adsBefore,
            adsConversionSentAfter: adsAfter,
            rowUpdated: true
        };
    }

    async updateOrder(id, orderData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            if (orderData.status) {
                fields.push(`status = $${paramIndex}`);
                values.push(orderData.status);
                paramIndex++;
            }
            if (orderData.documentId) {
                fields.push(`document_id = $${paramIndex}`);
                values.push(orderData.documentId);
                paramIndex++;
            }
            if (orderData.paymentId) {
                fields.push(`payment_id = $${paramIndex}`);
                values.push(orderData.paymentId);
                paramIndex++;
            }

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);
            const query = `UPDATE orders SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error updating order:', error);
            throw error;
        }
    }

    async updateOrderByFormId(formId, orderData) {
        try {
            const fields = [];
            const values = [];
            let paramIndex = 1;

            if (orderData.status) {
                fields.push(`status = $${paramIndex}`);
                values.push(orderData.status);
                paramIndex++;
            }
            if (orderData.documentId) {
                fields.push(`document_id = $${paramIndex}`);
                values.push(orderData.documentId);
                paramIndex++;
            }
            if (orderData.paymentId) {
                fields.push(`payment_id = $${paramIndex}`);
                values.push(orderData.paymentId);
                paramIndex++;
            }

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(formId);
            const query = `UPDATE orders SET ${fields.join(', ')}, updated_at = NOW() WHERE form_id = $${paramIndex} RETURNING *`;

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Error updating order by form_id:', error);
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            await pool.query('DELETE FROM orders WHERE id = $1', [id]);
            return true;
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            throw error;
        }
    }

    async updateOrderShippedStatus(id, isShipped) {
        try {
            const result = await pool.query(
                'UPDATE orders SET is_shipped = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [isShipped, id]
            );

            console.log(`📦 Order ${id} shipping status updated to: ${isShipped ? 'Shipped ✅' : 'Not Shipped'}`);

            return result.rows[0];
        } catch (error) {
            console.error('❌ Error updating order shipped status:', error);
            throw error;
        }
    }

    // ===== NEWSLETTER + COUPON EXTENSIONS =====

    async ensureNewsletterSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id SERIAL PRIMARY KEY,
                email VARCHAR(254) NOT NULL UNIQUE,
                name VARCHAR(100),
                phone VARCHAR(25),
                status VARCHAR(32) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'unsubscribed')),
                verification_token TEXT,
                verification_token_expires_at TIMESTAMPTZ,
                unsubscribe_token TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                verified_at TIMESTAMPTZ,
                unsubscribed_at TIMESTAMPTZ
            );
        `);

        try {
            await pool.query(
                `ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name VARCHAR(100)`
            );
            await pool.query(
                `ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS phone VARCHAR(25)`
            );
        } catch (err) {
            console.warn('newsletter name/phone columns:', err.message);
        }

        // Verify columns exist (Neon tables created before this feature need ALTER).
        try {
            const cols = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'newsletter_subscribers'
                  AND column_name IN ('name', 'phone')
            `);
            const have = new Set((cols.rows || []).map((r) => r.column_name));
            if (!have.has('name') || !have.has('phone')) {
                console.error(
                    '❌ newsletter_subscribers is missing name/phone columns after ALTER. Have:',
                    [...have]
                );
            }
        } catch (err) {
            console.warn('newsletter column check:', err.message);
        }

        try {
            await pool.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_verification_token_uidx
                ON newsletter_subscribers (verification_token)
                WHERE verification_token IS NOT NULL;
            `);
        } catch (err) {
            console.warn('newsletter verification token index:', err.message);
        }

        try {
            await pool.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsubscribe_token_uidx
                ON newsletter_subscribers (unsubscribe_token);
            `);
        } catch (err) {
            console.warn('newsletter unsubscribe token index:', err.message);
        }

        // Extend existing coupons table for newsletter-issued single-use codes
        try {
            await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS subscriber_id INTEGER`);
            await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ`);
            await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
            await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
        } catch (err) {
            console.warn('newsletter coupon columns:', err.message);
        }

        try {
            await pool.query(`
                DO $$ BEGIN
                    ALTER TABLE coupons
                    ADD CONSTRAINT coupons_subscriber_id_fkey
                    FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id)
                    ON DELETE SET NULL;
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                    WHEN undefined_table THEN NULL;
                    WHEN undefined_column THEN NULL;
                END $$;
            `);
        } catch (err) {
            console.warn('newsletter coupon FK (non-fatal):', err.message);
        }

        // Per-email confirmation send limits (survive subscriber delete/recreate)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS newsletter_email_send_limits (
                email VARCHAR(254) PRIMARY KEY,
                last_sent_at TIMESTAMPTZ,
                window_started_at TIMESTAMPTZ,
                send_count_in_window INTEGER NOT NULL DEFAULT 0,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
    }

    /**
     * Atomically check + claim a confirmation-email send slot for an address.
     * Independent of newsletter_subscribers rows (anti email-bombing).
     * @returns {{ allowed: boolean, reason?: string }}
     */
    async claimNewsletterEmailSendSlot(email) {
        const {
            evaluateNewsletterEmailSendGate
        } = require('../utils/newsletterEmailSendLimit');

        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized) return { allowed: false, reason: 'invalid' };

        return this.withTransaction(async (client) => {
            await client.query(
                `INSERT INTO newsletter_email_send_limits (email, send_count_in_window)
                 VALUES ($1, 0)
                 ON CONFLICT (email) DO NOTHING`,
                [normalized]
            );

            const locked = await client.query(
                `SELECT email, last_sent_at, window_started_at, send_count_in_window
                 FROM newsletter_email_send_limits
                 WHERE email = $1
                 FOR UPDATE`,
                [normalized]
            );
            const row = locked.rows[0] || null;
            const decision = evaluateNewsletterEmailSendGate(row);

            if (!decision.allowed) {
                return { allowed: false, reason: decision.reason };
            }

            await client.query(
                `UPDATE newsletter_email_send_limits SET
                    last_sent_at = $2,
                    window_started_at = $3,
                    send_count_in_window = $4,
                    updated_at = NOW()
                 WHERE email = $1`,
                [
                    normalized,
                    decision.lastSentAt,
                    decision.windowStartedAt,
                    decision.nextCount
                ]
            );

            return { allowed: true };
        });
    }

    async deleteNewsletterSubscriberByEmail(email) {
        // Detach coupons first in case FK is RESTRICT / missing ON DELETE SET NULL
        await pool.query(
            `UPDATE coupons SET subscriber_id = NULL
             WHERE subscriber_id IN (
                SELECT id FROM newsletter_subscribers WHERE email = $1
             )`,
            [email]
        );
        const r = await pool.query(
            'DELETE FROM newsletter_subscribers WHERE email = $1 RETURNING id',
            [email]
        );
        return (r.rowCount || 0) > 0;
    }

    async findNewsletterSubscriberByEmail(email) {
        const r = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE email = $1 LIMIT 1',
            [email]
        );
        return r.rows[0] || null;
    }

    async findNewsletterSubscriberByVerificationToken(token) {
        const r = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE verification_token = $1 LIMIT 1',
            [token]
        );
        return r.rows[0] || null;
    }

    async findNewsletterSubscriberByUnsubscribeToken(token) {
        const r = await pool.query(
            'SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = $1 LIMIT 1',
            [token]
        );
        return r.rows[0] || null;
    }

    async createNewsletterSubscriber({
        email,
        name,
        phone,
        verificationToken,
        unsubscribeToken,
        verificationExpiresAt
    }) {
        const r = await pool.query(
            `INSERT INTO newsletter_subscribers
                (email, name, phone, status, verification_token, verification_token_expires_at, unsubscribe_token)
             VALUES ($1, $2, $3, 'pending', $4, $5, $6)
             RETURNING *`,
            [
                email,
                name || null,
                phone || null,
                verificationToken,
                verificationExpiresAt,
                unsubscribeToken
            ]
        );
        return r.rows[0];
    }

    /** Persist / refresh name + phone on an existing subscriber row. */
    async updateNewsletterSubscriberContact(id, { name, phone } = {}) {
        if (!id) return null;
        const r = await pool.query(
            `UPDATE newsletter_subscribers SET
                name = COALESCE($2, name),
                phone = COALESCE($3, phone)
             WHERE id = $1
             RETURNING *`,
            [id, name || null, phone || null]
        );
        return r.rows[0] || null;
    }

    async refreshNewsletterVerification(id, { verificationToken, verificationExpiresAt, name, phone }) {
        const r = await pool.query(
            `UPDATE newsletter_subscribers SET
                status = 'pending',
                verification_token = $2,
                verification_token_expires_at = $3,
                name = COALESCE($4, name),
                phone = COALESCE($5, phone),
                unsubscribed_at = NULL
             WHERE id = $1
             RETURNING *`,
            [id, verificationToken, verificationExpiresAt, name || null, phone || null]
        );
        return r.rows[0] || null;
    }

    async reactivateNewsletterSubscriber(
        id,
        { verificationToken, unsubscribeToken, verificationExpiresAt, name, phone }
    ) {
        const r = await pool.query(
            `UPDATE newsletter_subscribers SET
                status = 'pending',
                verification_token = $2,
                verification_token_expires_at = $3,
                unsubscribe_token = $4,
                name = COALESCE($5, name),
                phone = COALESCE($6, phone),
                unsubscribed_at = NULL,
                verified_at = NULL
             WHERE id = $1
             RETURNING *`,
            [
                id,
                verificationToken,
                verificationExpiresAt,
                unsubscribeToken,
                name || null,
                phone || null
            ]
        );
        return r.rows[0] || null;
    }

    async markNewsletterVerified(id) {
        const r = await pool.query(
            `UPDATE newsletter_subscribers SET
                status = 'verified',
                verified_at = NOW(),
                verification_token = NULL,
                verification_token_expires_at = NULL
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return r.rows[0] || null;
    }

    async markNewsletterUnsubscribed(id) {
        const r = await pool.query(
            `UPDATE newsletter_subscribers SET
                status = 'unsubscribed',
                unsubscribed_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [id]
        );
        return r.rows[0] || null;
    }

    async getCouponBySubscriberId(subscriberId) {
        const r = await pool.query(
            'SELECT * FROM coupons WHERE subscriber_id = $1 ORDER BY id DESC LIMIT 1',
            [subscriberId]
        );
        return r.rows[0] ? this.mapCouponRow(r.rows[0]) : null;
    }

    /**
     * Run work inside a DB transaction. `fn` receives a pg client.
     */
    async withTransaction(fn) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        } catch (err) {
            try {
                await client.query('ROLLBACK');
            } catch (_) {
                // ignore rollback errors
            }
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Verify subscriber + activate their linked coupon in one transaction.
     * Returns { subscriber, coupon } or throws.
     * Coupon is activated only when subscriber was pending; already-verified is a no-op activate.
     */
    async verifyNewsletterAndActivateCoupon(subscriberId) {
        return this.withTransaction(async (client) => {
            const subRes = await client.query(
                `UPDATE newsletter_subscribers SET
                    status = 'verified',
                    verified_at = COALESCE(verified_at, NOW()),
                    verification_token = NULL,
                    verification_token_expires_at = NULL
                 WHERE id = $1
                   AND status = 'pending'
                 RETURNING *`,
                [subscriberId]
            );

            if (!subRes.rows[0]) {
                const current = await client.query(
                    'SELECT * FROM newsletter_subscribers WHERE id = $1 LIMIT 1',
                    [subscriberId]
                );
                if (!current.rows[0]) {
                    const err = new Error('subscriber_not_found');
                    err.code = 'subscriber_not_found';
                    throw err;
                }
                // Not pending (already verified / unsubscribed) — leave coupon untouched
                const err = new Error('subscriber_not_pending');
                err.code = 'subscriber_not_pending';
                err.subscriber = current.rows[0];
                throw err;
            }

            const couponRes = await client.query(
                `UPDATE coupons SET
                    is_active = TRUE,
                    updated_at = NOW()
                 WHERE id = (
                    SELECT id FROM coupons
                    WHERE subscriber_id = $1
                    ORDER BY id DESC
                    LIMIT 1
                 )
                 RETURNING *`,
                [subscriberId]
            );

            let couponRow = couponRes.rows[0] || null;

            // Legacy pending subscribers (signed up before coupon-at-signup): create active coupon now
            if (!couponRow) {
                const validFrom = new Date().toISOString().slice(0, 10);
                const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 10);
                const code = `NEWS${Date.now().toString(36).toUpperCase().slice(-8)}`;
                const inserted = await client.query(
                    `INSERT INTO coupons (
                        code, discount, type, min_amount, max_discount, valid_from, valid_until,
                        is_active, usage_count, max_usage, subscriber_id, created_at
                    ) VALUES ($1, 5, 'percentage', 0, 99999, $2::date, $3::date, TRUE, 0, 1, $4, NOW())
                    RETURNING *`,
                    [code, validFrom, validUntil, subscriberId]
                );
                couponRow = inserted.rows[0] || null;
            }

            return {
                subscriber: subRes.rows[0],
                coupon: couponRow ? this.mapCouponRow(couponRow) : null
            };
        });
    }

    /**
     * Insert an inactive newsletter coupon (is_active = false until email verified).
     */
    async createInactiveNewsletterCoupon(clientOrNull, data) {
        const q = clientOrNull || pool;
        const isActive =
            data.isActive === undefined ? false : !!data.isActive;
        const r = await q.query(
            `INSERT INTO coupons (
                code, discount, type, min_amount, max_discount, valid_from, valid_until,
                is_active, usage_count, max_usage, subscriber_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11, NOW())
            RETURNING *`,
            [
                String(data.code).toUpperCase().trim(),
                parseFloat(data.discount),
                data.type,
                parseFloat(data.minAmount) || 0,
                parseFloat(data.maxDiscount),
                data.validFrom,
                data.validUntil,
                isActive,
                parseInt(data.usageCount, 10) || 0,
                parseInt(data.maxUsage, 10) || 1,
                data.subscriberId != null ? parseInt(data.subscriberId, 10) : null
            ]
        );
        return this.mapCouponRow(r.rows[0]);
    }

    /**
     * Atomically mark a coupon used after successful payment.
     * Only updates rows that are still active and under their usage limit.
     * Returns { ok, coupon, reason, rowCount } — ok only when exactly one row was updated.
     */
    async markCouponUsedByCode(code) {
        if (!code || typeof code !== 'string' || !code.trim()) {
            return { ok: false, coupon: null, reason: 'invalid_code', rowCount: 0 };
        }

        const normalized = code.trim();
        const r = await pool.query(
            `UPDATE coupons SET
                usage_count = usage_count + 1,
                used_at = COALESCE(used_at, NOW()),
                is_active = CASE
                    WHEN usage_count + 1 >= max_usage THEN FALSE
                    ELSE is_active
                END,
                updated_at = NOW()
             WHERE UPPER(TRIM(code)) = UPPER(TRIM($1))
               AND is_active = TRUE
               AND usage_count < max_usage
             RETURNING *`,
            [normalized]
        );

        if (r.rowCount === 1 && r.rows[0]) {
            return {
                ok: true,
                coupon: this.mapCouponRow(r.rows[0]),
                reason: null,
                rowCount: 1
            };
        }

        // Diagnose why zero rows were affected (reuse, inactive, missing, etc.)
        const existing = await pool.query(
            `SELECT * FROM coupons WHERE UPPER(TRIM(code)) = UPPER(TRIM($1)) LIMIT 1`,
            [normalized]
        );
        if (!existing.rows[0]) {
            return { ok: false, coupon: null, reason: 'not_found', rowCount: 0 };
        }
        const mapped = this.mapCouponRow(existing.rows[0]);
        if (!mapped.isActive || mapped.usageCount >= mapped.maxUsage || mapped.usedAt) {
            return { ok: false, coupon: mapped, reason: 'already_used', rowCount: 0 };
        }
        return { ok: false, coupon: mapped, reason: 'update_failed', rowCount: 0 };
    }

    // ===== COUPONS =====

    mapCouponRow(row) {
        if (!row) return null;
        const d = (v) => {
            if (!v) return '';
            if (v instanceof Date) return v.toISOString().split('T')[0];
            const s = String(v);
            if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
            const dt = new Date(s);
            return Number.isNaN(dt.getTime()) ? s : dt.toISOString().split('T')[0];
        };
        return {
            id: row.id,
            code: row.code,
            discount: parseFloat(row.discount),
            type: row.type,
            minAmount: parseFloat(row.min_amount),
            maxDiscount: parseFloat(row.max_discount),
            validFrom: d(row.valid_from),
            validUntil: d(row.valid_until),
            isActive: row.is_active,
            usageCount: parseInt(row.usage_count, 10) || 0,
            maxUsage: parseInt(row.max_usage, 10) || 0,
            subscriberId: row.subscriber_id != null ? parseInt(row.subscriber_id, 10) : null,
            usedAt: row.used_at || null,
            createdAt: row.created_at || null
        };
    }

    async getAllCoupons() {
        const r = await pool.query('SELECT * FROM coupons ORDER BY id ASC');
        return (r.rows || []).map((row) => this.mapCouponRow(row));
    }

    async getCouponByCode(code) {
        if (!code || typeof code !== 'string') return null;
        const r = await pool.query(
            'SELECT * FROM coupons WHERE UPPER(TRIM(code)) = UPPER(TRIM($1)) LIMIT 1',
            [code]
        );
        return r.rows[0] ? this.mapCouponRow(r.rows[0]) : null;
    }

    async createCoupon(data) {
        await this.ensureNewsletterSchema();
        const r = await pool.query(
            `INSERT INTO coupons (
                code, discount, type, min_amount, max_discount, valid_from, valid_until,
                is_active, usage_count, max_usage, subscriber_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9, $10, $11, NOW())
            RETURNING *`,
            [
                String(data.code).toUpperCase().trim(),
                parseFloat(data.discount),
                data.type,
                parseFloat(data.minAmount) || 0,
                parseFloat(data.maxDiscount),
                data.validFrom,
                data.validUntil,
                data.isActive === undefined ? true : !!data.isActive,
                parseInt(data.usageCount, 10) || 0,
                parseInt(data.maxUsage, 10) || 100,
                data.subscriberId != null ? parseInt(data.subscriberId, 10) : null
            ]
        );
        return this.mapCouponRow(r.rows[0]);
    }

    async updateCoupon(id, body) {
        const existing = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
        if (!existing.rows[0]) return null;

        const cur = existing.rows[0];
        const next = {
            code: body.code !== undefined ? String(body.code).toUpperCase().trim() : cur.code,
            discount: body.discount !== undefined ? parseFloat(body.discount) : parseFloat(cur.discount),
            type: body.type !== undefined ? body.type : cur.type,
            min_amount: body.minAmount !== undefined ? parseFloat(body.minAmount) : parseFloat(cur.min_amount),
            max_discount: body.maxDiscount !== undefined ? parseFloat(body.maxDiscount) : parseFloat(cur.max_discount),
            valid_from: body.validFrom !== undefined ? body.validFrom : cur.valid_from,
            valid_until: body.validUntil !== undefined ? body.validUntil : cur.valid_until,
            is_active: body.isActive !== undefined ? !!body.isActive : cur.is_active,
            usage_count: body.usageCount !== undefined ? parseInt(body.usageCount, 10) : parseInt(cur.usage_count, 10),
            max_usage: body.maxUsage !== undefined ? parseInt(body.maxUsage, 10) : parseInt(cur.max_usage, 10)
        };

        const r = await pool.query(
            `UPDATE coupons SET
                code = $1, discount = $2, type = $3, min_amount = $4, max_discount = $5,
                valid_from = $6::date, valid_until = $7::date, is_active = $8, usage_count = $9, max_usage = $10,
                updated_at = NOW()
            WHERE id = $11
            RETURNING *`,
            [
                next.code,
                next.discount,
                next.type,
                next.min_amount,
                next.max_discount,
                next.valid_from,
                next.valid_until,
                next.is_active,
                next.usage_count,
                next.max_usage,
                id
            ]
        );
        return r.rows[0] ? this.mapCouponRow(r.rows[0]) : null;
    }

    async deleteCoupon(id) {
        const r = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
        return r.rowCount > 0;
    }

    // ===== LOGIN ATTEMPTS BY IP (brute-force protection, server-side) =====

    async getLoginLockStatusByIp(ip) {
        if (!ip || typeof ip !== 'string') return { isLocked: false, lockedUntil: null, remainingTime: null };
        const key = String(ip).trim().slice(0, 45);
        try {
            const r = await pool.query(
                'SELECT attempt_count, lock_count, locked_until FROM login_attempts_by_ip WHERE ip = $1',
                [key]
            );
            const row = r.rows[0];
            if (!row) return { isLocked: false, lockedUntil: null, remainingTime: null };
            const nowMs = Date.now();
            const lockedUntilRaw = row.locked_until;
            const lockedUntil = lockedUntilRaw ? new Date(lockedUntilRaw) : null;
            const lockedUntilMs = lockedUntil ? lockedUntil.getTime() : 0;
            if (lockedUntilMs > nowMs) {
                const remainingMs = lockedUntilMs - nowMs;
                const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
                return {
                    isLocked: true,
                    lockedUntil,
                    remainingTime: remainingMinutes <= 1 ? '1 minute' : `${remainingMinutes} minutes`
                };
            }
            if (lockedUntilRaw) {
                await pool.query(
                    'UPDATE login_attempts_by_ip SET locked_until = NULL, attempt_count = 0, updated_at = NOW() WHERE ip = $1',
                    [key]
                );
            }
            return { isLocked: false, lockedUntil: null, remainingTime: null };
        } catch (error) {
            console.error('❌ getLoginLockStatusByIp:', error.message);
            return { isLocked: false, lockedUntil: null, remainingTime: null };
        }
    }

    async recordLoginFailureByIp(ip, maxAttempts = 15, firstLockoutMinutes = 60, subsequentLockoutMinutes = 1440) {
        if (!ip || typeof ip !== 'string') return { shouldLock: false, attemptsRemaining: maxAttempts - 1 };
        const key = String(ip).trim().slice(0, 45);
        try {
            await pool.query(
                `INSERT INTO login_attempts_by_ip (ip, attempt_count, lock_count, locked_until, updated_at)
                 VALUES ($1, 1, 0, NULL, NOW())
                 ON CONFLICT (ip) DO UPDATE SET
                   attempt_count = CASE
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL AND login_attempts_by_ip.locked_until > NOW() THEN login_attempts_by_ip.attempt_count
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL THEN 1
                     ELSE login_attempts_by_ip.attempt_count + 1
                   END,
                   lock_count = CASE
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL AND login_attempts_by_ip.locked_until > NOW() THEN login_attempts_by_ip.lock_count
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL THEN login_attempts_by_ip.lock_count
                     WHEN login_attempts_by_ip.attempt_count + 1 >= $2 THEN COALESCE(login_attempts_by_ip.lock_count, 0) + 1
                     ELSE COALESCE(login_attempts_by_ip.lock_count, 0)
                   END,
                   locked_until = CASE
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL AND login_attempts_by_ip.locked_until > NOW() THEN login_attempts_by_ip.locked_until
                     WHEN login_attempts_by_ip.locked_until IS NOT NULL THEN NULL
                     WHEN login_attempts_by_ip.attempt_count + 1 >= $2 THEN NOW() + (
                       (CASE WHEN COALESCE(login_attempts_by_ip.lock_count, 0) = 0 THEN $3 ELSE $4 END) || ' minutes'
                     )::INTERVAL
                     ELSE NULL
                   END,
                   updated_at = NOW()`,
                [key, maxAttempts, firstLockoutMinutes, subsequentLockoutMinutes]
            );
            const r = await pool.query(
                'SELECT attempt_count, locked_until FROM login_attempts_by_ip WHERE ip = $1',
                [key]
            );
            const row = r.rows[0];
            const count = row ? parseInt(row.attempt_count, 10) || 0 : 1;
            const lockedUntil = row?.locked_until ? new Date(row.locked_until) : null;
            const isLocked = lockedUntil && new Date() < lockedUntil;
            return {
                shouldLock: isLocked,
                attemptsRemaining: isLocked ? 0 : Math.max(0, maxAttempts - count)
            };
        } catch (error) {
            console.error('❌ recordLoginFailureByIp:', error.message);
            return { shouldLock: false, attemptsRemaining: maxAttempts - 1 };
        }
    }

    /** Clear IP login attempts on successful login (optional, resets counter for that IP). */
    async clearLoginAttemptsByIp(ip) {
        if (!ip || typeof ip !== 'string') return;
        const key = String(ip).trim().slice(0, 45);
        try {
            await pool.query('DELETE FROM login_attempts_by_ip WHERE ip = $1', [key]);
        } catch (error) {
            console.error('❌ clearLoginAttemptsByIp:', error.message);
        }
    }

    // ===== GIFT-WITH-PURCHASE =====

    async ensureGiftSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gift_books (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gift_promotions (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL,
                gifts_per_unit INTEGER NOT NULL DEFAULT 1 CHECK (gifts_per_unit >= 1),
                active BOOLEAN NOT NULL DEFAULT TRUE,
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS gift_promotion_books (
                promotion_id INTEGER NOT NULL REFERENCES gift_promotions(id) ON DELETE CASCADE,
                book_id INTEGER NOT NULL REFERENCES gift_books(id) ON DELETE CASCADE,
                PRIMARY KEY (promotion_id, book_id)
            );
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS order_gift_selections (
                id SERIAL PRIMARY KEY,
                order_id INTEGER NOT NULL,
                product_id INTEGER,
                cart_unique_id TEXT,
                slot_index INTEGER NOT NULL DEFAULT 0,
                unit_index INTEGER NOT NULL DEFAULT 0,
                book_id INTEGER,
                book_title_snapshot TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        try {
            await pool.query(`
                CREATE INDEX IF NOT EXISTS order_gift_selections_order_id_idx
                ON order_gift_selections (order_id);
            `);
        } catch (err) {
            console.warn('order_gift_selections index:', err.message);
        }
    }

    mapGiftBookRow(row) {
        if (!row) return null;
        let images = row.image_urls;
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (_) {
                images = [];
            }
        }
        if (!Array.isArray(images)) images = [];
        return {
            id: row.id,
            title: row.title,
            imageUrls: images,
            image_urls: images,
            active: !!row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async getAllGiftBooks({ activeOnly = false } = {}) {
        await this.ensureGiftSchema();
        const r = await pool.query(
            `SELECT * FROM gift_books
             ${activeOnly ? 'WHERE active = TRUE' : ''}
             ORDER BY id ASC`
        );
        return r.rows.map((row) => this.mapGiftBookRow(row));
    }

    async getGiftBookById(id) {
        await this.ensureGiftSchema();
        const r = await pool.query('SELECT * FROM gift_books WHERE id = $1', [id]);
        return this.mapGiftBookRow(r.rows[0]);
    }

    async createGiftBook({ title, imageUrls = [], active = true }) {
        await this.ensureGiftSchema();
        const r = await pool.query(
            `INSERT INTO gift_books (title, image_urls, active)
             VALUES ($1, $2::jsonb, $3)
             RETURNING *`,
            [String(title || '').trim(), JSON.stringify(Array.isArray(imageUrls) ? imageUrls : []), !!active]
        );
        return this.mapGiftBookRow(r.rows[0]);
    }

    async updateGiftBook(id, { title, imageUrls, active }) {
        await this.ensureGiftSchema();
        const existing = await this.getGiftBookById(id);
        if (!existing) return null;
        const r = await pool.query(
            `UPDATE gift_books SET
                title = $2,
                image_urls = $3::jsonb,
                active = $4,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                title != null ? String(title).trim() : existing.title,
                JSON.stringify(
                    imageUrls != null
                        ? Array.isArray(imageUrls)
                            ? imageUrls
                            : existing.imageUrls
                        : existing.imageUrls
                ),
                active != null ? !!active : existing.active
            ]
        );
        return this.mapGiftBookRow(r.rows[0]);
    }

    async deleteGiftBook(id) {
        await this.ensureGiftSchema();
        await pool.query('DELETE FROM gift_books WHERE id = $1', [id]);
        return true;
    }

    async getPromotionBookIds(promotionId) {
        const r = await pool.query(
            'SELECT book_id FROM gift_promotion_books WHERE promotion_id = $1 ORDER BY book_id',
            [promotionId]
        );
        return r.rows.map((row) => row.book_id);
    }

    async mapGiftPromotionRow(row) {
        if (!row) return null;
        const bookIds = await this.getPromotionBookIds(row.id);
        const books = [];
        for (const bid of bookIds) {
            const book = await this.getGiftBookById(bid);
            if (book) books.push(book);
        }
        return {
            id: row.id,
            productId: row.product_id,
            product_id: row.product_id,
            giftsPerUnit: row.gifts_per_unit,
            gifts_per_unit: row.gifts_per_unit,
            active: !!row.active,
            startDate: row.start_date,
            endDate: row.end_date,
            start_date: row.start_date,
            end_date: row.end_date,
            bookIds,
            books,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async getAllGiftPromotions({ activeOnly = false } = {}) {
        await this.ensureGiftSchema();
        let sql = 'SELECT * FROM gift_promotions';
        if (activeOnly) {
            sql += ` WHERE active = TRUE
                AND (start_date IS NULL OR start_date <= CURRENT_DATE)
                AND (end_date IS NULL OR end_date >= CURRENT_DATE)`;
        }
        sql += ' ORDER BY id ASC';
        const r = await pool.query(sql);
        const out = [];
        for (const row of r.rows) {
            out.push(await this.mapGiftPromotionRow(row));
        }
        return out;
    }

    async getGiftPromotionById(id) {
        await this.ensureGiftSchema();
        const r = await pool.query('SELECT * FROM gift_promotions WHERE id = $1', [id]);
        return this.mapGiftPromotionRow(r.rows[0]);
    }

    async setPromotionBooks(promotionId, bookIds) {
        await pool.query('DELETE FROM gift_promotion_books WHERE promotion_id = $1', [promotionId]);
        const ids = Array.isArray(bookIds) ? bookIds : [];
        for (const bookId of ids) {
            await pool.query(
                `INSERT INTO gift_promotion_books (promotion_id, book_id)
                 VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [promotionId, bookId]
            );
        }
    }

    async createGiftPromotion(data) {
        await this.ensureGiftSchema();
        const r = await pool.query(
            `INSERT INTO gift_promotions (product_id, gifts_per_unit, active, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                data.productId,
                Math.max(1, parseInt(data.giftsPerUnit, 10) || 1),
                data.active !== false,
                data.startDate || null,
                data.endDate || null
            ]
        );
        const promo = r.rows[0];
        await this.setPromotionBooks(promo.id, data.bookIds || []);
        return this.mapGiftPromotionRow(promo);
    }

    async updateGiftPromotion(id, data) {
        await this.ensureGiftSchema();
        const existing = await this.getGiftPromotionById(id);
        if (!existing) return null;
        const r = await pool.query(
            `UPDATE gift_promotions SET
                product_id = $2,
                gifts_per_unit = $3,
                active = $4,
                start_date = $5,
                end_date = $6,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                data.productId != null ? data.productId : existing.productId,
                data.giftsPerUnit != null
                    ? Math.max(1, parseInt(data.giftsPerUnit, 10) || 1)
                    : existing.giftsPerUnit,
                data.active != null ? !!data.active : existing.active,
                data.startDate !== undefined ? data.startDate || null : existing.startDate,
                data.endDate !== undefined ? data.endDate || null : existing.endDate
            ]
        );
        if (data.bookIds) {
            await this.setPromotionBooks(id, data.bookIds);
        }
        return this.mapGiftPromotionRow(r.rows[0]);
    }

    async deleteGiftPromotion(id) {
        await this.ensureGiftSchema();
        await pool.query('DELETE FROM gift_promotions WHERE id = $1', [id]);
        return true;
    }

    /**
     * Active promotions summarized for checkout validation / cart UI.
     */
    async getActiveGiftPromotionsSummary() {
        const promos = await this.getAllGiftPromotions({ activeOnly: true });
        return promos.map((p) => ({
            id: p.id,
            productId: p.productId,
            giftsPerUnit: p.giftsPerUnit,
            bookIds: (p.books || []).filter((b) => b.active).map((b) => b.id),
            books: (p.books || []).filter((b) => b.active)
        }));
    }

    async saveOrderGiftSelections(orderId, selections) {
        await this.ensureGiftSchema();
        if (!orderId || !Array.isArray(selections) || selections.length === 0) return [];
        const saved = [];
        for (const sel of selections) {
            const r = await pool.query(
                `INSERT INTO order_gift_selections (
                    order_id, product_id, cart_unique_id, slot_index, unit_index,
                    book_id, book_title_snapshot
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    orderId,
                    sel.productId != null ? sel.productId : null,
                    sel.cartUniqueId != null ? String(sel.cartUniqueId) : null,
                    parseInt(sel.slotIndex, 10) || 0,
                    parseInt(sel.unitIndex, 10) || 0,
                    sel.bookId != null ? sel.bookId : null,
                    String(sel.bookTitleSnapshot || sel.book_title_snapshot || '').trim() || 'Gift book'
                ]
            );
            saved.push(r.rows[0]);
        }
        return saved;
    }

    async getOrderGiftSelections(orderId) {
        await this.ensureGiftSchema();
        const r = await pool.query(
            `SELECT * FROM order_gift_selections WHERE order_id = $1
             ORDER BY cart_unique_id, slot_index`,
            [orderId]
        );
        return r.rows.map((row) => ({
            id: row.id,
            orderId: row.order_id,
            productId: row.product_id,
            cartUniqueId: row.cart_unique_id,
            slotIndex: row.slot_index,
            unitIndex: row.unit_index,
            bookId: row.book_id,
            bookTitleSnapshot: row.book_title_snapshot
        }));
    }

    // ===== BANNERS =====

    async ensureBannersSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS banners (
                id SERIAL PRIMARY KEY,
                images JSONB NOT NULL DEFAULT '[]'::jsonb,
                title TEXT,
                body_text TEXT,
                button_text TEXT,
                button_link TEXT,
                placement VARCHAR(64) NOT NULL
                    CHECK (placement IN ('site_entry', 'homepage_section', 'cart')),
                active BOOLEAN NOT NULL DEFAULT TRUE,
                start_date DATE,
                end_date DATE,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        try {
            await pool.query(`
                CREATE INDEX IF NOT EXISTS banners_placement_active_idx
                ON banners (placement, active, sort_order);
            `);
        } catch (err) {
            console.warn('banners index:', err.message);
        }
    }

    mapBannerRow(row) {
        if (!row) return null;
        let images = row.images;
        if (typeof images === 'string') {
            try {
                images = JSON.parse(images);
            } catch (_) {
                images = [];
            }
        }
        if (!Array.isArray(images)) images = [];
        return {
            id: row.id,
            images,
            title: row.title || '',
            bodyText: row.body_text || '',
            body_text: row.body_text || '',
            buttonText: row.button_text || '',
            button_text: row.button_text || '',
            buttonLink: row.button_link || '',
            button_link: row.button_link || '',
            placement: row.placement,
            active: !!row.active,
            startDate: row.start_date,
            endDate: row.end_date,
            start_date: row.start_date,
            end_date: row.end_date,
            sortOrder: row.sort_order,
            sort_order: row.sort_order,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    async getAllBanners({ placement, activeOnly = false } = {}) {
        await this.ensureBannersSchema();
        const clauses = [];
        const params = [];
        if (placement) {
            params.push(placement);
            clauses.push(`placement = $${params.length}`);
        }
        if (activeOnly) {
            clauses.push('active = TRUE');
            clauses.push('(start_date IS NULL OR start_date <= CURRENT_DATE)');
            clauses.push('(end_date IS NULL OR end_date >= CURRENT_DATE)');
        }
        const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const r = await pool.query(
            `SELECT * FROM banners ${where} ORDER BY sort_order ASC, id ASC`,
            params
        );
        return r.rows.map((row) => this.mapBannerRow(row));
    }

    async getBannerById(id) {
        await this.ensureBannersSchema();
        const r = await pool.query('SELECT * FROM banners WHERE id = $1', [id]);
        return this.mapBannerRow(r.rows[0]);
    }

    async createBanner(data) {
        await this.ensureBannersSchema();
        const r = await pool.query(
            `INSERT INTO banners (
                images, title, body_text, button_text, button_link,
                placement, active, start_date, end_date, sort_order
             ) VALUES ($1::jsonb, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                JSON.stringify(Array.isArray(data.images) ? data.images : []),
                data.title || null,
                data.bodyText || data.body_text || null,
                data.buttonText || data.button_text || null,
                data.buttonLink || data.button_link || null,
                data.placement,
                data.active !== false,
                data.startDate || data.start_date || null,
                data.endDate || data.end_date || null,
                parseInt(data.sortOrder != null ? data.sortOrder : data.sort_order, 10) || 0
            ]
        );
        return this.mapBannerRow(r.rows[0]);
    }

    async updateBanner(id, data) {
        await this.ensureBannersSchema();
        const existing = await this.getBannerById(id);
        if (!existing) return null;
        const r = await pool.query(
            `UPDATE banners SET
                images = $2::jsonb,
                title = $3,
                body_text = $4,
                button_text = $5,
                button_link = $6,
                placement = $7,
                active = $8,
                start_date = $9,
                end_date = $10,
                sort_order = $11,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                JSON.stringify(
                    data.images != null
                        ? Array.isArray(data.images)
                            ? data.images
                            : existing.images
                        : existing.images
                ),
                data.title !== undefined ? data.title || null : existing.title || null,
                data.bodyText !== undefined || data.body_text !== undefined
                    ? data.bodyText || data.body_text || null
                    : existing.bodyText || null,
                data.buttonText !== undefined || data.button_text !== undefined
                    ? data.buttonText || data.button_text || null
                    : existing.buttonText || null,
                data.buttonLink !== undefined || data.button_link !== undefined
                    ? data.buttonLink || data.button_link || null
                    : existing.buttonLink || null,
                data.placement || existing.placement,
                data.active != null ? !!data.active : existing.active,
                data.startDate !== undefined || data.start_date !== undefined
                    ? data.startDate || data.start_date || null
                    : existing.startDate,
                data.endDate !== undefined || data.end_date !== undefined
                    ? data.endDate || data.end_date || null
                    : existing.endDate,
                data.sortOrder != null || data.sort_order != null
                    ? parseInt(data.sortOrder != null ? data.sortOrder : data.sort_order, 10) || 0
                    : existing.sortOrder
            ]
        );
        return this.mapBannerRow(r.rows[0]);
    }

    async deleteBanner(id) {
        await this.ensureBannersSchema();
        await pool.query('DELETE FROM banners WHERE id = $1', [id]);
        return true;
    }

    // ===== FAQ =====

    async ensureFaqSchema() {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS faq_items (
                id SERIAL PRIMARY KEY,
                question_he TEXT NOT NULL DEFAULT '',
                question_en TEXT NOT NULL DEFAULT '',
                answer_he TEXT NOT NULL DEFAULT '',
                answer_en TEXT NOT NULL DEFAULT '',
                links JSONB NOT NULL DEFAULT '[]'::jsonb,
                sort_order INTEGER NOT NULL DEFAULT 0,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        try {
            await pool.query(`
                CREATE INDEX IF NOT EXISTS faq_items_active_sort_idx
                ON faq_items (active, sort_order, id);
            `);
        } catch (err) {
            console.warn('faq index:', err.message);
        }

        // Seed at most once per process — never via createFaqItem (that re-entered ensure).
        if (!this._faqSeedPromise) {
            this._faqSeedPromise = (async () => {
                const count = await pool.query('SELECT COUNT(*)::int AS n FROM faq_items');
                if ((count.rows[0]?.n || 0) === 0) {
                    await this.seedDefaultFaqItems();
                }
            })().catch((err) => {
                console.error('FAQ seed failed:', err?.message || err);
                this._faqSeedPromise = null;
                throw err;
            });
        }
        await this._faqSeedPromise;
    }

    async seedDefaultFaqItems() {
        const whatsapp = 'https://wa.me/972539444166';
        const defaults = [
            {
                questionHe: 'אתם שולחים לכל הארץ? כמה זמן זה לוקח?',
                questionEn: 'Do you ship nationwide? How long does it take?',
                answerHe: 'כן! לכל המקומות זה עד 7 ימי עסקים.',
                answerEn: 'Yes! Delivery is up to 7 business days nationwide.',
                links: [],
                sortOrder: 0
            },
            {
                questionHe: 'החלקים הם מלגו אמיתי או לא?',
                questionEn: 'Are the parts real LEGO?',
                answerHe:
                    'החלקים הם לא מלגו אמיתי, כי לגו לא רוצים לשתף פעולה עם ערכות שקשורות באופן ישיר לדת (כמו בית המקדש), אבל נסענו עד לסין ובדקנו שהאיכות של החלקים לא נופלת משל לגו! החלקים באיכות מעולה.',
                answerEn:
                    'The parts are not real LEGO, because LEGO does not partner with kits tied directly to religion (like the Beit Hamikdash). We went all the way to China and checked that the quality is not below LEGO — the parts are excellent quality.',
                links: [],
                sortOrder: 1
            },
            {
                questionHe: 'יש דרך להשיג את זה דרך החנויות?',
                questionEn: 'Is there a way to get this through stores?',
                answerHe:
                    'זה לא מופץ כרגע לכל החנויות אבל יש מוקדי חלוקה בירושלים ובמרכז - {{0}} ונחבר אתכם למוקד החלוקה הרצוי.',
                answerEn:
                    'It is not currently distributed to all stores, but there are pickup points in Jerusalem and the center — {{0}} and we will connect you to the right pickup location.',
                links: [
                    {
                        url: whatsapp,
                        labelHe: 'צרו איתנו קשר',
                        labelEn: 'contact us'
                    }
                ],
                sortOrder: 2
            },
            {
                questionHe: 'לאיזה גילים זה מתאים?',
                questionEn: 'What ages is this suitable for?',
                answerHe:
                    'כדי שילד/ה יבנו את זה לבד, הם צריכים להיות בגיל 9+. בעזרת מבוגר אפשר גם מגילים נמוכים יותר כמו 6-7.',
                answerEn:
                    'For a child to build it independently, they should be age 9+. With an adult, younger ages like 6–7 work too.',
                links: [],
                sortOrder: 3
            },
            {
                questionHe: 'יש מחיר מיוחד לכמויות גדולות?',
                questionEn: 'Is there a special price for large quantities?',
                answerHe:
                    'כן בטח! המחיר משתנה לפי הכמות שתבקשו, ונהיה נמוך יותר ככל שהכמות גדלה. המינימום הנדרש הוא 10 יחידות. לפרטים נוספים {{0}} ונדבר:)',
                answerEn:
                    "Yes, of course! The price changes based on the quantity you request, and gets lower as the quantity grows. The minimum required is 10 units. For more details, {{0}} and we'll talk :)",
                links: [
                    {
                        url: whatsapp,
                        labelHe: 'צרו איתנו קשר בווצאפ',
                        labelEn: 'contact us on WhatsApp'
                    }
                ],
                sortOrder: 4
            }
        ];
        for (const item of defaults) {
            const links = this.normalizeFaqLinks(item.links);
            await pool.query(
                `INSERT INTO faq_items (
                    question_he, question_en, answer_he, answer_en,
                    links, sort_order, active
                 ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, TRUE)`,
                [
                    item.questionHe,
                    item.questionEn,
                    item.answerHe,
                    item.answerEn,
                    JSON.stringify(links),
                    item.sortOrder
                ]
            );
        }
    }

    mapFaqRow(row) {
        if (!row) return null;
        let links = row.links;
        if (typeof links === 'string') {
            try {
                links = JSON.parse(links);
            } catch (_) {
                links = [];
            }
        }
        if (!Array.isArray(links)) links = [];
        return {
            id: row.id,
            questionHe: row.question_he || '',
            questionEn: row.question_en || '',
            answerHe: row.answer_he || '',
            answerEn: row.answer_en || '',
            question_he: row.question_he || '',
            question_en: row.question_en || '',
            answer_he: row.answer_he || '',
            answer_en: row.answer_en || '',
            links: links.map((l) => ({
                url: l?.url || '',
                labelHe: l?.labelHe || l?.label_he || '',
                labelEn: l?.labelEn || l?.label_en || '',
                label_he: l?.labelHe || l?.label_he || '',
                label_en: l?.labelEn || l?.label_en || ''
            })),
            sortOrder: row.sort_order,
            sort_order: row.sort_order,
            active: !!row.active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }

    normalizeFaqLinks(links) {
        if (!Array.isArray(links)) return [];
        return links
            .map((l) => ({
                url: String(l?.url || '').trim(),
                labelHe: String(l?.labelHe || l?.label_he || '').trim(),
                labelEn: String(l?.labelEn || l?.label_en || '').trim()
            }))
            .filter((l) => l.url);
    }

    async getAllFaqItems({ activeOnly = false } = {}) {
        await this.ensureFaqSchema();
        const where = activeOnly ? 'WHERE active = TRUE' : '';
        const r = await pool.query(
            `SELECT * FROM faq_items ${where} ORDER BY sort_order ASC, id ASC`
        );
        return r.rows.map((row) => this.mapFaqRow(row));
    }

    async getFaqItemById(id) {
        await this.ensureFaqSchema();
        const r = await pool.query('SELECT * FROM faq_items WHERE id = $1', [id]);
        return this.mapFaqRow(r.rows[0]);
    }

    async createFaqItem(data) {
        await this.ensureFaqSchema();
        const links = this.normalizeFaqLinks(data.links);
        const r = await pool.query(
            `INSERT INTO faq_items (
                question_he, question_en, answer_he, answer_en,
                links, sort_order, active
             ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
             RETURNING *`,
            [
                String(data.questionHe || data.question_he || '').trim(),
                String(data.questionEn || data.question_en || '').trim(),
                String(data.answerHe || data.answer_he || '').trim(),
                String(data.answerEn || data.answer_en || '').trim(),
                JSON.stringify(links),
                parseInt(data.sortOrder != null ? data.sortOrder : data.sort_order, 10) || 0,
                data.active !== false
            ]
        );
        return this.mapFaqRow(r.rows[0]);
    }

    async updateFaqItem(id, data) {
        await this.ensureFaqSchema();
        const existing = await this.getFaqItemById(id);
        if (!existing) return null;
        const links =
            data.links != null
                ? this.normalizeFaqLinks(data.links)
                : this.normalizeFaqLinks(existing.links);
        const r = await pool.query(
            `UPDATE faq_items SET
                question_he = $2,
                question_en = $3,
                answer_he = $4,
                answer_en = $5,
                links = $6::jsonb,
                sort_order = $7,
                active = $8,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                data.questionHe != null || data.question_he != null
                    ? String(data.questionHe || data.question_he || '').trim()
                    : existing.questionHe,
                data.questionEn != null || data.question_en != null
                    ? String(data.questionEn || data.question_en || '').trim()
                    : existing.questionEn,
                data.answerHe != null || data.answer_he != null
                    ? String(data.answerHe || data.answer_he || '').trim()
                    : existing.answerHe,
                data.answerEn != null || data.answer_en != null
                    ? String(data.answerEn || data.answer_en || '').trim()
                    : existing.answerEn,
                JSON.stringify(links),
                data.sortOrder != null || data.sort_order != null
                    ? parseInt(data.sortOrder != null ? data.sortOrder : data.sort_order, 10) || 0
                    : existing.sortOrder,
                data.active != null ? !!data.active : existing.active
            ]
        );
        return this.mapFaqRow(r.rows[0]);
    }

    async deleteFaqItem(id) {
        await this.ensureFaqSchema();
        await pool.query('DELETE FROM faq_items WHERE id = $1', [id]);
        return true;
    }
}

module.exports = new DatabaseController();

