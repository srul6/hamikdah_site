const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
    {
        id: 1,
        name: "נר שבת",
        description: "נר שבת מסורתי לבית הכנסת",
        price: 25.00,
        image: "candle.jpg"
    },
    {
        id: 2,
        name: "תפילין",
        description: "תפילין כשרות למהדרין",
        price: 150.00,
        image: "tfilin.jpg"
    },
    {
        id: 3,
        name: "בית כנסת",
        description: "דגם בית כנסת מעוצב",
        price: 75.00,
        image: "synagogue.jpg"
    },
    {
        id: 4,
        name: "המקדש",
        description: "דגם בית המקדש",
        price: 120.00,
        image: "mikdash.jpg"
    }
];

async function updateSupabaseData() {
    try {
        console.log('Starting Supabase data update...');

        // Clear existing products
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .neq('id', 0);

        if (deleteError) {
            console.error('Error clearing products:', deleteError);
            return;
        }

        console.log('Cleared existing products');

        // Insert new products
        const { data, error } = await supabase
            .from('products')
            .insert(products);

        if (error) {
            console.error('Error inserting products:', error);
            return;
        }

        console.log('Successfully updated Supabase with new product data!');
        console.log('Products inserted:', data);

    } catch (error) {
        console.error('Script error:', error);
    }
}

updateSupabaseData(); 