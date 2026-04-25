# VOX LAB UI Structure & Components

## Overview

VOX LAB is a multi-mode visual authoring tool with three main interface layouts:
- **Authoring Mode** - For scene setup, avatar configuration, and conversation design
- **Experience Mode** - For playback and testing conversations
- **Verification Mode** - For reviewing and validating conversation exports

The UI is built with React and uses **Zustand** for state management (`useEditorStore`).

---

## High-Level Architecture

```
App (root)
├── Home (core container)
│   ├── Header (mode selector, settings)
│   ├── Left Panel (Avatar Library)
│   │   ├── SelectionBar
│   │   ├── ContentLibrary
│   │   ├── DraggableScenes
│   │   └── NavigationPanel
│   ├── Main Content (center/right)
│   │   ├── Avatar Config Panel (authoring)
│   │   ├── Scene Viewer (authoring)
│   │   ├── Conversation Panel / NodeEditor (authoring)
│   │   └── ExperienceMode (experience)
│   └── Inspector Panel (right, authoring only)
```

---

## Detailed Component Breakdown

### 1. **Header Component**
**Location:** `client/src/components/Header.jsx`

**Purpose:** Top navigation bar with mode switching and model selection

**Key Features:**
- Mode toggle: `authoring` / `experience` / `verification` / `playback`
- LLM Model selector (Gemini, OpenAI, Azure)
- Provider switching dropdown
- API key management button
- Theme toggle (light/dark)

**State Managed:**
- `currentProvider` - Active LLM provider
- `currentModel` - Selected model name
- `showModelDropdown` - Dropdown visibility

**Key Props:**
- `mode` - Current application mode
- `setMode` - Function to change mode
- `onOpenKeys` - Callback to open API key modal

---

### 2. **Left Panel - Avatar Library Section**

#### **SelectionBar**
**Location:** `client/src/components/topic/SelectionBar.jsx`

**Purpose:** Display and manage participant avatars

**Key Features:**
- Shows avatar thumbnail grid for all participants
- Drag-and-drop avatars to scene boxes
- Click to select avatar and open inspector
- Mark participants as "human" (player-controlled)
- Display voice and mood for each avatar
- Loading indicators for thumbnail generation

**State:**
```javascript
const [selectedAvatar, setSelectedAvatar] = useState(null);
const [thumbnails, setThumbnails] = useState({});
const [humanParticipants, setHumanParticipants] = useState([]);
```

**Avatar Config Per Participant:**
```javascript
{
  name: "Alice",
  url: "/assets/female-avatar1.glb",
  settings: {
    ttsLang: "en-GB",
    lipsyncLang: "en",
    body: "F",
    mood: "neutral",
    cameraView: "upper",
    cameraDistance: 0.1
  },
  voice: "en-GB-Standard-A",
  gender: "female",
  isHuman: false
}
```

**Interactions:**
- Click avatar → Opens `AvatarInspector` in right panel
- Drag avatar → Drags to scene box in `AvatarConfigPanel`
- Right-click → Toggle human status (stores in localStorage)

---

#### **ContentLibrary**
**Location:** `client/src/components/topic/ContentLibrary.jsx`

**Purpose:** Upload and manage reference content files

**Supported Formats:**
- PDF files
- Images (JPG, PNG)
- Spreadsheets (XLSX, XLS)
- Documents (DOC, DOCX)
- Text files (TXT)

**Features:**
- File upload input
- Drag-and-drop content into scene
- Content references in conversations

---

#### **DraggableScenes**
**Location:** `client/src/components/inspector/DraggableScenes.tsx`

**Purpose:** Scene library - manage saved and active scenes

**Key Features:**
- Lists all saved scenes from localStorage
- Shows active scenes from editor state
- Drag scenes to NodeEditor canvas
- Delete scenes button
- Double-click or drag to load scene
- Scene preview with avatar names and layout info

**State:**
```typescript
interface SavedScene extends Scene {
  preview?: ScenePreview;
  isFileReference?: boolean;
  isSaved: boolean;
  isActive?: boolean;
}
```

**Events Dispatched:**
- `scenepaneldrop` - When scene is dragged/dropped
- `show-scene-in-editor` - When scene is selected (with context: 'authoring')

---

#### **NavigationPanel**
**Location:** `client/src/components/topic/NavigationPanel.tsx`

**Purpose:** Bottom section of left panel - toggle between Library and Preview views

**Features:**
- Toggle Library visibility (Avatar Library + Content + Scenes)
- Toggle Preview visibility (Conversation messages)
- Participant initialization (create speakers in store)
- Loading state indicator

**Props:**
- `editAgent` - Whether library is visible
- `showPreview` - Whether preview panel is visible
- `setEditAgent` / `setShowPreview` - Toggle callbacks
- `selectedParticipants` - Array of participant names

---

### 3. **Main Content Panel - Avatar Configuration**

#### **AvatarConfigPanel**
**Location:** `client/src/components/avatarconfig/AvatarConfigPanel.jsx`

**Purpose:** Configure avatars and scene layout (when `editAvatar === true`)

**Provides:**
- **SceneHierarchyView** - Tree view of scene boxes and parties
- **SceneSetup** - Grid-based scene configuration
  - Add/remove boxes
  - Position and size boxes
  - Assign avatars to boxes
  - Configure party memberships
  - Set camera angles and layouts

**Key State in Home.jsx:**
```javascript
const [showAvatarPanel, setShowAvatarPanel] = useState(true);
const [editAvatar, setEditAvatar] = useState(true);
const [showSceneView, setShowSceneView] = useState(false);
```

**Flow:**
1. User adds participants in SelectionBar
2. AvatarConfigPanel shows grid with boxes
3. User drags avatars from SelectionBar to boxes
4. Each box can have multiple elements (avatars, content)
5. Boxes can be assigned to "Parties" (groups of participants)
6. Scene is saved to localStorage and editor store

---

#### **SceneViewer**
**Location:** `client/src/components/scene/SceneViewer.jsx`

**Purpose:** Read-only preview of current scene layout (when `showSceneView === true`)

**Features:**
- Visual representation of scene boxes
- Shows avatar assignments
- Shows party groupings
- Shows content references
- Edit button to switch back to SceneSetup

---

### 4. **Conversation Panel - NodeEditor**

#### **NodeEditor**
**Location:** `client/src/components/nodeeditor/NodeEditor.tsx`

**Purpose:** Visual node-based conversation flow editor (when `editConversation === true`)

**Concepts:**
- **Nodes** - Discrete conversation turns/snippets
- **Connections** - Links between nodes showing conversation flow
- **Speakers** - Which avatars speak in each node
- **Rules** - Interruption rules, backchannel rules

**Node Types:**
```typescript
interface SnippetNode extends Node {
  type: 'snippet';
  speakers: AvatarConfig[];        // Who speaks
  initiator: AvatarConfig;           // Who starts
  subTopic?: string;                 // Conversation focus
  turns?: number;                    // Number of exchanges
  interactionPattern?: string;       // neutral, critical, supportive, etc.
  interruptionRules?: InterruptionRule[];
  backChannelRules?: BackChannelRule[];
  partyMode?: boolean;               // Group conversation
  attachedScene?: Scene;             // Scene to use
  audioSegments?: AudioSegment[];    // Generated audio
  totalDuration?: number;
}
```

**Features:**
- Add nodes with right-click context menu
- Connect nodes with drag-and-drop on port
- Select node to open in Inspector
- Play node button to generate conversation
- Export to verification mode
- Real-time audio playback with timeline

**Key Controls:**
- Right-click canvas → Add node
- Left-click + drag on port → Connect nodes
- Left-click node → Select (opens Inspector)
- Play button → Generate audio for node
- Play All button → Generate entire conversation flow

---

### 5. **Preview Panel**

#### **PreviewPanel**
**Location:** `client/src/components/preview/PreviewPanel.tsx`

**Purpose:** Display conversation messages and audio playback

**Shows:**
- All messages in conversation order
- Speaker name and party affiliation
- Message timestamps
- Audio playback timeline
- Mood/vibe indicators
- Human vs AI speaker distinction

**Features:**
- Audio timeline scrubber
- Play/pause audio
- Message approval flow (impromptu phases)
- Export dialog trigger

**Message Types:**
```typescript
interface Message {
  participant: string;           // Speaker name
  content: string;               // Message text
  party?: string;                // Party affiliation
  isDerailing?: boolean;         // Breaks from script
  needsApproval?: boolean;       // Needs user approval
  isSystemMessage?: boolean;     // System notification
  audioSegments?: AudioSegment[];
  timestamp?: number;
}
```

---

### 6. **Inspector Panel (Right)**

#### **Inspector**
**Location:** `client/src/components/inspector/Inspector.jsx`

**Purpose:** Context-sensitive property editor (only visible in authoring mode)

**Only renders when:** `mode === 'authoring' && selectedItem !== null`

**Sub-Inspectors (conditional rendering):**

##### **AvatarInspector**
Shown when `selectedItem.type === 'avatar'`

**Editable Properties:**
- Basic: Name, Gender, Voice, Personality
- Interaction Pattern (neutral, critical, supportive, etc.)
- Custom Attributes (key-value pairs)
- UI for saving templates

##### **SnippetInspector**
Shown when selected item is a node/snippet

**Editable Properties:**
- Node title
- Speakers (which avatars participate)
- Initiator (who starts)
- Sub-topic
- Number of turns
- Interaction pattern
- Interruption rules editor
- Backchannel rules editor
- Scene selector
- Conversation prompt

##### **PartyInspector**
Shown when selected item is a party

**Editable Properties:**
- Party name & description
- Speaking mode (representative, all, subset, random)
- Representative speaker selection
- Participant list

##### **ConnectionInspector**
Shown when selected item is a connection between nodes

**Editable Properties:**
- Source and destination nodes
- Conditions (if applicable)

---

## State Management (Zustand Store)

**Location:** `client/src/components/inspector/store.ts`

### Key Store Properties:

```typescript
export interface EditorState {
  // Nodes & Connections
  nodes: SnippetNode[];
  connections: Connection[];
  
  // Scenes
  scenes: Scene[];
  savedScenes: SavedScene[];
  activeSceneId: string | null;
  
  // Selection
  selectedItem: SnippetNode | null;
  
  // Speakers
  speakers: AvatarConfig[];
  
  // Conversation Mode
  conversationMode: 'moderated' | 'autonomous';
  
  // Party Settings
  globalPartySettings?: GlobalPartySettings;
  
  // Methods
  addNode(node: SnippetNode): void;
  updateNode(id: string, updates: Partial<SnippetNode>): void;
  deleteNode(id: string): void;
  addConnection(connection: Connection): void;
  setSelectedItem(item: SnippetNode | null): void;
  setSpeakers(speakers: AvatarConfig[]): void;
  setScenes(scenes: Scene[]): void;
  setActiveSceneId(id: string | null): void;
  // ... and more
}
```

### localStorage Integration:

The store persists to localStorage with keys:
- `scene:{id}` - Individual scene data
- `aiPanelData` - Topic, human participants, speaker info
- `verification-data-{nodeId}` - Verification/export data
- `played-nodes` - Nodes that have been executed

---

## Mode System

### Authoring Mode (`mode === 'authoring'`)
**Default mode for editing**

Visible Components:
- Header
- Left panel (library, content, scenes)
- Avatar config panel OR Scene viewer
- Conversation panel (NodeEditor)
- Inspector panel

**Visibility Toggles:**
```javascript
showAvatarPanel: boolean    // Shows avatar config
showSceneView: boolean      // Shows scene viewer
editAvatar: boolean         // Edit vs just view
showConversationPanel: boolean
editConversation: boolean   // Edit nodes vs view awareness
showTopicPanel: boolean     // Library vs preview
editAgent: boolean          // Library vs preview
showPreview: boolean        // Library vs preview
```

### Experience Mode (`mode === 'experience'`)
**For testing/playing conversations**

- Full-screen scene display
- Avatar interaction
- Conversation playback
- No editor UI visible

### Verification Mode (`mode === 'verification'`)
**For reviewing exported data**

- VerificationPlayer component
- Shows recorded conversation data
- Allows replay with audio

### Playback Mode (`mode === 'playback'`)
**Special state for playing individual scenes**

- Preserves current UI state
- Plays scene in background
- Used during NodeEditor "Play" button

---

## Known Issues & Recent Fixes

### Issue #1: Inspector Disappears After Scene Setup ✅ FIXED

**Problem:** Setting up a scene in AvatarConfigPanel → Saving scene → Inspector vanishes

**Root Cause:** 
- Event handler in `SceneEventHandler.js` was switching mode from 'authoring' → 'experience'
- Inspector only renders when `mode === 'authoring'`

**Solution:**
- Modified event listener to check for `fromSceneLibrary` flag
- DraggableScenes now dispatches with `context: 'authoring'` and `fromSceneLibrary: true`
- This prevents mode switching when loading scenes from the library

**Code Changes:**
```javascript
// SceneEventHandler.js - Line ~107
if (event.detail.source === 'nodeeditor' && !event.detail.context) {
  if (event.detail.fromSceneLibrary) {
    // Stay in authoring mode when loading from scene library
    setMode('authoring');
    setShowAvatarPanel(true);
    setEditAvatar(true);
  } else {
    // Switch to experience mode when playing from node editor
    setMode('experience');
  }
}
```

```typescript
// DraggableScenes.tsx - Line ~115
const simulateSceneDrop = (scene: Scene) => {
  // ... existing code ...
  
  // Dispatch show-scene-in-editor with authoring context
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('show-scene-in-editor', {
      detail: {
        sceneId: scene.id,
        sceneName: scene.name,
        source: 'draggable-scenes',
        context: 'authoring',
        fromSceneLibrary: true,
        maintainMode: false
      }
    }));
  }, 100);
};
```

---

### Issue #2: Avatar Library Stuck on Single Avatar ⚠️ PARTIAL

**Problem:** Can't toggle between avatar selections (stuck on Alice)

**Root Cause:**
- SelectionBar shows avatars but clicking doesn't update selectedParticipants array
- Avatar URLs are fixed by name mapping
- No UI to change which avatar model a participant uses

**Partial Solution:**
- SelectionBar allows clicking to select and open Inspector
- Inspector can edit voice, personality, mood
- But can't change the avatar model (GLB file) itself

**Needed Enhancement:**
- Add avatar model selector to AvatarInspector
- Allow choosing from available GLB files for a participant
- Update selectedParticipants to use selected avatars

---

## Event System

### Key Custom Events:

**Scene Management:**
- `show-scene-in-editor` - Load/select a scene
- `scenepaneldrop` - Scene dropped from library
- `editor-scenes-updated` - Scenes changed in store

**Node Editor:**
- `node-generated` - Node audio generated
- `play-node` - Play node audio
- `node-selected` - Node selected in editor

**Avatar/Speaker:**
- `humanParticipantsChanged` - Human status toggled
- `speakers-updated` - Speaker list changed

**Conversation:**
- `topicChanged` - Conversation topic changed
- `impromptu-approval-needed` - Requires user approval
- `impromptu-rejected` - User rejected derailing

---

## Data Flow Examples

### Creating a Scene:
1. User selects participants in SelectionBar → `handleParticipantsSelected(names)`
2. Home.jsx sets `selectedParticipants` state
3. AvatarConfigPanel renders with grid
4. User drags avatars to boxes
5. User clicks "Save Scene" button
6. Scene saved to localStorage and editor store
7. DraggableScenes detects new scene and displays it

### Playing a Conversation:
1. User clicks "Play All" in NodeEditor
2. NodeEditor generates conversation by calling API
3. Server returns messages with audio segment data
4. PreviewPanel displays messages and audio timeline
5. Audio plays with avatar animations via TalkingHead instances
6. Messages dispatched to `setMessages()` state

### Exporting to Verification:
1. User clicks "Export" in PreviewPanel
2. Home.jsx collects all played nodes
3. Calls `exportToVerificationData()` or `exportToVerificationWithTTS()`
4. Data saved to localStorage with `verification-data-{nodeId}` keys
5. Mode switches to 'verification'
6. VerificationPlayer loads and displays exported data

---

## File Structure Reference

```
client/src/components/
├── App.jsx                    # Root component
├── Home.jsx                   # Main container
├── Header.jsx                 # Top navigation
├── TalkingHead.css           # Styling
│
├── avatarconfig/
│   ├── AvatarConfigPanel.jsx # Scene grid editor
│   ├── SceneSetup.jsx        # Box configuration
│   ├── SceneHierarchyView.jsx# Tree view
│   ├── SceneSetupModal.jsx   # Save/load dialog
│   └── utils/                # Helper functions
│
├── inspector/
│   ├── Inspector.jsx         # Main inspector dispatcher
│   ├── AvatarInspector.jsx   # Avatar properties
│   ├── SnippetInspector.tsx  # Node/snippet properties
│   ├── PartyInspector.jsx    # Party/group properties
│   ├── DraggableScenes.tsx   # Scene library
│   ├── store.ts              # Zustand store
│   └── *.tsx                 # Other inspectors
│
├── nodeeditor/
│   ├── NodeEditor.tsx        # Canvas & nodes
│   ├── NodeDisplay.tsx       # Node rendering
│   ├── NodeConnection.tsx    # Connection lines
│   └── utils/                # Utilities
│
├── preview/
│   ├── PreviewPanel.tsx      # Message & audio display
│   └── ImpromptuApprovalPanel.tsx  # Approval UI
│
├── topic/
│   ├── SelectionBar.jsx      # Avatar selection
│   ├── ContentLibrary.jsx    # File upload
│   └── NavigationPanel.tsx   # Panel toggles
│
├── theme/
│   ├── ThemeContext.jsx      # Dark/light mode
│   └── theme.css             # Theme variables
│
└── events/
    └── SceneEventHandler.js  # Event listeners
```

---

## Best Practices for Contributing

### Adding a New Component:
1. Place in appropriate folder (inspector/, avatarconfig/, etc)
2. Import store with `useEditorStore()`
3. Import useEditorStore as const { ... } = useEditorStore()
4. Use store methods to update state
5. Dispatch custom events for cross-component communication

### Updating State:
❌ Don't: Modify localStorage directly without dispatching events
✅ Do: Use store setters, then dispatch custom events

### Adding UI Controls:
1. Add to appropriate inspector or panel
2. Update related input types in store
3. Dispatch change events
4. Test in authoring mode

### Preventing Mode Switches:
Pass `context: 'authoring'` in event details to prevent mode changes when loading scenes from library.

---

## Performance Notes

- SelectionBar generates thumbnails asynchronously (can be slow with many avatars)
- NodeEditor uses memoization for large node graphs
- PreviewPanel virtualizes long message lists
- Scene data stored in localStorage (5-10MB limit)
- Consider splitting very large conversations into multiple scenes

