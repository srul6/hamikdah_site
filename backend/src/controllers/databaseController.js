const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});

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

            // Get current product
            const productResult = await pool.query(
                'SELECT quantity FROM products WHERE id = $1',
                [productId]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Product ${productId} not found`);
            }

            const currentQuantity = productResult.rows[0].quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - quantityToReduce);

            console.log(`📊 Product ${productId}: Current: ${currentQuantity}, Reducing by: ${quantityToReduce}, New: ${newQuantity}`);

            // Update quantity
            await pool.query(
                'UPDATE products SET quantity = $1 WHERE id = $2',
                [newQuantity, productId]
            );

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

            // First, check if order with this form_id already exists
            const existingOrder = await pool.query(
                'SELECT id FROM orders WHERE form_id = $1',
                [orderData.formId]
            );

            if (existingOrder.rows.length > 0) {
                // Order exists, update it
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
                        dedication = $16,
                        purchase_timestamp = $17,
                        updated_at = NOW()
                    WHERE form_id = $18
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
                        orderData.dedication || null,
                        parsedTimestamp,
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
                    items, dedication, purchase_timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
                    dedication = EXCLUDED.dedication,
                    purchase_timestamp = EXCLUDED.purchase_timestamp,
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
                    orderData.dedication || null,
                    parsedTimestamp
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
}

module.exports = new DatabaseController();

