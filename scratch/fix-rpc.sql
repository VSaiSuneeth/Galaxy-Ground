-- Fix accept_connection_rpc to match the notifications schema
create or replace function public.accept_connection_rpc(p_request_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_request record;
  v_thread_id uuid;
  v_part_a uuid;
  v_part_b uuid;
  v_recipient_profile record;
begin
  -- Fetch connection request
  select * into v_request from public.connection_requests where id = p_request_id;
  if not found then
    raise exception 'Connection request not found';
  end if;

  if v_request.status != 'pending' then
    raise exception 'Connection request is not pending';
  end if;

  -- Verify current user is recipient
  if auth.uid() != v_request.recipient_id then
    raise exception 'Unauthorized to accept this request';
  end if;

  -- Determine ordered participants
  v_part_a := least(v_request.sender_id, v_request.recipient_id);
  v_part_b := greatest(v_request.sender_id, v_request.recipient_id);

  -- Insert or fetch message thread
  insert into public.message_threads (participant_a, participant_b, created_at, last_message_at)
  values (v_part_a, v_part_b, now(), now())
  on conflict (participant_a, participant_b) do update
    set last_message_at = now()
  returning id into v_thread_id;

  -- Update request status
  update public.connection_requests
  set status = 'accepted', thread_id = v_thread_id, responded_at = now()
  where id = p_request_id;

  -- Fetch recipient details
  select display_name, username into v_recipient_profile from public.profiles where user_id = v_request.recipient_id;

  -- Insert system notification for the sender with correct columns
  insert into public.notifications (
    user_id,
    kind,
    account_type,
    account_id,
    account_name,
    account_handle,
    title,
    preview,
    link,
    read,
    created_at
  )
  values (
    v_request.sender_id,
    'connection_accepted',
    'user',
    v_request.recipient_id,
    coalesce(v_recipient_profile.display_name, 'Someone'),
    v_recipient_profile.username,
    'Connection Request Accepted',
    coalesce(v_recipient_profile.display_name, 'Someone') || ' accepted your connection request.',
    '/messages/' || v_thread_id,
    false,
    now()
  );

  return v_thread_id;
end;
$$;


-- Fix block_user_rpc to match the notifications schema
create or replace function public.block_user_rpc(p_blocked_id uuid)
returns void language plpgsql security definer as $$
declare
  v_blocker_id uuid;
  v_blocker_profile record;
begin
  v_blocker_id := auth.uid();
  if v_blocker_id = p_blocked_id then
    raise exception 'Cannot block yourself';
  end if;

  -- Insert user block row
  insert into public.user_blocks (blocker_id, blocked_id, created_at)
  values (v_blocker_id, p_blocked_id, now())
  on conflict do nothing;

  -- Sever connection requests
  update public.connection_requests
  set status = 'blocked', responded_at = now()
  where (sender_id = v_blocker_id and recipient_id = p_blocked_id)
     or (sender_id = p_blocked_id and recipient_id = v_blocker_id);

  -- Fetch blocker profile
  select display_name, username into v_blocker_profile from public.profiles where user_id = v_blocker_id;

  -- Create soft notification for the blocked user (to tell them they cannot message this person)
  insert into public.notifications (
    user_id,
    kind,
    account_type,
    account_id,
    account_name,
    account_handle,
    title,
    preview,
    read,
    created_at
  )
  values (
    p_blocked_id,
    'block_alert',
    'user',
    v_blocker_id,
    coalesce(v_blocker_profile.display_name, 'Someone'),
    v_blocker_profile.username,
    'Block Alert',
    'You cannot message this person.',
    false,
    now()
  );
end;
$$;
