/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 */

function validateEnvOrExit({ silent = false } = {}) {
  // Check for either FF_ prefixed or NEXT_PUBLIC_ prefixed vars
  const requiredVars = [
    { names: ['FF_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'], label: 'Supabase URL' },
    { names: ['FF_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'], label: 'Supabase Key' }
  ];

  const missing = [];

  for (const { names, label } of requiredVars) {
    const found = names.some(name => process.env[name]);
    if (!found) {
      missing.push(label);
    }
  }

  if (missing.length > 0) {
    if (!silent) {
      console.warn('[ENV] Warning - Missing environment variables:', missing.join(', '));
      console.warn('[ENV] Some features may not work correctly');
    }
    // Don't exit - allow server to start with reduced functionality
    return false;
  }

  if (!silent) {
    console.log('[ENV] All required environment variables are set');
  }

  return true;
}

module.exports = {
  validateEnvOrExit
};
