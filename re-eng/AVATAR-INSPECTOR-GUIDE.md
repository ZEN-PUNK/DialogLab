# Avatar Inspector Panel - Complete Guide

**Location:** `client/src/components/inspector/AvatarInspector.jsx`

This document explains every parameter in the Avatar Inspector panel and whether/how it's currently used in VOX LAB.

---

## Overview

The Avatar Inspector appears on the right panel when you click on an avatar in a scene. It has **3 main tabs**:
1. **Basic Settings** - Avatar personality and identity
2. **Conversation** - How the avatar behaves in dialogue
3. **Avatar Settings** - Real-time 3D avatar display settings

---

## TAB 1: BASIC SETTINGS

### Primary Configuration Section

#### **Personality**
- **Type:** Dropdown selector
- **Options:** 
  - friendly
  - professional
  - casual
  - formal
  - enthusiastic
  - reserved
  - empathetic
  - analytical

- **What It Does:**
  - Sets the avatar's general demeanor and communication style
  - Stored in localStorage under avatar's config
  - Sent to the LLM as part of the system prompt when generating responses
  - Example: "Personality: analytical" tells the AI to be more logical and data-driven

- **Currently Used:** ✅ **YES**
  - Passed to the server in the conversation prompt
  - Influences how the LLM generates character responses

---

#### **Role Description**
- **Type:** Text area (multiline input)
- **Example Value:** "Senior HCI researcher specializing in human-computer interaction with expertise in user studies and experimental design"

- **What It Does:**
  - Provides context about the avatar's background and expertise
  - Critical for role-playing scenarios
  - Sent to the LLM system prompt to maintain consistent characterization

- **Currently Used:** ✅ **YES**
  - Stored in avatar config
  - Used in conversation prompt generation
  - Helps LLM stay "in character"

---

#### **Custom Attributes**
- **Type:** Key-value pair system
- **Example Attributes:**
  ```
  role: HCI Researcher
  experience: 10 years
  expertise: User Studies, Experimental Design
  education: Ph.D. in HCI
  researchFocus: Human-Computer Interaction
  publications: 30+ peer-reviewed papers
  ```

- **What It Does:**
  - Allows you to define custom characteristics that aren't covered by other fields
  - Provides additional context for the LLM
  - Can include age, profession, background, skills, etc.

- **Currently Used:** ✅ **YES**
  - Serialized and sent to the LLM as part of the prompt
  - Helps create rich character profiles
  - Example use: If you add `expertise: "quantum physics"`, the AI will consider this when generating responses

- **How to Use:**
  1. Enter attribute name (e.g., "age")
  2. Enter attribute value (e.g., "35")
  3. Click "Add Attribute"
  4. Attributes appear as removable tags below

---

## TAB 2: CONVERSATION

### Conversation Behavior Section

#### **Communication Style / Interaction Pattern**
- **Type:** Dropdown selector
- **Options:**
  - neutral (balanced, no strong bias)
  - supportive (encouraging, collaborative)
  - critical (questioning, challenging)
  - skeptical (doubtful, demands evidence)
  - receptive (open-minded, curious)
  - agreeable (accommodating, consensus-seeking)

- **What It Does:**
  - Defines how the avatar responds to others in conversation
  - Influences tone and argumentative approach
  - Affects whether the avatar agrees, disagrees, or stays neutral

- **Currently Used:** ✅ **YES**
  - Sent to LLM as part of system prompt
  - Example: "Interaction Pattern: critical" → AI becomes more challenging/questioning
  - Important for group discussions and debates

---

#### **Proactive Behavior - Enable Proactive Responses**
- **Type:** Toggle checkbox
- **Default:** OFF (false)

- **What It Does:**
  - When enabled, avatar may spontaneously jump into conversation without being directly addressed
  - Makes conversations feel more natural (people don't wait to be asked)
  - Useful for multi-party discussions

- **Currently Used:** ⚠️ **PARTIAL**
  - Stored in avatar configuration
  - Sent to server/LLM
  - Server-side implementation may not fully support this yet

---

#### **Proactive Threshold**
- **Type:** Slider (0.0 - 1.0)
- **Default:** 0.7
- **Range meaning:**
  - 0.0 = Never proactive
  - 0.5 = Sometimes proactive
  - 1.0 = Always proactive (whenever possible)

- **What It Does:**
  - Controls frequency of proactive responses when enabled
  - Higher values = more frequent interruptions/spontaneous comments
  - Affects conversational dynamics

- **Currently Used:** ⚠️ **PARTIAL**
  - Configuration is saved
  - Server-side logic may need enhancement to fully utilize this

---

### Speech Pattern Section

#### **Filler Words Frequency**
- **Type:** Dropdown selector
- **Options:**
  - none (no filler words like "um", "uh", "like")
  - low (occasional filler words)
  - medium (some filler words)
  - high (frequent filler words)

- **What It Does:**
  - Controls how often avatar uses natural speech fillers
  - Makes speech sound more natural (medium/high)
  - Or more polished/professional (none/low)
  - Affects voice generation if using full TTS with pause markers

- **Currently Used:** ⚠️ **LIMITED**
  - Configuration stored
  - Audio generation might not implement this fully
  - Potential for future enhancement

---

## TAB 3: AVATAR SETTINGS

### Voice Settings Section

#### **Voice (Dropdown)**
- **Type:** Dropdown selector
- **Female Options (Azure):**
  - en-US-Standard-C (American Female)
  - en-GB-Standard-A (British Female)

- **Male Options (Azure):**
  - en-US-Standard-B (American Male)
  - en-GB-Standard-B (British Male)
  - en-GB-Standard-D (British Male 2)

- **What It Does:**
  - Selects which voice is used for text-to-speech
  - Affects gender, accent, and timbre of audio
  - Maps Google Cloud voice names to Azure Neural voices

- **Currently Used:** ✅ **YES - AZURE TTS**
  - **Important:** These are Google Cloud legacy voice names that get mapped to Azure
  - In `server/tts.js`, there's a voice mapping:
    ```javascript
    const googleVoiceToAzure = {
      'en-US-Standard-B': 'en-US-AriaNeural',
      'en-GB-Standard-A': 'en-GB-SoniaNeural',
      'en-GB-Standard-B': 'en-GB-RyanNeural',
      // ... etc
    };
    ```
  - When you select a voice, the server converts it to the Azure equivalent when generating audio

---

#### **Test Voice Button**
- **Type:** Button
- **Action:** Plays a short audio sample with the selected voice

- **What It Does:**
  - Generates a test message using selected voice
  - Lets you hear the voice before using it
  - Useful for comparing voice options

- **Currently Used:** ✅ **YES**
  - Uses Azure Speech TTS to generate test audio
  - Short phrases like "Hello, this is my British voice."

---

### Emotional State Section

#### **Mood (Dropdown)**
- **Type:** Dropdown selector
- **Options:**
  - neutral (standard, no emotion)
  - happy (cheerful, positive)
  - sad (melancholic, serious)
  - angry (frustrated, aggressive)
  - surprised (astonished, taken aback)

- **What It Does:**
  - Sets the emotional tone of the avatar's expressions and animations
  - Affects facial expressions and body language
  - May influence speaking pace/tone if supported by TalkingHead library

- **Currently Used:** ✅ **YES - 3D AVATAR ONLY**
  - Applied to TalkingHead.js avatar instances
  - Calls `avatarInstance.setMood(mood)` to update facial expressions
  - Does NOT affect audio generation (TTS doesn't support emotion)
  - Real-time: You can see mood change immediately in the 3D avatar

---

### Camera Settings Section

#### **Camera View (Dropdown)**
- **Type:** Dropdown selector
- **Options:**
  - upper (shows upper body, default)
  - face (close-up head shot)
  - full (full body view)

- **What It Does:**
  - Controls what part of avatar is visible
  - Changes the framing of the 3D scene
  - Affects which avatar features are prominent

- **Currently Used:** ✅ **YES - 3D AVATAR ONLY**
  - Converted from UI names to API names:
    - "face" → "head" (TalkingHead API requirement)
    - "upper" → "upper"
    - "full" → "full"
  - Applied immediately via `avatarInstance.setView()`
  - Real-time: View changes instantly

---

#### **Camera Distance (Slider)**
- **Type:** Slider (0.0 - 2.0)
- **Default:** 0.1
- **Higher value** = Further away (zoomed out)
- **Lower value** = Closer (zoomed in)

- **What It Does:**
  - Controls camera distance from avatar
  - Affects zoom level of the 3D view
  - Allows different framing for different scenarios

- **Currently Used:** ✅ **YES - 3D AVATAR ONLY**
  - Applied to TalkingHead instances
  - Changes perspective in real-time
  - Useful for emphasis: closer for detail, farther for full body view

---

### Model Information Section

#### **Model URL (Read-Only)**
- **Type:** Text input (disabled/read-only)
- **Example Value:** `/assets/female-avatar1.glb`

- **What It Does:**
  - Shows the 3D model file being used
  - GLB files contain 3D mesh, rigging, animation data
  - Cannot be changed directly in Inspector (change in scene setup)

- **Currently Used:** ✅ **YES**
  - Determines which 3D model loads for the avatar
  - Selected in Scene Setup when positioning avatars

---

## Summary Table: What's Actually Used?

| Parameter | Tab | Used? | Where | Notes |
|-----------|-----|-------|-------|-------|
| **Personality** | Basic | ✅ YES | LLM Prompt | Influences AI character responses |
| **Role Description** | Basic | ✅ YES | LLM Prompt | Critical context for character |
| **Custom Attributes** | Basic | ✅ YES | LLM Prompt | Rich character details |
| **Interaction Pattern** | Conversation | ✅ YES | LLM Prompt | Affects conversational style |
| **Proactive Responses** | Conversation | ⚠️ PARTIAL | Server Logic | Configuration saved, not fully used |
| **Proactive Threshold** | Conversation | ⚠️ PARTIAL | Server Logic | Similar to Proactive - partial implementation |
| **Filler Words Frequency** | Conversation | ⚠️ LIMITED | TTS/LLM | Stored but may not affect output |
| **Voice** | Avatar Settings | ✅ YES | Azure TTS | Determines audio voice |
| **Test Voice** | Avatar Settings | ✅ YES | Azure TTS | Preview before using |
| **Mood** | Avatar Settings | ✅ YES | TalkingHead 3D | Affects facial expressions |
| **Camera View** | Avatar Settings | ✅ YES | TalkingHead 3D | Affects framing |
| **Camera Distance** | Avatar Settings | ✅ YES | TalkingHead 3D | Affects zoom level |
| **Model URL** | Avatar Settings | ✅ YES | Scene Setup | Points to 3D GLB file |

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│  Avatar Inspector UI                │
│  (AvatarInspector.jsx)              │
└────────┬────────────────────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
    ┌────────────┐              ┌─────────────────┐
    │  LLM Data  │              │  3D Avatar Data │
    │            │              │                 │
    │ • Voice    │              │ • Mood          │
    │ • Personality│            │ • Camera View   │
    │ • Role     │              │ • Camera Dist   │
    │ • Custom   │              │ • Model URL     │
    │   Attrs    │              └────────┬────────┘
    │ • Behavior │                       │
    └────┬───────┘                       ▼
         │                    ┌──────────────────┐
         │                    │  TalkingHead.js  │
         │                    │  3D Rendering    │
         │                    └──────────────────┘
         │
         ▼
    ┌─────────────────────────────┐
    │  Server Conversation Logic  │
    │  (chat.js, chatutils.js)    │
    │                             │
    │  Builds LLM Prompt with:   │
    │  - Avatar personality      │
    │  - Role description        │
    │  - Custom attributes       │
    │  - Interaction pattern     │
    └──────────────┬──────────────┘
                   │
                   ▼
            ┌─────────────────┐
            │ Gemini          │
            │  (gpt-5.4-nano) │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  Azure Speech   │
            │  (Voice TTS)    │
            └─────────────────┘
```

---

## Configuration Storage

Avatar configs are stored in **two places**:

1. **localStorage** - Browser persistence
   - Key: `avatar-config-{name}` (e.g., `avatar-config-Alice`)
   - Persists between sessions

2. **Zustand Store** - Active session state
   - Accessible via `useEditorStore()`
   - Lost on page refresh (unless persisted)

---

## Real-Time vs. Deferred Updates

### Real-Time Updates (Instant)
- ✅ Mood changes
- ✅ Camera view changes
- ✅ Camera distance changes
- ✅ Voice test playback

### Deferred Updates (Next Conversation)
- Personality
- Role description
- Custom attributes
- Interaction pattern
- Filler words frequency
- Proactive settings

These take effect when new messages are generated because they're part of the LLM system prompt.

---

## Azure Voice Mapping Reference

The app uses **Google Cloud voice names** in the UI but converts them to **Azure Neural voices**:

```javascript
// Mapping in server/tts.js
{
  'en-US-Standard-A': 'en-US-AriaNeural',
  'en-US-Standard-B': 'en-US-BrianNeural',
  'en-US-Standard-C': 'en-US-SoniaNeural',
  'en-US-Standard-D': 'en-US-GuyNeural',
  'en-US-Standard-E': 'en-US-GuyNeural',
  'en-GB-Standard-A': 'en-GB-SoniaNeural',
  'en-GB-Standard-B': 'en-GB-RyanNeural',
  'en-GB-Standard-C': 'en-GB-ThomasNeural',
  'en-GB-Standard-D': 'en-GB-RyanNeural',
  'en-GB-Standard-F': 'en-GB-SoniaNeural'
}
```

This allows the UI to show consistent names regardless of TTS provider.

---

## Future Enhancement Opportunities

1. **Proactive Response Logic**
   - Currently stored but not fully used
   - Could enhance server-side conversation flow
   - Allow avatars to interrupt/interject naturally

2. **Filler Words Implementation**
   - Currently not affecting output
   - Could add to TTS request if supported
   - Or could be simulated in text generation

3. **Emotion in Audio**
   - Currently only affects 3D expressions
   - Azure TTS supports SSML `<amazon:emotion>` tags
   - Could add emotional prosody to speech

4. **Advanced Speech Patterns**
   - Speaking rate customization
   - Pitch control
   - Speaking style (formal, casual, etc.)

5. **Gesture Support**
   - Custom gestures based on personality
   - Automatic gestures during specific word types
   - Gesture intensity control

---

## Troubleshooting

### Voice Not Changing?
1. Ensure you're using Azure credentials (check server logs)
2. Test voice button should work immediately
3. New messages will use selected voice

### 3D Avatar Not Responding to Mood/Camera Changes?
1. Check that avatar instance is loaded (`window.avatarInstancesRef.current[id]`)
2. May need to restart scene if avatar wasn't properly initialized
3. Check browser console for errors

### Settings Not Saving?
1. Check localStorage quotas (can be limited)
2. Verify browser allows localStorage for this domain
3. Check for console errors during save operation

