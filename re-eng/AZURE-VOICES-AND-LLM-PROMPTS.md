# Azure Voice Integration & LLM Prompt Structure

## Part 1: Azure Voices & Styles Mapping

### Real Azure Neural Voices Available

Azure Speech Service has a comprehensive list of neural voices. Here's the mapping for English:

#### **US English Voices**

| Voice Name | Gender | Style Support | Best For |
|-----------|--------|-----------------|----------|
| en-US-AriaNeural | Female | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering | General assistant, friendly tone |
| en-US-BrianNeural | Male | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering | Professional, neutral |
| en-US-ChristopherNeural | Male | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering | News, narration |
| en-US-EveNeural | Female | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering | Young female, assistant |
| en-US-GuyNeural | Male | cheerful, sad, calm, fearful, disgruntled, serious, unfriendly | Male assistant |
| en-US-JennyNeural | Female | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering | Customer service |

#### **British English Voices**

| Voice Name | Gender | Style Support | Best For |
|-----------|--------|-----------------|----------|
| en-GB-SoniaNeural | Female | cheerful, sad, calm, fearful, disgruntled, serious, unfriendly | Professional, friendly |
| en-GB-RyanNeural | Male | cheerful, sad, calm, fearful, disgruntled, serious, unfriendly, whispering | Professional, casual |
| en-GB-ThomasNeural | Male | cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly | Male voice variety |

### Azure SSML with Style Example

```xml
<speak version="1.0" xml:lang="en-US">
  <voice name="en-US-AriaNeural">
    <prosody pitch="0%" rate="1.0">
      <mstts:express-as style="cheerful" styledegree="2.0">
        Hello! I'm excited to help you today.
      </mstts:express-as>
    </prosody>
  </voice>
</speak>
```

---

## Part 2: How Avatar Properties Flow to LLM

### ✅ Avatar Inspector Properties → LLM System Prompt

When a conversation is triggered, avatar properties flow through this path:

```
┌──────────────────────────────────────┐
│  Avatar Inspector (Client)           │
│                                      │
│  • Personality                       │
│  • Role Description                  │
│  • Custom Attributes                 │
│  • Interaction Pattern               │
│  • Filler Words Frequency            │
│  • Proactive Settings                │
└──────────────┬───────────────────────┘
               │
               ▼
     ┌──────────────────────┐
     │ Conversation Request │
     │ (POST /api/chat)     │
     └──────────┬───────────┘
                │
                ▼
      ┌─────────────────────────┐
      │ server/chat.js          │
      │ - Parses request        │
      │ - Creates Agent object  │
      │ - Passes properties     │
      └──────────┬──────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │ server/agent.js              │
      │ Agent.reply() method          │
      │                              │
      │ Builds SYSTEM PROMPT:        │
      │ ────────────────────────     │
      │ "You are {name}, a           │
      │  {personality} person.       │
      │  {attributeContext}          │
      │  Role: {roleDescription}     │
      │  {context}                   │
      │  {interactionPattern}        │
      │  ..."                        │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌─────────────────────────┐
      │ llmProvider.generateText│
      │ (Gemini)          │
      └──────────┬──────────────┘
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
 SYSTEM PROMPT      ↑      USER PROMPT
 (Avatar Props)     │      (Conversation)
                Message
                History
```

---

## Part 3: System Prompt vs User Prompt Structure

### **SYSTEM PROMPT** (What LLM sees as instructions)

Contains all avatar configuration properties:

```javascript
const systemPrompt = `You are Alice, a friendly person.
Experience is 10 years, expertise is User Studies, Experimental Design.

Role: Senior HCI researcher specializing in human-computer interaction with expertise in user studies and experimental design.

You are part of a conversation with Bob and Grace. Pay attention to turn order and context.

Your communication style is neutral - respond naturally without strong bias.

Respond briefly (1-2 sentences), building on previous points without repeating them.
Keep your response conversational and natural. After you speak, Bob will respond.`;
```

**What's Included:**
- ✅ Avatar name
- ✅ Personality attribute
- ✅ Custom attributes (dynamically generated context)
- ✅ Role description
- ✅ Interaction pattern
- ✅ Context about conversation flow

### **USER PROMPT** (What LLM sees as the current message)

Contains only conversation context:

```javascript
const userPrompt = `Last message: "So what about the implications for accessibility in user testing?"`;
```

This is the actual conversation turn - the LLM responds based on the system instructions (avatar properties) but to this specific user message.

---

## Part 4: Exact Code Flow

### Code in `server/agent.js` - Line 102-115:

```javascript
const prompt = `You are ${this.name}, a ${this.personality} person. ${attributeContext} 
      ${this.roleDescription ? "Role: " + this.roleDescription : ""}
      ${isStartingMessage && message !== "This is the first scene" ? `What happened in the last scene: ${message}` : ""}
      ${isStartingMessage && message !== "This is the first scene" ? "briefly summarize what happened in the last scene and transition to the current context (use 1-2 sentences): " : ""}
      ${derailerContext}
      ${context}
      ${interruptionContext}
      ${!isStartingMessage ? `Last message: ${message}` : ""}
     
      Respond briefly (1-2 sentences), building on previous points without repeating them.
      Keep your response conversational and natural. After you speak, ${nextSpeaker} will respond.`;
```

**This entire string is the SYSTEM PROMPT** sent to Gemini.

### Breakdown:

| Component | Source | Type | Example |
|-----------|--------|------|---------|
| `${this.name}` | Agent instance | Identity | "Alice" |
| `${this.personality}` | Avatar Inspector Basic Settings | Character trait | "friendly" |
| `${attributeContext}` | Generated from Custom Attributes | Dynamic context | "Experience is 10 years, expertise is User Studies, Experimental Design" |
| `${this.roleDescription}` | Avatar Inspector Basic Settings | Background | "Senior HCI researcher..." |
| `${context}` | Conversation context | Scene information | Who else is speaking, what's the topic |
| `${message}` | User input / conversation history | **Current exchange** | "Last message: {actual user input}" |
| `${nextSpeaker}` | Conversation flow | Turn order | "Bob" |

---

## Part 5: Azure Voice & Style Implementation

### Current Implementation Limitations:

The current `tts.js` only maps voice names but **does NOT include styles**. 

### Enhanced Implementation Needed:

To use Azure styles, we need to:

1. **Update Voice Selection UI** to show available styles
2. **Store style choice** in avatar config
3. **Include style in SSML** when generating audio

### Example Enhanced SSML Generation:

```javascript
// In server/tts.js - enhanced synthesizeSpeech function

const buildSsmlWithStyle = (text, voiceName, style = 'neutral', styledegree = 1.0) => {
  // Valid styles per voice
  const validStyles = {
    'en-US-AriaNeural': ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled', 'serious', 'shouting', 'unfriendly', 'whispering'],
    'en-US-BrianNeural': ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled', 'serious', 'shouting', 'unfriendly', 'whispering'],
    'en-GB-SoniaNeural': ['cheerful', 'sad', 'calm', 'fearful', 'disgruntled', 'serious', 'unfriendly'],
    'en-GB-RyanNeural': ['cheerful', 'sad', 'calm', 'fearful', 'disgruntled', 'serious', 'unfriendly', 'whispering'],
  };

  // Validate style for this voice
  const voiceStyles = validStyles[voiceName] || ['neutral'];
  const useStyle = voiceStyles.includes(style) ? style : 'neutral';

  const ssml = `<speak version="1.0" xml:lang="en-US">
    <voice name="${voiceName}">
      <prosody pitch="0%" rate="1.0">
        <mstts:express-as style="${useStyle}" styledegree="${styledegree}">
          ${text}
        </mstts:express-as>
      </prosody>
    </voice>
  </speak>`;

  return ssml;
};
```

---

## Part 6: Data Flow Summary

### How Each Avatar Property is Used:

| Property | Inspector Tab | In System Prompt? | In User Prompt? | Real-Time? | Effect |
|----------|---------------|-------------------|-----------------|-----------|--------|
| **Personality** | Basic | ✅ YES | ❌ NO | ❌ Next turn | LLM character trait |
| **Role Description** | Basic | ✅ YES | ❌ NO | ❌ Next turn | LLM background context |
| **Custom Attributes** | Basic | ✅ YES (generated) | ❌ NO | ❌ Next turn | LLM enriched context |
| **Interaction Pattern** | Conversation | ✅ YES | ❌ NO | ❌ Next turn | LLM style guide |
| **Voice** | Avatar Settings | ❌ NO | ❌ NO | ✅ YES | Azure TTS voice ID |
| **Mood** | Avatar Settings | ❌ NO | ❌ NO | ✅ YES | 3D Avatar expressions |
| **Style** | Avatar Settings | ❌ NO | ❌ NO | ✅ YES | Azure TTS emotional style (not yet implemented) |
| **Camera View** | Avatar Settings | ❌ NO | ❌ NO | ✅ YES | 3D Avatar camera framing |

---

## Part 7: Recommended Azure Voice Mapping

Replace the current mapping in `server/tts.js` with this:

```javascript
// Enhanced Azure voice mapping with style support
const AZURE_VOICE_CATALOG = {
  // US English - Female Voices
  'en-US-female-aria': {
    name: 'en-US-AriaNeural',
    gender: 'female',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled', 'serious']
  },
  'en-US-female-eve': {
    name: 'en-US-EveNeural',
    gender: 'female',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled']
  },
  'en-US-female-jenny': {
    name: 'en-US-JennyNeural',
    gender: 'female',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled']
  },
  
  // US English - Male Voices
  'en-US-male-brian': {
    name: 'en-US-BrianNeural',
    gender: 'male',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled']
  },
  'en-US-male-christopher': {
    name: 'en-US-ChristopherNeural',
    gender: 'male',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled']
  },
  'en-US-male-guy': {
    name: 'en-US-GuyNeural',
    gender: 'male',
    styles: ['cheerful', 'sad', 'calm', 'fearful', 'disgruntled']
  },
  
  // British English - Female
  'en-GB-female-sonia': {
    name: 'en-GB-SoniaNeural',
    gender: 'female',
    styles: ['cheerful', 'sad', 'calm', 'fearful', 'disgruntled']
  },
  
  // British English - Male
  'en-GB-male-ryan': {
    name: 'en-GB-RyanNeural',
    gender: 'male',
    styles: ['cheerful', 'sad', 'calm', 'fearful', 'disgruntled']
  },
  'en-GB-male-thomas': {
    name: 'en-GB-ThomasNeural',
    gender: 'male',
    styles: ['cheerful', 'sad', 'angry', 'calm', 'fearful', 'disgruntled']
  }
};

// Backward compatibility: Map old Google names to new Azure names
const LEGACY_GOOGLE_TO_AZURE = {
  'en-US-Standard-A': 'en-US-female-aria',
  'en-US-Standard-B': 'en-US-male-brian',
  'en-US-Standard-C': 'en-US-female-eve',
  'en-US-Standard-D': 'en-US-male-guy',
  'en-US-Standard-E': 'en-US-female-jenny',
  'en-GB-Standard-A': 'en-GB-female-sonia',
  'en-GB-Standard-B': 'en-GB-male-ryan',
  'en-GB-Standard-C': 'en-GB-female-sonia',
  'en-GB-Standard-D': 'en-GB-male-thomas',
};
```

---

## Part 8: Recommended UI Updates

### Update Avatar Inspector Voice Tab

**From:**
```
Voice: [Dropdown: British Voice (F), American Voice (M), etc.]
```

**To:**
```
Voice: [Dropdown: en-US-AriaNeural, en-US-BrianNeural, en-GB-SoniaNeural, ...]

[New] Voice Style: [Dropdown: neutral, cheerful, sad, angry, calm, fearful, disgruntled, ...]

[New] Style Intensity: [Slider: 0.5 - 2.0]
  (controls degree of emotion expressed)
```

### Update Avatar Inspector Conversation Tab

**From:**
```
Filler Words Frequency: [Dropdown: none, low, medium, high]
```

**To:**
```
Emotion/Tone Preset: [Dropdown: neutral, enthusiastic, skeptical, concerned, authoritative]
  (Maps to appropriate voice style when generating audio)

Filler Words Frequency: [Dropdown: none, low, medium, high]
  (For future use in TTS generation)
```

---

## Part 9: Complete Flow Example

### Scenario: Generate response with custom style

**1. User clicks avatar → Opens Inspector**

```
Personality: analytical
Voice: en-US-BrianNeural
Style: serious
Role: Senior researcher
```

**2. User triggers conversation**

**3. System creates prompt:**

```
SYSTEM PROMPT:
"You are Alice, an analytical person.
Experience is 10 years, expertise is User Studies.
Role: Senior HCI researcher specializing in human-computer interaction.
Your communication style is analytical - respond logically and data-driven.
Respond briefly (1-2 sentences), building on previous points."

USER PROMPT:
"Last message: 'What do you think about this approach?'"
```

**4. Gemini generates:**

```
Response: "The methodology shows promise, though we'd need to validate 
with a larger sample size to establish statistical significance."
```

**5. Azure Speech TTS generates audio with style:**

```
SSML sent to Azure:
<speak version="1.0" xml:lang="en-US">
  <voice name="en-US-BrianNeural">
    <mstts:express-as style="serious" styledegree="1.5">
      The methodology shows promise, though we'd need to validate 
      with a larger sample size to establish statistical significance.
    </mstts:express-as>
  </voice>
</speak>

Azure generates MP3 with serious tone applied
```

---

## Key Takeaway

**Avatar Inspector Properties → SYSTEM PROMPT (not user)**

- Personality, role, attributes shape how LLM thinks
- Conversation messages go to USER PROMPT
- This is why you need to regenerate to see personality changes
- Voice & mood are separate, applied after LLM generates text

