import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function test() {
  const prompt = `You are Alice, a friendly insurance adjuster...`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{text: prompt}] }],
    generationConfig: { maxOutputTokens: 150, temperature: 0.8 }
  });
  console.log(result.response);
}
test();
