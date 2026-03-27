-- Check if video job IDs were stored for the latest course
SELECT 
    id,
    title,
    intro_video_job_id,
    intro_video_status,
    created_at
FROM courses
ORDER BY created_at DESC
LIMIT 1;

-- Check if video job IDs were stored for lessons
SELECT 
    cl.id,
    cl.title,
    cl.video_job_id,
    cl.video_status,
    ct.title as topic_title,
    c.title as course_title
FROM course_lessons cl
JOIN course_topics ct ON cl.topic_id = ct.id
JOIN courses c ON ct.course_id = c.id
WHERE c.id = (SELECT id FROM courses ORDER BY created_at DESC LIMIT 1)
ORDER BY cl.order_index;
