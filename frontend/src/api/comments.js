// frontend/src/api/comments.js
import { API_BASE_URL } from '../config';

const API_ENDPOINTS = {
    comments: `${API_BASE_URL}/api/comments`
};

export async function fetchComments() {
    try {
        const response = await fetch(API_ENDPOINTS.comments);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

export async function fetchCommentById(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.comments}/${id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching comment:', error);
        throw error;
    }
}

export async function createComment(commentData) {
    try {
        const response = await fetch(API_ENDPOINTS.comments, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(commentData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
}

export async function updateComment(id, commentData) {
    try {
        const response = await fetch(`${API_ENDPOINTS.comments}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(commentData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
}

export async function deleteComment(id) {
    try {
        const response = await fetch(`${API_ENDPOINTS.comments}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
}
