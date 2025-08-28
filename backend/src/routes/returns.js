// backend/src/routes/returns.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Serve the Returns page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/returns.html'));
});

module.exports = router;
