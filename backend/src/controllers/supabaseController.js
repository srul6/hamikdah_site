const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class SupabaseController {
    // Get all products
    async getAllProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Get product by ID
    async getProductById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    // Create new product
    async createProduct(productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    // Update product
    async updateProduct(id, updateData) {
        try {
            console.log('📝 Updating product:', id, 'with data:', updateData);

            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Supabase update error:', error);
                console.error('   Error details:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('✅ Product updated successfully:', data);
            return data;
        } catch (error) {
            console.error('❌ Error updating product:', error);
            console.error('   Error message:', error.message);
            console.error('   Error details:', error.details || 'No details');
            console.error('   Error hint:', error.hint || 'No hint');
            throw error;
        }
    }

    // Delete product
    async deleteProduct(id) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Cart operations
    async getCart() {
        try {
            const { data, error } = await supabase
                .from('cart')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching cart:', error);
            return [];
        }
    }

    async saveCart(cartItems) {
        try {
            // Clear existing cart
            await supabase.from('cart').delete().neq('id', 0);

            // Insert new cart items
            if (cartItems.length > 0) {
                const { error } = await supabase
                    .from('cart')
                    .insert(cartItems);

                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            throw error;
        }
    }

    // Image upload to Supabase Storage
    async uploadImage(file, folder = 'products') {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            console.log('📤 Uploading image to Supabase Storage:', fileName);

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('product-images') // Bucket name
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('❌ Supabase upload error:', error);
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            console.log('✅ Image uploaded successfully');
            console.log('   File path:', fileName);
            console.log('   Public URL:', publicUrlData.publicUrl);

            return {
                success: true,
                url: publicUrlData.publicUrl, // Return full Supabase URL
                path: fileName
            };
        } catch (error) {
            console.error('❌ Error uploading image:', error);
            throw error;
        }
    }

    // Delete image from Supabase Storage
    async deleteImage(filePath) {
        try {
            const { error } = await supabase.storage
                .from('product-images')
                .remove([filePath]);

            if (error) throw error;

            console.log('✅ Image deleted successfully:', filePath);
            return true;
        } catch (error) {
            console.error('❌ Error deleting image:', error);
            throw error;
        }
    }

    // Comments methods
    async getAllComments() {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching comments:', error);
            throw error;
        }
    }

    async getCommentById(id) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error fetching comment:', error);
            throw error;
        }
    }

    async createComment(commentData) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([commentData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error creating comment:', error);
            throw error;
        }
    }

    async updateComment(id, commentData) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .update(commentData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error updating comment:', error);
            throw error;
        }
    }

    async deleteComment(id) {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            throw error;
        }
    }

    // Reduce product quantity after successful purchase
    async reduceProductQuantity(productId, quantityToReduce) {
        try {
            console.log(`🔄 Reducing quantity for product ${productId} by ${quantityToReduce}`);

            // Get current product
            const { data: product, error: fetchError } = await supabase
                .from('products')
                .select('quantity')
                .eq('id', productId)
                .single();

            if (fetchError) {
                console.error('❌ Error fetching product:', fetchError);
                throw fetchError;
            }

            if (!product) {
                console.error(`❌ Product ${productId} not found`);
                throw new Error(`Product ${productId} not found`);
            }

            const currentQuantity = product.quantity || 0;
            const newQuantity = Math.max(0, currentQuantity - quantityToReduce); // Don't go below 0

            console.log(`📊 Product ${productId}: Current quantity: ${currentQuantity}, Reducing by: ${quantityToReduce}, New quantity: ${newQuantity}`);

            // Update quantity
            const { error: updateError } = await supabase
                .from('products')
                .update({ quantity: newQuantity })
                .eq('id', productId);

            if (updateError) {
                console.error('❌ Error updating product quantity:', updateError);
                throw updateError;
            }

            console.log(`✅ Successfully reduced product ${productId} quantity to ${newQuantity}`);
            return { success: true, newQuantity };
        } catch (error) {
            console.error('❌ Error reducing product quantity:', error);
            throw error;
        }
    }

    // ===== ORDERS MANAGEMENT =====

    async getAllOrders() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            throw error;
        }
    }

    async getOrderById(id) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error fetching order:', error);
            throw error;
        }
    }

    async getOrderByFormId(formId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('form_id', formId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error fetching order by form_id:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            // Parse the purchase timestamp
            // The format is "DD.MM.YYYY, HH:MM:SS" from he-IL locale
            let parsedTimestamp = new Date(); // Default to now

            if (orderData.purchaseTimestamp) {
                try {
                    // Parse "17.10.2025, 17:36:17" format
                    const timestampStr = orderData.purchaseTimestamp;
                    const [datePart, timePart] = timestampStr.split(', ');
                    const [day, month, year] = datePart.split('.');
                    const [hours, minutes, seconds] = timePart.split(':');

                    // Create date in Israel timezone
                    parsedTimestamp = new Date(
                        parseInt(year),
                        parseInt(month) - 1, // Months are 0-indexed
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

            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    form_id: orderData.formId,
                    document_id: orderData.documentId,
                    payment_id: orderData.paymentId,
                    status: orderData.status || 'pending',
                    amount: orderData.amount,
                    currency: orderData.currency || 'ILS',
                    customer_name: orderData.customerInfo.name,
                    customer_email: orderData.customerInfo.email,
                    customer_phone: orderData.customerInfo.phone,
                    customer_street: orderData.customerInfo.street,
                    customer_house_number: orderData.customerInfo.houseNumber,
                    customer_apartment_number: orderData.customerInfo.apartmentNumber,
                    customer_floor: orderData.customerInfo.floor,
                    customer_city: orderData.customerInfo.city,
                    customer_country: orderData.customerInfo.country,
                    items: orderData.items,
                    dedication: orderData.dedication,
                    purchase_timestamp: parsedTimestamp
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error creating order:', error);
            throw error;
        }
    }

    async updateOrder(id, orderData) {
        try {
            const updateFields = {};
            if (orderData.status) updateFields.status = orderData.status;
            if (orderData.documentId) updateFields.document_id = orderData.documentId;
            if (orderData.paymentId) updateFields.payment_id = orderData.paymentId;

            const { data, error } = await supabase
                .from('orders')
                .update(updateFields)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error updating order:', error);
            throw error;
        }
    }

    async updateOrderByFormId(formId, orderData) {
        try {
            const updateFields = {};
            if (orderData.status) updateFields.status = orderData.status;
            if (orderData.documentId) updateFields.document_id = orderData.documentId;
            if (orderData.paymentId) updateFields.payment_id = orderData.paymentId;

            const { data, error } = await supabase
                .from('orders')
                .update(updateFields)
                .eq('form_id', formId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Error updating order by form_id:', error);
            throw error;
        }
    }

    async deleteOrder(id) {
        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            throw error;
        }
    }
}

module.exports = new SupabaseController();