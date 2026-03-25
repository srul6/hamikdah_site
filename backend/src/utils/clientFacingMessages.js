/**
 * Short, non-revealing messages for JSON responses to browsers / untrusted clients.
 * Log specifics with console.error / console.warn on the server only.
 */
module.exports = {
    BAD_REQUEST: 'Unable to process your request.',
    PAYMENT_START_FAILED: 'Unable to start payment. Please try again later.',
    ORDER_REJECTED: 'Unable to process your request.',
    FEEDBACK_REJECTED: 'Unable to process your request.',
    WEBHOOK_REJECTED: 'Bad request'
};
