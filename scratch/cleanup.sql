-- Clean up all connection requests, messages, and threads between User 1 and User 2
DELETE FROM public.messages WHERE sender_id IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f');
DELETE FROM public.message_threads WHERE participant_a IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f') OR participant_b IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f');
DELETE FROM public.connection_requests WHERE sender_id IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f') OR recipient_id IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f');
DELETE FROM public.notifications WHERE user_id IN ('ee2cdc16-9f46-4b9d-a055-55745f599aea', '2617e1b5-f2f1-40a7-8693-a20b44d39d0f');
