/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 */

function validateEnvOrExit({ silent = false } = {}) {
  const requiredVars = [
    'FF_SUPABASE_URL',
    'FF_SUPABASE_SERVICE_ROLE_KEY'
  ];

  const optionalVars = [
    'FF_ANTHROPIC_API_KEY' // Optional - system will use other AI providers if not set
  ];

  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    if (!silent) {
      console.error('❌ Missing required environment variables:');
      missing.forEach(v => console.error(`   - ${v}`));
      console.error('\nPlease set these in Railway or .env file');
    }
    process.exit(1);
  }

  if (!silent) {
    console.log('✅ All required environment variables are set');

    // Warn about optional vars
    const missingOptional = optionalVars.filter(v => !process.env[v]);
    if (missingOptional.length > 0) {
      console.warn('⚠️  Optional environment variables not set:');
      missingOptional.forEach(v => console.warn(`   - ${v}`));
    }
  }

  return true;
}

module.exports = {
  validateEnvOrExit
};
