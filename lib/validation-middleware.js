/**
 * Validation Middleware
 * Input validation for API endpoints
 */

/**
 * Validate input middleware
 * Basic pass-through for now - can be enhanced later
 */
function validateInput(req, res, next) {
  // Pass through - validation can be added here later
  next();
}

/**
 * Get validated data from request
 */
function getValidatedData(req) {
  return {
    ...req.body,
    ...req.query,
    ...req.params
  };
}

module.exports = {
  validateInput,
  getValidatedData
};
