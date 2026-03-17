// backend/src/routes/comments.js
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { requireAuth } = require('../middleware/authMiddleware');

function requireAdmin(req, res, next) {
    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    if (req.admin.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required'
        });
    }
    next();
}

// Get all comments
router.get('/', commentsController.getAllComments);

// Get comment by ID
router.get('/:id', commentsController.getCommentById);

// Create new comment (admin only)
router.post('/', requireAuth, requireAdmin, commentsController.createComment);

// Update comment (admin only)
router.put('/:id', requireAuth, requireAdmin, commentsController.updateComment);

// Delete comment (admin only)
router.delete('/:id', requireAuth, requireAdmin, commentsController.deleteComment);

module.exports = router;
