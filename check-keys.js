
require('dotenv').config({ path: '.env.local' });

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Present" : "Missing");
console.log("ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "Present" : "Missing");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
