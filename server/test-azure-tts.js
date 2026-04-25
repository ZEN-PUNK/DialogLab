#!/usr/bin/env node

/**
 * Azure Speech TTS Integration Test
 * Tests the Azure Speech Text-to-Speech endpoint
 */

import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const AZURE_ENDPOINT = process.env.AZURE_TTS_ENDPOINT;
const AZURE_KEY = process.env.AZURE_TTS_KEY;

async function testAzureTTS() {
  console.log('🧪 Testing Azure Speech Text-to-Speech Integration\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`  - Endpoint: ${AZURE_ENDPOINT ? '✓ Set' : '✗ Missing'}`);
  console.log(`  - API Key: ${AZURE_KEY ? '✓ Set' : '✗ Missing'}`);

  if (!AZURE_ENDPOINT || !AZURE_KEY) {
    console.error('\n❌ Azure configuration incomplete. Please set AZURE_TTS_ENDPOINT and AZURE_TTS_KEY in .env');
    process.exit(1);
  }

  try {
    // Test text
    const testText = "Hello! This is a test of Azure Speech Text-to-Speech integration.";
    const voiceName = "en-US-AriaNeural";

    // Build SSML according to Azure Speech REST API specification
    const ssml = `<speak version='1.0' xml:lang='en-US'><voice name='${voiceName}'><prosody pitch='0%' rate='1.0'>${escapeXml(testText)}</prosody></voice></speak>`;

    console.log(`\n🎙️  Testing TTS with voice: ${voiceName}`);
    console.log(`   Text: "${testText}"`);

    // Normalize endpoint URL
    let ttsUrl;
    if (!AZURE_ENDPOINT.includes('/cognitiveservices/v1')) {
      ttsUrl = `${AZURE_ENDPOINT.replace(/\/$/, '')}/cognitiveservices/v1`;
    } else {
      ttsUrl = AZURE_ENDPOINT;
    }

    console.log(`   Endpoint: ${ttsUrl}`);
    console.log(`   SSML: ${ssml}`);

    const response = await axios.post(ttsUrl, ssml, {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'VOX LAB-Test/1.0'
      },
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data);
    const testAudioPath = './test-azure-tts.mp3';
    
    // Save test audio
    fs.writeFileSync(testAudioPath, audioBuffer);

    console.log(`\n✅ Success!`);
    console.log(`   - Audio generated successfully`);
    console.log(`   - File size: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`   - Saved to: ${testAudioPath}`);
    console.log(`\n🎉 Azure Speech TTS is working correctly!`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data}`);
    }
    process.exit(1);
  }
}

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

testAzureTTS();
