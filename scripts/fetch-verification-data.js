const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log('Could not load .env.local');
}

async function fetchData() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Find a course that has quizzes
        const courseRes = await client.query(`
      SELECT c.id, c.title 
      FROM courses c 
      JOIN course_topics t ON c.id = t.course_id 
      JOIN course_quizzes q ON t.id = q.topic_id 
      LIMIT 1
    `);

        if (courseRes.rows.length === 0) {
            console.log(JSON.stringify({ error: 'No suitable course found' }));
            return;
        }

        const course = courseRes.rows[0];

        // Get topics and quizzes for this course
        const topicsRes = await client.query(`
      SELECT t.id, t.title, t.order_index 
      FROM course_topics t 
      WHERE t.course_id = $1 
      ORDER BY t.order_index
    `, [course.id]);

        const topics = topicsRes.rows;

        // Get lessons and quizzes
        for (let t of topics) {
            const lessonsRes = await client.query(`SELECT id, title FROM course_lessons WHERE topic_id = $1 ORDER BY order_index LIMIT 1`, [t.id]);
            t.first_lesson = lessonsRes.rows[0];

            const quizRes = await client.query(`SELECT id, title FROM course_quizzes WHERE topic_id = $1`, [t.id]);
            if (quizRes.rows.length > 0) {
                t.quiz = quizRes.rows[0];
                // Get answers
                const answersRes = await client.query(`
            SELECT id, question_text, correct_answer 
            FROM quiz_questions 
            WHERE quiz_id = $1
         `, [t.quiz.id]);
                t.quiz.answers = answersRes.rows;
            }
        }

        console.log(JSON.stringify({ course, topics }, null, 2));

    } catch (err) {
        console.error(JSON.stringify({ error: err.message, stack: err.stack, fullError: err }));
    } finally {
        await client.end();
    }
}

fetchData();
