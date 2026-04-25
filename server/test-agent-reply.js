import { setGeminiApiKey } from './providers/geminiAPI.js';
import Agent from './agent.js';
import dotenv from 'dotenv';
dotenv.config();

setGeminiApiKey(process.env.GEMINI_API_KEY);

async function test() {
  const agent = new Agent("Alice", "Friendly", "neutral", false, {role: "Adjuster"}, "none", false, 0.3, "Claims Adjuster.");
  const ppr = agent.postProcessResponse;
  agent.postProcessResponse = function(response) {
      console.log(response);
      return ppr.call(agent, response);
  }
  const msg = await agent.reply("Hello Alice, I have a new claim.", "Topic: Auto Claim.", "Bob", { interrupt: false, vibe: "neutral" }, {maxTokens: 150}, false);
  console.log(msg);
}
test();
