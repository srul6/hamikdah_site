// backend/src/app.js
const express = require('express');
require('dotenv').config();
const productsRouter = require('./routes/products');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// CORS configuration - set FRONTEND_URL / BACKEND_URL in env; optional hardcoded origins below
const allowedOrigins = [
    'https://bmikdash.com',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL?.replace(/\/api\/?$/, ''),
    'https://hamikdash.onrender.com',
    'https://hamikdash-frontend.onrender.com',
    'https://hamikdah-site.onrender.com'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️  CORS blocked origin:', origin);
        }
        return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    },
    credentials: true
}));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Serve product images statically
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// API routes - these must come BEFORE the catch-all route
app.use('/api/products', productsRouter);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/greeninvoice', require('./routes/greenInvoice'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/feedback', require('./routes/feedback'));

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Handle API routes that weren't matched above
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// SPA routes: serve React app
const sendIndex = (req, res) => res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
app.get('/admin', sendIndex);
app.get('/terms', sendIndex);
app.get('/site-terms', sendIndex);
app.get('/privacy', sendIndex);
app.get('/returns', sendIndex);
app.get('/about', sendIndex);
app.get('/payment/success', sendIndex);
app.get('/payment/failure', sendIndex);
app.get('/payment/cancel', sendIndex);
app.get('*', sendIndex);

const PORT = process.env.PORT || 5001;

// Production-ready server startup
if (process.env.NODE_ENV === 'production') {
    // Production: minimal logging, use process.env.PORT
    app.listen(process.env.PORT, () => {
        console.log('🚀 Hamikdash backend deployed successfully');
        console.log('✅ Using Neon PostgreSQL + Cloudflare R2');
    });
} else {
    // Development: detailed logging, local port
    app.listen(PORT, () => {
        console.log(`🔧 Backend running on port ${PORT}`);
        console.log('🔄 Development mode - detailed logging enabled');
        console.log('✅ Using Neon PostgreSQL + Cloudflare R2 - always accessible!');
    });
}