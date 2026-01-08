/**
 * Console Override for Production
 * Silences console.log, console.debug, and console.info in production
 * Keeps console.warn and console.error for important messages
 */

if (process.env.NODE_ENV === 'production') {
  // Store original methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // Override console methods
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};

  // Keep warn and error
  console.warn = originalWarn;
  console.error = originalError;

  // Log that override is active
  console.warn('[Console Override] Production mode: console.log/debug/info silenced');
} else {
  // Development mode - keep all console methods
  console.log('[Console Override] Development mode: all console methods active');
}

module.exports = {};
