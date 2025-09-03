// backend/src/app.js
const express = require('express');
require('dotenv').config();
const productsRouter = require('./routes/products');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use('/api/greeninvoice', require('./routes/greenInvoice'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coupons', require('./routes/coupons'));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Handle API routes that weren't matched above
app.all('/api/*', (req, res) => {
    console.log(`API route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'API endpoint not found' });
});

// Specific routes for React app pages
app.get('/admin', (req, res) => {
    console.log('Serving admin page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.get('/terms', (req, res) => {
    console.log('Serving terms page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.get('/returns', (req, res) => {
    console.log('Serving returns page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.get('/about', (req, res) => {
    console.log('Serving about page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Payment result routes
app.get('/payment/success', (req, res) => {
    console.log('Serving payment success page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.get('/payment/failure', (req, res) => {
    console.log('Serving payment failure page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

app.get('/payment/cancel', (req, res) => {
    console.log('Serving payment cancel page');
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Catch-all route: serve React app for all non-API routes
app.get('*', (req, res) => {
    console.log(`Serving React app for: ${req.path}`);
    res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

const PORT = process.env.PORT || 5001;

// Production-ready server startup
if (process.env.NODE_ENV === 'production') {
    // Production: minimal logging, use process.env.PORT
    app.listen(process.env.PORT, () => {
        console.log('🚀 Hamikdash backend deployed successfully');
        console.log('✅ Using Supabase cloud database');
    });
} else {
    // Development: detailed logging, local port
    app.listen(PORT, () => {
        console.log(`🔧 Backend running on port ${PORT}`);
        console.log('🔄 Development mode - detailed logging enabled');
        console.log('✅ Using Supabase cloud database - always accessible!');
    });
}