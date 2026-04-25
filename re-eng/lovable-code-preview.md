# Lovable Code: Preview Panel — Message Display & Conversation Flow

Implement as `src/components/preview/PreviewPanel.tsx`. This component displays the live conversation, handles impromptu approval, and manages conversation modes.

## Message Interface

```typescript
export interface Message {
  content?: string;
  message?: string;
  participant?: string;
  sender?: string;
  recipient?: string;
  party?: string;
  isSystemMessage?: boolean;
  isBackchannel?: boolean;
  isProactive?: boolean;
  isDerailing?: boolean;
  needsApproval?: boolean;
  isApproved?: boolean;
  impromptuPhase?: boolean;
  isImpromptuPhaseStart?: boolean;
  isEndingPhase?: boolean;
  derailMode?: string;
  type?: string; // 'snippet_switch' | 'scene_switch'
  backchannels?: Array<{
    sender: string;
    emoji: string;
    message: string;
    vibe: string;
  }>;
}
```

## PreviewPanel Props

```typescript
interface PreviewPanelProps {
  onClose: () => void;
  messages: Message[];
  audioSegments?: AudioSegment[];
  currentPlaybackTime?: number;
  isPlaying?: boolean;
  totalDuration?: number;
  onSeek?: (time: number) => void;
  avatarInstancesRef?: React.MutableRefObject<any>;
  showExportDialog?: boolean;
  onExport?: () => void;
  onDeclineExport?: () => void;
  onApproveImpromptu?: (message: Message, editedContent?: string) => void;
  onRejectImpromptu?: (message: Message) => void;
  onEditImpromptu?: (messageContent: string) => void;
  onRegenerateImpromptuWithMode?: (mode: string) => void;
}
```

## Full PreviewPanel Component

```tsx
import React, { useState, useEffect, useRef } from 'react';
import useEditorStore from '../inspector/store';
import ImpromptuApprovalPanel from './ImpromptuApprovalPanel';
import API_CONFIG from '@/config';

// Generate consistent colors based on party name
const getPartyColor = (partyName: string | undefined) => {
  if (!partyName) return { bg: '#f1f5f9', text: '#1e293b', accent: '#64748b' };
  let hash = 0;
  for (let i = 0; i < partyName.length; i++) hash = partyName.charCodeAt(i) + ((hash << 5) - hash);
  const colorSchemes = [
    { bg: '#c7d2fe', text: '#1e3a8a', accent: '#4f46e5' },
    { bg: '#bbf7d0', text: '#166534', accent: '#10b981' },
    { bg: '#fef08a', text: '#854d0e', accent: '#facc15' },
    { bg: '#fecaca', text: '#991b1b', accent: '#f87171' },
    { bg: '#bae6fd', text: '#0c4a6e', accent: '#38bdf8' },
    { bg: '#bae6fd', text: '#0c4a6e', accent: '#0ea5e9' },
  ];
  return colorSchemes[Math.abs(hash) % colorSchemes.length];
};

const getVibeColor = (vibe?: string): string => {
  if (!vibe) return '#0c4a6e';
  const map: Record<string, string> = {
    amused: '#0ea5e9', skeptical: '#6B7280', excited: '#F59E0B', supportive: '#10B981',
    curious: '#3B82F6', concerned: '#EF4444', empathetic: '#EC4899', bored: '#4B5563',
    surprised: '#F97316', confused: '#0ea5e9', impressed: '#059669', agreeable: '#10B981',
    neutral: '#6B7280', nodding: '#10B981'
  };
  return map[vibe.toLowerCase()] || '#0c4a6e';
};

const isHumanUser = (participant: string | undefined): boolean => {
  if (!participant) return false;
  try {
    const savedData = localStorage.getItem('aiPanelData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      return parsed.humanParticipants?.includes(participant) || false;
    }
  } catch {}
  return false;
};

// ═══════════════════════════════════════════
// MessageDisplay: renders the conversation messages list
// ═══════════════════════════════════════════
const MessageDisplay: React.FC<{
  messages: Message[];
  showExportDialog?: boolean;
  onExport?: () => void;
  onDeclineExport?: () => void;
  onApproveImpromptu?: (message: Message, editedContent?: string) => void;
  onRejectImpromptu?: (message: Message) => void;
  onEditImpromptu?: (messageContent: string) => void;
}> = ({ messages, showExportDialog, onExport, onDeclineExport, onApproveImpromptu, onRejectImpromptu, onEditImpromptu }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversationMode } = useEditorStore();

  // Filter valid messages — in human-control mode, exclude messages needing approval
  const validMessages = messages.filter(message =>
    (message.content || message.message) &&
    !(conversationMode === 'human-control' && message.needsApproval)
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto') as HTMLElement;
      container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  if (validMessages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-1.5 relative">
      {validMessages.map((message, index) => {
        const content = message.content || message.message || '';
        const participant = message.participant || message.sender || '';
        const isSystemMessage = Boolean(message.isSystemMessage);
        const isBackchannel = Boolean(message.isBackchannel);
        const isProactive = Boolean(message.isProactive);
        const isDerailing = Boolean(message.isDerailing);
        const party = message.party;
        const partyColor = getPartyColor(party || participant);
        const isFromHumanUser = isHumanUser(participant);

        if (!content) return null;

        return (
          <div key={`msg-${index}`}>
            <div className={`flex ${isProactive || isFromHumanUser ? 'justify-end' : 'justify-start'} my-2`}>
              <div className="max-w-[85%]">
                {/* Party/speaker badge */}
                {(party || participant) && !isBackchannel && !isSystemMessage && (
                  <div className={`flex items-center mb-0.5 ${isProactive || isFromHumanUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium border shadow-sm"
                      style={!isFromHumanUser && !isDerailing ? {
                        backgroundColor: partyColor.bg,
                        color: partyColor.text,
                        borderColor: partyColor.accent
                      } : {}}
                    >
                      {isFromHumanUser && <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mr-1" />}
                      {isDerailing && <span className="inline-block w-1.5 h-1.5 bg-pink-500 rounded-full mr-1 animate-pulse" />}
                      {participant}
                      {isFromHumanUser && <span className="ml-1 text-[9px] bg-blue-700 text-white px-1 rounded">HUMAN</span>}
                      {isDerailing && (
                        <span className="ml-1 text-[9px] bg-pink-700 text-white px-1 rounded">
                          {message.derailMode === 'drift' ? 'TOPIC SHIFT' :
                           message.derailMode === 'extend' ? 'PERSPECTIVE SHIFT' :
                           message.derailMode === 'question' ? 'QUESTION' :
                           message.derailMode === 'emotional' ? 'EMOTIONAL' :
                           message.derailMode}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`relative p-1.5 min-h-[20px] rounded text-[11px] border shadow-sm ${
                  isSystemMessage ? 'bg-gray-100 text-gray-500 italic text-[10px]' :
                  isBackchannel ? 'bg-gray-50 text-gray-400 italic text-[10px]' :
                  isProactive ? 'border-purple-300 bg-purple-50' :
                  isFromHumanUser ? 'border-blue-400 border-2 bg-blue-50' :
                  isDerailing ? 'border-pink-400 bg-white' :
                  'border-gray-200 bg-white'
                }`}>
                  <div className="whitespace-pre-wrap break-words text-xs pl-2 leading-relaxed">
                    {isSystemMessage ? (
                      <span className="text-[10px] italic opacity-80">{content}</span>
                    ) : content}
                  </div>

                  {/* Backchannel emoji reactions */}
                  {message.backchannels && message.backchannels.length > 0 && (
                    <div className="absolute bottom-0 right-0 flex flex-row-reverse">
                      {Array.from(new Set(message.backchannels.map(b => b.sender))).map((sender, senderIdx) => {
                        const backchannel = message.backchannels!.find(b => b.sender === sender);
                        if (!backchannel) return null;
                        return (
                          <div key={`bc-${index}-${sender}`} className="relative group cursor-help"
                               style={{ marginRight: senderIdx === 0 ? '-8px' : '-4px', marginBottom: '-8px' }}>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-lg shadow-md"
                                  style={{ backgroundColor: getVibeColor(backchannel.vibe) }}>
                              {backchannel.emoji}
                            </span>
                            <div className="absolute bottom-full right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
                              <div className="bg-black text-white text-xs rounded p-1.5 min-w-[120px] shadow-lg">
                                <div className="font-bold">{backchannel.sender}</div>
                                <div className="text-gray-300 italic">{backchannel.message}</div>
                                {backchannel.vibe && <div className="mt-1 px-1.5 py-0.5 rounded bg-gray-700">Vibe: {backchannel.vibe}</div>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Export dialog */}
      {showExportDialog && conversationMode !== 'human-control' && (
        <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border mx-2 mb-2">
          <div className="text-sm font-medium">Export Conversation</div>
          <p className="text-xs text-gray-500">Save your conversation for review in the verification panel.</p>
          <div className="flex gap-2 mt-2">
            <button onClick={onExport} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium">Export</button>
            <button onClick={onDeclineExport} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium">Cancel</button>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

// ═══════════════════════════════════════════
// PreviewPanel: wrapper with mode selector + approval panel
// ═══════════════════════════════════════════
const PreviewPanel: React.FC<PreviewPanelProps> = ({
  onClose, messages, audioSegments = [], currentPlaybackTime = 0, isPlaying = false,
  totalDuration = 0, onSeek, avatarInstancesRef, showExportDialog = false,
  onExport, onDeclineExport, onApproveImpromptu, onRejectImpromptu,
  onEditImpromptu, onRegenerateImpromptuWithMode
}) => {
  const { conversationMode, setConversationMode } = useEditorStore();
  const [regeneratingMessage, setRegeneratingMessage] = useState(false);

  const handleModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'human-control' | 'autonomous' | 'reactive';
    try {
      setConversationMode(newMode);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATION_MODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      if (!response.ok) throw new Error('Failed to update conversation mode');
      // If switching to autonomous, auto-approve any pending messages
      if (newMode === 'autonomous' && messages.some(m => m.needsApproval)) {
        onApproveImpromptu?.(messages.find(m => m.needsApproval)!);
      }
    } catch (error) {
      console.error('Error changing conversation mode:', error);
      setConversationMode(conversationMode);
    }
  };

  const handleRegenerateWithMode = async (mode: string) => {
    if (!onRegenerateImpromptuWithMode) return;
    try {
      setRegeneratingMessage(true);
      await onRegenerateImpromptuWithMode(mode);
    } finally {
      setRegeneratingMessage(false);
    }
  };

  const hasValidMessages = messages.some(m => m.content || m.message);

  return (
    <div className="w-full flex flex-col h-[calc(100vh-150px)] theme-bg-primary theme-text-primary">
      {/* Mode selector */}
      <div className="flex items-center justify-between p-2 theme-bg-secondary border-b">
        <select value={conversationMode} onChange={handleModeChange}
                className="bg-gray-700 text-white p-1 rounded text-sm">
          <option value="human-control">Human Control</option>
          <option value="autonomous">Autonomous</option>
          <option value="reactive">Reactive</option>
        </select>
      </div>

      {/* Content area */}
      <div className="overflow-y-auto flex-1 p-4">
        {hasValidMessages ? (
          <>
            <MessageDisplay
              messages={messages}
              showExportDialog={showExportDialog}
              onExport={onExport}
              onDeclineExport={onDeclineExport}
              onApproveImpromptu={onApproveImpromptu}
              onRejectImpromptu={onRejectImpromptu}
              onEditImpromptu={onEditImpromptu}
            />
            {/* Show impromptu approval panel when in human control mode */}
            {(() => {
              const messageNeedingApproval = messages.find(m => m.needsApproval && m.isDerailing);
              return conversationMode === 'human-control' && messageNeedingApproval && onApproveImpromptu && onRejectImpromptu && (
                <ImpromptuApprovalPanel
                  message={messageNeedingApproval}
                  onApprove={(editedContent) => onApproveImpromptu(messageNeedingApproval, editedContent)}
                  onReject={() => onRejectImpromptu(messageNeedingApproval)}
                  onEdit={onEditImpromptu}
                  onRegenerateWithMode={handleRegenerateWithMode}
                />
              );
            })()}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No conversation running. Select a mode above to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
```

## ImpromptuApprovalPanel — `src/components/preview/ImpromptuApprovalPanel.tsx`

This panel appears when the conversation is in human-control mode and a derailer agent wants to start an impromptu phase. It allows the user to approve, reject, edit, or regenerate the derailing message.

```tsx
import React, { useState } from 'react';

interface ImpromptuApprovalPanelProps {
  message: any;
  onApprove: (editedContent?: string) => void;
  onReject: () => void;
  onEdit?: (content: string) => void;
  onRegenerateWithMode?: (mode: string) => void;
}

const ImpromptuApprovalPanel: React.FC<ImpromptuApprovalPanelProps> = ({
  message, onApprove, onReject, onEdit, onRegenerateWithMode
}) => {
  const [editedContent, setEditedContent] = useState(message.content || message.message || '');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="border-2 border-pink-400 rounded-lg p-3 bg-pink-50 dark:bg-pink-900/20 mt-2">
      <div className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
        Impromptu Phase — {message.derailMode === 'drift' ? 'Topic Shift' :
          message.derailMode === 'extend' ? 'Perspective Shift' :
          message.derailMode === 'question' ? 'Probing Question' :
          message.derailMode === 'emotional' ? 'Emotional Response' : 'Derail'}
      </div>

      <div className="text-xs mb-2">
        <span className="font-medium">{message.participant || message.sender}</span> wants to shift the conversation:
      </div>

      {isEditing ? (
        <textarea
          className="w-full p-2 text-xs border rounded mb-2 resize-none"
          rows={3}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
        />
      ) : (
        <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded mb-2 border">
          {editedContent}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => onApprove(editedContent)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium">
          Approve
        </button>
        <button onClick={onReject}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium">
          Reject
        </button>
        <button onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
          {isEditing ? 'Preview' : 'Edit'}
        </button>

        {/* Regenerate with different modes */}
        {onRegenerateWithMode && (
          <div className="flex gap-1">
            {['drift', 'extend', 'question', 'emotional'].map(mode => (
              <button key={mode} onClick={() => onRegenerateWithMode(mode)}
                      className={`px-2 py-1 rounded text-xs ${
                        message.derailMode === mode ? 'bg-pink-600 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                      }`}>
                {mode === 'drift' ? '🔄' : mode === 'extend' ? '🔍' : mode === 'question' ? '💭' : '😢'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpromptuApprovalPanel;
```
