// backend/src/app.js
const express = require('express');
require('dotenv').config();
const productsRouter = require('./routes/products');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Serve product images statically
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// API routes
app.use('/api/products', productsRouter);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/cardcom', require('./routes/cardcom'));

// Static page routes
app.use('/terms', require('./routes/terms'));
app.use('/returns', require('./routes/returns'));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log('Using Supabase cloud database - always accessible!');
});