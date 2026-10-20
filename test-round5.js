import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lmdswaagcdxulcczkqmu.supabase.co',
  'sb_publishable_vJuM53xDSIfO4KwZhWkjBA_hSbz-fOh'
);

// Round 5 credentials - use ONLY these
const accounts = {
  accountA: { email: 'test_a@example.com', password: 'password123' },
  accountB: { email: 'test_b@example.com', password: 'password123' },
  accountC: { email: 'test_c@example.com', password: 'password123' },
  admin: { email: 'admin@example.com', password: 'adminpassword123' }
};

async function runRound5Tests() {
  console.log('=== Round 5 Clean-Room Re-Test ===\n');

  // Issue 1: Badges FK Relationship
  console.log('Issue 1: Badges FK Relationship (profile_badge_awards join with badges)');
  const { data: signInA1, error: signInErrorA1 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  
  if (signInA1?.session) {
    const { data: badges, error: badgesError } = await supabase
      .from('profile_badge_awards')
      .select('*, badges(*)')
      .eq('user_id', signInA1.session.user.id);
    console.log('Result:', badgesError ? 'FAIL - ' + badgesError.message : (badges && badges.length > 0 ? 'PASS - Badges joined successfully: ' + badges.length + ' badges' : 'PASS - Query succeeded (no badges awarded)'));
    if (badges && badges.length > 0) {
      console.log('Sample badge:', badges[0]);
    }
  } else {
    console.log('Result: FAIL - Account A sign-in failed: ' + signInErrorA1?.message);
  }

  await supabase.auth.signOut();

  // Issue 2: connection_requests RLS (both success and blocked cases)
  console.log('\nIssue 2: connection_requests RLS');
  
  // Success case: Account C → Account B (both neutral, should succeed)
  const { data: signInC, error: signInErrorC } = await supabase.auth.signInWithPassword({
    email: accounts.accountC.email,
    password: accounts.accountC.password
  });
  
  const { data: signInB, error: signInErrorB } = await supabase.auth.signInWithPassword({
    email: accounts.accountB.email,
    password: accounts.accountB.password
  });
  
  if (signInC?.session && signInB?.session) {
    console.log('Success Case: Account C → Account B (should succeed)');
    const { error: successError } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: signInC.session.user.id,
        recipient_id: signInB.session.user.id,
        intent_category: 'networking',
        context_message: 'Test request from C to B'
      });
    console.log('Result:', successError ? 'FAIL - ' + successError.message : 'PASS - Request created successfully');
  }

  await supabase.auth.signOut();
  await supabase.auth.signOut();

  // Blocked case: Account B → Account A (A has blocked B, should fail)
  const { data: signInB2, error: signInErrorB2 } = await supabase.auth.signInWithPassword({
    email: accounts.accountB.email,
    password: accounts.accountB.password
  });
  
  const { data: signInA2, error: signInErrorA2 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  
  if (signInB2?.session && signInA2?.session) {
    console.log('Blocked Case: Account B → Account A (should be rejected)');
    const { error: blockedError } = await supabase
      .from('connection_requests')
      .insert({
        requester_id: signInB2.session.user.id,
        recipient_id: signInA2.session.user.id,
        intent_category: 'networking',
        context_message: 'Test blocked request from B to A'
      });
    console.log('Result:', blockedError ? 'PASS - Request blocked as expected: ' + blockedError.message : 'FAIL - Request succeeded (security issue!)');
  }

  await supabase.auth.signOut();
  await supabase.auth.signOut();

  // Issue 3: posts DELETE RLS with strict protocol
  console.log('\nIssue 3: posts DELETE RLS (strict protocol: create → delete → read)');
  
  // Step 1: Create a new post as Account A
  const { data: signInA3, error: signInErrorA3 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  
  let createdPostId = null;
  if (signInA3?.session) {
    const { data: newPost, error: createError } = await supabase
      .from('posts')
      .insert({ content: 'Round 5 strict protocol test post', user_id: signInA3.session.user.id })
      .select()
      .single();
    
    if (newPost && !createError) {
      createdPostId = newPost.id;
      console.log('Step 1 - Created post ID:', createdPostId);
    } else {
      console.log('Step 1 - FAIL: Could not create post:', createError?.message);
    }
  }

  await supabase.auth.signOut();

  // Step 2: Attempt DELETE as Account B
  if (createdPostId) {
    const { data: signInB3, error: signInErrorB3 } = await supabase.auth.signInWithPassword({
      email: accounts.accountB.email,
      password: accounts.accountB.password
    });
    
    if (signInB3?.session) {
      console.log('Step 2 - Account B attempting DELETE on post', createdPostId);
      const { error: deleteError, count } = await supabase
        .from('posts')
        .delete()
        .eq('id', createdPostId);
      console.log('Delete response:', deleteError ? 'Error: ' + deleteError.message : 'Success (rows affected: ' + count + ')');
    }

    await supabase.auth.signOut();

    // Step 3: Follow-up read to confirm post still exists
    console.log('Step 3 - Follow-up read to confirm post existence');
    const { data: postStillExists, error: readError } = await supabase
      .from('posts')
      .select('id, content')
      .eq('id', createdPostId)
      .single();
    
    if (postStillExists && !readError) {
      console.log('Result: PASS - Post still exists after delete attempt (RLS working)');
      console.log('Post state:', postStillExists);
    } else if (readError && readError.code === 'PGRST116') {
      console.log('Result: FAIL - Post was deleted (RLS not working!)');
    } else {
      console.log('Result: FAIL - Read error:', readError?.message);
    }
  }

  // Issue 4: Password reset
  console.log('\nIssue 4: Password Reset');
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(accounts.accountA.email, {
    redirectTo: 'http://localhost:8080/auth/reset'
  });
  console.log('Result:', resetError ? 'FAIL - ' + resetError.message : 'PASS - Reset request accepted (token/row should be created)');

  // Quick regression pass - Flows 2-5, 7, 9-12
  console.log('\n=== Quick Regression Pass ===');
  
  // Flow 2: Sign In
  const { data: signInA4, error: signInErrorA4 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  console.log('Flow 2: Sign In:', signInErrorA4 ? 'FAIL - ' + signInErrorA4.message : 'PASS');

  // Flow 3: Create Post
  if (signInA4?.session) {
    const { error: postError } = await supabase
      .from('posts')
      .insert({ content: 'Regression test post', user_id: signInA4.session.user.id });
    console.log('Flow 3: Create Post:', postError ? 'FAIL - ' + postError.message : 'PASS');
  }

  // Flow 4: Like Post
  if (signInA4?.session) {
    const { data: posts } = await supabase.from('posts').select('id').limit(1).single();
    if (posts) {
      const { error: likeError } = await supabase
        .from('likes')
        .insert({ user_id: signInA4.session.user.id, post_id: posts.id });
      console.log('Flow 4: Like Post:', likeError && !likeError.message.includes('duplicate') ? 'FAIL - ' + likeError.message : 'PASS');
    }
  }

  // Flow 5: Follow Startup
  if (signInA4?.session) {
    const { data: startup } = await supabase.from('startups').select('id').limit(1).single();
    if (startup) {
      const { error: followError } = await supabase
        .from('follows')
        .insert({ follower_id: signInA4.session.user.id, target_id: startup.id, target_type: 'startup' });
      console.log('Flow 5: Follow Startup:', followError && !followError.message.includes('duplicate') ? 'FAIL - ' + followError.message : 'PASS');
    }
  }

  await supabase.auth.signOut();

  // Flow 7: Bookmark Post
  const { data: signInA5 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  if (signInA5?.session) {
    const { data: bookmarkPost } = await supabase.from('posts').select('id').limit(1).single();
    if (bookmarkPost) {
      const { error: bookmarkError } = await supabase
        .from('bookmarks')
        .insert({ user_id: signInA5.session.user.id, post_id: bookmarkPost.id, post_source: 'user' });
      console.log('Flow 7: Bookmark Post:', bookmarkError && !bookmarkError.message.includes('duplicate') ? 'FAIL - ' + bookmarkError.message : 'PASS');
    }
  }

  // Flow 9: Intel Tab
  if (signInA5?.session) {
    const { data: follows } = await supabase.from('follows').select('id').eq('follower_id', signInA5.session.user.id);
    console.log('Flow 9: Intel Tab:', follows ? 'PASS' : 'FAIL');
  }

  await supabase.auth.signOut();

  // Flow 10: Admin Access
  const { data: signInAdmin } = await supabase.auth.signInWithPassword({
    email: accounts.admin.email,
    password: accounts.admin.password
  });
  if (signInAdmin?.session) {
    const { data: hasRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: signInAdmin.session.user.id, _role: 'admin' });
    console.log('Flow 10: Admin Access:', roleError ? 'FAIL - ' + roleError.message : (hasRole ? 'PASS' : 'FAIL'));
  }

  await supabase.auth.signOut();

  // Flow 11: Live Hub
  const { data: liveEvents, error: liveError } = await supabase.from('live_events').select('*').limit(1);
  console.log('Flow 11: Live Hub:', liveError ? 'FAIL - ' + liveError.message : 'PASS');

  // Flow 12: API Access
  const { data: signInA6 } = await supabase.auth.signInWithPassword({
    email: accounts.accountA.email,
    password: accounts.accountA.password
  });
  if (signInA6?.session) {
    const { data: apiKeys, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', signInA6.session.user.id);
    console.log('Flow 12: API Access:', apiKeyError ? 'FAIL - ' + apiKeyError.message : 'PASS');
  }

  await supabase.auth.signOut();

  console.log('\n=== Round 5 Testing Complete ===');
}

runRound5Tests().catch(console.error);
