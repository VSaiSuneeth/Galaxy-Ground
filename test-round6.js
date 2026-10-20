import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lmdswaagcdxulcczkqmu.supabase.co',
  'sb_publishable_vJuM53xDSIfO4KwZhWkjBA_hSbz-fOh'
);

const accounts = {
  accountA: { email: 'test_a@example.com', password: 'password123' },
  accountB: { email: 'test_b@example.com', password: 'password123' },
  accountC: { email: 'test_c@example.com', password: 'password123' },
  admin: { email: 'admin@example.com', password: 'adminpassword123' },
  testFinal: { email: 'test_final_sanity@example.com', password: 'password123' }
};

async function runRound6Tests() {
  console.log('=== Round 6 Final Tests ===\n');

  // Test 1: connection_requests Account C → Account B with ALL required fields
  console.log('Test 1: connection_requests Account C → Account B (with all required fields)');
  const { data: signInC, error: signInErrorC } = await supabase.auth.signInWithPassword({
    email: accounts.accountC.email,
    password: accounts.accountC.password
  });
  
  const { data: signInB, error: signInErrorB } = await supabase.auth.signInWithPassword({
    email: accounts.accountB.email,
    password: accounts.accountB.password
  });
  
  if (signInC?.session && signInB?.session) {
    const requestBody = {
      requester_id: signInC.session.user.id,
      recipient_id: signInB.session.user.id,
      intent_category: 'Networking',
      context_message: 'Test message from C to B - Round 6'
    };
    
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const { data: request, error: requestError } = await supabase
      .from('connection_requests')
      .insert(requestBody)
      .select()
      .single();
    
    if (requestError) {
      console.log('Response Body:', JSON.stringify({
        message: requestError.message,
        code: requestError.code,
        details: requestError.details,
        hint: requestError.hint
      }, null, 2));
      console.log('Result: FAIL - ' + requestError.message);
    } else {
      console.log('Response Body:', JSON.stringify(request, null, 2));
      console.log('Result: PASS - Request created (201)');
    }
  } else {
    console.log('FAIL - Sign-in failed:', signInErrorC?.message || signInErrorB?.message);
  }

  await supabase.auth.signOut();
  await supabase.auth.signOut();

  // Test 2: Password reset for clean account test_final_sanity@example.com
  console.log('\nTest 2: Password Reset for test_final_sanity@example.com');
  const { error: resetError, data: resetData } = await supabase.auth.resetPasswordForEmail(accounts.testFinal.email, {
    redirectTo: 'http://localhost:8080/auth/reset'
  });
  
  if (resetError) {
    console.log('Response Body:', JSON.stringify({
      message: resetError.message,
      code: resetError.code,
      details: resetError.details
    }, null, 2));
    console.log('Result: FAIL - ' + resetError.message);
  } else {
    console.log('Response Body:', JSON.stringify(resetData, null, 2));
    console.log('Result: PASS - Reset request accepted');
  }

  console.log('\n=== Round 6 Tests Complete ===');
}

runRound6Tests().catch(console.error);
