import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
async function test() {
  const text = "Hello there. I understand you";
  const promptText = `Repeat exactly what is quoted here without adding introductory or conclusive remarks:\n\n"${text}"`;
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${key}`,
      {
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("Request succeeded, size:", response.data.candidates[0].content.parts[0].inlineData.data.length);
  } catch (e) {
    console.error(e.response?.data?.error?.message || e.message);
  }
}
test();
