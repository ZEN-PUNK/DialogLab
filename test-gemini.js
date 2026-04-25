import { generateText } from './providers/llmProvider.js';
import dotenv from 'dotenv';
dotenv.config();
async function test() {
  try {
    const response = await generateText("Hello! What is your name?");
    console.log("Response:", response);
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
