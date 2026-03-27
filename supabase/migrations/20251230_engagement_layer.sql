
-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id BIGINT REFERENCES course_lessons(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Card content
  front TEXT NOT NULL, 
  back TEXT NOT NULL,  
  card_type TEXT NOT NULL CHECK (card_type IN ('concept', 'code', 'application', 'definition')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
  
  -- Additional context
  hint TEXT,
  explanation TEXT,
  code_example TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User card progress (SM-2 Algorithm)
CREATE TABLE IF NOT EXISTS user_card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  
  -- SM-2 Algorithm variables
  ease_factor FLOAT DEFAULT 2.5,    
  interval INTEGER DEFAULT 1,        
  repetitions INTEGER DEFAULT 0,     
  
  -- Review tracking
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  
  -- Performance
  average_response_time INTEGER, 
  last_quality INTEGER,          
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, flashcard_id)
);

-- Review sessions
CREATE TABLE IF NOT EXISTS review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  cards_reviewed INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  
  session_type TEXT DEFAULT 'daily' CHECK (session_type IN ('daily', 'lesson', 'cram'))
);

-- Gamification tables
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- XP & Levels
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  
  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Stats
  total_lessons_completed INTEGER DEFAULT 0,
  total_cards_reviewed INTEGER DEFAULT 0,
  total_cards_mastered INTEGER DEFAULT 0,
  total_time_learning_ms BIGINT DEFAULT 0,
  
  -- Preferences
  daily_goal_cards INTEGER DEFAULT 20,
  daily_goal_lessons INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_url TEXT,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_card_progress_next_review ON user_card_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_card_progress_status ON user_card_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_flashcards_lesson ON flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_course ON flashcards(course_id);

-- Quality Assurance Columns
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quality_score INTEGER;
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS quality_breakdown JSONB;

-- Topic Video Support
ALTER TABLE course_topics ADD COLUMN IF NOT EXISTS video_url TEXT;
