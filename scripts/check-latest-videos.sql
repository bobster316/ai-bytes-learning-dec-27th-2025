
SELECT 
    v.id, 
    v.video_job_id, 
    v.status, 
    v.meta, 
    c.title as course_title, 
    l.title as lesson_title
FROM videos v
LEFT JOIN lessons l ON v.lesson_id = l.id
LEFT JOIN modules m ON l.module_id = m.id
LEFT JOIN courses c ON m.course_id = c.id
ORDER BY v.created_at DESC
LIMIT 5;
