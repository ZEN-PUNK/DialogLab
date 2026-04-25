import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    response.data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => console.log(m.name, m.supportedGenerationMethods, m.inputTokenLimit));
  } catch (e) {
    console.log(e.message);
  }
}
test();
