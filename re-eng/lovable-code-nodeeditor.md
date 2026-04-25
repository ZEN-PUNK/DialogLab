# Lovable Code: Node Editor — Conversation Graph

The NodeEditor is the largest component (~2781 lines). It is a **zoomable/pannable SVG canvas** where conversation nodes (snippets) are placed, connected, and executed. Each node represents a conversation scene with attached avatars, topics, and party configurations.

## Key Concepts

1. **Nodes** = conversation snippets with attached scenes, speakers, topics, turns, interaction patterns
2. **Connections** = directional links between nodes defining conversation flow order
3. **Play All** = traverses the connected graph (DFS from root) and plays each node sequentially
4. Each node can be played as **text only** (just generate messages) or **with audio** (3D avatar TTS)
5. Nodes are draggable, zoomable, and can be created by dragging scenes from the left panel

## Component: `src/components/nodeeditor/NodeEditor.tsx`

### Props
```tsx
interface NodeEditorProps {
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  avatarInstancesRef?: React.MutableRefObject<any>;
  setShowExportDialog?: (show: boolean) => void;
}
```

### State (~30 variables)
```tsx
// Canvas interaction
const [scale, setScale] = useState(1);
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

// Node interaction
const [draggingNode, setDraggingNode] = useState<string | null>(null);
const [hasMoved, setHasMoved] = useState(false);
const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
const [selectedNode, setSelectedNode] = useState<SnippetNode | null>(null);
const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
const [activeContextMenuNode, setActiveContextMenuNode] = useState<string | null>(null);

// Connection
const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
const [nextConnectionId, setNextConnectionId] = useState(1);
const [activeConnectionIds, setActiveConnectionIds] = useState<string[]>([]);

// Playback
const [isPlaying, setIsPlaying] = useState(false);
const [isGenerating, setIsGenerating] = useState(false);
const [playingNodeId, setPlayingNodeId] = useState<string | null>(null);
const [playingAllNodes, setPlayingAllNodes] = useState(false);
const [useAudio, setUseAudio] = useState(true);
const [buttonDisabled, setButtonDisabled] = useState(false);

// Audio/Avatar
const [speakingElement, setSpeakingElement] = useState<AvatarElement | null>(null);
const [activePlaybackScene, setActivePlaybackScene] = useState<any>(null);
const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
const [totalDuration, setTotalDuration] = useState(0);

// Hand raising (moderated mode)
const [raisedHandParticipants, setRaisedHandParticipants] = useState<RaisedHandParticipant[]>([]);
```

### Critical Method: `generateTextFromNode()`

This is the core conversation generation flow. It:
1. Extracts speakers from the attached scene
2. Builds party commands from scene box party configurations
3. Builds content commands for any PDFs in the scene
4. Builds derailer commands for human participants
5. POSTs config to `/api/start-conversation`
6. Reads streaming newline-delimited JSON response
7. For each `type: 'message'` chunk: adds to messages array, handles backchannels
8. On `type: 'completion'`: stores audio segments in node

```tsx
const generateTextFromNode = async (node: SnippetNode, isPartOfSequence = false, isLastNode = false, isFirstNode = false) => {
  handleNodeLoad(node, isPartOfSequence, isFirstNode, true);
  try {
    const maxTurns = node.turns || 3;

    // Extract party configs from scene boxes
    const speakersByParty: Record<string, any[]> = {};
    const scenePartyConfigs: Record<string, any> = {};
    const sceneGlobalPartySettings = node.attachedScene?.globalPartySettings || {
      partyTurnMode: 'free', moderatorParty: '', enableBackchannel: false, enableInterruptions: false
    };

    if (node.attachedScene?.boxes) {
      node.attachedScene.boxes.forEach(box => {
        const partyName = box.party;
        if (partyName) {
          if (box.partyConfig) scenePartyConfigs[partyName] = { ...box.partyConfig };
          if (!speakersByParty[partyName]) speakersByParty[partyName] = [];
          box.elements?.forEach(element => {
            if (element.elementType === 'avatar' && element.avatarData?.name) {
              const matchingSpeaker = node.speakers.find(s => s.name === element.avatarData.name);
              if (matchingSpeaker) speakersByParty[partyName].push(matchingSpeaker);
            }
          });
        }
      });
    }

    // Build party commands
    const partyCommands: PartyCommand[] = Object.keys(speakersByParty).map(partyName => ({
      command: 'createParty',
      partyName,
      members: speakersByParty[partyName].map(s => s.name),
      config: {
        speakingMode: scenePartyConfigs[partyName]?.speakingMode || 'random',
        representative: scenePartyConfigs[partyName]?.representativeSpeaker || null,
        canInterrupt: sceneGlobalPartySettings.enableInterruptions ?? true,
        speakingProbability: 1.0,
        backchannelProbability: sceneGlobalPartySettings.enableBackchannel ? 0.3 : 0,
        partyDescription: scenePartyConfigs[partyName]?.description || partyName
      }
    }));
    partyCommands.push({ command: 'enablePartyMode', turnMode: sceneGlobalPartySettings.partyTurnMode || 'free' });

    // Build content commands (PDFs)
    const contentCommands: ContentCommand[] = [];
    // ... extract PDF elements from scene boxes, create initializeContent commands

    // Build derailer commands for human participants
    const derailerCommands: SetAsDerailerCommand[] = [];
    const hasHumanParticipants = node.speakers.some(s => s.isHuman);
    if (node.derailerMode !== false && hasHumanParticipants) {
      // Find human agents from localStorage or scene isHuman flags
      // For each human agent, push setAsDerailer command
    }

    const config = {
      maxTurns,
      agents: node.speakers.map(speaker => ({
        name: speaker.name,
        personality: speaker.personality || "friendly",
        interactionPattern: node.interactionPattern || "neutral",
        isHuman: speaker.isHuman || false,
        roleDescription: speaker.roleDescription || "",
        sceneDescription: node.description || "",
        conversationPrompt: node.conversationPrompt || ""
      })),
      partyTurnMode: sceneGlobalPartySettings.partyTurnMode || "free",
      moderatorParty: sceneGlobalPartySettings.moderatorParty || "",
      initiator: node.initiator?.name || node.speakers[0]?.name,
      topic: node.topic || node.objective || "general conversation",
      subTopic: node.subTopic || "",
      description: node.description || "",
      conversationPrompt: node.conversationPrompt || "",
      interactionPattern: node.interactionPattern || "neutral",
      turnTakingMode: node.turnTakingMode || "round-robin",
      partyMode: Object.keys(speakersByParty).length > 0,
      partyCommands,
      contentCommands: contentCommands.length > 0 ? contentCommands : undefined,
      derailerMode: node.derailerMode !== false,
      derailerCommands,
      globalPartySettings: sceneGlobalPartySettings,
      shouldLoadPreviousConversationManager: isPartOfSequence && !isFirstNode,
      conversationMode: useEditorStore.getState().conversationMode
    };

    // Send to backend with LLM key headers
    const provider = localStorage.getItem('LLM_PROVIDER') || 'gemini';
    const key = provider === 'openai' ? localStorage.getItem('OPENAI_API_KEY') : localStorage.getItem('GEMINI_API_KEY');
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.START_CONVERSATION}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-llm-provider': provider,
        'x-llm-key': key || ''
      },
      body: JSON.stringify(config)
    });

    // Process streaming response
    const reader = response.body?.getReader();
    let done = false;
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.type === 'message') {
            if (data.message.isBackchannel) {
              // Attach backchannel emoji to last message
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, backchannels: [...(last.backchannels || []), {
                  sender: data.message.sender,
                  emoji: getBackchannelEmoji(data.message.message, data.message.backchannelVibe),
                  message: data.message.message,
                  vibe: data.message.backchannelVibe
                }]}];
              });
            } else {
              setMessages(prev => [...prev, { ...data.message, backchannels: [] }]);
            }
          } else if (data.type === 'completion') {
            // Conversation complete
          }
        }
      }
    }
  } catch (error) { console.error('Error generating text:', error); }
  finally {
    if (!isPartOfSequence || isLastNode) {
      setIsGenerating(false);
      if (setShowExportDialog && conversationMode !== 'human-control') setShowExportDialog(true);
    }
  }
};
```

### Play All Nodes (Graph Traversal)

```tsx
const playAllNodes = (type: "audio" | "text") => {
  // Get all snippet nodes, build incoming/outgoing connection maps
  // Find root nodes (no incoming connections)
  // DFS from selected root or first root
  // Build ordered queue of nodeIds
  // Light up connections along the path
  // Start playing first node, playNextNodeInQueue() continues chain
};
```

### Render Structure

```tsx
return (
  <div className="node-editor-container theme-bg-primary">
    {/* Background grid (moves with pan) */}
    <div className="canvas-background" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }} />

    {/* Play All button + Audio checkbox */}
    <div className="absolute top-[10px] right-[10px] z-10 flex items-center gap-2">
      <div onClick={handlePlayAllClick} className={`px-2.5 py-1.5 ${playing ? 'bg-gray-500' : 'bg-blue-600'} text-white rounded flex items-center gap-1.5 text-sm`}>
        <svg>▶</svg>
        <span>{playing ? "Playing..." : "Play All"}</span>
      </div>
      <label className="flex items-center px-2 py-1 bg-white border rounded">
        <input type="checkbox" checked={useAudio} onChange={...} />
        <span className="ml-1 text-xs">Audio</span>
      </label>
    </div>

    {/* SVG Canvas (zoomable, pannable) */}
    <svg ref={canvasRef} onMouseMove={handleMouseMove} onClick={handleCanvasClick}
         onDragOver={handleDragOver} onDrop={handleDrop} onMouseDown={handleCanvasDragStart}>
      <g transform={`translate(${position.x}, ${position.y}) scale(${scale})`}>
        {/* Connection lines between nodes */}
        <NodeConnection nodes={nodes} mousePos={mousePos} activeConnectionIds={activeConnectionIds} />

        {/* Node cards */}
        {nodes.map(node => (
          <NodeDisplay
            key={node.id}
            node={node}
            isFocused={focusedNodeId === node.id}
            playingNodeId={playingNodeId}
            emojiStates={emojiStates}
            onNodeClick={handleNodeClick}
            onStartDragging={startDragging}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onStartConnection={handleStartConnection}
            onCompleteConnection={handleCompleteConnection}
          />
        ))}
      </g>
    </svg>

    {/* Zoom controls */}
    <div className="zoom-controls">
      <button onClick={() => setScale(s => Math.min(s + 0.1, 3))}>+</button>
      <button onClick={() => setScale(1)}>Reset</button>
      <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}>-</button>
    </div>

    {/* Generating/Playing overlay */}
    {(isGenerating || isPlaying) && (
      <div className="generating-overlay">
        <div className="generating-spinner" />
        <div>{isGenerating ? "Generating..." : "Playing..."}</div>
      </div>
    )}

    {/* Speaking highlight on active avatar */}
    {isPlaying && speakingElement && <SpeakingHighlight speakingElement={speakingElement} currentScene={activePlaybackScene} />}
  </div>
);
```

## Sub-component: `NodeDisplay.tsx`

Renders a single node card in the SVG canvas. Shows:
- Node title (auto-numbered if blank)
- Scene thumbnail (miniature of the attached scene's avatar layout)
- Speaker badges with party colors
- Topic label
- Turn count
- Play/Generate buttons (text vs audio)
- Connection handle dots (top/bottom for in/out connections)
- Context menu (delete, duplicate)
- Glow effect when playing
- Emoji states overlay for hand raising

### Props:
```tsx
interface NodeDisplayProps {
  node: SnippetNode;
  nodes: SnippetNode[];
  forceUpdate: number;
  hasMoved: boolean;
  connectingFrom: string | null;
  activeContextMenuNode: string | null;
  isFocused: boolean;
  draggingNode: string | null;
  scale: number;
  playingNodeId: string | null;
  emojiStates: Record<string, string>;
  onNodeClick: (node: SnippetNode, event: React.MouseEvent, type?: 'none' | 'text' | 'audio') => void;
  onStartDragging: (nodeId: string, e: React.MouseEvent, x: number, y: number) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (node: SnippetNode) => void;
  onStartConnection: (nodeId: string) => void;
  onCompleteConnection: (nodeId: string) => void;
  onContextMenuOpen: (nodeId: string) => void;
}
```

## Sub-component: `NodeConnection.tsx`

Renders SVG path curves between connected nodes. Highlights active connections during playback.

### Key behavior:
- Bezier curves from bottom of source node to top of target node
- Arrow heads at the end
- Green glow on active connections during playback
- Temporary line to mouse when creating a new connection

## Backchannel Emoji Mapping

```typescript
const getBackchannelEmoji = (message: string, vibe?: string): string => {
  const vibeEmojiMap: Record<string, string> = {
    amused: '😏', skeptical: '🤨', excited: '😃', supportive: '👍',
    curious: '🤔', concerned: '😟', empathetic: '🫂', bored: '😴',
    surprised: '😲', confused: '😕', impressed: '🙌', agreeable: '😊',
    neutral: '👁️', nodding: '👍'
  };
  if (vibe && vibeEmojiMap[vibe.toLowerCase()]) return vibeEmojiMap[vibe.toLowerCase()];
  // Fallback: analyze message text for emotion keywords
  return '👁️';
};
```

## CSS: `NodeEditor.css`

Key styles needed:
```css
.node-editor-container { position: relative; width: 100%; height: 100%; overflow: hidden; }
.canvas { width: 100%; height: 100%; }
.canvas-background { position: absolute; top: 0; left: 0; width: 200%; height: 200%;
  background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px; }
.zoom-controls { position: absolute; bottom: 10px; right: 10px; display: flex; gap: 4px; }
.zoom-controls button { padding: 4px 8px; background: white; border: 1px solid #d1d5db; border-radius: 4px; }
.generating-overlay { position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: rgba(0,0,0,0.3); z-index: 50; }
.generating-spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb;
  border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.drag-over { outline: 2px dashed #3b82f6; outline-offset: -2px; }
```
