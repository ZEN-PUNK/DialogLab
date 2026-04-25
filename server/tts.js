import path from "path";
import fs from "fs";
import { exec } from "child_process";
import os from "os";
import dotenv from "dotenv";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
// Load environment variables
dotenv.config();

let currentTtsApiKey = process.env.TTS_API_KEY || '';
let currentTtsProvider = process.env.TTS_PROVIDER || 'azure';
let currentGeminiApiKey = process.env.GEMINI_API_KEY || '';
let currentAzureTtsKey = process.env.AZURE_TTS_KEY || '';
let currentAzureTtsEndpoint = process.env.AZURE_TTS_ENDPOINT || '';

// Gemini TTS client - uses Gemini 2.0 Live API for text-to-speech
const geminiClient = {
  synthesizeSpeech: async (request) => {
    try {
      console.log(`[${new Date().toISOString()}] Gemini TTS: Making API call via Gemini SDK`);
      
      if (!currentGeminiApiKey) {
        throw new Error('Gemini API key not configured');
      }
      
      const text = request.input?.text || '';
      
      // Use Gemini API REST endpoint for text-to-speech audio generation
      // This uses the Audio generation capability of Gemini
      // Map incoming voices (like en-US-AriaNeural or en-GB-Standard-A) to Gemini voices
      let geminiVoice = "Aoede"; // female default
      const validVoices = ["Aoede", "Charon", "Fenrir", "Kore", "Puck"];
      if (request.voice?.name) {
        const vRaw = request.voice.name;
        const v = vRaw.toLowerCase();
        
        if (validVoices.includes(vRaw)) {
          geminiVoice = vRaw; // Already a valid Gemini voice
        } else if (v.includes("male") || v.includes("thomas") || v.includes("brian") || v.includes("charlie") || v.includes("ryan") || v.includes("christopher") || v.endsWith("-b") || v.endsWith("-d")) {
          geminiVoice = "Charon"; // mapped to male
        } else if (v.includes("aria") || v.includes("sonia") || v.includes("eve") || v.includes("jane") || v.includes("grace") || v.endsWith("-a") || v.endsWith("-c") || v.endsWith("-f")) {
          geminiVoice = "Aoede"; // mapped to female
        }
      }

      // Format prompt to ensure strictly TTS behavior
      const promptText = `Please act as a direct text-to-speech engine. Speak exactly the following text verbatim, without adding any conversational filler, sound effects, or descriptions:\n\n"${text}"`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${currentGeminiApiKey}`,
        {
          contents: [{
            role: "user",
            parts: [{
              text: promptText
            }]
          }],
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
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        const audioBase64 = response.data.candidates[0].content.parts[0].inlineData.data;
        const pcmBuffer = Buffer.from(audioBase64, 'base64');
        
        // Add WAV header for 24kHz, mono, 16-bit PCM
        const dataLen = pcmBuffer.length;
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        
        const header = Buffer.alloc(44);
        header.write('RIFF', 0);
        header.writeUInt32LE(dataLen + 36, 4); // File size - 8
        header.write('WAVE', 8);
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16); // Subchunk1Size
        header.writeUInt16LE(1, 20); // PCM format (1)
        header.writeUInt16LE(numChannels, 22);
        header.writeUInt32LE(sampleRate, 24);
        header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // Byte rate
        header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // Block align
        header.writeUInt16LE(bitsPerSample, 34);
        header.write('data', 36);
        header.writeUInt32LE(dataLen, 40);
        
        const wavBuffer = Buffer.concat([header, pcmBuffer]);
        console.log(`[${new Date().toISOString()}] Gemini TTS: Audio generated successfully`);
        return [{ audioContent: wavBuffer.toString('base64') }];
      } else {
        console.log(`[${new Date().toISOString()}] Gemini TTS: No audio in response, creating fallback`);
        // Fallback to Azure if Gemini doesn't return audio
        return await azureClient.synthesizeSpeech(request);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Gemini TTS API Error:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
      // Fall back to Azure TTS on error
      console.log(`[${new Date().toISOString()}] Gemini TTS: Falling back to Azure TTS`);
      return await azureClient.synthesizeSpeech(request);
    }
  }
};

// Google TTS client
const googleClient = {
  synthesizeSpeech: async (request) => {
    try {
      console.log(`[${new Date().toISOString()}] Google TTS: Making API call`);
      
      const apiRequest = {
        input: request.input,
        voice: request.voice,
        audioConfig: request.audioConfig
      };
      
      const response = await axios.post(
        process.env.TTS_ENDPOINT || "https://texttospeech.googleapis.com/v1/text:synthesize", 
        apiRequest, 
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": request.apiKey || currentTtsApiKey
          }
        }
      );

      console.log(`[${new Date().toISOString()}] Google TTS: Received response`);
      
      let audioContent;
      
      if (response.data.audioContent) {
        console.log(`[${new Date().toISOString()}] Google TTS: Audio content received (${response.data.audioContent.length / 1.33} bytes)`);
      } else {
        throw new Error("No audio content in response from Google TTS");
      }
      
      // Google API already returns base64, return it directly
      return [{ audioContent: response.data.audioContent }];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Google TTS API Error:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
      throw error;
    }
  }
};

// Helper function to map Google voice names to Azure voice names
function mapGoogleVoiceToAzure(googleVoiceName) {
  const voiceMap = {
    // Google Cloud TTS Standard voices (en-GB)
    'en-GB-Standard-A': 'en-GB-SoniaNeural',
    'en-GB-Standard-B': 'en-GB-ThomasNeural',
    'en-GB-Standard-C': 'en-GB-SoniaNeural',
    'en-GB-Standard-D': 'en-GB-ThomasNeural',
    'en-GB-Standard-F': 'en-GB-SoniaNeural',
    // Google Cloud TTS Standard voices (en-US)
    'en-US-Neural2-A': 'en-US-AriaNeural',
    'en-US-Neural2-C': 'en-US-GuyNeural',
    'en-US-Neural2-E': 'en-US-JennyNeural',
    'en-US-Standard-A': 'en-US-AriaNeural',
    'en-US-Standard-B': 'en-US-GuyNeural',
    'en-US-Standard-C': 'en-US-JennyNeural',
    'en-US-Standard-D': 'en-US-AriaNeural',
    // Custom voice name formats
    'en-US-male-brian': 'en-US-GuyNeural',
    'en-US-female-alice': 'en-US-AriaNeural',
    'en-GB-male-alan': 'en-GB-ThomasNeural',
    'en-GB-female-susan': 'en-GB-SoniaNeural'
  };
  
  // Always return a mapped voice, fallback to AriaNeural for unmapped voices
  const mappedVoice = voiceMap[googleVoiceName];
  if (mappedVoice) {
    console.log(`[${new Date().toISOString()}] Mapped Google voice "${googleVoiceName}" to Azure voice "${mappedVoice}"`);
    return mappedVoice;
  }
  
  console.log(`[${new Date().toISOString()}] No mapping found for voice "${googleVoiceName}", using default "en-US-AriaNeural"`);
  return 'en-US-AriaNeural';
}

// Azure TTS client
const azureClient = {
  synthesizeSpeech: async (request) => {
    try {
      console.log(`[${new Date().toISOString()}] Azure TTS: Making API call`);
      
      // Convert Google TTS request format to Azure SSML format
      let voiceName = request.voice?.name || 'en-US-AriaNeural';
      voiceName = mapGoogleVoiceToAzure(voiceName);  // Map Google voices to Azure
      const speakingRate = (request.audioConfig?.speakingRate || 1.0).toFixed(2);
      
      let ssml = `<speak version="1.0" xml:lang="en-US"><voice name="${voiceName}"><prosody rate="${speakingRate}">`;
      if (request.input.text) {
        ssml += request.input.text;
      } else if (request.input.ssml) {
        ssml += request.input.ssml.replace(/<speak>|<\/speak>/g, '');
      }
      ssml += '</prosody></voice></speak>';
      
      const response = await axios.post(
        `${currentAzureTtsEndpoint}/cognitiveservices/v1`,
        ssml,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': currentAzureTtsKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
          },
          params: {
            'api-version': '1.0'
          },
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`[${new Date().toISOString()}] Azure TTS: Received audio response (${response.data.length} bytes)`);
      
      // Azure returns direct audio content as Buffer - wrap it in the expected format
      return [{
        audioContent: Buffer.isBuffer(response.data) ? response.data.toString('base64') : response.data
      }];
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Azure TTS API Error:`, error.message);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }
      throw error;
    }
  }
};

console.log(`[${new Date().toISOString()}] TTS: Provider configured as "${currentTtsProvider}"`);

// Helper function to get the correct TTS client based on current provider
function getClient() {
  if (currentTtsProvider === 'azure') {
    console.log(`[${new Date().toISOString()}] TTS: Using Azure provider`);
    return azureClient;
  } else if (currentTtsProvider === 'gemini') {
    console.log(`[${new Date().toISOString()}] TTS: Using Gemini provider`);
    return geminiClient;
  } else {
    console.log(`[${new Date().toISOString()}] TTS: Using Google provider`);
    return googleClient;
  }
}

// Helper function to ensure directory exists
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

// Helper function to determine Rhubarb binary path
function determineRhubarbPath() {
  switch (os.platform()) {
    case "darwin": // macOS
      return path.join(process.cwd(), "Rhubarb-Lip-Mac", "rhubarb");
    case "win32": // Windows
      return path.join(process.cwd(), "Rhubarb_Lip", "rhubarb.exe");
    case "linux": // Linux
      return path.join(process.cwd(), "Rhubarb_Lip_Linux", "rhubarb");
    default: // Default case for other OS, if any
      throw new Error("Unsupported operating system for Rhubarb Lip Sync");
  }
}

/**
 * Sets up the TTS routes for Express
 * @param {Express} app - Express app instance
 * @param {number} port - Server port number
 */
// Route to the appropriate TTS client based on provider
const client = {
  synthesizeSpeech: async (request) => {
    if (currentTtsProvider === 'gemini') {
      return geminiClient.synthesizeSpeech(request);
    } else if (currentTtsProvider === 'azure') {
      return azureClient.synthesizeSpeech(request);
    } else {
      return googleClient.synthesizeSpeech(request);
    }
  }
};

export const setupTTSRoutes = (app, port) => {
  // Batch TTS processing endpoint
  app.post("/api/batch-synthesize", async (req, res) => {
    try {
      console.log(`[${new Date().toISOString()}] Batch TTS: Received request for batch synthesis`);
      
      const { segments } = req.body;
      
      if (!segments || !Array.isArray(segments) || segments.length === 0) {
        console.error(`[${new Date().toISOString()}] Batch TTS: Invalid request - no segments provided`);
        return res.status(400).json({ error: 'No segments provided' });
      }
      
      console.log(`[${new Date().toISOString()}] Batch TTS: Processing ${segments.length} segments`);
      console.log(`[${new Date().toISOString()}] Batch TTS: Segment IDs: ${segments.map(s => s.segmentId).join(', ')}`);
      
      // Create audio directory if it doesn't exist
      const audioDir = path.join(process.cwd(), "audio");
      if (!fs.existsSync(audioDir)) {
        console.log(`[${new Date().toISOString()}] Batch TTS: Creating audio directory at ${audioDir}`);
        fs.mkdirSync(audioDir, { recursive: true });
      } else {
        console.log(`[${new Date().toISOString()}] Batch TTS: Audio directory exists at ${audioDir}`);
      }
      
      // Process the segments with TTS
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      
      console.log(`[${new Date().toISOString()}] Batch TTS: Starting processing of ${segments.length} segments`);
      
      for (const [index, segment] of segments.entries()) {
        const { text, voiceSettings, segmentId } = segment;
        
        console.log(`[${new Date().toISOString()}] Batch TTS: Processing segment ${index + 1}/${segments.length} (ID: ${segmentId})`);
        console.log(`  - Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        console.log(`  - Voice: ${JSON.stringify(voiceSettings)}`);
        
        if (!text || !voiceSettings) {
          console.error(`[${new Date().toISOString()}] Batch TTS: Segment ${segmentId} missing text or voice settings`);
          results.push({
            segmentId,
            error: "Missing text or voice settings",
            success: false
          });
          failureCount++;
          continue;
        }
        
        try {
          // Generate speech for this segment
          console.log(`[${new Date().toISOString()}] Batch TTS: Calling TTS API for segment ${segmentId}`);
          const startTime = Date.now();
          
          const [response] = await getClient().synthesizeSpeech({
            input: { text },
            voice: {
              languageCode: voiceSettings.languageCode || "en-US",
              name: voiceSettings.name,
            },
            audioConfig: { 
              audioEncoding: "MP3", 
              speakingRate: voiceSettings.rate || 1.0,
              pitch: voiceSettings.pitch || 0,
            },
          });
          
          const apiDuration = Date.now() - startTime;
          console.log(`[${new Date().toISOString()}] Batch TTS: TTS API response received for segment ${segmentId} (took ${apiDuration}ms)`);
          
          // Create a unique filename for this segment
          const fileName = `segment-${segmentId.replace(/[^\w\-\.]/g, '_')}-${uuidv4()}.mp3`;
          const filePath = path.join(process.cwd(), "audio", fileName);
          ensureDirectoryExistence(filePath);

          // Save the audio file
          const audioBuffer = typeof response.audioContent === 'string' ? Buffer.from(response.audioContent, 'base64') : response.audioContent;
          await fs.promises.writeFile(filePath, audioBuffer);
          console.log(`[${new Date().toISOString()}] Batch TTS: Audio file saved for segment ${segmentId}: ${fileName}`);

          let audioUrl;
          if (process.env.NODE_ENV === "development") {
            // Construct the proper URL for the audio file
            audioUrl = `http://localhost:${port}/audio/${encodeURIComponent(fileName)}`;
          } else {
            audioUrl = `https://chatlab.3dvar.com/server/audio/${encodeURIComponent(fileName)}`;
          }
          console.log(`[${new Date().toISOString()}] Batch TTS: Audio URL created: ${audioUrl}`);

          // Add the result to our array
          results.push({
            segmentId,
            audioUrl,
            success: true
          });
          successCount++;
        } catch (segmentError) {
          console.error(`[${new Date().toISOString()}] Batch TTS: Error processing segment ${segmentId}:`, segmentError);
          results.push({
            segmentId,
            error: segmentError.message,
            success: false
          });
          failureCount++;
        }
      }
      
      console.log(`[${new Date().toISOString()}] Batch TTS: Processing complete. Success: ${successCount}, Failed: ${failureCount}`);
      
      res.json({
        results,
        totalSuccess: successCount,
        totalFailed: failureCount
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Batch TTS: Fatal error in batch synthesis:`, error);
      res.status(500).json({ error: "Error in batch synthesis" });
    }
  });

  // TalkingHead TTS endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      console.log(`[${new Date().toISOString()}] TalkingHead TTS: Received request`);
      
      // Extract the request body that would normally go directly to Google's API
      const { input, voice, audioConfig, enableTimePointing } = req.body;
      
      if (!input || !voice) {
        console.error(`[${new Date().toISOString()}] TalkingHead TTS: Invalid request - missing input or voice`);
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      console.log(`[${new Date().toISOString()}] TalkingHead TTS: Processing request with voice: ${voice.name}`);
      
      // Make the request to the configured TTS provider
      const [response] = await getClient().synthesizeSpeech({
        input: input,
        voice: voice,
        audioConfig: audioConfig,
        apiKey: req.headers['x-tts-key'] || undefined
      });
      
      // audioContent is already base64 from the client, use directly
      const audioContentBase64 = typeof response.audioContent === 'string' 
        ? response.audioContent 
        : response.audioContent.toString('base64');
      
      console.log(`[${new Date().toISOString()}] TalkingHead TTS: Sending ${audioContentBase64.length} chars of base64 audio`);
      
      // Return the response in the format expected by TalkingHead
      res.json({
        audioContent: audioContentBase64,
        timepoints: [] // Add logic for timepoints if needed
      });
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] TalkingHead TTS: Error:`, error);
      res.status(500).json({ error: "Error processing TTS request" });
    }
  });

  // Single text-to-speech synthesis endpoint with lip sync
  app.post("/synthesize", async (req, res) => {
    const { text, voiceSettings } = req.body;

    try {
      const [response] = await getClient().synthesizeSpeech({
        input: { text },
        voice: {
          languageCode: voiceSettings.languageCode,
          name: voiceSettings.name,
        },
        audioConfig: { audioEncoding: "LINEAR16" },
      });

      const filePath = path.join(
        process.cwd(),
        "audio",
        `${voiceSettings.name}-${Date.now()}.wav`,
      );
      ensureDirectoryExistence(filePath);

      const audioBuffer = typeof response.audioContent === 'string' ? Buffer.from(response.audioContent, 'base64') : response.audioContent;
      await fs.promises.writeFile(filePath, audioBuffer);

      const rhubarbPath = determineRhubarbPath();
      const jsonFilePath = filePath.replace(".wav", ".json");

      // Process with Rhubarb lip sync
      exec(
        `${rhubarbPath} -f json "${filePath}" -o "${jsonFilePath}"`,
        (error, stderr, stdout) => {
          if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send("Error generating lip sync data");
          }
          if (stderr) console.error(`stderr: ${stderr}`);
          console.log(`stdout: ${stdout}`);

          if (process.env.NODE_ENV === "development") {
            res.json({
              audioUrl: `http://localhost:${port}/audio/${encodeURIComponent(path.basename(filePath))}`,
              jsonUrl: `http://localhost:${port}/audio/${encodeURIComponent(path.basename(jsonFilePath))}`,
            });
          } else {
            res.json({
              audioUrl: `https://chatlab.3dvar.com/server/audio/${encodeURIComponent(path.basename(filePath))}`,
              jsonUrl: `https://chatlab.3dvar.com/server/audio/${encodeURIComponent(path.basename(jsonFilePath))}`,
            });
          }
        },
      );
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Error synthesizing speech");
    }
  });
};

// Export the TTS client for use in other parts of the application
export { client as ttsClient };

// Runtime key management
export function setTtsApiKey(apiKey) {
  currentTtsApiKey = apiKey || '';
}

export function setGeminiTtsApiKey(apiKey) {
  currentGeminiApiKey = apiKey || '';
  console.log(`[${new Date().toISOString()}] Gemini TTS API key configured`);
}

export function setTtsProvider(provider) {
  if (['google', 'azure', 'gemini'].includes(provider)) {
    currentTtsProvider = provider;
    console.log(`[${new Date().toISOString()}] TTS Provider switched to: ${provider}`);
  } else {
    console.error(`Invalid TTS provider: ${provider}. Must be 'google', 'azure', or 'gemini'`);
  }
}

export function getTtsProvider() {
  return currentTtsProvider;
}

export function isTtsConfigured() {
  if (currentTtsProvider === 'gemini') {
    return Boolean(currentGeminiApiKey && String(currentGeminiApiKey).trim().length > 0);
  } else if (currentTtsProvider === 'azure') {
    return Boolean(currentAzureTtsKey && currentAzureTtsEndpoint);
  } else {
    return Boolean(currentTtsApiKey && String(currentTtsApiKey).trim().length > 0);
  }
}
