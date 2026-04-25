# Lovable Code: Workspace (Studio) Component

This is the main workspace that ties everything together. Implement as `src/components/Studio.tsx` (was `Home.jsx`). This component manages the app modes (authoring, preview, experience, verification) and composes all panels.

The workspace has a 3-panel layout:
- **Left panel** (300px): Avatar library, content library, saved scenes, preview panel
- **Center panel** (flex): Scene viewer OR avatar config panel (top), Node editor (bottom)
- **Right panel**: Inspector (context-sensitive property editor)

## App Entry Point — `src/App.tsx`

```tsx
import { useEffect, useState } from 'react';
import Studio from './components/Studio';
import { ThemeProvider } from './components/theme/ThemeContext';
import './components/theme/theme.css';
import './components/theme/theme-utils.css';
import './App.css';
import ApiKeyModal from './components/ApiKeyModal';

function App() {
  const [missingKeys, setMissingKeys] = useState({ openai: false, gemini: false, tts: false });
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [provider, setProvider] = useState('gemini');

  const refreshStatus = async () => {
    const p = localStorage.getItem('LLM_PROVIDER') || provider || 'gemini';
    setProvider(p);
    const nextMissing = {
      openai: p === 'openai' ? !(localStorage.getItem('OPENAI_API_KEY')) : false,
      gemini: p === 'gemini' ? !(localStorage.getItem('GEMINI_API_KEY')) : false,
      tts: !(localStorage.getItem('TTS_API_KEY')),
    };
    setMissingKeys(nextMissing);
    setShowKeyModal(nextMissing.openai || nextMissing.gemini || nextMissing.tts);
  };

  useEffect(() => { refreshStatus(); }, []);

  useEffect(() => {
    const handler = () => setShowKeyModal(true);
    window.addEventListener('open-api-key-modal', handler);
    return () => window.removeEventListener('open-api-key-modal', handler);
  }, []);

  return (
    <ThemeProvider>
      <div className="App">
        <Studio />
        {showKeyModal && (
          <ApiKeyModal
            missing={missingKeys}
            provider={provider}
            onSelectProvider={(p: string) => {
              localStorage.setItem('LLM_PROVIDER', p);
              setProvider(p);
            }}
            onClose={() => setShowKeyModal(false)}
            onSaved={refreshStatus}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## Studio Component — `src/components/Studio.tsx`

This is the core workspace component. Key behaviors:
- **4 modes**: authoring (default), experience, verification, playback
- **Authoring mode** has 3 columns: left panel (library + preview), center (scene + node editor), right (inspector)
- Manages conversation state (messages array), audio segments, avatar instances
- Handles export to verification (with optional TTS audio generation)
- Handles impromptu phase approval/rejection via API calls (streaming responses)

### State variables:
```tsx
const [mode, setMode] = useState('authoring'); // 'authoring' | 'experience' | 'verification' | 'playback'
const [showAvatarPanel, setShowAvatarPanel] = useState(true);
const [editAvatar, setEditAvatar] = useState(true);
const [editAgent, setEditAgent] = useState(true); // controls left library panel
const [showPreview, setShowPreview] = useState(false);
const [showTopicPanel, setShowTopicPanel] = useState(true);
const [showSceneView, setShowSceneView] = useState(false);
const [showExportDialog, setShowExportDialog] = useState(false);
const [messages, setMessages] = useState([]); // conversation messages
const [selectedParticipants, setSelectedParticipants] = useState([]);
const [audioSegments, setAudioSegments] = useState([]);
const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [totalDuration, setTotalDuration] = useState(0);
const avatarInstancesRef = useRef({});
const { scenes, activeSceneId, setActiveSceneId, setScenes, conversationMode, setConversationMode } = useEditorStore();
```

### Key handlers:

**handleApproveImpromptu**: POST to `/api/impromptu/approve` with optional `editedContent`, stream response for new messages.

**handleRejectImpromptu**: POST to `/api/impromptu/reject`, remove derailing messages from UI, stream replacement messages.

**handleExport**: Exports conversation to verification data in localStorage, optionally generates TTS audio via `/api/batch-synthesize`, then switches to verification mode.

### Render structure:
```tsx
return (
  <>
    <Header mode={mode} setMode={setMode} onOpenKeys={() => window.dispatchEvent(new CustomEvent('open-api-key-modal'))} />
    <div className="app-container theme-bg-primary">

      {/* LEFT PANEL (300px) */}
      {showTopicPanel && (
        <div className="max-w-[300px] w-[300px] h-full">
          {editAgent && (
            <>
              <PanelHeader title="Avatar Library" />
              <SelectionBar avatarUrls={avatarUrls} participantNames={selectedParticipants} currentScene={currentScene} />
              <PanelHeader title="Content Library" />
              <ContentLibrary currentScene={currentScene} />
              <DraggableScenes />
            </>
          )}
          <PanelHeader title="Preview Panel" isEditing={showPreview} />
          <PreviewPanel
            messages={messages}
            onClose={() => setShowPreview(false)}
            showExportDialog={showExportDialog}
            onExport={handleExport}
            onDeclineExport={() => setShowExportDialog(false)}
            onApproveImpromptu={handleApproveImpromptu}
            onRejectImpromptu={handleRejectImpromptu}
            onEditImpromptu={handleEditImpromptu}
            onRegenerateImpromptuWithMode={handleRegenerateImpromptuWithMode}
          />
          <NavigationPanel editAgent={editAgent} showPreview={showPreview} />
        </div>
      )}

      {/* CENTER PANEL */}
      <div className="main-content">
        {mode === 'authoring' ? (
          <>
            {showAvatarPanel && (
              <div>
                <PanelHeader title={showSceneView ? 'Scene Viewer' : 'Scene Panel'} />
                {showSceneView ? (
                  <SceneViewer currentScene={currentScene} avatarInstancesRef={avatarInstancesRef} />
                ) : editAvatar ? (
                  <AvatarConfigPanel messages={messages} setMessages={setMessages} scenes={scenes} />
                ) : null}
              </div>
            )}
            <div>
              <PanelHeader title="Conversation Panel" />
              <NodeEditor messages={messages} setMessages={setMessages} avatarInstancesRef={avatarInstancesRef} setShowExportDialog={setShowExportDialog} />
            </div>
          </>
        ) : mode === 'experience' ? (
          <ExperienceMode />
        ) : mode === 'verification' ? (
          <VerificationPlayer />
        ) : null}
      </div>

      {/* RIGHT PANEL - Inspector */}
      {mode === 'authoring' && <Inspector />}
    </div>
  </>
);
```

### Impromptu approval flow (critical behavior):

When a message with `needsApproval: true` and `isDerailing: true` arrives in the stream:
1. The message is shown in PreviewPanel with an `ImpromptuApprovalPanel` overlay
2. User can: Approve (optionally editing the text), Reject, or Regenerate with a different mode
3. Approve → POST `/api/impromptu/approve` → streams continuation messages
4. Reject → POST `/api/impromptu/reject` → removes derail messages, streams replacement
5. Regenerate → POST `/api/impromptu/regenerate-with-mode` → streams new derail message

### Conversation mode switching:

Three modes sent to server via POST `/api/conversation/mode`:
- **human-control**: Derailing requires approval, conversation pauses for approval
- **autonomous**: Derailing auto-approved, conversation flows without pausing
- **reactive**: Derailing disabled entirely

### Default avatar name-gender mapping:
```typescript
const nameGenderMap: Record<string, string> = {
  'Alice': 'female', 'Bob': 'male', 'David': 'male', 'Eve': 'female',
  'Grace': 'female', 'Henry': 'male', 'Ivy': 'female', 'Jane': 'female',
};
const nameAvatarMap: Record<string, string> = {
  'Alice': '/assets/female-avatar1.glb', 'Bob': '/assets/male-avatar1.glb',
  'David': '/assets/male-avatar3.glb', 'Eve': '/assets/female-avatar2.glb',
  'Grace': '/assets/female-avatar3.glb', 'Henry': '/assets/male-avatar5.glb',
  'Ivy': '/assets/female-avatar4.glb', 'Jane': '/assets/female-avatar5.glb',
};
```
