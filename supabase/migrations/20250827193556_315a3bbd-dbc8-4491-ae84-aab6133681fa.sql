-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  hiking_experience TEXT CHECK (hiking_experience IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create hiking groups table
CREATE TABLE public.hiking_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'hard', 'expert')),
  max_members INTEGER DEFAULT 20,
  is_private BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for hiking groups
ALTER TABLE public.hiking_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for hiking groups
CREATE POLICY "Groups are viewable by everyone" 
ON public.hiking_groups 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create groups" 
ON public.hiking_groups 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" 
ON public.hiking_groups 
FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Group owners can delete their groups" 
ON public.hiking_groups 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add trigger for groups
CREATE TRIGGER update_hiking_groups_updated_at
  BEFORE UPDATE ON public.hiking_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.hiking_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS for group members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for group members
CREATE POLICY "Group members are viewable by group members" 
ON public.group_members 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = group_members.group_id
  ) OR 
  auth.uid() IN (
    SELECT owner_id FROM public.hiking_groups WHERE id = group_members.group_id
  )
);

CREATE POLICY "Users can join groups" 
ON public.group_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups or owners can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT owner_id FROM public.hiking_groups WHERE id = group_members.group_id
  )
);

-- Create hiking events table
CREATE TABLE public.hiking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  group_id UUID NOT NULL REFERENCES public.hiking_groups(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'hard', 'expert')),
  max_participants INTEGER DEFAULT 15,
  meeting_point TEXT,
  equipment_needed TEXT[],
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for hiking events
ALTER TABLE public.hiking_events ENABLE ROW LEVEL SECURITY;

-- Create policies for hiking events
CREATE POLICY "Events are viewable by group members" 
ON public.hiking_events 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = hiking_events.group_id
  ) OR 
  auth.uid() IN (
    SELECT owner_id FROM public.hiking_groups WHERE id = hiking_events.group_id
  )
);

CREATE POLICY "Group members can create events" 
ON public.hiking_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = organizer_id AND
  auth.uid() IN (
    SELECT user_id FROM public.group_members WHERE group_id = hiking_events.group_id
  )
);

CREATE POLICY "Event organizers can update their events" 
ON public.hiking_events 
FOR UPDATE 
USING (auth.uid() = organizer_id);

CREATE POLICY "Event organizers can delete their events" 
ON public.hiking_events 
FOR DELETE 
USING (auth.uid() = organizer_id);

-- Add trigger for events
CREATE TRIGGER update_hiking_events_updated_at
  BEFORE UPDATE ON public.hiking_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();