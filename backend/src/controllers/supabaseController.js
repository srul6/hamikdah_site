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
                .order('created_at', { ascending: false });

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
            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating product:', error);
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
}

module.exports = new SupabaseController(); 