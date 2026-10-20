import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey || process.env.E2E_ALLOW_MUTATIONS !== 'true') {
  throw new Error('Set test credentials and E2E_ALLOW_MUTATIONS=true for an isolated test project before running this legacy script.');
}
const supabase = createClient(supabaseUrl, supabaseKey);
const accounts = {
  accountA: { email: process.env.E2E_USER_A_EMAIL, password: process.env.E2E_USER_A_PASSWORD },
  accountB: { email: process.env.E2E_USER_B_EMAIL, password: process.env.E2E_USER_B_PASSWORD },
  accountC: { email: process.env.E2E_USER_C_EMAIL, password: process.env.E2E_USER_C_PASSWORD },
  admin: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }
};

async function runFinalTests() {
  console.log('=== Final Two Tests ===\n');

  // Test 1: connection_requests Account C → Account B (should succeed)
  console.log('Test 1: connection_requests Account C → Account B (should succeed)');
  const { data: signInC, error: signInErrorC } = await supabase.auth.signInWithPassword({
    email: accounts.accountC.email,
    password: accounts.accountC.password
  });
  
  const { data: signInB, error: signInErrorB } = await supabase.auth.signInWithPassword({
    email: accounts.accountB.email,
    password: accounts.accountB.password
  });
  
  if (signInC?.session && signInB?.session) {
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: signInC.session.user.id,
        recipient_id: signInB.session.user.id,
        intent_category: 'networking',
        context_message: 'Final test request from C to B'
      })
      .select()
      .single();
    
    console.log('Result:', requestError ? 'FAIL - ' + requestError.message : 'PASS - Request created (201)');
    if (request) {
      console.log('Request ID:', request.id);
    }
  } else {
    console.log('FAIL - Sign-in failed:', signInErrorC?.message || signInErrorB?.message);
  }

  await supabase.auth.signOut();
  await supabase.auth.signOut();

  // Test 2: Password reset for test_a@example.com
  console.log('\nTest 2: Password Reset for test_a@example.com');
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(accounts.accountA.email, {
    redirectTo: 'http://localhost:8080/auth/reset'
  });
  console.log('Result:', resetError ? 'FAIL - ' + resetError.message : 'PASS - Reset request accepted');

  console.log('\n=== Final Tests Complete ===');
}

runFinalTests().catch(console.error);
