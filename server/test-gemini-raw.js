import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function test() {
  const prompt = `You are Alice, a Friendly insurance professional. 

Claims Handling Approach:
1. Listen empathetically to the claimant's situation
Role & Responsibilities: Adjuster

Respond naturally (1-2 sentences) in a professional but caring manner.
Ask follow-up questions if needed to clarify details.
After you speak, Bob will respond.
Last message: Hello Alice, I have a new claim.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{text: prompt}] }],
    generationConfig: { maxOutputTokens: 150, temperature: 0.8 }
  });
  console.log(result.response.text());
}
test();
