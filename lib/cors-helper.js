/**
 * CORS Helper Stub
 * Minimal implementation for bot server to load
 */

function corsMiddleware(req, res, next) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (next) next();
}

module.exports = {
  corsMiddleware,
  enableCORS: corsMiddleware,
  cors: corsMiddleware
};
