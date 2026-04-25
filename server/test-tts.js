import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const currentGeminiApiKey = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const text = 'Hello world';
    const geminiVoice = 'Aoede';
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentGeminiApiKey}`,
      {
        contents: [{ role: "user", parts: [{ text: text }] }],
      }
    );
    console.log("Response:", response.data);
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
