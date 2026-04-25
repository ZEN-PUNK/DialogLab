import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const currentGeminiApiKey = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${currentGeminiApiKey}`,
      {
        contents: [{ role: "user", parts: [{ text: "Hello world" }] }],
        generationConfig: {
             responseModalities: ["AUDIO"],
             speechConfig: {
               voiceConfig: {
                 prebuiltVoiceConfig: {
                   voiceName: "Aoede"
                 }
               }
             }
          }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log(JSON.stringify(response.data.candidates[0].content.parts[0]).substring(0, 150));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
