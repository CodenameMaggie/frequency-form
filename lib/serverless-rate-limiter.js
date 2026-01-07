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

module.exports = {
  checkRateLimit,
  createRateLimiter,
  RateLimiter: createRateLimiter
};
