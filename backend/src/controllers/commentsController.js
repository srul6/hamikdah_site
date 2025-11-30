// backend/src/controllers/commentsController.js
const { databaseController } = require('../config/database');

// Get all comments
exports.getAllComments = async (req, res) => {
    try {
        const comments = await databaseController.getAllComments();
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Get comment by ID
exports.getCommentById = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await databaseController.getCommentById(id);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json(comment);
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ error: 'Failed to fetch comment' });
    }
};

// Create new comment
exports.createComment = async (req, res) => {
    try {
        const commentData = req.body;
        const newComment = await databaseController.createComment(commentData);
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
};

// Update comment
exports.updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const commentData = req.body;
        const updatedComment = await databaseController.updateComment(id, commentData);
        if (!updatedComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json(updatedComment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
};

// Delete comment
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await databaseController.deleteComment(id);
        if (!success) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};
