# Vox by DeepSim Lab — Lovable Integration Prompt

## Status

Phase 1 is DONE: landing page, routing (`/` → landing, `/studio` → workspace), theme (indigo/violet palette, dark-mode-first), studio shell, Zustand store shell, TypeScript config.

Phase 2 starts now. The app's core features — node editor, conversation engine, verification, 3D avatars — already exist as working code. Lovable couldn't pull from GitHub, so the code is embedded below. **Implement these components exactly as shown.**

---

## Architecture

```
Frontend (React 19 + Vite 6 + Zustand + Tailwind)
    ↕ HTTP (JSON + streaming newline-delimited JSON)
Backend (Node.js/Express, port 3010) ← runs separately, NOT in Lovable
    ↕ Google Gemini / OpenAI APIs + Google TTS
```

The backend is **external**. Lovable builds only the frontend. The backend runs at `http://localhost:3010` in dev or `https://chatlab.3dvar.com` in production.

---

## API Contract (Backend Endpoints)

All endpoints are relative to the base URL. Frontend sends API keys via headers:
- `x-llm-provider`: `"openai"` or `"gemini"`
- `x-llm-key`: the LLM API key
- `x-tts-key`: the Google TTS API key

### Core Conversation

**POST `/api/start-conversation`**
Request body:
```json
{
  "maxTurns": 6,
  "completeConversation": true,
  "shouldLoadPreviousConversationManager": false,
  "conversationMode": "reactive",
  "initiator": "Alice",
  "startingMessage": null,
  "participants": ["Alice", "Bob", "Charlie"],
  "topic": "AI Ethics",
  "subTopic": "Bias in hiring",
  "turnTakingMode": "round-robin",
  "interactionPattern": "neutral",
  "conversationPrompt": "optional custom prompt",
  "partyMode": false,
  "partyCommands": [],
  "derailerCommands": [],
  "contentCommands": [],
  "agents": [
    {
      "name": "Alice",
      "personality": "thoughtful and analytical",
      "interactionPattern": "neutral",
      "isHumanProxy": false,
      "customAttributes": {},
      "fillerWordsFrequency": "none"
    }
  ],
  "interruptionRules": [
    { "interrupter": "Bob", "interrupted": "Alice", "probability": 0.3, "vibe": "excited" }
  ],
  "backChannelRules": [
    { "fromPeople": "Charlie", "toPeople": "Alice", "frequency": "sometimes", "vibe": "Supportive", "probability": 0.5 }
  ]
}
```
Response: **streaming** newline-delimited JSON chunks:
```
{"type":"message","message":{"sender":"Alice","message":"Let's talk about...","recipient":"All","party":"Teaching Staff","isSystemMessage":false,"isBackchannel":false,"isProactive":false,"isDerailing":false,"needsApproval":false,"impromptuPhase":false,"backchannels":[{"sender":"Bob","emoji":"😊","message":"Bob is nodding","vibe":"Supportive"}]}}
{"type":"message","message":{...}}
{"type":"human_input_required","speaker":"HumanUser"}
{"type":"completion","status":"done"}
```

**POST `/api/human-input`** — `{ "input": "text", "speaker": "HumanUser" }`

**POST `/api/conversation/mode`** — `{ "mode": "human-control"|"autonomous"|"reactive" }`

### Impromptu Phase (Derailer)

**POST `/api/impromptu/approve`** — `{ "editedContent": "optional edited text" }` → streaming response
**POST `/api/impromptu/reject`** — `{}` → streaming response
**POST `/api/impromptu/edit-message`** — `{ "messageContent": "edited text" }`
**POST `/api/impromptu/regenerate-with-mode`** — `{ "mode": "drift"|"extend"|"question"|"emotional" }` → streaming response

### TTS

**POST `/api/tts`** — `{ "input": {"text": "..."}, "voice": {"languageCode":"en-GB","name":"en-GB-Standard-A"}, "audioConfig": {"audioEncoding":"MP3"} }` → `{ "audioContent": "base64..." }`

**POST `/api/batch-synthesize`** — `{ "segments": [{"text":"...","voiceSettings":{"languageCode":"en-US","name":"en-US-Neural2-F","rate":1.5},"segmentId":"seg-1"}] }` → `{ "results": [{"segmentId":"seg-1","audioUrl":"http://...","success":true}] }`

### Models & Keys

**GET `/api/llm-models`** → `{ "currentProvider":"gemini", "availableModels":{...}, "currentModel":"gemini-2.0-flash" }`
**POST `/api/update-model`** — `{ "provider":"gemini", "model":"gemini-2.0-flash-lite" }`
**POST `/api/llm-provider`** — `{ "provider":"gemini" }`
**POST `/api/llm-keys`** — `{ "provider":"gemini", "apiKey":"..." }`
**GET `/api/llm-status`** → `{ "geminiConfigured":true, "openaiConfigured":false, "ttsConfigured":true, "currentProvider":"gemini" }`

### Verification

**POST `/api/verification/calculate-coherence`** — `{ "segments": [...] }` → `{ "coherenceScore":0.85, "overallSentiment":0.3, "sentiment":{"avatar-1":0.5} }`
**POST `/api/verification/ask-agent`** — `{ "verificationData":{...}, "question":"Who dominated?" }` → `{ "answer":"..." }`

### Content

**POST `/api/content/upload`** — multipart/form-data with file
**GET `/api/content/list`** → `[{ "id":"...", "name":"doc.pdf", "type":"pdf" }]`

### Misc

**POST `/api/generate-conversation-prompt`** — `{ "generalContext":"...", "sceneDescription":"...", "subTopic":"...", "speakers":[{"name":"Alice"}], "interactionPattern":"neutral" }` → `{ "prompt":"..." }`

---

## Component Implementation Order

Paste the code files into Lovable in this order:

1. **lovable-code-store.md** — Zustand store types + full implementation (the data backbone)
2. **lovable-code-workspace.md** — App.tsx + config.ts + Home/Studio workspace component
3. **lovable-code-preview.md** — PreviewPanel + message display + impromptu approval
4. **lovable-code-nodeeditor.md** — Node editor (conversation graph builder)

Each file is self-contained with instructions for Lovable.

---

## Brand Reminder

- Company: **DeepSim Lab** — *"Build it before it's real."*
- Product: **Vox** — workspace is **Vox Studio**, backend is **Vox Engine**
- Palette: deep indigo (#312e81), electric violet (#7c3aed), slate grays, amber (#f59e0b)
- Dark mode first. System sans-serif. Lucide icons.
- All "DialogLab" strings → "VOX LAB"
