# VOX LAB Agent Documentation

## Overview

VOX LAB is an authoring tool for configuring and orchestrating multi-agent conversations with animated 3D avatars. It enables researchers, designers, and developers to create, visualize, and evaluate complex agent-based dialogue systems.

**Technologies:**
- **Frontend:** React 19, Vite, Three.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **LLM Providers:** OpenAI GPT, Google Gemini
- **TTS:** Google Text-to-Speech
- **3D Avatars:** Ready Player Me avatars with TalkingHead library

## Architecture

### High-Level Architecture

VOX LAB follows a client-server architecture:

- **Client (Port 5173):** React SPA for authoring and visualization
- **Server (Port 3010):** Express API server handling LLM calls, TTS, and conversation logic

### Data Flow

1. User configures conversation in Node Editor (frontend)
2. Configuration sent to server via REST API
3. Server initializes ConversationManager with agents
4. Conversation runs turn-by-turn, calling LLM providers
5. Responses converted to speech via TTS
6. Audio and text streamed back to client for visualization

## Frontend Structure

### Main Entry Points

- `client/src/App.jsx`: Root component, handles API key modal and theme
- `client/src/components/Home.jsx`: Main application component, orchestrates all panels

### Key Components

#### Core Panels

- **Header** (`client/src/components/Header.jsx`): Top navigation bar
- **SceneViewer** (`client/src/components/scene/SceneViewer.jsx`): 3D scene rendering with Three.js
- **NodeEditor** (`client/src/components/nodeeditor/NodeEditor.tsx`): Visual conversation design interface
- **PreviewPanel** (`client/src/components/preview/PreviewPanel.tsx`): Real-time conversation preview
- **Inspector** (`client/src/components/inspector/Inspector.jsx`): Property editor for selected elements

#### Configuration Panels

- **AvatarConfigPanel** (`client/src/components/avatarconfig/AvatarConfigPanel.jsx`): Avatar selection and configuration
- **ContentLibrary** (`client/src/components/topic/ContentLibrary.jsx`): Content management
- **NavigationPanel** (`client/src/components/topic/NavigationPanel.tsx`): Topic/scene navigation

#### Specialized Components

- **VerificationPlayer** (`client/src/components/verification/VerificationPlayer.tsx`): Conversation analysis and metrics
- **ExperienceMode** (`client/src/components/experience/ExperienceMode.jsx`): Polished presentation mode
- **DraggableScenes** (`client/src/components/inspector/DraggableScenes.tsx`): Scene management interface

### State Management

- **Zustand Store** (`client/src/components/inspector/store.ts`): Centralized state for editor, scenes, connections
- **Local Storage**: API keys, user preferences

### Key Hooks and Utils

- `useEditorStore`: Main store hook for editor state
- `SceneEventHandler.js`: Event handling for scene updates
- `AvatarInitializer.js`: Avatar setup utilities

## Backend Structure

### Main Entry Point

- `server/server.js`: Express server setup, CORS configuration, route mounting

### Core Modules

#### Conversation Management
- `server/chat.js`: ConversationManager class - orchestrates multi-agent conversations
- `server/agent.js`: Agent class - individual participant logic
- `server/conversationmemory.js`: Memory management for conversation history

#### API Routes
- `server/modelAPI.js`: LLM provider endpoints
- `server/tts.js`: Text-to-speech endpoints
- `server/contentAPI.js`: Content management endpoints
- `server/verificationAPI.js`: Conversation analysis endpoints

#### Providers
- `server/providers/llmProvider.js`: Unified interface for LLM providers
- `server/providers/geminiAPI.js`: Google Gemini integration

### Key Classes

#### ConversationManager
- Manages turn-based conversations
- Handles party mode, interruptions, derailing
- Integrates with memory and agents

#### Agent
- Represents individual conversation participants
- Handles LLM calls and response generation
- Maintains agent-specific state

## API Endpoints

### Conversation APIs
- `POST /api/start-conversation`: Initiate conversation
- `POST /api/batch-synthesize`: Generate audio for conversation
- `POST /api/tts`: Single text-to-speech request

### Content APIs
- `GET /api/content`: Retrieve content files
- `POST /api/content`: Upload content
- `DELETE /api/content/:id`: Delete content

### Verification APIs
- `POST /api/verification/analyze`: Analyze conversation metrics
- `GET /api/verification/transcript`: Get conversation transcript

### Impromptu APIs
- `POST /api/impromptu/approve`: Approve impromptu phase
- `POST /api/impromptu/reject`: Reject impromptu phase

## Configuration

### Environment Variables (server/.env)
```
NODE_ENV=development
GEMINI_API_KEY=your-key
API_KEY_LLM=your-openai-key
TTS_API_KEY=your-tts-key
DEFAULT_LLM_PROVIDER=gemini
```

### Client Configuration
- `client/src/config.js`: API endpoints and environment detection
- `client/components.json`: UI component configuration
- `client/vite.config.js`: Build configuration

## Key Features

### Visual Conversation Design
- Node-based editor for conversation flow
- Scene management with hierarchies
- Connection system for dialogue branches

### 3D Avatar Integration
- Ready Player Me avatar support
- Synchronized speech animation
- TalkingHead library for lip-sync

### Multi-Agent Conversations
- Configurable agent personalities
- Party mode for group dynamics
- Interruption and backchannel support

### Real-time Preview
- Live conversation simulation
- Audio playback with timeline
- Scene transitions

### Verification Tools
- Conversation metrics dashboard
- Audio transcript analysis
- Quality evaluation

## Development Workflow

### Starting Development
1. Install dependencies: `npm install` in client/ and server/
2. Configure API keys in server/.env
3. Start server: `cd server && node server.js`
4. Start client: `cd client && npm run dev`
5. Open http://localhost:5173

### Building for Production
- Client: `npm run build` in client/
- Server: Deploy Node.js app to hosting platform

## File Organization

### Client
```
client/
├── src/
│   ├── components/
│   │   ├── avatarconfig/     # Avatar configuration
│   │   ├── events/           # Event handlers
│   │   ├── experience/       # Presentation mode
│   │   ├── inspector/        # Property editors
│   │   ├── nodeeditor/       # Visual editor
│   │   ├── preview/          # Preview functionality
│   │   ├── scene/            # 3D scene rendering
│   │   ├── theme/            # Theming system
│   │   ├── topic/            # Content management
│   │   ├── ui/               # Reusable UI components
│   │   └── verification/     # Analysis tools
│   ├── libs/                 # Third-party libraries
│   └── assets/               # Static assets
├── public/
│   ├── assets/               # Avatar models, content
│   └── libs/                 # TalkingHead, etc.
```

### Server
```
server/
├── providers/                # LLM integrations
├── *.js                      # Core server files
└── audio/                    # Generated audio files
```

### Content
```
content/                      # User-uploaded content
```

## Re-engineering Guidelines

### Modernization Opportunities
- Migrate to TypeScript for better type safety
- Implement proper state management (Redux Toolkit/Zustand already used)
- Add comprehensive testing (Jest, React Testing Library)
- Improve error handling and loading states
- Optimize 3D rendering performance
- Add real-time collaboration features

### Component Refactoring
- Break down large components (Home.jsx) into smaller, focused components
- Implement proper prop validation
- Add accessibility features
- Standardize naming conventions

### Backend Improvements
- Add proper authentication/authorization
- Implement rate limiting
- Add comprehensive logging
- Migrate to async/await consistently
- Add input validation and sanitization

### API Enhancements
- Implement RESTful API design
- Add OpenAPI/Swagger documentation
- Version API endpoints
- Add proper error responses

This documentation serves as the foundation for re-engineering VOX LAB into a more maintainable, scalable, and feature-rich application.