# Lovable Code: Zustand Store — Types & Full Implementation

Implement this as `src/components/inspector/store.ts`. This is the central state management for the entire app. Every component reads from and writes to this store. **Implement it exactly as shown.**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PartyCommand } from '../nodeeditor/types';

// ═══════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════

export interface AudioSegment {
  id: string;
  avatarId: string;
  avatarName: string;
  message: {
    sender: string;
    message: string;
    recipient: string;
    party?: string;
    isSystemMessage?: boolean;
    isBackchannel?: boolean;
    isProactive?: boolean;
    isDerailing?: boolean;
    needsApproval?: boolean;
    impromptuPhase?: boolean;
    isImpromptuPhaseStart?: boolean;
    isEndingPhase?: boolean;
    derailMode?: string;
    backchannels?: Array<{
      sender: string;
      emoji: string;
      message: string;
      vibe: string;
    }>;
    [key: string]: any;
  };
  startTime: number;
  endTime: number;
  duration: number;
  audioUrl?: string;
}

export interface AvatarConfig {
  id: string;
  name: string;
  gender: string;
  voice: string;
  personality?: string;
  roleDescription?: string;
  customAttributes?: Record<string, any>;
  party?: string;
  isPartyRepresentative?: boolean;
  isHuman?: boolean;
  [key: string]: any;
}

export interface Party {
  id: string;
  type: 'party';
  name: string;
  description: string;
  speakingMode: 'representative' | 'all' | 'subset' | 'random';
  hasRepresentative: boolean;
  enableBackchannel: boolean;
  representativeSpeaker?: string;
  participantIds: string[];
}

export interface GlobalParty {
  id: string;
  type: 'globalParty';
  name: string;
}

interface Node {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  isScripted: boolean;
  objective?: string;
  speakers: AvatarConfig[];
  initiator?: AvatarConfig;
  subTopic?: string;
  turns?: number;
  interactionPattern?: string;
  description?: string;
}

export interface InterruptionRule {
  id: string;
  fromSpeaker: AvatarConfig;
  toSpeaker: AvatarConfig;
  emotion: string;
}

export interface BackChannelRule {
  id: string;
  fromSpeaker: AvatarConfig;
  toSpeaker: AvatarConfig;
  emotion: string;
}

export interface SnippetNode extends Node {
  subTopic?: string;
  topic?: string;
  turns?: number;
  interactionPattern?: string;
  turnTakingMode?: string;
  snippetThoughts?: string;
  interruptionRules?: InterruptionRule[];
  backChannelRules?: BackChannelRule[];
  partyMode?: boolean;
  partyTurnMode?: 'free' | 'round-robin' | 'moderated';
  attachedScene?: Scene;
  party?: string;
  partyVariables?: Record<string, any>;
  partyState?: string;
  derailerMode?: boolean;
  audioSegments?: AudioSegment[];
  totalDuration?: number;
  description?: string;
  conversationPrompt?: string;
  interruptionFromSpeaker?: string;
  interruptionToSpeaker?: string;
  interruptionEmotion?: string;
  backChannelFromSpeaker?: string;
  backChannelToSpeaker?: string;
  backChannelEmotion?: string;
}

interface Element {
  avatarData?: {
    gender: string;
    name: string;
    settings: {
      body: string;
      cameraDistance: number;
      cameraRotateY: number;
      cameraView: string;
      lipsyncLang: string;
      mood: string;
      ttsLang: string;
      url: string;
      voice: string;
      content: null;
      contentName: null;
      contentType: null;
      contentUrl: null;
    };
    elementType: string;
    id: string;
  };
  elementType: string;
  id: string;
}

export interface Box {
  elementRatio: number;
  elements: Element[];
  height: number;
  id: string;
  layoutMode: string;
  party: string | null;
  partyConfig?: {
    name: string;
    description: string;
    speakingMode: 'representative' | 'all' | 'subset' | 'random';
    hasRepresentative: boolean;
    enableBackchannel: boolean;
    representativeSpeaker?: string;
    participantIds: string[];
    partyTurnMode?: string;
    isModeratorParty?: boolean;
    subsetSize?: number;
  };
  view: string;
  width: number;
  x: number;
  y: number;
}

export interface Scene {
  id: string;
  name: string;
  boxes: Box[];
  backgroundImage: string | null;
  hasUnsavedChanges: boolean;
  globalPartySettings?: GlobalPartySettings;
}

export interface SavedScene {
  id: string;
  name: string;
  boxes: Box[];
  backgroundImage: string | null;
  hasUnsavedChanges: boolean;
  preview?: ScenePreview;
  isFileReference?: boolean;
  isSaved?: boolean;
  isActive?: boolean;
  globalPartySettings?: GlobalPartySettings;
}

export interface ScenePreview {
  backgroundImage: string | null;
  boxCount: number;
  hasAvatars: boolean;
  hasContent: boolean;
  parties: string[];
  boxPositions: { x: number; y: number; width: number; height: number }[];
  avatarNames: string[];
  boxContents?: Array<{
    avatarNames: string[];
    hasContent: boolean;
    party: string | null;
  }>;
  timestamp?: number;
  size?: string;
}

export interface Connection {
  id: string;
  condition: string;
  from: string;
  to: string;
}

export const interactionPatterns = ["neutral", "positive", "negative", "questioning"];
export const turnTakingModes = ["round-robin", "free-form", "directed"];
export const interruptionRules = ["none", "allowed", "frequent"];
export const voiceOptions = ["normal", "whisper", "loud", "excited"];
export const emotionOptions = ["Amused", "Skeptical", "Excited", "Supportive", "Curious", "Concerned", "Empathetic", "Bored", "Surprised", "Confused", "Impressed"];

export const getDefaultParties = (): Party[] => [
  { name: "Teaching Staff", description: "Your role is to teach, guide discussions, provide explanations, and help students understand difficult concepts.", speakingMode: "random", hasRepresentative: true, enableBackchannel: false, participantIds: [], id: '1', type: 'party' },
  { name: "Students", description: "Your role is to learn, ask questions when you don't understand, and seek clarification on complex topics.", speakingMode: "random", hasRepresentative: false, enableBackchannel: true, participantIds: [], id: '2', type: 'party' },
  { name: "Moderators", description: "Your role is to facilitate discussions, ensure balanced participation, maintain order, and guide the conversation flow.", speakingMode: "random", hasRepresentative: true, enableBackchannel: false, participantIds: [], id: '3', type: 'party' },
  { name: "Presenters", description: "Your role is to share knowledge, deliver prepared content, engage with the audience, and respond to questions.", speakingMode: "random", hasRepresentative: false, enableBackchannel: false, participantIds: [], id: '4', type: 'party' },
  { name: "Audience", description: "Your role is to actively listen, provide feedback during Q&A, and engage with presented content.", speakingMode: "random", hasRepresentative: false, enableBackchannel: true, participantIds: [], id: '5', type: 'party' }
];

export interface PartyConfig {
  name: string;
  description: string;
  speakingMode: 'random' | 'representative' | 'all' | 'subset';
  hasRepresentative: boolean;
  enableBackchannel: boolean;
  representativeSpeaker?: string;
  participantIds: string[];
  partyTurnMode?: string;
  isModeratorParty?: boolean;
  subsetSize?: number;
}

export interface GlobalPartySettings {
  partyTurnMode: string;
  moderatorParty: string;
  enableBackchannel: boolean;
}

// ═══════════════════════════════════════════
// EDITOR STATE INTERFACE
// ═══════════════════════════════════════════

export interface EditorState {
  selectedItem: Node | Connection | Party | GlobalParty | null;
  nodes: Node[];
  connections: Connection[];
  scenes: Scene[];
  activeSceneId: string | null;
  speakers: AvatarConfig[];
  savedScenes: Scene[];
  conversationMode: 'human-control' | 'autonomous' | 'reactive';

  setSelectedItem: (item: Node | Connection | Party | GlobalParty | null) => void;
  updateSelectedItem: (updatedItem: Node | Connection | Party) => void;
  closeInspector: () => void;
  openGlobalPartyInspector: () => void;

  addNode: (node: Node) => void;
  updateNode: (nodeId: string, updates: Partial<Node>) => void;
  updateSnippetNode: (nodeId: string, updates: Partial<SnippetNode>) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeAudioSegmentsAndTotalDuration: (nodeId: string, audioSegments: AudioSegment[], totalDuration: number) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (connectionId: string, updates: Partial<Connection>) => void;
  deleteConnection: (connectionId: string) => void;

  setScenes: (scenes: Scene[]) => void;
  updateScene: (sceneIndex: number, updates: Partial<Scene>) => void;
  setActiveSceneId: (sceneId: string | null) => void;

  setSavedScenes: (scenes: Scene[]) => void;
  loadSavedScene: (sceneId: string) => Promise<Scene | null>;
  loadSavedScenes: () => void;
  deleteSavedScene: (sceneId: string) => void;

  updatePartyForBox: (boxId: string, partyName: string | null) => void;
  setSpeakers: (speakers: AvatarConfig[]) => void;
  applyAvatarConfigChanges: (id: string, config: AvatarConfig) => void;
  getCachedDefaultSpeakers: () => AvatarConfig[];

  partyConfigs: Record<string, PartyConfig>;
  globalPartySettings: GlobalPartySettings;
  setPartyConfigs: (configs: Record<string, PartyConfig>) => void;
  setGlobalPartySettings: (settings: GlobalPartySettings) => void;
  getPartyCommands: () => PartyCommand[];

  listenForHumanParticipantsChanges: () => void;

  emojiStates: Record<string, string>;
  setEmojiStates: (states: Record<string, string>) => void;
  updateEmojiState: (elementId: string, emojiType: string | null) => void;

  setConversationMode: (mode: 'human-control' | 'autonomous' | 'reactive') => void;
}

// ═══════════════════════════════════════════
// STORE IMPLEMENTATION
// ═══════════════════════════════════════════

const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedItem: null,
      nodes: [],
      connections: [],
      scenes: [],
      activeSceneId: null,
      speakers: [],
      savedScenes: [],
      conversationMode: 'reactive',
      emojiStates: {},
      partyConfigs: {},
      globalPartySettings: { partyTurnMode: 'free', moderatorParty: '', enableBackchannel: false },

      // Simple setters
      setSelectedItem: (item) => set({ selectedItem: item }),
      closeInspector: () => set({ selectedItem: null }),
      openGlobalPartyInspector: () => set({ selectedItem: { id: 'global-party-manager', type: 'globalParty', name: 'Global Party Manager' } }),

      updateSelectedItem: (updatedItem) => {
        const { nodes, connections } = get();
        set({
          selectedItem: updatedItem,
          nodes: nodes.map(node => node.id === updatedItem.id ? { ...node, ...updatedItem } : node) as Node[],
          connections: connections.map(conn => conn.id === updatedItem.id ? { ...conn, ...updatedItem } : conn) as Connection[]
        });
      },

      // Node operations
      addNode: (node) => set(state => ({ nodes: [...state.nodes, node] })),
      updateNode: (nodeId, updates) => set(state => ({
        nodes: state.nodes.map(node => node.id === nodeId ? { ...node, ...updates } : node)
      })),
      updateSnippetNode: (nodeId, updates) => set(state => ({
        nodes: state.nodes.map(node => node.id === nodeId && node.type === 'snippet' ? { ...node, ...updates } : node)
      })),
      deleteNode: (nodeId) => set(state => ({
        nodes: state.nodes.filter(node => node.id !== nodeId),
        connections: state.connections.filter(conn => conn.from !== nodeId && conn.to !== nodeId),
        selectedItem: state.selectedItem?.id === nodeId ? null : state.selectedItem
      })),
      updateNodeAudioSegmentsAndTotalDuration: (nodeId, audioSegments, totalDuration) => set(state => {
        const updatedNodes = state.nodes.map(node => {
          if (node.id === nodeId && node.type === 'snippet') {
            return { ...node, audioSegments, totalDuration } as SnippetNode;
          }
          return node;
        });
        let selectedItem = state.selectedItem;
        if (selectedItem && selectedItem.id === nodeId && 'type' in selectedItem && selectedItem.type === 'snippet') {
          selectedItem = { ...selectedItem, audioSegments, totalDuration } as SnippetNode;
        }
        return { nodes: updatedNodes, selectedItem };
      }),

      // Connection operations
      addConnection: (connection) => set(state => ({ connections: [...state.connections, connection] })),
      updateConnection: (connectionId, updates) => set(state => ({
        connections: state.connections.map(conn => conn.id === connectionId ? { ...conn, ...updates } : conn),
        selectedItem: state.selectedItem?.id === connectionId ? { ...state.selectedItem, ...updates } : state.selectedItem
      })),
      deleteConnection: (connectionId) => set(state => ({
        connections: state.connections.filter(conn => conn.id !== connectionId),
        selectedItem: state.selectedItem?.id === connectionId ? null : state.selectedItem
      })),

      // Scene operations
      setScenes: (scenes) => {
        const scenesWithSettings = scenes.map(scene => ({
          ...scene,
          globalPartySettings: scene.globalPartySettings || { partyTurnMode: 'free', moderatorParty: '', enableBackchannel: false }
        }));
        set(state => {
          const updatedSavedScenes = [...state.savedScenes];
          scenesWithSettings.forEach(scene => {
            const idx = updatedSavedScenes.findIndex(s => s.id === scene.id);
            if (idx !== -1) updatedSavedScenes[idx] = { ...updatedSavedScenes[idx], ...scene };
          });
          return { scenes: scenesWithSettings, savedScenes: updatedSavedScenes };
        });
      },
      updateScene: (sceneIndex, updates) => set(state => {
        if (sceneIndex < 0 || sceneIndex >= state.scenes.length) return state;
        const updatedScenes = [...state.scenes];
        updatedScenes[sceneIndex] = { ...updatedScenes[sceneIndex], ...updates };
        // Save to localStorage
        try {
          localStorage.setItem(`scene:${updatedScenes[sceneIndex].id}`, JSON.stringify(updatedScenes[sceneIndex]));
        } catch (error) { console.error('Error saving scene:', error); }
        return { scenes: updatedScenes };
      }),
      setActiveSceneId: (sceneId) => set(state => {
        if (sceneId === null) return { activeSceneId: null, scenes: [] };
        return { activeSceneId: sceneId };
      }),

      // Saved scenes
      setSavedScenes: (scenes) => set({ savedScenes: scenes }),
      loadSavedScene: async (sceneId) => {
        try {
          let sceneStr = localStorage.getItem(`scene:${sceneId}`);
          if (!sceneStr) {
            const allSceneKeys = Object.keys(localStorage).filter(key => key.startsWith("scene:"));
            for (const key of allSceneKeys) {
              try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                if (data.id === sceneId) { sceneStr = JSON.stringify(data); break; }
              } catch {}
            }
          }
          if (!sceneStr) return null;
          const sceneData = JSON.parse(sceneStr);
          return {
            id: sceneData.id || `scene-${Date.now()}`,
            name: sceneData.name || 'Unnamed Scene',
            boxes: sceneData.boxes || [],
            backgroundImage: sceneData.backgroundImage || null,
            hasUnsavedChanges: false,
            globalPartySettings: sceneData.globalPartySettings || { partyTurnMode: 'free', moderatorParty: '', enableBackchannel: false }
          };
        } catch (error) { console.error("Error loading saved scene:", error); return null; }
      },
      loadSavedScenes: () => {
        try {
          const sceneKeys = Object.keys(localStorage).filter(key => key.startsWith("scene:"));
          const loadedScenes = sceneKeys.map(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              return {
                id: data.id || key.replace("scene:", ""),
                name: data.name || "Unnamed Scene",
                boxes: data.boxes || [],
                backgroundImage: data.backgroundImage || null,
                hasUnsavedChanges: false,
                globalPartySettings: data.globalPartySettings || { partyTurnMode: 'free', moderatorParty: '', enableBackchannel: false }
              };
            } catch { return null; }
          }).filter(Boolean) as Scene[];
          set({ savedScenes: loadedScenes });
        } catch { set({ savedScenes: [] }); }
      },
      deleteSavedScene: (sceneId) => {
        localStorage.removeItem(`scene:${sceneId}`);
        set(state => ({ savedScenes: state.savedScenes.filter(s => s.id !== sceneId) }));
      },

      // Party management
      updatePartyForBox: (boxId, partyName) => {
        const { scenes, activeSceneId } = get();
        if (!scenes || !activeSceneId) return;
        const idx = scenes.findIndex(s => s.id === activeSceneId);
        if (idx === -1) return;
        const updatedScenes = [...scenes];
        const boxIdx = updatedScenes[idx].boxes.findIndex(b => b.id === boxId);
        if (boxIdx === -1) return;
        updatedScenes[idx].boxes[boxIdx].party = partyName;
        updatedScenes[idx].hasUnsavedChanges = true;
        set({ scenes: updatedScenes });
      },

      setSpeakers: (newSpeakers) => {
        set({ speakers: newSpeakers });
        try { localStorage.setItem('topicPanel-participants', JSON.stringify(newSpeakers)); } catch {}
      },
      applyAvatarConfigChanges: (id, config) => {
        document.dispatchEvent(new CustomEvent('applyAvatarChanges', { detail: { id, config } }));
      },
      getCachedDefaultSpeakers: () => {
        const { speakers } = get();
        if (speakers && speakers.length > 0) return speakers;
        return getDefaultSpeakers();
      },

      setPartyConfigs: (configs) => set({ partyConfigs: configs }),
      setGlobalPartySettings: (settings) => set({ globalPartySettings: settings }),
      getPartyCommands: () => {
        const { partyConfigs, globalPartySettings } = get();
        const commands: PartyCommand[] = [];
        Object.entries(partyConfigs).forEach(([_, config]) => {
          commands.push({
            command: 'createParty',
            partyName: config.name,
            members: config.participantIds,
            config: {
              speakingMode: config.speakingMode,
              representative: config.representativeSpeaker || null,
              canInterrupt: true,
              speakingProbability: 1.0,
              backchannelProbability: config.enableBackchannel ? 0.3 : 0,
              partyDescription: config.description
            }
          });
        });
        if (Object.keys(partyConfigs).length > 0) {
          commands.push({ command: 'enablePartyMode', turnMode: globalPartySettings.partyTurnMode });
        }
        return commands;
      },

      listenForHumanParticipantsChanges: () => {
        if ((window as any)._storeHumanParticipantsSyncInitialized) return;
        (window as any)._storeHumanParticipantsSyncInitialized = true;
        // Listen for humanParticipantsChanged event and update scenes
        window.addEventListener('humanParticipantsChanged', () => {
          try {
            const savedData = localStorage.getItem('aiPanelData');
            if (savedData) {
              const parsedData = JSON.parse(savedData);
              if (parsedData.humanParticipants) {
                console.log('Store: human participants changed:', parsedData.humanParticipants);
              }
            }
          } catch {}
        });
      },

      setEmojiStates: (states) => set({ emojiStates: states }),
      updateEmojiState: (elementId, emojiType) => set(state => {
        const newStates = { ...state.emojiStates };
        if (emojiType === null) {
          setTimeout(() => {
            set(s => { const u = { ...s.emojiStates }; delete u[elementId]; return { emojiStates: u }; });
          }, 500);
          return { emojiStates: newStates };
        }
        newStates[elementId] = emojiType;
        return { emojiStates: newStates };
      }),

      setConversationMode: (mode) => set({ conversationMode: mode }),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
        scenes: state.scenes,
        activeSceneId: state.activeSceneId,
        speakers: state.speakers,
        savedScenes: state.savedScenes,
        partyConfigs: state.partyConfigs,
        globalPartySettings: state.globalPartySettings,
        conversationMode: state.conversationMode
      }),
    }
  )
);

// Default speakers
export const getDefaultSpeakers = (() => {
  let cachedSpeakers: AvatarConfig[] | null = null;
  return (): AvatarConfig[] => {
    if (cachedSpeakers) return cachedSpeakers;
    const { speakers } = useEditorStore.getState();
    if (speakers && speakers.length > 0) return speakers;
    try {
      const saved = localStorage.getItem('topicPanel-participants');
      if (saved) {
        const p = JSON.parse(saved) as AvatarConfig[];
        if (Array.isArray(p) && p.length > 0) { cachedSpeakers = p; return p; }
      }
    } catch {}
    cachedSpeakers = [
      { id: "1", gender: "female", name: "Alice", voice: "en-GB-Standard-A", settings: { body: "F", cameraDistance: 0.2, cameraRotateY: 0, cameraView: "upper", lipsyncLang: "en", mood: "neutral", ttsLang: "en-GB" } } as AvatarConfig,
      { id: "2", gender: "male", name: "Bob", voice: "en-GB-Standard-B", settings: { body: "M", cameraDistance: 1.2, cameraRotateY: 0, cameraView: "upper", lipsyncLang: "en", mood: "neutral", ttsLang: "en-GB" } } as AvatarConfig,
      { id: "3", gender: "male", name: "Charlie", voice: "en-GB-Standard-D", settings: { body: "M", cameraDistance: 1.2, cameraRotateY: 0, cameraView: "upper", lipsyncLang: "en", mood: "neutral", ttsLang: "en-GB" } } as AvatarConfig,
    ];
    return cachedSpeakers;
  };
})();

export default useEditorStore;
useEditorStore.getState().listenForHumanParticipantsChanges();
```

Also create `src/components/nodeeditor/types.ts`:

```typescript
import { AudioSegment } from '../inspector/store';

export interface PartyConfig {
  name?: string;
  description?: string;
  speakingMode?: 'random' | 'all' | 'representative' | 'subset';
  hasRepresentative?: boolean;
  enableBackchannel?: boolean;
  representativeSpeaker?: string;
  participantIds?: string[];
  partyTurnMode?: string;
  isModeratorParty?: boolean;
  subsetSize?: number;
  canInterrupt?: boolean;
  speakingProbability?: number;
  backchannelProbability?: number;
  partyDescription?: string;
}

export interface AudioPlaybackConfig {
  scene: any;
  playAudio: boolean;
  playAnimation: boolean;
  maxTurns: number;
  agents: any[];
  participants: string[];
  initiator: string | null;
  topic: string;
  subTopic: string;
  interactionPattern: string;
  turnTakingMode: string;
  derailerMode?: boolean;
  partyMode?: boolean;
  partyCommands?: PartyCommand[];
  contentCommands?: ContentCommand[];
  derailerCommands?: SetAsDerailerCommand[];
  partyTurnMode?: string;
  moderatorParty?: string;
  globalPartySettings?: {
    partyTurnMode: string;
    moderatorParty: string;
    enableBackchannel: boolean;
    enableInterruptions: boolean;
  };
  shouldLoadPreviousConversationManager: boolean;
  conversationMode?: 'human-control' | 'autonomous' | 'reactive';
  conversationPrompt?: string | null;
}

export interface DragOffset { x: number; y: number; }
export interface MousePosition { x: number; y: number; }

export interface CreatePartyCommand {
  command: 'createParty';
  partyName: string;
  members: string[];
  config: {
    speakingMode: string;
    representative: string | null;
    canInterrupt: boolean;
    speakingProbability: number;
    backchannelProbability: number;
    partyDescription: string;
  };
}

export interface EnablePartyModeCommand {
  command: 'enablePartyMode';
  turnMode: string;
}

export interface SetAsDerailerCommand {
  command: 'setAsDerailer';
  agentName: string;
  config: {
    enable: boolean;
    mode: "drift" | "extend" | "random";
    threshold: number;
    minTurns: number;
    maxTurns: number;
  };
}

export type PartyCommand = CreatePartyCommand | EnablePartyModeCommand | SetAsDerailerCommand;

export interface InitializeContentCommand {
  command: 'initializeContent';
  filename: string;
  owners?: string[] | string | null;
  isParty?: boolean;
  presenter?: string | null;
  presenterIsParty?: boolean;
}

export interface SetContentAsPublicCommand {
  command: 'setContentAsPublic';
  contentId: string;
  presenter?: string | null;
  presenterIsParty?: boolean;
}

export type ContentCommand = InitializeContentCommand | SetContentAsPublicCommand;

export interface AvatarData { name: string; [key: string]: any; }
export interface BoxElement { elementType: string; avatarData?: AvatarData; id: string; [key: string]: any; }
export interface SceneBox { party: string | null; partyConfig?: PartyConfig; elements?: BoxElement[]; [key: string]: any; }

export interface AvatarElement {
  id: string;
  elementType: string;
  avatarData?: AvatarData;
}
```

And create `src/config.ts`:

```typescript
const isProduction = window.location.hostname !== 'localhost' &&
                    window.location.hostname !== '127.0.0.1';

const API_CONFIG = {
  BASE_URL: isProduction ? 'https://chatlab.3dvar.com' : 'http://localhost:3010',
  ENDPOINTS: {
    START_CONVERSATION: '/api/start-conversation',
    BATCH_SYNTHESIZE: '/api/batch-synthesize',
    TTS: '/api/tts',
    IMPROMPTU_APPROVE: '/api/impromptu/approve',
    IMPROMPTU_REJECT: '/api/impromptu/reject',
    IMPROMPTU_EDIT: '/api/impromptu/edit-message',
    IMPROMPTU_REGENERATE_WITH_MODE: '/api/impromptu/regenerate-with-mode',
    CONVERSATION_MODE: '/api/conversation/mode',
    LLM_MODELS: '/api/llm-models',
    UPDATE_MODEL: '/api/update-model',
    SET_LLM_PROVIDER: '/api/llm-provider',
    SET_LLM_KEYS: '/api/llm-keys',
    LLM_STATUS: '/api/llm-status',
    VERIFICATION_CALCULATE_COHERENCE: '/api/verification/calculate-coherence',
    VERIFICATION_ASK_AGENT: '/api/verification/ask-agent',
    GENERATE_CONVERSATION_PROMPT: '/api/generate-conversation-prompt',
    CONTENT_UPLOAD: '/api/content/upload',
    CONTENT_LIST: '/api/content/list',
  }
};

export default API_CONFIG;
```
