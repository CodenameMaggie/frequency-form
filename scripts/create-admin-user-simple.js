/**
 * Create Admin User in Supabase
 * Usage: node scripts/create-admin-user-simple.js [password]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = 'henry@frequencyandform.com';

async function createAdminUser() {
  console.log('===========================================');
  console.log('F&F Admin User Creation');
  console.log('===========================================');
  console.log('');

  // Get password from command line args or use default
  const password = process.argv[2] || 'henryff2026';

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
  }

  console.log('Creating admin user...');
  console.log('Email:', ADMIN_EMAIL);

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
        console.log('You can:');
        console.log('1. Login with existing credentials at http://localhost:3000/admin/login');
        console.log('2. Reset password via Supabase dashboard');
        console.log('   https://supabase.com/dashboard/project/kzazlevvatuqbslzdjjb/auth/users');
        console.log('');
        return;
      }
      throw error;
    }

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔒 Password:', password);
    console.log('');
    console.log('Login at:');
    console.log('  - Local:  http://localhost:3000/admin/login');
    console.log('  - Prod:   https://frequencyandform.com/admin/login');
    console.log('');
    console.log('User ID:', data.user.id);
    console.log('');
    console.log('⚠️  IMPORTANT: Change your password after first login!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error creating admin user:', error.message);
    console.error('');
    process.exit(1);
  }
}

createAdminUser();
