// backend/src/app.js
const express = require('express');
require('dotenv').config();
const productsRouter = require('./routes/products');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Serve product images statically
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// API routes - these must come BEFORE the catch-all route
app.use('/api/products', productsRouter);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/cardcom', require('./routes/cardcom'));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Catch-all route: serve React app for all non-API routes
app.get('*', (req, res) => {
    // Check if this is an API route that wasn't handled
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log('Using Supabase cloud database - always accessible!');
});