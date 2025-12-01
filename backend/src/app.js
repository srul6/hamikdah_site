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

// CORS configuration - allow both production and local development
const allowedOrigins = [
    'https://bmikdash.com',
    'http://localhost:3000',
    'http://localhost:3001',
    // Add Render frontend URL if different from backend
    process.env.FRONTEND_URL,
    // Allow same origin (if frontend and backend on same domain)
    process.env.BACKEND_URL?.replace('/api', ''),
    // Allow Render frontend domains
    'https://hamikdash.onrender.com',
    'https://hamikdash-frontend.onrender.com',
    'https://hamikdah-site.onrender.com'
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Log the blocked origin for debugging
        console.log('⚠️  CORS blocked origin:', origin);
        console.log('   Allowed origins:', allowedOrigins);

        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true // Allow cookies to be sent
}));

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
app.use('/api/upload', require('./routes/upload'));
app.use('/api/comments', require('./routes/comments'));

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