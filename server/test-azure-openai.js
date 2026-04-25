#!/usr/bin/env node

/**
 * Azure OpenAI Integration Test
 * Tests the Azure OpenAI LLM endpoint
 */

import dotenv from 'dotenv';
import { AzureOpenAI } from 'openai';

dotenv.config();

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.4-nano';
const AZURE_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

async function testAzureOpenAI() {
  console.log('🧪 Testing Azure OpenAI LLM Integration\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`  - Endpoint: ${AZURE_ENDPOINT ? '✓ Set' : '✗ Missing'}`);
  console.log(`  - API Key: ${AZURE_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`  - Deployment: ${AZURE_DEPLOYMENT}`);
  console.log(`  - API Version: ${AZURE_API_VERSION}`);

  if (!AZURE_ENDPOINT || !AZURE_KEY) {
    console.error('\n❌ Azure configuration incomplete. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY in .env');
    process.exit(1);
  }

  try {
    console.log(`\n🤖 Initializing Azure OpenAI client...`);
    
    const client = new AzureOpenAI({
      apiVersion: AZURE_API_VERSION,
      endpoint: AZURE_ENDPOINT,
      apiKey: AZURE_KEY,
    });

    console.log(`✅ Client initialized successfully`);

    console.log(`\n💬 Testing chat completion...`);
    console.log(`   Deployment: ${AZURE_DEPLOYMENT}`);
    console.log(`   Prompt: "I am going to Paris, what should I see?"`);

    const response = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "I am going to Paris, what should I see?",
        }
      ],
      max_completion_tokens: 256,
      model: AZURE_DEPLOYMENT
    });

    const content = response.choices[0].message.content;
    
    console.log(`\n✅ Success!`);
    console.log(`\n📝 Response:`);
    console.log(`   ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
    console.log(`\n   Full response length: ${content.length} characters`);

    console.log(`\n✅ Tokens used:`);
    console.log(`   - Input tokens: ${response.usage.prompt_tokens}`);
    console.log(`   - Output tokens: ${response.usage.completion_tokens}`);
    console.log(`   - Total tokens: ${response.usage.total_tokens}`);

    console.log(`\n🎉 Azure OpenAI integration is working correctly!`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.status) {
      console.error(`   Status: ${error.status}`);
    }
    if (error.error?.message) {
      console.error(`   Detail: ${error.error.message}`);
    }
    process.exit(1);
  }
}

testAzureOpenAI();
