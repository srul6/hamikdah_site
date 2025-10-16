// backend/src/routes/comments.js
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');

// Get all comments
router.get('/', commentsController.getAllComments);

// Get comment by ID
router.get('/:id', commentsController.getCommentById);

// Create new comment
router.post('/', commentsController.createComment);

// Update comment
router.put('/:id', commentsController.updateComment);

// Delete comment
router.delete('/:id', commentsController.deleteComment);

module.exports = router;
