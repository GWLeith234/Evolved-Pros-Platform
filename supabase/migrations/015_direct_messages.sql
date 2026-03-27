-- Conversations: one row per thread between two users
CREATE TABLE IF NOT EXISTS public.conversations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_two_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_unique_pair UNIQUE (participant_one_id, participant_two_id),
  CONSTRAINT conversations_no_self_chat CHECK (participant_one_id <> participant_two_id)
);

-- Messages: rows belonging to a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (char_length(body) <= 2000),
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON public.conversations(participant_one_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON public.conversations(participant_two_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message    ON public.conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_messages_conversation         ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender               ON public.messages(sender_id);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- Conversations: participants only
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- Messages: only participants in the conversation can read
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );

-- Only sender can insert
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Recipient can mark as read (update read_at only)
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one_id = auth.uid() OR c.participant_two_id = auth.uid())
    )
  );

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
