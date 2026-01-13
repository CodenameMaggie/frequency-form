/**
 * Create Admin User in Supabase
 * Creates henry@frequencyandform.com admin account
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'henry@frequencyandform.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askPassword() {
  return new Promise((resolve) => {
    rl.question('Enter password for henry@frequencyandform.com (min 6 characters): ', (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  console.log('===========================================');
  console.log('F&F Admin User Creation');
  console.log('===========================================');
  console.log('');

  // Get password from user
  const password = await askPassword();
  rl.close();

  if (!password || password.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
  }

  console.log('');
  console.log('Creating admin user...');

  try {
    // Create user with admin service role
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Henry',
        role: 'admin'
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('');
        console.log('⚠️  User already exists!');
        console.log('');
        console.log('To reset password, go to:');
        console.log('https://supabase.com/dashboard/project/kzazlevvatuqbslzdjjb/auth/users');
        console.log('');
        return;
      }
      throw error;
    }

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔒 Password: [hidden]');
    console.log('');
    console.log('Login at:');
    console.log('  - Local:  http://localhost:3000/admin/login');
    console.log('  - Prod:   https://frequencyandform.com/admin/login');
    console.log('');
    console.log('User ID:', data.user.id);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error creating admin user:', error.message);
    console.error('');
    process.exit(1);
  }
}

createAdminUser();
