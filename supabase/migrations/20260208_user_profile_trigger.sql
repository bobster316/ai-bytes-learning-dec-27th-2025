-- Migration: 20260208_user_profile_trigger.sql
-- Description: Ensures every new user gets a user_profiles entry automatically.

-- Function to create initial user profile
CREATE OR REPLACE FUNCTION create_initial_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id, 
        total_xp, 
        current_level, 
        xp_to_next_level,
        current_streak,
        longest_streak,
        total_lessons_completed,
        total_cards_reviewed,
        total_cards_mastered,
        total_time_learning_ms
    )
    VALUES (
        NEW.id, 
        0, 
        1, 
        100,
        0,
        0,
        0,
        0,
        0,
        0
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile for new users
-- Note: We add this alongside the existing on_auth_user_created for subscriptions
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_initial_user_profile();
