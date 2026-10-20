-- Create a security definer function to check message rate limits and avoid RLS recursion
create or replace function public.check_message_rate_limit(p_thread_id uuid, p_sender_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.messages
  where thread_id = p_thread_id
    and sender_id = p_sender_id
    and created_at > now() - interval '1 hour';
  return v_count < 50;
end;
$$;

-- Drop and recreate the insert policy on messages using the security definer helper
drop policy if exists "Thread participants can insert messages" on public.messages;

create policy "Thread participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.message_threads
      where id = thread_id
      and (participant_a = auth.uid() or participant_b = auth.uid())
      and not public.are_users_blocked(participant_a, participant_b)
    )
    and public.check_message_rate_limit(thread_id, auth.uid())
  );
