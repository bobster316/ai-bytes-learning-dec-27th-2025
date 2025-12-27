
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function test() {
    console.log("Key:", process.env.GEMINI_API_KEY ? "Found" : "Missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    try {
        const result = await model.generateContent("Hello?");
        console.log("Result:", result.response.text());
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
