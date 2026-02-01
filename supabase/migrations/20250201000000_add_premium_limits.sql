-- Migration pour ajouter les limitations premium
-- Gratuit: 1 groupe créé, 10 événements/an
-- Premium: illimité

-- Fonction pour compter les groupes dont l'utilisateur est propriétaire
CREATE OR REPLACE FUNCTION count_user_owned_groups(check_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM hiking_groups
        WHERE owner_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les événements créés par l'utilisateur dans l'année
CREATE OR REPLACE FUNCTION count_user_events_this_year(check_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM hiking_events
        WHERE organizer_id = check_user_id
        AND created_at >= DATE_TRUNC('year', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur peut créer un groupe
CREATE OR REPLACE FUNCTION can_create_group(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Premium: illimité
    IF is_premium(check_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Gratuit: maximum 1 groupe
    RETURN count_user_owned_groups(check_user_id) < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur peut créer un événement
CREATE OR REPLACE FUNCTION can_create_event(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Premium: illimité
    IF is_premium(check_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Gratuit: maximum 10 événements par an
    RETURN count_user_events_this_year(check_user_id) < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer les anciennes policies si elles existent
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.hiking_groups;
    DROP POLICY IF EXISTS "Group members can create events" ON public.hiking_events;
END $$;

-- Créer les nouvelles policies avec vérification des limites
CREATE POLICY "Authenticated users can create groups"
ON public.hiking_groups
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = owner_id
    AND can_create_group(auth.uid())
);

CREATE POLICY "Group members can create events"
ON public.hiking_events
FOR INSERT
WITH CHECK (
    auth.uid() = organizer_id
    AND auth.uid() IN (
        SELECT user_id FROM public.group_members WHERE group_id = hiking_events.group_id
    )
    AND can_create_event(auth.uid())
);
