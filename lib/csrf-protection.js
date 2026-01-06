/**
 * CSRF Protection Middleware
 * Cross-Site Request Forgery protection for API endpoints
 */

/**
 * CSRF middleware
 * Basic pass-through for now - can be enhanced later with actual CSRF tokens
 */
function csrfMiddleware() {
  return function(req, res, next) {
    // Pass through - CSRF protection can be added here later
    // For bot-to-bot communication, CSRF is less critical as we use API keys
    next();
  };
}

module.exports = {
  csrfMiddleware
};
