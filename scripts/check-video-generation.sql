-- Comprehensive check of video generation status for all recent courses
-- Check Course 639 (most recent)
SELECT 
    'COURSE 639' as check_type,
    c.id,
    c.title,
    c.intro_video_job_id,
    c.intro_video_status,
    c.created_at
FROM courses c
WHERE c.id = 639;

-- Check Topics for Course 639
SELECT 
    'TOPICS FOR 639' as check_type,
    ct.id,
    ct.title,
    ct.intro_video_job_id,
    ct.intro_video_status,
    ct.order_index
FROM course_topics ct
WHERE ct.course_id = 639
ORDER BY ct.order_index;

-- Check Lessons for Course 639
SELECT 
    'LESSONS FOR 639' as check_type,
    cl.id,
    cl.title,
    cl.video_job_id,
    cl.video_status,
    ct.title as topic_title
FROM course_lessons cl
JOIN course_topics ct ON cl.topic_id = ct.id
WHERE ct.course_id = 639
ORDER BY ct.order_index, cl.order_index;

-- Check all courses with video generation attempts
SELECT 
    'ALL COURSES WITH VIDEO ATTEMPTS' as check_type,
    c.id,
    c.title,
    c.intro_video_job_id,
    c.intro_video_status,
    c.created_at,
    (SELECT COUNT(*) FROM course_topics WHERE course_id = c.id) as topic_count
FROM courses c
WHERE c.created_at > NOW() - INTERVAL '24 hours'
ORDER BY c.created_at DESC;
