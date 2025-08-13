const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
    try {
        console.log('Checking products table schema...');
        
        // Get table info
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('Sample product data:');
            console.log(JSON.stringify(data[0], null, 2));
            
            console.log('\nAvailable columns:');
            console.log(Object.keys(data[0]));
        } else {
            console.log('No products found in table');
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

checkTableSchema(); 