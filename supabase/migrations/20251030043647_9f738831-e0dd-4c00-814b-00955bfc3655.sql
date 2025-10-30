-- Make user_id nullable in support_messages
ALTER TABLE public.support_messages 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.support_messages;

-- New policies that allow both authenticated and anonymous users
CREATE POLICY "Authenticated users can view their own messages"
  ON public.support_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert messages"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    -- Either user is authenticated and user_id matches
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- Or user is not authenticated and user_id is null
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );