-- Check video generation status for course 643
SELECT 
    'COURSE' as type,
    c.id,
    c.title,
    c.intro_video_job_id as job_id,
    c.intro_video_status as status
FROM courses c
WHERE c.id = 643

UNION ALL

SELECT 
    'TOPIC' as type,
    ct.id,
    ct.title,
    ct.intro_video_job_id as job_id,
    ct.intro_video_status as status
FROM course_topics ct
WHERE ct.course_id = 643
ORDER BY type, id;
