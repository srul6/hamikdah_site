// backend/src/routes/terms.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Serve the Terms of Service page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/terms.html'));
});

module.exports = router;
