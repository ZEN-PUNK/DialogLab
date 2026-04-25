import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
async function test() {
  const text = "Hello there. I understand you";
  
  const getAudioSize = async (promptMsg) => {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${key}`,
        {
          contents: [{ role: "user", parts: [{ text: promptMsg }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return response.data.candidates[0].content.parts[0].inlineData.data.length;
    } catch(e) {
      return e.response?.data?.error?.message || e.message;
    }
  };

  console.log("Raw text size:", await getAudioSize(text));
  const instruction = `Please act as a direct text-to-speech engine. Speak exactly the following text verbatim, without adding any conversational filler, sound effects, or descriptions:\n\n"${text}"`;
  console.log("Instructed text size:", await getAudioSize(instruction));
}
test();
