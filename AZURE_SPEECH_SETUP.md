# Azure Speech Text-to-Speech Integration Guide

This document explains how to set up and use Azure Speech Services for Text-to-Speech (TTS) in VOX LAB.

## Overview

VOX LAB now supports **two TTS providers**:
1. **Google Cloud Text-to-Speech** (default)
2. **Azure Speech Services** (new) - REST API based text-to-speech

You can switch between them at runtime without restarting the server.

## How Azure Speech TTS Works

VOX LAB uses the **Azure Speech Services Text-to-Speech REST API** which supports:
- Neural voices with natural sounding speech
- Multiple languages and locales
- SSML markup for fine-grained control
- Various audio output formats
- Real-time speech synthesis

## Setup

### Getting Azure Speech Credentials

1. **Create an Azure Account** (if you don't have one):
   - Visit https://azure.microsoft.com/
   - Sign up for a free account (includes $200 free credits)

2. **Create a Speech Services Resource**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Click "+ Create a resource"
   - Search for "Speech"
   - Click "Speech" service
   - Fill in details:
     - **Name**: Choose a name (e.g., `voxlab-speech`)
     - **Subscription**: Select your subscription
     - **Resource Group**: Create or select a group
     - **Region**: Choose your nearest region (e.g., `East US`, `Sweden Central`, `West Europe`)
     - **Pricing Tier**: Free (F0) or Standard (S0)
   - Click "Create" and wait for deployment (~1-2 minutes)

3. **Get Your Credentials**:
   - Once the resource is created, go to **Keys and Endpoint** (left sidebar)
   - Copy:
     - **Endpoint**: Your endpoint URL
     - **Key**: Either Key1 or Key2

### Endpoint Format

⚠️ **CRITICAL**: For **Text-to-Speech**, you MUST use the **REGIONAL endpoint**, NOT the resource endpoint.

**Correct Format for TTS** (by region):
```
https://{region}.tts.speech.microsoft.com
```

Examples:
```
https://eastus.tts.speech.microsoft.com
https://swedencentral.tts.speech.microsoft.com
https://westeurope.tts.speech.microsoft.com
```

**DO NOT use the Resource Endpoint for TTS**:
```
https://{resource-name}.cognitiveservices.azure.com  ❌ WRONG for TTS
```

Example of what NOT to use:
```
https://maivoice.cognitiveservices.azure.com  ❌ This will cause 404 errors
```

✓ Use the regional endpoint found on the "Keys and Endpoint" page under the region column.
✓ The endpoint should follow the pattern: `https://{region}.tts.speech.microsoft.com`

## Configuration

### Option 1: Using Environment Variables

Edit `.env` in the `server/` directory:

```env
# Choose provider: 'google' or 'azure'
TTS_PROVIDER=azure

# Azure Speech Text-to-Speech Configuration
# Use the endpoint from Azure Portal > Keys and Endpoint
AZURE_TTS_ENDPOINT=https://swedencentral.tts.speech.microsoft.com
# or if using custom resource:
# AZURE_TTS_ENDPOINT=https://voxlab-speech.cognitiveservices.azure.com

# API Key from Azure Portal
AZURE_TTS_KEY=your_azure_speech_api_key_here

# Google Text-to-Speech Configuration (backup)
TTS_API_KEY=
TTS_ENDPOINT=https://texttospeech.googleapis.com/v1/text:synthesize
```

**Important**: 
- Copy the exact endpoint from Azure Portal
- The endpoint must be the one provided in "Keys and Endpoint" section
- Don't add `/cognitiveservices/v1` yourself - VOX LAB adds it automatically

### Option 2: Using Runtime API

You can switch providers at runtime by calling:

```bash
POST http://localhost:3010/api/tts-provider
Content-Type: application/json

{
  "provider": "azure"
}
```

Response:
```json
{
  "status": "success",
  "currentProvider": "azure"
}
```

## Testing

### Test Azure Speech TTS

Run the included test script:

```bash
cd server
node test-azure-tts.js
```

This will:
1. Verify your Azure configuration
2. Construct SSML markup
3. Make a test TTS request
4. Save the audio as `test-azure-tts.mp3`
5. Report success or detailed error information

### Testing in VOX LAB UI

1. **Start the server**: `npm start` (from `server/`)
2. **Open VOX LAB** in your browser
3. **Create/Open a Conversation**:
   - With Azure TTS provider selected, all speech synthesis uses Azure
   - Responses will generate audio using Azure neural voices
4. **Monitor the server logs**:
   - Look for messages like: `Azure Speech TTS: Making API call to...`
   - Check for success: `Azure Speech TTS: Received audio response...`

## Available Voices

Azure Speech supports hundreds of neural voices across multiple languages:

### English US Voices (Examples):

| Voice | Gender | Features |
|-------|--------|----------|
| en-US-AriaNeural | Female | Professional, expressive |
| en-US-AmberNeural | Female | Friendly, warm |
| en-US-AshleyNeural | Female | Soft, calm |
| en-US-CoraNeural | Female | Bright, energetic |
| en-US-ChristopherNeural | Male | Deep, confident |
| en-US-EricNeural | Male | Young, warm |

For a complete list of all available voices and languages, see: [Azure Speech Service Languages](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=tts)

### How to Use Different Voices

When creating a conversation in VOX LAB and selecting avatar voices, the voice must match the Azure neural voice name:

- `en-US-AriaNeural` - US English, female
- `de-DE-BerndNeural` - German, male
- `fr-FR-DeniseNeural` - French, female
- `es-ES-AlvaroNeural` - Spanish, male
- `ja-JP-KeitaNeural` - Japanese, male
- `zh-CN-YunxiNeural` - Mandarin Chinese, male

## Speech Synthesis Features

### SSML Control

VOX LAB uses Speech Synthesis Markup Language (SSML) for advanced control:

```xml
<speak version='1.0' xml:lang='en-US'>
  <voice name='en-US-AriaNeural'>
    <prosody pitch='10%' rate='1.2'>
      This has higher pitch and faster speed.
    </prosody>
  </voice>
</speak>
```

Supported SSML features:
- **pitch**: -50% to +50%
- **rate**: 0.5x to 2.0x (speed)
- **volume**: Control loudness
- **styles**: Different speaking styles (news, chat, etc.)
- **emotions**: Express emotions in speech

### Audio Output Formats

VOX LAB uses: `audio-16khz-32kbitrate-mono-mp3`

Other available formats include:
- `audio-16khz-128kbitrate-mono-mp3` (higher quality)
- `audio-24khz-48kbitrate-mono-mp3` (better quality)
- `audio-48khz-192kbitrate-mono-mp3` (highest quality)
- Various WAV, OGG, and proprietary formats

## Switching Between Providers

Switch between Azure Speech and Google TTS at any time:

### Switch to Azure Speech
```bash
curl -X POST http://localhost:3010/api/tts-provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"azure"}'
```

### Check Current Provider
```bash
curl http://localhost:3010/api/tts-provider
```

Response:
```json
{
  "currentProvider": "azure"
}
```

## Troubleshooting

### Issue: "Azure TTS endpoint or key not configured"
**Solution**: Ensure both are set in `.env`:
```env
AZURE_TTS_ENDPOINT=https://swedencentral.tts.speech.microsoft.com
AZURE_TTS_KEY=your_key_here
```

### Issue: 401 Unauthorized
**Solution**: 
1. Verify your API key is correct
2. Key might have expired - regenerate in Azure Portal
3. Ensure you're using Key1 or Key2, not the endpoint

### Issue: 404 Not Found
**Solution**:
1. **Check endpoint format** - Most common issue!
   - ✓ CORRECT: `https://swedencentral.tts.speech.microsoft.com`
   - ❌ WRONG: `https://maivoice.cognitiveservices.azure.com` (resource endpoint)
   - Use the **REGIONAL endpoint** (from the region dropdown on "Keys and Endpoint" page), NOT the resource endpoint
2. Copy the exact endpoint from Azure Portal
3. Don't include `/cognitiveservices/v1` - VOX LAB adds it automatically
4. Verify the region exists and is active
5. Make sure you have a Speech resource (not just a Cognitive Services account)

### Issue: 403 Forbidden
**Solution**:
1. Check your subscription is active
2. Ensure your resource isn't disabled
3. Verify API key hasn't exceeded its quota
4. Check regional restrictions in Azure Portal

### Issue: No Audio Generated (Empty Response)
**Solution**:
1. Run `test-azure-tts.js` to test connectivity
2. Check server logs for error details
3. Verify your SSML voice name is valid
4. Try a different voice from the supported list

### Issue: Poor Audio Quality
**Solution**:
1. Try a different output format with higher bitrate
2. Use standard voices (e.g., AriaNeural) instead of custom
3. Adjust SSML pitch and rate appropriately
4. Ensure audio format matches playback requirements

### Issue: Slow Response Time
**Solution**:
1. First request might be slower (Azure warming up)
2. Subsequent requests should be 500-2000ms
3. Check your network connection
4. Verify your subscription tier isn't throttled

## Supported Regions

Azure Speech is available in 30+ regions worldwide:

**Popular Regions**:
```
eastus                  - East US
westus                  - West US  
westeurope              - West Europe
northeurope             - North Europe
eastasia                - East Asia
southeastasia           - Southeast Asia
swedencentral           - Sweden Central
japaneast               - Japan East
koreacentral            - Korea Central
brazilsouth             - Brazil South
canadacentral           - Canada Central
uksouth                 - UK South
```

For complete list, see [Azure Regions Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/regions)

## Performance & Cost

### Latency
- **First request**: 1-3 seconds (Azure resource startup)
- **Subsequent requests**: 500-1500ms average
- **Cached responses**: <500ms if audio is cached

### Pricing (as of 2024)
Azure Speech Free Tier (F0):
- 5,000 characters/month free

Azure Speech Standard (S0):
- ~$4 for 1 million characters
- Support for all voices and features

### Cost Optimization
1. Cache generated audio files
2. Use VOX LAB's batch synthesis for multiple segments
3. Choose appropriate voice for your region
4. Monitor usage in Azure Portal > Resource metrics

## API Implementation Details

### REST API Endpoint Structure

```
POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1

Headers:
- Ocp-Apim-Subscription-Key: <your-key>
- Content-Type: application/ssml+xml
- X-Microsoft-OutputFormat: audio-16khz-32kbitrate-mono-mp3
- User-Agent: VOX LAB/1.0

Body: SSML markup
```

### Request Example

```bash
curl -X POST \
  'https://swedencentral.tts.speech.microsoft.com/cognitiveservices/v1' \
  -H 'Ocp-Apim-Subscription-Key: YOUR_KEY' \
  -H 'Content-Type: application/ssml+xml' \
  -H 'X-Microsoft-OutputFormat: audio-16khz-32kbitrate-mono-mp3' \
  -d '<speak version="1.0" xml:lang="en-US"><voice name="en-US-AriaNeural">Hello world!</voice></speak>'
```

## Files Modified

- `server/tts.js` - Azure Speech TTS client implementation
- `server/test-azure-tts.js` - Test script for Azure connectivity
- `server/.env` - Configuration file
- `server/.env.example` - Configuration template

## Support & Documentation

- [Azure Speech Services Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Text-to-Speech REST API Reference](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech)
- [SSML Guide](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup-language)
- [Language and Voice Support](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support?tabs=tts)
