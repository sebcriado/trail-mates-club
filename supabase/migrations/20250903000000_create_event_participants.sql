-- Create event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.hiking_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS for event participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for event participants
CREATE POLICY "Event participants are viewable by group members" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.hiking_events he
    JOIN public.group_members gm ON gm.group_id = he.group_id
    WHERE he.id = event_participants.event_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join events if they are group members" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.hiking_events he
    JOIN public.group_members gm ON gm.group_id = he.group_id
    WHERE he.id = event_participants.event_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can leave events" 
ON public.event_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);
