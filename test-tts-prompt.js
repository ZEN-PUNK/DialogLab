import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY;
async function test() {
  const text = "Hello there. I understand you";
  const prompt = `Please act as a Text-To-Speech engine. Repeat the following text exactly verbatim without adding any commentary or intro: "${text}"`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${key}`,
      {
        contents: [{ role: "user", parts: [{ text: text }] }],
        generationConfig: { responseModalities: ["TEXT", "AUDIO"] }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("Response text:", response.data.candidates[0].content.parts.find(p => p.text)?.text);
  } catch (e) { console.error(e.message); }
}
test();
