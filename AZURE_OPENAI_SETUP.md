# Azure OpenAI Integration Guide

This document explains how to set up and use Azure OpenAI (LLM) in VOX LAB.

## Overview

VOX LAB now supports **three LLM providers**:
1. **OpenAI** (GPT-4, GPT-3.5-Turbo)
2. **Google Gemini** (default)
3. **Azure OpenAI** (new) - GPT-5, GPT-4, Turbo models

You can switch between them at runtime without restarting the server.

## Setup

### Getting Azure OpenAI Credentials

1. **Create an Azure Account** (if you don't have one):
   - Visit https://azure.microsoft.com/
   - Sign up for a free account (includes $200 free credits)

2. **Create an Azure OpenAI Resource**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Click "Create a resource"
   - Search for "Azure OpenAI"
   - Click "Create"
   - Fill in details:
     - **Name**: Choose a name (e.g., `voxlab-openai`)
     - **Subscription**: Select your subscription
     - **Resource Group**: Create or select a group
     - **Region**: Choose your nearest region
     - **Pricing Tier**: Standard S0
   - Click "Create" and wait for deployment

3. **Deploy a Model**:
   - Once the resource is created, go to "Model deployments"
   - Click "Create new deployment"
   - Select a model (e.g., `gpt-4`, `gpt-4-turbo`, or `gpt-5.4-nano`)
   - Set deployment name (e.g., `gpt-5.4-nano`)
   - Click "Create"

4. **Get Your Credentials**:
   - Go to "Keys and Endpoint" (left sidebar)
   - Copy:
     - **Endpoint**: Your endpoint URL (e.g., `https://deepsim.cognitiveservices.azure.com/`)
     - **Key**: Either Key1 or Key2
     - **Deployment**: The deployment name you created (e.g., `gpt-5.4-nano`)

### Configuration

#### Option 1: Using Environment Variables

Edit `.env` in the `server/` directory:

```env
# Choose provider: 'openai', 'gemini', or 'azure'
LLM_PROVIDER=azure

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://deepsim.cognitiveservices.azure.com/
AZURE_OPENAI_KEY=8tN0lWRVW1Qjes4q3hlo295BfjiuhMkgx6lKElj7NrRsvSTtYFu...
AZURE_OPENAI_DEPLOYMENT=gpt-5.4-nano
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

**Important**: 
- `AZURE_OPENAI_ENDPOINT` should be your resource endpoint from Azure Portal
- `AZURE_OPENAI_KEY` is the API key from "Keys and Endpoint"
- `AZURE_OPENAI_DEPLOYMENT` must match the deployment name you created

#### Option 2: Using Runtime API

You can configure Azure OpenAI at runtime by calling:

```bash
POST http://localhost:3010/api/azure-config
Content-Type: application/json

{
  "endpoint": "https://deepsim.cognitiveservices.azure.com/",
  "apiKey": "your_api_key_here",
  "deployment": "gpt-5.4-nano",
  "apiVersion": "2024-12-01-preview"
}
```

Response:
```json
{
  "status": "success",
  "message": "Azure OpenAI configured successfully",
  "config": {
    "endpoint": "https://deepsim.cognitiveservices.azure.com/",
    "deployment": "gpt-5.4-nano",
    "apiVersion": "2024-12-01-preview",
    "configured": true
  }
}
```

**Check current configuration**:
```bash
GET http://localhost:3010/api/azure-config
```

#### Option 3: Switch to Azure Provider

Once configured, switch to Azure OpenAI:

```bash
POST http://localhost:3010/api/llm-provider
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

**Check current provider**:
```bash
GET http://localhost:3010/api/llm-models
```

Returns:
```json
{
  "status": "success",
  "currentProvider": "azure",
  "availableModels": {
    "GPT5_NANO": "gpt-5.4-nano",
    "GPT4_TURBO": "gpt-4-turbo",
    "GPT4": "gpt-4"
  },
  "currentModel": "gpt-5.4-nano"
}
```

## Testing

### Test Azure OpenAI Integration

Run the included test script:

```bash
cd server
node test-azure-openai.js
```

This will:
1. Verify your Azure configuration
2. Initialize the Azure OpenAI client
3. Make a test chat completion request
4. Display the response and token usage
5. Report success or detailed error information

### Testing in VOX LAB UI

1. **Start the server**: `npm start` (from `server/`)
2. **Open VOX LAB** in your browser
3. **Check LLM Status**:
   - The app should show Azure as available provider
   - When Azure is selected, conversations will use Azure OpenAI
4. **Run a conversation**:
   - Create or open a conversation
   - With Azure provider selected, responses will be generated using Azure OpenAI
   - Monitor the server logs for detailed request information

## Available Models

Azure OpenAI supports various models depending on your region and subscription:

### Commonly Available Models

- `gpt-5.4-nano` - Latest, most capable
- `gpt-4-turbo` - High performance
- `gpt-4` - Standard
- `gpt-3.5-turbo` - Fast, cost-effective

**Note**: Actual available models depend on your Azure region and account type.

## Model Management

### Switch Between Models (at runtime)

```bash
POST http://localhost:3010/api/update-model
Content-Type: application/json

{
  "provider": "azure",
  "model": "gpt-4-turbo"
}
```

### View Available Models

```bash
GET http://localhost:3010/api/llm-models
```

## Switching Between Providers

You can easily switch between Azure OpenAI, OpenAI, and Gemini:

### Switch to Azure
```bash
curl -X POST http://localhost:3010/api/llm-provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"azure"}'
```

### Switch to OpenAI
```bash
curl -X POST http://localhost:3010/api/llm-provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai"}'
```

### Switch to Gemini
```bash
curl -X POST http://localhost:3010/api/llm-provider \
  -H "Content-Type: application/json" \
  -d '{"provider":"gemini"}'
```

## Troubleshooting

### Issue: "Azure configuration incomplete"
**Solution**: Ensure all required environment variables are set:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_KEY`
- `AZURE_OPENAI_DEPLOYMENT` (optional, defaults to `gpt-5.4-nano`)
- `AZURE_OPENAI_API_VERSION` (optional, defaults to `2024-12-01-preview`)

### Issue: "Missing credentials" Error
**Solution**: 
1. Verify your API key is correct in `.env` or via `/api/azure-config`
2. Check that your Azure OpenAI resource is active in Azure Portal
3. Ensure the key hasn't expired

### Issue: "Resource not found" (404 Error)
**Solution**:
1. Verify the endpoint format:
   - Should be like: `https://deepsim.cognitiveservices.azure.com/`
   - Copy the exact endpoint from Azure Portal
   - Must include the region and resource name
2. Ensure the endpoint matches your resource location
3. Verify you're using the correct API version

### Issue: "Invalid deployment" or "Deployment not found"
**Solution**:
1. Verify the deployment name:
   - Go to Azure Portal > Your Resource > Model deployments
   - Check the exact deployment name
   - Copy it exactly (case-sensitive)
2. Ensure the deployment exists and is active
3. If you recently created it, wait a few seconds for it to activate

### Issue: 401 Unauthorized
**Solution**:
1. Verify your API key is correct
2. Check it hasn't expired
3. Ensure you're using the right key (Key1 or Key2)
4. Try regenerating the key in Azure Portal

### Issue: Rate Limiting (429 Error)
**Solution**:
1. Your requests are exceeding the rate limit
2. Check your subscription quota in Azure Portal
3. Consider upgrading your tier (Standard S0 → S1, etc.)
4. Implement request throttling on the client side

### Issue: No Response Generated
**Solution**:
1. Run `test-azure-openai.js` to verify connectivity
2. Check server logs for detailed error messages
3. Verify the model deployment is active in Azure Portal
4. Try a different deployment method if available

## Performance & Cost

### Response Time
- **Azure OpenAI**: Generally 1-3 seconds per request
- **Comparable to**: OpenAI Cloud API

### Pricing (as of 2024)
- **GPT-5.4 Nano**: Pay-per-token pricing
- **GPT-4 Turbo**: ~$0.01/$0.03 per 1K tokens (input/output)
- **GPT-4**: ~$0.03/$0.06 per 1K tokens

First 1,000 tokens free per resource.

### Cost Optimization
1. Use `gpt-5.4-nano` for most tasks (more cost-effective)
2. Use `gpt-4-turbo` only when needed
3. Monitor usage in Azure Portal > Deployments tab
4. Set `maxTokens` appropriately in conversation config

## Advanced Configuration

### Custom API Version

Different API versions support different features:

```env
AZURE_OPENAI_API_VERSION=2024-12-01-preview  # Latest features
AZURE_OPENAI_API_VERSION=2024-08-01-preview  # Stable
AZURE_OPENAI_API_VERSION=2023-12-01-preview  # Legacy
```

Check [Azure OpenAI API Version Reference](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference) for details.

### Using Multiple Deployments

Each deployment can use a different model version:

1. Create multiple deployments in Azure Portal
2. Configure via `/api/azure-config` with different deployment names
3. Switch between them by updating `AZURE_OPENAI_DEPLOYMENT`

## Architecture

The LLM provider system in VOX LAB now includes:

```
LLM Provider System
├── OpenAI Provider
├── Gemini Provider (default)
└── Azure OpenAI Provider (new)
    ├── Chat Completions API
    ├── Text Generation
    └── Multi-turn Conversations
```

## Files Modified

- `server/providers/azureOpenAIAPI.js` - New Azure OpenAI provider
- `server/providers/llmProvider.js` - Updated to support Azure
- `server/modelAPI.js` - Added Azure configuration endpoints
- `server/server.js` - Imported Azure provider functions
- `server/.env` - Azure credentials
- `server/.env.example` - Configuration template

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/llm-models` | GET | Get available models and current provider |
| `/api/llm-provider` | POST | Switch between providers (azure, openai, gemini) |
| `/api/update-model` | POST | Change the active model for a provider |
| `/api/llm-keys` | POST | Set API keys for providers |
| `/api/llm-status` | GET | Check provider configuration status |
| `/api/azure-config` | POST | Configure Azure OpenAI |
| `/api/azure-config` | GET | Get current Azure configuration |

## Support

For issues:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Run `test-azure-openai.js` for diagnostics
4. Verify Azure resource is active in Azure Portal
5. Check [Azure OpenAI Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
