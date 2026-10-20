-- Add unique constraint to message_threads table for participant_a and participant_b
ALTER TABLE public.message_threads
ADD CONSTRAINT unique_participants UNIQUE (participant_a, participant_b);
