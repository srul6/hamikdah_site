const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const imagesToUpload = [
    { name: 'candle.jpg', path: 'candle.jpg' },
    { name: 'candle_related.jpg', path: 'candle_related.jpg' },
    { name: 'candleSticks.jpg', path: 'candleSticks.jpg' },
    { name: 'candle.png', path: "png's/candle.png" },
    { name: 'tfilin.jpg', path: 'tfilin.jpg' },
    { name: 'tfilin.png', path: "png's/tfilin.png" },
    { name: 'synagogue.jpg', path: 'synagogue.jpg' },
    { name: 'synagoge.png', path: "png's/synagoge.png" },
    { name: 'mikdash.jpg', path: 'mikdash.jpg' },
    { name: 'mikdash_related.jpeg', path: 'mikdash_related.jpeg' },
    { name: 'smallMikdash.png', path: "png's/smallMikdash.png" },
    { name: 'smallmikdash.jpg', path: 'smallmikdash.jpg' },
    { name: 'synagogue_related.jpg', path: 'synagogue_related.jpg' }
];

async function uploadImagesToSupabase() {
    try {
        console.log('Starting image upload to Supabase Storage...');

        const imagesPath = path.join(__dirname, '../public/images');

        for (const image of imagesToUpload) {
            try {
                const imagePath = path.join(imagesPath, image.path);
                const imageBuffer = await fs.readFile(imagePath);

                const { data, error } = await supabase.storage
                    .from('product-images')
                    .upload(image.name, imageBuffer, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (error) {
                    console.error(`Error uploading ${image.name}:`, error);
                } else {
                    console.log(`✅ Uploaded: ${image.name}`);
                }
            } catch (error) {
                console.error(`Error reading ${image.name}:`, error);
            }
        }

        console.log('Image upload completed!');

        // Get public URLs
        const { data: urls } = supabase.storage
            .from('product-images')
            .getPublicUrl('candle.jpg');

        console.log('Example public URL:', urls.publicUrl);

    } catch (error) {
        console.error('Script error:', error);
    }
}

uploadImagesToSupabase(); 