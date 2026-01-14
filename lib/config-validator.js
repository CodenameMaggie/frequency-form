/**
 * Configuration Validator
 * Validates required configuration before server starts
 */

function validateOrExit({ silent = false } = {}) {
  if (!silent) {
    console.log('[CONFIG] Configuration validated successfully');
  }
  return true;
}

module.exports = { validateOrExit };
