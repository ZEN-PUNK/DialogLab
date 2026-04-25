# Lovable Prompt — Recreate VOX LAB

## Source code reference

The full working codebase is at: **https://github.com/ZEN-PUNK/VOX-LAB**

Clone or connect to this repo. Every file referenced below exists in that repository. The detailed architecture guide is at `re-eng/agent-detailed.md` inside the repo.

---

## What to build

Recreate **VOX LAB** — a full-stack web application for authoring, running, and evaluating multi-agent conversations with animated 3D avatars.

The app has two parts:
1. A **React frontend** (currently Vite + React 19 + Zustand + Tailwind + Three.js)
2. A **Node.js/Express backend** (conversation orchestration, LLM provider calls, TTS, content management, verification analysis)

Build every component, every API route, and every feature described below. Do not leave anything out.

---

## Tech stack

### Frontend
- React (latest)
- TypeScript (unify the current JS/TS mix into full TypeScript)
- Vite for dev/build
- Zustand for state management
- Tailwind CSS for styling
- Radix UI primitives for accessible UI components (checkbox, select, slider, tabs, tooltip, separator, label, progress, avatar)
- Lucide React for icons
- Three.js for 3D rendering
- Recharts for data visualization
- react-hot-toast for notifications
- react-draggable for drag interactions
- react-select for advanced select inputs
- rc-slider for range sliders
- html2canvas for screenshot capture
- xlsx for spreadsheet export
- class-variance-authority + clsx + tailwind-merge for component variant utilities

### Backend
- Node.js with Express
- axios for external API calls
- multer for file uploads
- dotenv for environment configuration
- @google/generative-ai for Gemini integration
- openai SDK for OpenAI integration
- @google-cloud/text-to-speech compatible HTTP calls for TTS
- pdf-parse for document processing

---

## Application modes

The app has three main modes the user switches between:
1. **Authoring mode** — the default workspace where the user designs scenes, avatars, conversation graphs, and rules
2. **Preview mode** — live conversation execution with streaming messages, audio playback, and impromptu approval
3. **Experience mode** — a polished presentation viewer for showcasing finished conversations

There is also a **Verification mode** for analyzing completed conversations with metrics dashboards.

---

## Frontend — every component to build

### Root and shell

#### `App.tsx`
- Wraps everything in a ThemeProvider
- Checks if API keys exist in localStorage
- If keys are missing, shows the ApiKeyModal
- Tracks the active LLM provider (gemini or openai)
- Renders the main Home component
- Listens for a custom `open-api-key-modal` window event to re-open the key modal

#### `config.ts`
- Detects production vs development by checking `window.location.hostname`
- Exports `API_CONFIG` with `BASE_URL` and an `ENDPOINTS` object containing every backend route path:
  - `START_CONVERSATION`: `/api/start-conversation`
  - `BATCH_SYNTHESIZE`: `/api/batch-synthesize`
  - `TTS`: `/api/tts`
  - `IMPROMPTU_APPROVE`: `/api/impromptu/approve`
  - `IMPROMPTU_REJECT`: `/api/impromptu/reject`
  - `IMPROMPTU_EDIT`: `/api/impromptu/edit-message`
  - `IMPROMPTU_REGENERATE_WITH_MODE`: `/api/impromptu/regenerate-with-mode`
  - `CONVERSATION_MODE`: `/api/conversation/mode`
  - `LLM_MODELS`: `/api/llm-models`
  - `UPDATE_MODEL`: `/api/update-model`
  - `SET_LLM_PROVIDER`: `/api/llm-provider`
  - `SET_LLM_KEYS`: `/api/llm-keys`
  - `LLM_STATUS`: `/api/llm-status`
  - `VERIFICATION_CALCULATE_COHERENCE`: `/api/verification/calculate-coherence`
  - `VERIFICATION_ASK_AGENT`: `/api/verification/ask-agent`
  - `GENERATE_CONVERSATION_PROMPT`: `/api/generate-conversation-prompt`
  - `CONTENT_UPLOAD`: `/api/content/upload`
  - `CONTENT_LIST`: `/api/content/list`

#### `ApiKeyModal.tsx`
- Modal for entering API keys for OpenAI, Gemini, and TTS
- Stores keys in localStorage
- Lets the user select the active LLM provider
- Sends keys to the backend via `POST /api/llm-keys`
- Shows which keys are configured vs missing

---

### Main workspace — `Home.tsx`

This is the central orchestration component. It manages:
- current application mode (authoring, preview, experience, verification)
- visibility toggles for every panel (avatar panel, conversation panel, topic panel, preview panel, scene view)
- selected participants, messages array, current topic
- audio playback state (segments, currentPlaybackTime, isPlaying, totalDuration)
- avatar URLs and thumbnail cache
- scene state and active scene selection
- export dialog state
- conversation mode from the Zustand store

It renders conditionally based on mode:
- **Authoring**: Header, AvatarConfigPanel, Inspector, NodeEditor, ContentLibrary, NavigationPanel, SelectionBar, DraggableScenes
- **Preview**: PreviewPanel overlaid on the authoring view
- **Verification**: VerificationPlayer
- **Experience**: ExperienceMode

It also:
- sets up scene event listeners on mount
- generates model thumbnail caches
- maps participant names to gendered avatar URLs using a built-in name-to-avatar mapping

---

### State management — `store.ts`

Zustand store with persistence. This is the central data model.

#### Types to define:

**AvatarConfig**: id, name, gender, voice, personality, roleDescription, customAttributes, party, isPartyRepresentative, plus extensible fields

**Party**: id, type ('party'), name, description, speakingMode ('representative' | 'all' | 'subset' | 'random'), hasRepresentative, enableBackchannel, representativeSpeaker, participantIds

**GlobalParty**: id, type ('globalParty'), name

**SnippetNode** extends Node: subTopic, topic, turns, interactionPattern, turnTakingMode, snippetThoughts, interruptionRules, backChannelRules, partyMode, partyTurnMode, attachedScene, party, partyVariables, partyState, derailerMode, audioSegments, totalDuration, description, conversationPrompt, plus temporary form state for creating interruption and backchannel rules

**InterruptionRule**: id, fromSpeaker (AvatarConfig), toSpeaker (AvatarConfig), emotion

**BackChannelRule**: id, fromSpeaker (AvatarConfig), toSpeaker (AvatarConfig), emotion

**Box**: elementRatio, elements, height, id, layoutMode, party, partyConfig, view, width, x, y

**Scene**: id, name, boxes, backgroundImage, hasUnsavedChanges, globalPartySettings

**SavedScene** extends Scene: preview, isFileReference, isSaved, isActive

**ScenePreview**: backgroundImage, boxCount, hasAvatars, hasContent, parties, boxPositions, avatarNames, boxContents, timestamp, size

**Connection**: id, condition, from, to

**PartyConfig**: name, description, speakingMode, hasRepresentative, enableBackchannel, representativeSpeaker, participantIds, partyTurnMode, isModeratorParty, subsetSize

**GlobalPartySettings**: partyTurnMode, moderatorParty, enableBackchannel

**EditorState**: selectedItem, nodes, connections, scenes, activeSceneId, speakers, savedScenes, conversationMode ('human-control' | 'autonomous' | 'reactive'), partyConfigs, globalPartySettings, emojiStates

#### Store actions:
- setSelectedItem, updateSelectedItem, closeInspector
- openGlobalPartyInspector
- addNode, updateNode, updateSnippetNode, deleteNode, updateNodeAudioSegmentsAndTotalDuration
- addConnection, updateConnection, deleteConnection
- setScenes, updateScene, setActiveSceneId
- setSavedScenes, loadSavedScene, loadSavedScenes, deleteSavedScene
- updatePartyForBox, setSpeakers, applyAvatarConfigChanges, getCachedDefaultSpeakers
- setPartyConfigs, setGlobalPartySettings, getPartyCommands
- listenForHumanParticipantsChanges
- setEmojiStates, updateEmojiState
- setConversationMode

#### Global option constants:
- interactionPatterns: ["neutral", "positive", "negative", "questioning"]
- turnTakingModes: ["round-robin", "free-form", "directed"]
- interruptionRules: ["none", "allowed", "frequent"]
- voiceOptions: ["normal", "whisper", "loud", "excited"]
- emotionOptions: ["Amused", "Skeptical", "Excited", "Supportive", "Curious", "Concerned", "Empathetic", "Bored", "Surprised", "Confused", "Impressed"]

#### Default parties function `getDefaultParties()`:
Returns 5 preset parties: Teaching Staff, Students, Moderators, Presenters, Audience — each with name, description, speakingMode, hasRepresentative, enableBackchannel, and participantIds.

---

### Avatar and scene configuration components

#### `AvatarConfigPanel.tsx`
- Primary panel for scene and avatar setup
- Contains SceneHierarchyView and SceneSetup
- Tracks active scene, selected box, loading and error state, avatar refs
- Listens for `editor-scenes-updated` custom events
- Syncs scene state between local, prop, and store sources

#### `SceneHierarchyView.tsx`
- Tree view of scene elements (boxes, avatars, content)
- Lets user select and focus on specific scene parts

#### `SceneSetup.tsx`
- Main editing surface for scene composition
- Accepts forwarded ref
- Handles avatar placement, box creation, layout editing

#### `SceneSetupModal.tsx`
- Modal for initial scene creation or configuration

#### `ConversationGroup.tsx`
- Groups participants within the scene model

#### `ParticipantModal.tsx`
- UI for creating or editing individual participants

#### `VerticalToolbar.tsx`
- Toolbar actions for scene editing

#### `avatarconfig/utils/`
- `modelThumbnailGenerator` — generates thumbnail images for avatar models
- `AvatarInitializer` — initializes avatar instances for scenes

---

### Scene viewer

#### `SceneViewer.tsx`
- Read-only scene preview
- Renders scene boxes with absolute positioning based on percentage coordinates
- Shows background image if present
- Displays avatar names and content inside boxes
- Shows party labels on boxes assigned to parties
- Displays scene metadata (ID, box count)

---

### Node editor — conversation graph authoring

#### `NodeEditor.tsx`
- Canvas-based graph editor for conversation flow
- Nodes represent conversation snippets/scenes
- Nodes are draggable with pan and zoom support
- Connections link nodes for dialogue branching
- Integrates audio playback adapter for scene preview
- Validates scene configurations
- Handles avatar speaking visualization
- Exports to verification data with optional TTS
- Contains a `SpeakingHighlight` sub-component for active speaker visualization

#### `NodeDisplay.tsx`
- Renders individual node visuals including title, speakers, turn count, and snippet details

#### `NodeConnection.tsx`
- Renders SVG connection lines between nodes
- Exports helper functions: `startConnection`, `completeConnection`, `handleCanvasClick`

#### `types.ts`
- AudioPlaybackConfig, DragOffset, MousePosition, PartyCommand, SceneBox, AvatarElement, BoxElement, ContentCommand, SetAsDerailerCommand

#### `utils/NodeEditorUtils.ts`
- validateScene, handleAvatarSpeaking, formatTime, createNodeFromScene
- exportToVerificationData, exportToVerificationWithTTS
- AudioSegment and Message type definitions

#### `utils/AudioPlaybackAdapter.ts`
- AudioPlaybackAdapter class for managing audio playback
- createAudioPlaybackConfig, dispatchSceneEvent helpers

---

### Inspector system

#### `Inspector.tsx`
- Shell that selects which specialized inspector to show based on the selected item type

#### `AvatarInspector.tsx`
- Edits per-avatar: personality, voice, role description, custom attributes, party assignment

#### `ConnectionInspector.tsx`
- Edits connection conditions and transition behavior

#### `PartyInspector.tsx`
- Configures party-level: speaking mode, backchannel, representative settings, participation

#### `GlobalPartyInspector.tsx`
- Edits scene-wide party behavior: turn mode, moderator party, global backchannel

#### `SnippetInspector.tsx`
- Edits snippet node: speakers, turns, interaction pattern, turn-taking mode, prompts, interruption rules, backchannel rules, party mode, derailer mode

#### `ConversationPrompt.tsx`
- Dedicated text area for editing the custom conversation prompt for a snippet

#### `DraggableScenes.tsx`
- Drag-to-reorder scene sequencing UI

#### `SceneSelector.tsx`
- Compact scene switcher dropdown or list

---

### Preview and live conversation

#### `PreviewPanel.tsx`
- Real-time message display during conversation execution
- Messages arrive incrementally via streaming
- Party-based color coding for message bubbles
- Detects and highlights impromptu/derailing phases
- Contains a `MessageDisplay` sub-component
- Shows export dialog at conversation end
- Supports impromptu approve/reject/edit actions
- Distinguishes human users from AI agents
- Auto-scrolls to latest message

#### `ImpromptuApprovalPanel.tsx`
- Human-in-the-loop approval UI
- Shows pending impromptu messages
- Allows approve, reject, or edit before the message enters the conversation

---

### Verification and analysis

#### `VerificationPlayer.tsx`
- Loads all verification data entries from localStorage
- Selector UI for multiple past conversations
- Shows summary cards with duration, participant count, metrics
- Can delete associated audio files via API
- Renders the selected conversation's full analysis

#### `AudioTranscript.tsx`
- Video/audio metrics player
- Transcript timeline with speaker segments

#### `ConversationMetricsDashboard.tsx`
- Visualizes: participation time, turn-taking frequency, speaking balance, sentiment per participant, overall sentiment, coherence score, interruptions, engagement level
- Uses Recharts for bar charts and data visualization

#### `verificationUtils.tsx`
- Shared helpers for formatting, computing, and transforming verification metrics

---

### Content and topic management

#### `ContentLibrary.tsx`
- Lists content files from the server
- Supports uploading new content
- File type detection and metadata display

#### `NavigationPanel.tsx`
- Workflow navigation helper

#### `SelectionBar.tsx`
- Context-sensitive selection controls

#### `avatarTemplates.ts`
- Predefined avatar configuration presets

---

### Experience mode

#### `ExperienceMode.tsx`
- Polished read-only presentation of a finished conversation
- Scene transitions and avatar display

#### `ExperienceSceneSetupModal.tsx`
- Setup modal for configuring the experience view

---

### Theme system

#### `ThemeContext.tsx`
- React context provider for light/dark theme
- Reads and persists theme preference

#### `theme.css` and `theme-utils.css`
- CSS custom properties for theming
- Utility classes

#### `ThemeToggle.tsx`
- Toggle button for switching themes

---

### Events

#### `SceneEventHandler.ts`
- Sets up global event listeners for scene updates
- `setupSceneEventListeners` and `setupEditorScenesUpdateListener` functions
- Bridges events between decoupled UI regions

---

### UI primitives (reusable components)

Build each of these as a proper component:
- `badge.tsx`
- `button.tsx` — with variants via class-variance-authority
- `card.tsx` — CardHeader, CardTitle, CardContent
- `checkbox.tsx`
- `input.tsx`
- `label.tsx`
- `PanelHeader.tsx`
- `progress.tsx`
- `select.tsx` — Select, SelectTrigger, SelectContent, SelectItem, SelectValue
- `separator.tsx`
- `slider.tsx`
- `tabs.tsx` — Tabs, TabsList, TabsTrigger, TabsContent
- `textarea.tsx`
- `tooltip.tsx` — Tooltip, TooltipTrigger, TooltipContent, TooltipProvider

---

## Backend — every module and route to build

### `server.ts` — main entry point

- Express app on port 3010
- CORS configured for localhost:5173 and production domain
- Body parser with 50mb JSON limit
- Static serving of `/audio` directory
- Mounts all route modules
- Main conversation endpoint with chunked streaming response

### Conversation execution (`POST /api/start-conversation`)
- Receives full conversation config from frontend
- Creates ConversationManager with maxTurns and memory
- Reads LLM provider and key from request headers (`x-llm-provider`, `x-llm-key`)
- Sets conversation mode: `human-control`, `autonomous`, or `reactive`
- Adds agents with personality, interaction pattern, custom attributes, filler word frequency
- Configures human proxy agents
- Sets interaction patterns, interruption rules, backchannel rules
- Supports party mode with party definitions, roles, moderator, representative speakers
- Supports derailer configuration per agent
- Supports content attachment for grounded conversations
- Streams `{ type: "message", message }` JSON lines
- Streams `{ type: "human_input_required", speaker }` when human proxy is active
- Streams `{ type: "completion", status: "done" | "finished" }`
- Handles impromptu approval flow with pause/resume

### `POST /api/human-input`
- Receives `{ input, speaker }` and forwards to conversationManager

### `POST /api/generate-audio`
- Generates a single audio WAV file from text and voice settings
- Returns the audio URL

### `POST /save-quotes`
- Accepts an array of quotes and stores in memory

---

### `chat.ts` — ConversationManager class

The conversation engine. Implement all of this:

**Constructor**: maxTurns, memory, agents list, conversation history, interaction pattern, interruption rules, backchannel rules

**Party mode fields**: partyMode, parties Map, partyRoles Map, partyMembership Map, partyTurnMode ('free' | 'round-robin' | 'moderated'), moderatorParty, raisedHandsQueue, approvedSpeakers, handRaisingEnabled, partySpeakerQueue

**Derailer mode fields**: impromptuPhaseActive, impromptuTurnsLeft, originalPartyMode, originalPartyTurnMode, originalModerator, predefinedParties, impromptuDerailer, impromptuDerailMode, pendingImpromptuPhase, isWaitingForApproval, conversationPaused, recentlyRejectedImpromptu, derailingEnabled

**Conversation modes**:
- `human-control`: requireImpromptuApproval=true, autoApproveImpromptu=false, derailingEnabled=true
- `autonomous`: requireImpromptuApproval=false, autoApproveImpromptu=true, derailingEnabled=true
- `reactive`: all derailing disabled, no approvals needed

**Callbacks**: onMessageGenerated, onHumanInputRequired, onConversationComplete

**Key methods**:
- addAgent with full config
- setInteractionPattern
- setInterruptionRule, setBackChannelRule
- setAgentAsHumanProxy
- provideHumanInput
- start/run conversation loop
- party management methods
- impromptu phase activation and resolution

---

### `agent.ts` — Agent class

**Constructor parameters**: name, personality, interactionPattern, isHumanProxy, customAttributes, fillerWordsFrequency, isProactive, proactiveThreshold, roleDescription, isDerailer, derailThreshold, derailMode ('drift' | 'extend' | 'question' | 'emotional')

**Key methods**:
- `reply(message, context, nextSpeaker, interruptionInfo, options, isStartingMessage)` — builds a rich prompt including personality, role, derailer context, scene transition context, and interaction rules. Returns `{ fullResponse, interrupted, partialResponse }`
- `postProcessResponse(response)` — removes agent name prefix, limits to 3 sentences
- `setProactiveSettings(settings)` — configure trigger words and topics
- `shouldReactProactively(message, context)` — checks triggers and random threshold
- `generateProactiveResponse(message, context, nextSpeaker, options)` — creates a natural cut-in response
- `shouldDerail()` — random check against derailThreshold
- `generateDerailResponse(message, context, nextSpeaker, options)` — generates mode-specific derailing responses
- `generateDynamicAttributeContext(customAttributes)` — uses LLM to create a contextual sentence from attributes

---

### `conversationmemory.ts` — ConversationMemory class

**Constructor**: shortTermLimit, summaryInterval

**Fields**: conversationHistory, summaries, lastSummaryIndex, coveredPoints Set, analogiesUsed Set

**Key methods**:
- `generateSummary(messages)` — uses LLM to create bullet-point summaries
- `addMessage(message)` — adds to history, triggers summary generation at intervals

---

### `chatutils.ts` — conversation helpers

- `generateBackchannel(message, vibe, agent)` — generates non-verbal backchannel reactions using LLM with rich vibe descriptions (Amused, Skeptical, Excited, Supportive, Curious, Concerned, Empathetic, Bored, Surprised, Confused, Impressed, agreeable, neutral, nodding)
- `getNextRoundRobinSpeaker(participants, lastSpeaker, lastSpeakerIndex)` — round-robin turn selection with edge case handling
- `interpretUserInstructions(instruction)` — parses editing commands
- `getContextForPattern(lastSpeaker, currentAgent, nextAgent, interactionPattern, topic, recentMessages, themeAnalysis, conversationPrompt)` — builds contextual guidance string with pattern-specific behavior (Critical, Skeptical, Neutral, Receptive, Agreeable, disagree, agree)

---

### `providers/llmProvider.ts` — unified LLM facade

**Providers**: OPENAI, GEMINI

**Models**:
- OpenAI: gpt-3.5-turbo, gpt-4, gpt-4-turbo
- Gemini: gemini-2.0-flash-lite, gemini-2.0-flash

**Exported functions**:
- `setProvider(provider)`, `getProvider()`
- `setDefaultModel(provider, model)`, `getAvailableModels()`, `getCurrentModel()`
- `generateText(prompt, options)` — routes to correct provider, supports per-request apiKey override
- `chatCompletion(messages, options)` — multi-turn chat, routes to correct provider
- `setOpenAIApiKey(apiKey)`, `isOpenAIConfigured()`

---

### `providers/geminiAPI.ts` — Gemini integration

- Uses `@google/generative-ai` SDK
- Models: FLASH_LITE (`gemini-2.0-flash-lite`), FLASH (`gemini-2.0-flash`)
- `generateText(prompt, options)` — supports temperature, maxTokens, model selection, per-request API key, contentAttachment (text or PDF with inline base64 data), JSON formatting hint
- `chatCompletion(messages, options)` — converts message array to Gemini chat format
- `setGeminiApiKey(apiKey)`, `isGeminiConfigured()`

---

### `tts.ts` — text-to-speech

**TTS client**: makes direct HTTP calls to Google TTS API endpoint using `X-Goog-Api-Key` header

**Routes**:
- `POST /api/batch-synthesize` — processes array of `{ text, voiceSettings, segmentId }` segments, generates MP3 files, returns `{ results, totalSuccess, totalFailed }`
- `POST /api/tts` — single synthesis for TalkingHead, returns base64 audioContent. Accepts per-request TTS key via `x-tts-key` header
- `POST /synthesize` — single synthesis with WAV output and Rhubarb lip-sync JSON generation

**Helpers**: `setTtsApiKey(apiKey)`, `isTtsConfigured()`

---

### `contentAPI.ts` — content management routes

Uses multer with disk storage. Sanitizes filenames by replacing spaces.

- `POST /api/content/upload` — uploads file to content directory, copies to parent content folder for redundancy, returns `{ success, path, serverPath, filename, size }`
- `POST /api/upload/content` — alternate upload endpoint with same behavior
- `GET /api/content/list` — scans content directory, returns array of `{ id, name, filename, type, path, description, metadata, isOnServer }`

---

### `contentManager.ts` — ContentManager class

**Fields**: contentStore Map, contentOwnership Map, contentDir path

**Methods**:
- `loadContent(filename)` — reads file metadata, generates description, stores in memory
- `assignOwnership(contentId, owners, isParty, presenter)` — assigns content to agents or parties
- `setContentAsPublic(contentId, presenter, presenterIsParty)`
- `hasAccess(contentId, agentName, partyMembership)` — checks ownership and party membership
- `getContent(contentId)`, `getContentIds()`, `getOwnership(contentId)`
- `generateSummary(...)` — LLM-generated summary of content

---

### `modelAPI.ts` — model management routes

- `GET /api/llm-models` — returns currentProvider, availableModels, currentModel
- `POST /api/update-model` — sets default model for a provider
- `POST /api/llm-keys` — sets API key for openai, gemini, or tts provider
- `GET /api/llm-status` — returns configuration status (geminiConfigured, openaiConfigured, ttsConfigured, currentProvider) with no-cache headers
- `POST /api/llm-provider` — switches active provider

---

### `verificationAPI.ts` — verification analysis routes

- `POST /api/verification/calculate-coherence` — accepts conversation segments, uses LLM to compute coherenceScore (0-1), overallSentiment (-1 to 1), per-participant sentiment. Reads LLM options from `x-llm-provider` and `x-llm-key` headers
- `POST /api/verification/ask-agent` — accepts verificationData and a question, builds a rich prompt including the transcript and all metrics, returns an LLM-generated analytical answer

Helper: `extractJson(text)` strips markdown code block wrappers from LLM responses before JSON parsing.

---

## Environment variables

The backend uses a `.env` file:
```
NODE_ENV=development
GEMINI_API_KEY=<key>
API_KEY_LLM=<openai-key>
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_OPENAI_MODEL=gpt-4
DEFAULT_GEMINI_MODEL=gemini-2.0-flash
TTS_API_KEY=<google-tts-key>
TTS_ENDPOINT=https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize
```

---

## Important behaviors to preserve

1. **Streaming conversation**: The `/api/start-conversation` endpoint must stream newline-delimited JSON, not return a single response
2. **Per-request API keys**: The frontend sends API keys via headers (`x-llm-provider`, `x-llm-key`, `x-tts-key`) so the backend uses user-specific keys
3. **Local storage for API keys**: Keys are stored client-side and sent per request, not stored permanently on the server
4. **Party mechanics**: Full party support including representative mode, moderated turn-taking, hand raising, and group dynamics
5. **Derailer/impromptu system**: Agents can be configured to derail conversations with drift, extend, question, or emotional modes. Human-control mode requires approval of derailing turns
6. **Content grounding**: PDFs and documents can be attached to conversations via Gemini's inline data feature
7. **Verification loop**: Conversations can be exported, analyzed for coherence/sentiment, and queried with natural language questions

---

## What to modernize during the rebuild

- Unify everything into TypeScript
- Clean up component decomposition (especially Home.tsx and NodeEditor)
- Use consistent naming throughout
- Add proper error boundaries and loading states
- Keep the same API contract so frontend and backend remain interchangeable with the original
- Preserve all domain model types from the store

---

## Final checklist — do not miss these

- [ ] ApiKeyModal with provider selection and key storage
- [ ] Home workspace shell with mode switching
- [ ] Zustand store with all types, actions, and persistence
- [ ] AvatarConfigPanel with SceneHierarchyView, SceneSetup, SceneSetupModal, ConversationGroup, ParticipantModal, VerticalToolbar
- [ ] SceneViewer read-only renderer
- [ ] NodeEditor with NodeDisplay, NodeConnection, types, and utils
- [ ] Inspector with AvatarInspector, ConnectionInspector, PartyInspector, GlobalPartyInspector, SnippetInspector, ConversationPrompt
- [ ] DraggableScenes and SceneSelector
- [ ] PreviewPanel with MessageDisplay and ImpromptuApprovalPanel
- [ ] VerificationPlayer with AudioTranscript, ConversationMetricsDashboard, verificationUtils
- [ ] ContentLibrary, NavigationPanel, SelectionBar, avatarTemplates
- [ ] ExperienceMode and ExperienceSceneSetupModal
- [ ] ThemeContext, theme CSS, ThemeToggle
- [ ] SceneEventHandler
- [ ] All UI primitives (badge, button, card, checkbox, input, label, PanelHeader, progress, select, separator, slider, tabs, textarea, tooltip)
- [ ] Express server with all route modules mounted
- [ ] ConversationManager with full party and derailer support
- [ ] Agent class with reply, proactive, and derail methods
- [ ] ConversationMemory with LLM-driven summaries
- [ ] Chat utilities (backchannel, round-robin, context builder)
- [ ] LLM provider facade with Gemini and OpenAI
- [ ] Gemini API integration with PDF attachment support
- [ ] TTS routes (batch, single, synthesize)
- [ ] Content upload and listing API
- [ ] Model management routes
- [ ] Verification analysis routes
- [ ] Config and environment variable setup
