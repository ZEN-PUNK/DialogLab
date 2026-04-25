import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const currentGeminiApiKey = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const text = 'Hello world';
    const geminiVoice = 'Aoede';
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentGeminiApiKey}`,
      {
        contents: [{ role: "user", parts: [{ text: text }] }],
        generationConfig: {
             responseModalities: ["AUDIO"],
             speechConfig: {
               voiceConfig: {
                 prebuiltVoiceConfig: {
                   voiceName: geminiVoice
                 }
               }
             }
          }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log("Response mode:", Object.keys(response.data));
    console.log("Candidate 0:", JSON.stringify(response.data.candidates[0].content.parts).substring(0, 100));
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}
test();
