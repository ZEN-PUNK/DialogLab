# VOX LAB Re-engineering Deep Guide

## Purpose of this document

This file is the detailed handoff map for any agent or engineer who needs to modernize, refactor, extend, or stabilize VOX LAB.

It is intentionally more detailed than `agent.md` and should be treated as the operational architecture guide for future work.

Use this document when you need to:
- understand how the app is wired end-to-end
- locate the correct files for a feature or bug
- see the responsibilities of each major component
- identify risky areas before refactoring
- plan a modernization roadmap without breaking the current working app

---

## 1. Product summary

VOX LAB is a web-based authoring and simulation environment for multi-agent conversations with animated 3D avatars.

The application combines:
- a React/Vite visual editor for scenes, avatars, dialogue logic, and previewing
- a Node/Express backend for orchestration, LLM calls, text-to-speech, content uploads, and verification analysis
- local and server-side storage for scene state, audio output, and uploaded content

At a high level, users can:
1. create a scene with avatars and layout boxes
2. define conversation snippets and turn-taking behavior
3. configure agents, personalities, parties, and prompts
4. run a conversation using Gemini or OpenAI
5. synthesize speech for generated dialogue
6. preview the result in an animated UI
7. export and analyze verification metrics

---

## 2. Stack and runtime model

### Frontend
- React 19
- Vite 6
- Zustand for editor state
- Tailwind-style UI utilities plus custom CSS
- Three.js and TalkingHead-based avatar rendering
- TypeScript used in some feature areas, mixed with JSX/JavaScript

### Backend
- Node.js with Express
- axios for provider calls
- multer for content uploads
- dotenv for environment configuration
- pluggable LLM provider layer with Gemini and OpenAI
- Google TTS-compatible HTTP flow for voice generation

### Runtime ports
- frontend dev server: 5173
- backend API server: 3010

### Production behavior
The frontend decides whether to use localhost or the production host through environment-sensitive logic in `client/src/config.js`.

---

## 3. System architecture in one view

## Request and rendering pipeline

1. The user loads the React app.
2. The root app checks whether local API keys are present.
3. The main workspace opens through `Home.jsx`.
4. The user edits scenes, participants, prompts, and conversation nodes.
5. UI state is stored centrally in the Zustand store.
6. When previewing or running a conversation, the client sends config to the backend.
7. The backend builds a `ConversationManager` and creates `Agent` instances.
8. The manager coordinates turn-taking, rules, derailing, interruptions, and party mode.
9. Generated responses are streamed back to the frontend.
10. Optional TTS endpoints generate audio files and return URLs.
11. The preview and verification views render messages, playback, and metrics.

---

## 4. Repository map

### Top-level folders

#### `client/`
The full React application. All authoring, preview, verification, and scene editing UI lives here.

#### `server/`
The Express backend and conversation orchestration engine.

#### `content/`
Project-level content assets and uploaded material available to the app.

#### `re-eng/`
Documentation and re-engineering handoff material for agents.

---

## 5. Frontend architecture

## 5.1 Frontend entry points

### `client/src/main.jsx`
Bootstraps React into the DOM.

### `client/src/App.jsx`
Top-level wrapper for the UI.

Responsibilities:
- mounts the theme provider
- renders the main `Home` component
- checks if required API keys exist in local storage
- opens the API key modal when keys are missing
- tracks currently selected LLM provider

Why it matters for re-engineering:
- this is the correct place for app-wide providers
- auth bootstrapping or session bootstrapping would likely start here
- global error boundaries could be added here later

### `client/src/config.js`
Central API configuration.

Responsibilities:
- determines whether the app is in local or production mode
- defines backend base URL
- holds endpoint constants used across the UI

This file is the main client-side routing map to the backend.

---

## 5.2 Main workspace shell

### `client/src/components/Home.jsx`
This is the central orchestration component for the entire authoring experience.

It is one of the most important files in the codebase.

Responsibilities:
- controls the active application mode such as authoring, preview, and experience mode
- coordinates the visibility of the avatar panel, conversation panel, topic panel, preview panel, and scene view
- stores transient UI state such as selected participants, messages, playback state, and export options
- wires together scene editing, preview execution, verification playback, and event listeners
- imports the core feature panels and decides what is shown on screen

Why it is high-risk:
- it is large and multi-responsibility
- future regressions are likely if changes are made without isolating state and effects
- a modernization pass should probably split this into container-level feature modules

Recommended future refactor:
- split into a workspace shell plus dedicated mode containers
- separate orchestration logic from display logic
- move conversation execution orchestration into custom hooks or a service layer

---

## 5.3 State management

### `client/src/components/inspector/store.ts`
The Zustand store is the most important shared state definition on the frontend.

This file defines many of the app’s core types and structures:
- `AvatarConfig`
- `Party`
- `GlobalParty`
- `SnippetNode`
- `Box`
- `Scene`
- `SavedScene`
- `Connection`
- global option lists such as interaction patterns and voice options

Responsibilities:
- holds current scenes and scene metadata
- tracks node editor state and graph relationships
- stores selected items and inspector-related state
- acts as the canonical place for authoring data flow

Why it matters:
- if you want to understand the domain model, start here
- if you want to improve persistence or serialization, start here
- if you want to migrate to stricter TypeScript, this is the best anchor point

Re-engineering note:
The app already uses a reasonable central store approach, but the schema should be normalized and formalized to reduce duplication and implicit state coupling.

---

## 5.4 Major feature areas

## A. Avatar and scene configuration

### `client/src/components/avatarconfig/AvatarConfigPanel.jsx`
Primary entry for visual scene and avatar configuration.

Responsibilities:
- loads and displays the scene setup workflow
- coordinates scene hierarchy display
- tracks active scene and selected box
- reacts to external scene update events
- passes refs and avatar configuration state into scene editing subcomponents

How to use it conceptually:
- select or create a scene
- place avatars and content into scene boxes
- synchronize the chosen scene back into the central editor state

Supporting files in this folder:

#### `SceneHierarchyView.jsx`
Shows the tree or structure of scene elements and lets the user focus on specific parts.

#### `SceneSetup.jsx`
Likely the main layout and editing surface for scene composition.

#### `SceneSetupModal.jsx`
Used when creating or configuring scenes through modal interactions.

#### `ConversationGroup.jsx`
Supports grouping or organizing participants within the scene model.

#### `PartcipantModal.jsx`
Participant creation or editing UI. Note the filename typo should be corrected in a future cleanup pass.

#### `VerticalToolbar.jsx`
Tool actions for scene editing and manipulation.

### `client/src/components/scene/SceneViewer.jsx`
Read-only scene preview renderer.

Responsibilities:
- displays scene name and background
- renders each box with absolute positioning
- shows avatar or content placeholders in each box
- gives users a visual, non-editing preview of the configured scene

Use this file when changing scene preview appearance or box rendering behavior.

---

## B. Conversation graph authoring

### `client/src/components/nodeeditor/NodeEditor.tsx`
The conversation graph editor and one of the most critical files in the app.

Responsibilities:
- renders the node-based authoring canvas
- represents scenes or snippets as draggable graph nodes
- handles connection logic between nodes
- manages playback-related scene synchronization
- integrates utility functions for validation and export
- dispatches scene events and initializes avatars for scene preview

This is where conversation logic is shaped visually by the user.

Important related files:

#### `NodeDisplay.tsx`
Responsible for rendering individual node visuals and node-level content.

#### `NodeConnection.tsx`
Handles linking nodes together, connection gestures, completion of edges, and canvas click behavior.

#### `types.ts`
Defines node editor-specific typing for commands, drag state, playback, and scene boxes.

#### `utils/`
Holds node utility functions such as export, formatting, and playback adapters.

Re-engineering priority:
High. This area should eventually be separated into:
- graph rendering
- graph interaction commands
- data serialization
- playback/export services

---

## C. Inspector system

### `client/src/components/inspector/Inspector.jsx`
Main inspector shell for editing properties of the currently selected object.

Likely responsibilities:
- chooses the correct specialized inspector based on current selection type
- allows users to edit scene, node, party, or connection metadata

Supporting inspectors:

#### `AvatarInspector.jsx`
Edits per-avatar configuration such as personality, voice, and role-related settings.

#### `ConnectionInspector.jsx`
Edits edge properties between nodes, such as conditions and transitions.

#### `PartyInspector.jsx`
Configures party-level participation and conversation settings.

#### `GlobalPartyInspector.jsx`
Edits app- or scene-wide party behavior.

#### `SnippetInspector.tsx`
Edits the properties of a conversation snippet node, including prompts, speakers, turn count, and rules.

#### `ConversationPrompt.tsx`
Dedicated editing UI for the custom conversation prompt.

#### `DraggableScenes.tsx`
Scene ordering and management surface, probably used to rearrange or select scenes in the authoring flow.

#### `SceneSelector.tsx`
Lightweight UI for switching the active scene.

Why this area matters:
This is where business rules become editable. Any schema change usually needs corresponding updates here.

---

## D. Preview and live run experience

### `client/src/components/preview/PreviewPanel.tsx`
Live conversation monitor.

Responsibilities:
- renders generated messages in the order received
- filters or adapts the display based on conversation mode
- auto-scrolls while new messages arrive
- supports impromptu approval workflows
- colors party messages consistently
- supports export-related prompts and review actions

This is the right place to improve:
- conversation readability
- streaming UX
- moderation controls
- real-time author feedback

### `client/src/components/preview/ImpromptuApprovalPanel.tsx`
Human-in-the-loop approval UI for impromptu or derailing turns.

---

## E. Verification and evaluation

### `client/src/components/verification/VerificationPlayer.tsx`
Loads saved verification data and displays analysis dashboards.

Responsibilities:
- reads exported verification data from local storage
- allows selection of previous conversations
- renders summary data such as duration and participant information
- can trigger deletion of generated audio files via the API

### `client/src/components/verification/AudioTranscript.tsx`
Transcript and metrics playback view.

### `client/src/components/verification/ConversationMetricsDashboard.tsx`
Visualization of metrics such as sentiment, balance, and participation.

### `client/src/components/verification/verificationUtils.tsx`
Shared helpers for verification processing.

This feature group is the app’s research and evaluation layer.

---

## F. Content and topic management

### `client/src/components/topic/ContentLibrary.jsx`
UI for managing uploaded or available content assets.

Responsibilities:
- exposes server-side content to the user
- supports selection of knowledge material for scenes or participants

### `client/src/components/topic/NavigationPanel.tsx`
Navigation and flow helper for moving through the authoring experience.

### `client/src/components/topic/SelectionBar.jsx`
Lightweight selection and context controls.

### `client/src/components/topic/avatarTemplates.ts`
Likely contains avatar presets or starter configurations.

---

## G. Experience mode

### `client/src/components/experience/ExperienceMode.jsx`
Presentation-style mode for showing completed conversations or polished scenes.

### `client/src/components/experience/ExperienceSceneSetupModal.jsx`
Scene-related experience mode setup or transition support.

This folder appears intended for showcasing a finished artifact rather than editing it.

---

## H. Event and theming utilities

### `client/src/components/events/SceneEventHandler.js`
Event bridge between editing actions and scene updates.

Responsibilities:
- sets up scene-related listeners
- synchronizes updates between isolated UI regions
- helps decouple some editor subsystems by using browser events

### `client/src/components/theme/ThemeContext.jsx`
Provides theme state and styling context to the app.

### `client/src/components/ui/`
Reusable UI primitives such as buttons, inputs, sliders, cards, tabs, and tooltips.

This is the correct place for design system cleanup and consistency improvements.

---

## 6. Frontend user workflows

## Workflow 1: Author a conversation

1. App opens in the main workspace.
2. User sets API keys if needed.
3. User creates avatars and scenes in the avatar config area.
4. User defines dialogue nodes and connections in the node editor.
5. Inspector panels refine prompts, interaction rules, and participant settings.
6. The workspace state is stored in the editor store.

## Workflow 2: Run a conversation

1. The user triggers a preview or execution flow.
2. The frontend serializes agent and conversation configuration.
3. A request is sent to the backend conversation endpoint.
4. The backend streams message events back.
5. The preview panel displays them progressively.
6. Optional TTS audio is generated and attached to playback.

## Workflow 3: Verify and analyze

1. The conversation is exported to verification data.
2. Local storage retains the analysis package.
3. Verification views load the saved package.
4. Sentiment, balance, interruptions, and coherence can be reviewed.

---

## 7. Backend architecture

## 7.1 Backend entry point

### `server/server.js`
This is the application server bootstrap and route host.

Responsibilities:
- starts the Express application
- configures CORS and JSON body parsing
- serves generated audio statically through `/audio`
- mounts TTS, content, model, and verification routes
- handles conversation startup and streaming message output
- stores conversation manager and memory instances in process scope

Critical endpoint in this file:

### `POST /api/start-conversation`
This is the main conversation execution endpoint.

Behavior:
- receives conversation config from the frontend
- creates or resets conversation memory as needed
- creates a `ConversationManager`
- attaches request-scoped LLM options from headers
- streams newline-delimited JSON chunks back to the client
- pushes messages, approval states, and completion events

Why it matters:
- this endpoint is the live bridge between the authoring UI and the simulation engine
- any streaming or synchronization bug often originates here or in `chat.js`

Other endpoints here:
- `POST /api/human-input` for human proxy responses
- `POST /api/generate-audio` for a simple audio generation path
- `POST /save-quotes` for quote persistence behavior

---

## 7.2 Conversation orchestration core

### `server/chat.js`
Contains `ConversationManager`, the main engine for multi-agent dialogue.

Responsibilities:
- stores the current conversation sequence
- limits and tracks conversation turns
- owns the list of active agents
- manages interaction patterns and conversational rules
- supports interruption and backchannel mechanics
- supports party mode and moderated turn-taking
- supports derailer and impromptu behavior
- pauses or resumes when human approval is required
- notifies the client when messages are generated or when the conversation completes

Key concepts inside the manager:
- `partyMode`
- `partyTurnMode`
- `moderatorParty`
- `handRaisingEnabled`
- `impromptuPhaseActive`
- `isWaitingForApproval`
- `conversationPaused`
- `derailingEnabled`

Re-engineering note:
This is the heart of the backend and likely contains a lot of feature accumulation. It should eventually be broken into smaller modules:
- conversation state machine
- turn selection strategy
- moderation and approval logic
- serialization and event streaming
- analytics hooks

---

## 7.3 Individual agent abstraction

### `server/agent.js`
Defines the per-participant behavior model.

Responsibilities:
- stores the agent’s personality and role description
- builds prompts using context, history, and conversation rules
- supports human proxy mode
- handles proactive behavior and derailing behavior
- post-processes LLM output to keep it short and conversational

Key methods:
- `reply(...)` for the main response generation path
- `postProcessResponse(...)` to clean up raw model output
- `setProactiveSettings(...)`
- `shouldReactProactively(...)`
- `generateProactiveResponse(...)`
- `shouldDerail()`
- `generateDerailResponse(...)`

This file is the best place to change persona prompting behavior and response style.

---

## 7.4 Conversation utility helpers

### `server/chatutils.js`
Support functions for conversational behavior.

Responsibilities include:
- generating non-verbal backchannel reactions
- selecting the next speaker in round-robin mode
- interpreting user editing instructions
- building contextual guidance for different interaction patterns

This is useful for extracting reusable rules out of the large conversation engine.

---

## 7.5 Provider and model layer

### `server/providers/llmProvider.js`
Unified LLM provider facade.

Responsibilities:
- keeps track of the current provider
- stores default models per provider
- exposes methods to generate plain text or chat completions
- supports runtime OpenAI API key injection
- forwards Gemini requests into the Gemini integration module

This file is the backend abstraction seam for model portability.

It is the best place to add:
- Anthropic or Azure OpenAI support
- retries and timeouts
- structured provider logging
- token accounting

### `server/providers/geminiAPI.js`
Gemini-specific provider integration. Handles model mappings and actual Gemini requests.

---

## 7.6 Text-to-speech layer

### `server/tts.js`
Voice generation and audio file creation.

Responsibilities:
- exposes `/api/batch-synthesize` for multi-segment audio generation
- exposes `/api/tts` for TalkingHead-compatible TTS responses
- exposes `/synthesize` for single synthesis with lip-sync side output
- stores generated audio in the server-side `audio` folder
- allows runtime TTS key updates

Important behavior:
- uses direct HTTP calls to the configured TTS endpoint
- writes audio files and returns public URLs
- supports per-request key override through headers

This is the correct place to improve caching, queueing, and audio cleanup.

---

## 7.7 Content system

### `server/contentAPI.js`
Express routes for content upload and retrieval.

Responsibilities:
- accepts uploaded files via multer
- sanitizes file names
- stores files in the content directory
- duplicates uploads into a project-level content folder for redundancy
- lists available content as structured metadata objects

Key routes:
- `POST /api/content/upload`
- `POST /api/upload/content`
- `GET /api/content/list`

### `server/contentManager.js`
In-memory content metadata and ownership manager.

Responsibilities:
- loads content metadata and builds content objects
- assigns ownership to agents or parties
- supports public or restricted visibility models
- checks content access rules during conversation flows

This is where future knowledge-grounding or RAG-like behavior could be expanded.

---

## 7.8 Verification and research analysis

### `server/verificationAPI.js`
LLM-backed conversation analysis routes.

Responsibilities:
- computes coherence and sentiment scores from conversation segments
- asks higher-level analytical questions about a conversation
- returns normalized JSON metric structures

Key routes:
- `POST /api/verification/calculate-coherence`
- `POST /api/verification/ask-agent`

Why it matters:
This layer turns the app into more than a simulator; it makes it evaluative and research oriented.

---

## 7.9 Model management routes

### `server/modelAPI.js`
Administrative API layer for active model/provider state.

Key routes:
- `GET /api/llm-models`
- `POST /api/update-model`
- `POST /api/llm-keys`
- `GET /api/llm-status`
- `POST /api/llm-provider`

This file is the configuration bridge between frontend preferences and backend provider runtime state.

---

## 8. API inventory and what each endpoint does

| Endpoint | Method | Purpose | Main consumer |
|---|---|---|---|
| `/api/start-conversation` | POST | Starts and streams a conversation run | authoring and preview UI |
| `/api/human-input` | POST | Supplies a human proxy response | human-controlled mode |
| `/api/generate-audio` | POST | Generates a single audio file URL | playback helpers |
| `/api/batch-synthesize` | POST | Generates multiple TTS segments | preview/export pipeline |
| `/api/tts` | POST | Returns TalkingHead-style base64 audio | avatar speech runtime |
| `/api/content/upload` | POST | Uploads content assets | content library UI |
| `/api/upload/content` | POST | Alternate upload path | fallback uploads |
| `/api/content/list` | GET | Lists server-side content | content browser |
| `/api/llm-models` | GET | Returns provider and model state | settings/model UI |
| `/api/update-model` | POST | Changes the active model | settings UI |
| `/api/llm-keys` | POST | Sets runtime API keys | API key modal |
| `/api/llm-status` | GET | Checks provider configuration state | app boot/modal |
| `/api/llm-provider` | POST | Switches between Gemini and OpenAI | app settings |
| `/api/verification/calculate-coherence` | POST | Computes coherence and sentiment | verification panel |
| `/api/verification/ask-agent` | POST | Lets an LLM answer questions about a transcript | research/verification tools |

---

## 9. Domain model summary

## Scenes
A scene is a visual arrangement of boxes, avatars, background assets, and optional party settings.

Core fields usually include:
- id
- name
- boxes
- backgroundImage
- hasUnsavedChanges
- globalPartySettings

## Boxes
A box is a positioned region inside a scene.

It can contain:
- avatars
- content items
- party assignment metadata
- layout information such as x, y, width, and height

## Snippet nodes
A snippet node is a conversation step in the graph.

It typically includes:
- speakers
- turns
- interaction pattern
- prompt or description
- turn-taking mode
- interruption rules
- backchannel rules
- party behavior flags
- optional attached scene

## Parties
Parties represent groups of agents.

They support:
- representative or all-speaker modes
- backchannel settings
- moderated or free turn-taking
- participant membership

## Messages and segments
Messages are streamed conversation units. Audio segments map spoken content to playback assets and timing.

---

## 10. How frontend and backend connect

### Client-to-server communication style
The client mostly calls REST endpoints using the base URL from `client/src/config.js`.

### Streaming conversation flow
The conversation endpoint streams JSON chunks rather than waiting for a single final payload. That means the UI is built around incremental message arrival.

### Local storage usage
The frontend relies on local storage for:
- API keys
- current provider selection
- human participant data
- verification exports
- played node order and session-like state

This works for a prototype, but should eventually be migrated to a more explicit persistence layer.

---

## 11. Current strengths of the app

- functional end-to-end authoring flow already exists
- visual conversation graph editing is present
- multiple LLM providers are supported
- TTS integration is operational
- party and impromptu mechanics are more advanced than a simple chatbot demo
- verification features make the app useful for experimentation and research

---

## 12. Main technical debt and modernization targets

## High-priority issues

### 1. Large, overloaded components
Examples:
- `Home.jsx`
- `NodeEditor.tsx`
- `chat.js`

These files mix state, orchestration, UI behavior, and domain rules.

### 2. Mixed JavaScript and TypeScript
The app is partially typed but not consistently typed. This increases friction during maintenance.

### 3. Event-driven coupling
Some scene synchronization relies on global browser events, which can become fragile and hard to trace.

### 4. Local storage as a persistence backbone
Useful for prototyping, but weak for versioning, collaboration, and robustness.

### 5. Limited backend modularization
Conversation logic, moderation logic, and provider orchestration are still tightly packed.

### 6. Naming inconsistencies
Examples include typos like `PartcipantModal.jsx` and mixed naming patterns across folders.

---

## 13. Safe places to start re-engineering

These are the best low-risk entry points for future tasks:

### UI cleanup
- `client/src/components/ui/`
- theme files
- isolated inspector subcomponents

### Strong typing pass
- `client/src/components/inspector/store.ts`
- `client/src/components/nodeeditor/types.ts`

### Provider abstraction improvements
- `server/providers/llmProvider.js`
- `server/modelAPI.js`

### Verification enhancements
- `client/src/components/verification/`
- `server/verificationAPI.js`

---

## 14. High-risk files to modify carefully

If you change any of the following, validate the entire authoring and preview flow afterward:

- `client/src/components/Home.jsx`
- `client/src/components/nodeeditor/NodeEditor.tsx`
- `client/src/components/inspector/store.ts`
- `server/server.js`
- `server/chat.js`
- `server/agent.js`
- `server/tts.js`

These files affect multiple subsystems at once.

---

## 15. Suggested modernization roadmap

## Phase 1: Stabilize and document
- add better typing to the shared state model
- document payload shapes for all API routes
- remove obvious naming issues and dead code
- add frontend and backend logging boundaries

## Phase 2: Component decomposition
- split `Home.jsx` into workspace feature modules
- split `NodeEditor.tsx` into graph shell, toolbar, renderer, and interaction controllers
- split `chat.js` into a proper conversation engine package

## Phase 3: Reliability improvements
- add structured error handling and user-visible error states
- add tests for core orchestration behavior
- add validation for incoming API payloads
- add retries and timeouts for provider calls

## Phase 4: Product-grade improvements
- add persistence beyond local storage
- add authentication and project saving
- improve scalability for larger scenes and longer conversations
- add clearer model settings and export workflows

---

## 16. Practical guide for future agents

### If the task is about avatar appearance or layout
Start in:
- `client/src/components/avatarconfig/`
- `client/src/components/scene/`
- `client/src/components/inspector/`

### If the task is about dialogue flow or snippet behavior
Start in:
- `client/src/components/nodeeditor/`
- `client/src/components/inspector/SnippetInspector.tsx`
- `server/chat.js`
- `server/agent.js`

### If the task is about model selection or API keys
Start in:
- `client/src/components/ApiKeyModal.jsx`
- `client/src/config.js`
- `server/modelAPI.js`
- `server/providers/llmProvider.js`

### If the task is about voice generation or avatar speech
Start in:
- `server/tts.js`
- preview and node editor playback utilities

### If the task is about transcript analysis or metrics
Start in:
- `client/src/components/verification/`
- `server/verificationAPI.js`

### If the task is about uploaded documents or knowledge inputs
Start in:
- `client/src/components/topic/ContentLibrary.jsx`
- `server/contentAPI.js`
- `server/contentManager.js`

---

## 17. Recommended next documentation files

After this guide, the next useful docs would be:
- a payload schema document for scene, node, and agent config
- a route-by-route API contract reference
- a state diagram for conversation execution modes
- a frontend event map for scene synchronization
- a modernization backlog prioritized by risk and impact

---

## 18. Final summary

VOX LAB is already a rich functional prototype with a serious amount of capability:
- multi-agent orchestration
- scene authoring
- avatar visualization
- voice synthesis
- evaluation and research tooling

The main re-engineering challenge is not missing functionality.
It is architectural consolidation.

The best long-term strategy is to preserve the current working behavior while progressively isolating:
- domain state
- graph editing logic
- conversation orchestration
- provider integration
- presentation and verification UI

This file should be used as the primary deep-navigation reference for future engineering tasks.