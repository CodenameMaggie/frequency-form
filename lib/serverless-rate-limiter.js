/**
 * Serverless Rate Limiter Stub
 * Minimal implementation for bot server to load
 */

async function checkRateLimit(identifier, options = {}) {
  // Stub - always allow requests
  return {
    allowed: true,
    remaining: options.limit || 100,
    reset: Date.now() + (options.window || 60000)
  };
}

function createRateLimiter(options = {}) {
  return {
    check: (identifier) => checkRateLimit(identifier, options),
    reset: async (identifier) => { console.log(`[Stub] Reset rate limit for ${identifier}`); }
  };
}

// Middleware function for AI rate limiting
function aiRateLimit(handler) {
  return async (req, res) => {
    // Stub - no rate limiting, just pass through
    return handler(req, res);
  };
}

module.exports = {
  checkRateLimit,
  createRateLimiter,
  RateLimiter: createRateLimiter,
  aiRateLimit
};
