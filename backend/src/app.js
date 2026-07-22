// backend/src/app.js
const express = require('express');
require('dotenv').config();
const productsRouter = require('./routes/products');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

/** Cache-Control: hashed webpack assets (CRA) — 1 year; images/video/fonts — 30 days; HTML — no cache */
const CACHE_IMMUTABLE_SEC = 31536000; // 1 year
const CACHE_MEDIA_SEC = 2592000; // 30 days

function setSpaBuildCacheHeaders(res, filePath) {
    const base = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (base === 'index.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
    }

    // CRA: main.<hash>.js/css and <id>.<hash>.chunk.js
    if (/\.[a-f0-9]{8,}\.(js|mjs|css)$/i.test(base) || /\.[a-f0-9]{8,}\.chunk\.(js|mjs|css)$/i.test(base)) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_IMMUTABLE_SEC}, immutable`);
        return;
    }

    const longCacheMediaExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.avif', '.bmp',
        '.mp4', '.webm', '.mov', '.m4v', '.woff', '.woff2', '.ttf', '.otf', '.eot'];
    if (longCacheMediaExt.includes(ext)) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_MEDIA_SEC}`);
        return;
    }

    if (ext === '.map') {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_IMMUTABLE_SEC}, immutable`);
        return;
    }

    if (ext === '.js' || ext === '.css') {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_IMMUTABLE_SEC}, immutable`);
        return;
    }

    if (base === 'asset-manifest.json' || base === 'manifest.json') {
        res.setHeader('Cache-Control', 'no-cache');
        return;
    }

    res.setHeader('Cache-Control', `public, max-age=${CACHE_MEDIA_SEC}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies
app.set('trust proxy', 1);

// CORS configuration - set FRONTEND_URL / BACKEND_URL in env; optional hardcoded origins below
const allowedOrigins = [
    'https://bmikdash.com',
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL?.replace(/\/api\/?$/, ''),
    'https://hamikdash.onrender.com',
    'https://hamikdah-site-fronteand.onrender.com',
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

// Serve product images statically (30-day cache)
app.use('/images', express.static(path.join(__dirname, '../public/images'), {
    setHeaders(res) {
        res.setHeader('Cache-Control', `public, max-age=${CACHE_MEDIA_SEC}`);
    }
}));

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

// Serve static files from the React build (hashed JS/CSS long cache; HTML no cache)
app.use(express.static(path.join(__dirname, '../../frontend/build'), {
    setHeaders: setSpaBuildCacheHeaders
}));

// Handle API routes that weren't matched above
app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// SPA routes: serve React app (always revalidate — fresh HTML after deploy)
const indexPath = path.join(__dirname, '../../frontend/build/index.html');
const sendIndex = (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
};
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