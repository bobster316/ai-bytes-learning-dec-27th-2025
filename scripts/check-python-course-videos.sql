-- Check the latest course for video job IDs
SELECT 
    id,
    title,
    intro_video_job_id,
    intro_video_status,
    created_at
FROM courses
WHERE title LIKE '%Python%'
ORDER BY created_at DESC
LIMIT 1;

-- Check lessons for the latest Python course
SELECT 
    cl.id,
    cl.title,
    cl.video_job_id,
    cl.video_status,
    ct.title as topic_title
FROM course_lessons cl
JOIN course_topics ct ON cl.topic_id = ct.id
JOIN courses c ON ct.course_id = c.id
WHERE c.title LIKE '%Python%'
ORDER BY c.created_at DESC, cl.order_index
LIMIT 10;
