ALTER POLICY "insert_own_posts" ON posts
WITH CHECK (
  auth.uid() = user_id
  AND (SELECT count(*) FROM posts
       WHERE user_id = auth.uid()
       AND created_at > now() - interval '1 hour') < 20
);