$body = '{"courseName":"Intro to Transformer Architecture","difficultyLevel":"beginner","targetDuration":30,"numberOfTopics":1,"lessonsPerTopic":2}'
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/course/generate-v2" -Method POST -ContentType "application/json" -Body $body
$response.Content
