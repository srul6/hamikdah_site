const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon
    }
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

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
            let childrenPlaying = productData.children_playing;
            if (Array.isArray(childrenPlaying)) {
                childrenPlaying = JSON.stringify(childrenPlaying);
            }

            let desktopHeroImages = productData.desktop_hero_images;
            if (Array.isArray(desktopHeroImages)) {
                desktopHeroImages = JSON.stringify(desktopHeroImages);
            }

            let extraImages = productData.extraimages;
            if (Array.isArray(extraImages)) {
                extraImages = JSON.stringify(extraImages);
            }

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
                    productData.buildingtime || null,
                    productData.pieces || null,
                    productData.height || null,
                    productData.length || null,
                    productData.width || null,
                    productData.recommendedage || null,
                    childrenPlaying || null,
                    desktopHeroImages || null,
                    JSON.stringify(productData.colors || [])
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

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramIndex}`);
                    // Handle JSON/array fields
                    if (key === 'colors' && Array.isArray(updateData[key])) {
                        values.push(JSON.stringify(updateData[key]));
                    } else if ((key === 'children_playing' || key === 'desktop_hero_images' || key === 'extraimages') && Array.isArray(updateData[key])) {
                        values.push(JSON.stringify(updateData[key]));
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

            Object.keys(commentData).forEach(key => {
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
            return result.rows || [];
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
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

            const result = await pool.query(
                `INSERT INTO orders (
                    form_id, document_id, payment_id, status, amount, currency,
                    customer_name, customer_email, customer_phone,
                    customer_street, customer_house_number, customer_apartment_number,
                    customer_floor, customer_city, customer_country,
                    items, dedication, purchase_timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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

            return result.rows[0];
        } catch (error) {
            console.error('❌ Error creating order:', error);
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
}

module.exports = new DatabaseController();

