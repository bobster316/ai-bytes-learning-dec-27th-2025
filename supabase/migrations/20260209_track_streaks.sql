
-- Function to update user engagement (Streak + XP)
CREATE OR REPLACE FUNCTION update_user_engagement()
RETURNS TRIGGER AS $$
DECLARE
    today DATE := CURRENT_DATE;
    last_act DATE;
    curr_streak INTEGER;
    long_streak INTEGER;
    xp_reward INTEGER := 10; -- 10 XP per lesson activity
BEGIN
    -- Get current stats
    SELECT last_activity_date, current_streak, longest_streak 
    INTO last_act, curr_streak, long_streak
    FROM public.user_profiles
    WHERE user_id = NEW.user_id;

    -- If no profile exists, nothing to do
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Update Streaks (only once per day)
    IF last_act IS NULL OR last_act < today THEN
        -- Activity logic
        IF last_act = today - INTERVAL '1 day' THEN
            curr_streak := curr_streak + 1;
        ELSEIF last_act < today - INTERVAL '1 day' OR last_act IS NULL THEN
            curr_streak := 1;
        END IF;

        IF curr_streak > long_streak THEN
            long_streak := curr_streak;
        END IF;
    END IF;

    -- Update the profile with XP and streaks
    -- Note: We add XP every time they engage (could be multiple times a day)
    UPDATE public.user_profiles
    SET 
        current_streak = COALESCE(curr_streak, current_streak),
        longest_streak = COALESCE(long_streak, longest_streak),
        total_xp = total_xp + xp_reward,
        last_activity_date = today,
        current_level = (total_xp + xp_reward) / 100 + 1, -- Level up every 100 XP
        updated_at = NOW()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak whenever lesson progress is updated
DROP TRIGGER IF EXISTS trigger_update_engagement ON public.user_lesson_progress;
CREATE TRIGGER trigger_update_engagement
    AFTER INSERT OR UPDATE ON public.user_lesson_progress
    FOR EACH ROW EXECUTE FUNCTION update_user_engagement();
