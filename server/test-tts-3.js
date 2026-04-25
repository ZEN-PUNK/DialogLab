import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const currentGeminiApiKey = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentGeminiApiKey}`,
      { contents: [{ role: "user", parts: [{ text: "Hello world" }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("Request to gemini-2.5-flash success");
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
