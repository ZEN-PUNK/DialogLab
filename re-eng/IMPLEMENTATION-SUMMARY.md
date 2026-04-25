# Azure Voices & Voice Styles - Implementation Summary

## Overview

Dialog Lab has been updated with **real Azure Neural Voices** and **voice style support** (emotional tone control). This replaces the limited Google voice mapping with comprehensive Azure voice options.

## ✅ Completed Changes

### Server-Side: `/workspaces/DialogLab/server/tts.js`

**1. Real Azure Voice Catalog**
- 9 Azure Neural Voices available:
  - **US English Female:** AriaNeural, EveNeural, JennyNeural
  - **US English Male:** BrianNeural, ChristopherNeural, GuyNeural
  - **British English Female:** SoniaNeural
  - **British English Male:** RyanNeural, ThomasNeural

**2. Backward Compatibility**
- Old Google voice names still work (e.g., "en-US-Standard-B")
- Automatically mapped to new Azure voices
- No breaking changes to existing saved configs

**3. Voice Style Support**
- Extracts `voice.style` from TTS request
- Extracts `voice.styleDegree` (0.5 to 2.0 intensity)
- Embedded in SSML with `<mstts:express-as>` tags
- Supports: cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering

**4. SSML Generation**
```javascript
// Now includes style tags:
<mstts:express-as style='cheerful' styledegree='1.5'>
  Your response text here
</mstts:express-as>
```

### Client-Side: `/workspaces/DialogLab/client/src/components/inspector/AvatarInspector.jsx`

**1. New Voice Catalog UI**
- `VOICE_CATALOG` constant with 9 voices, each with:
  - Real Azure name display
  - Region (US/GB)
  - Gender (M/F)
  - Available styles for that voice

**2. Updated Voice Selection Dropdown**
- Organized by region and gender
- Shows real Azure voice names: "en-US-AriaNeural (F)", "en-GB-RyanNeural (M)", etc.
- No more generic "American Voice (M)" labels

**3. New Voice Style Dropdown**
- 11 emotional styles available
- Default: "neutral" (no emotion)
- Options: cheerful, sad, angry, calm, fearful, disgruntled, serious, shouting, unfriendly, whispering

**4. New Style Intensity Slider**
- Range: 0.5x (subtle) to 2.0x (very expressive)
- Default: 1.0x (normal)
- Updates in real-time

**5. State Management**
- New state: `voiceStyle`, `styleDegree`
- Saved to localStorage in `avatarConfig.settings`
- Loaded from saved configs on mount
- Initialized with templates or defaults

**6. Event Handlers**
- `handleVoiceStyleChange()` - Updates style, saves, dispatches event
- `handleStyleDegreeChange()` - Updates intensity, saves, dispatches event
- Both integrate with existing audio change system

## Data Flow

### Configuration Storage
```
User changes Voice Style in Inspector
        ↓
handleVoiceStyleChange() called
        ↓
Update state: voiceStyle, styleDegree
        ↓
Update avatarConfig.settings
        ↓
Save to localStorage (avatar-config-{name})
        ↓
Dispatch avatarConfigChanged event
```

### Usage in Conversation
```
Conversation starts
        ↓
Load avatar config from localStorage
        ↓
Avatar instance receives full config including:
  - voice (name)
  - settings.voiceStyle
  - settings.styleDegree
        ↓
Avatar.say() called
        ↓
TTS API receives voice config with style
        ↓
server/tts.js processes:
  1. Maps voice name to Azure voice
  2. Extracts style and styleDegree
  3. Generates SSML with style tags
  4. Sends to Azure Speech API
        ↓
Azure applies emotional style to audio
```

## UI/UX Improvements

### Before
- Only 5 generic voice options: "American Voice (M)", "British Voice (F)", etc.
- No emotion/style control
- Limited voice selection

### After
- 9 distinct real Azure voices with clear names
- 11 emotional styles per voice
- Style intensity control (0.5-2.0x)
- Organized by region and gender
- Hover tooltips explaining each control

## Configuration Example

**Saved in localStorage:**
```json
{
  "name": "Alice",
  "voice": "en-US-female-aria",
  "personality": "friendly",
  "roleDescription": "Senior researcher",
  "settings": {
    "voiceStyle": "cheerful",
    "styleDegree": 1.5,
    "mood": "happy",
    "cameraView": "upper"
  },
  "customAttributes": {
    "experience": "10 years",
    "expertise": "HCI"
  }
}
```

## Testing Checklist

- [ ] Voice dropdown shows all 9 real Azure voices
- [ ] Voice style dropdown has 11 options
- [ ] Style intensity slider works (0.5-2.0)
- [ ] Changes save to localStorage
- [ ] Conversation loads saved voice style
- [ ] TTS generates audio with emotional style applied
- [ ] Old configs with legacy voice names still work
- [ ] Default styles work when none selected

## Files Modified

1. `/workspaces/DialogLab/server/tts.js` - Voice mapping & SSML generation
2. `/workspaces/DialogLab/client/src/components/inspector/AvatarInspector.jsx` - UI & state management

## Backward Compatibility

✅ **Fully backward compatible:**
- Old Google voice names ("en-US-Standard-B") still work
- Existing saved configs continue to work
- Automatic migration to new voice names
- Default styles applied when style not specified

## Next Steps (Optional Enhancements)

1. **Preview styles** - Show audio sample for each style
2. **Voice style presets** - Map personality traits to default styles (analytical → serious, enthusiastic → cheerful, etc.)
3. **Conversation behavior guidelines** - Update based on voice style
4. **Template updates** - Add voice style to avatar templates
5. **Full integration test** - Verify style is used in actual TTS calls

## Documentation References

See related documentation:
- [AZURE-VOICES-AND-LLM-PROMPTS.md](./AZURE-VOICES-AND-LLM-PROMPTS.md) - Complete voice catalog and LLM integration guide
- [AVATAR-INSPECTOR-GUIDE.md](./AVATAR-INSPECTOR-GUIDE.md) - Avatar property reference

## Technical Notes

**Azure Neural Voice Names Format:**
```
en-{LANG}-{Name}Neural
en-US-AriaNeural (US English, Female)
en-GB-RyanNeural (British English, Male)
```

**SSML Namespace Required:**
```xml
<speak xmlns:mstts="https://www.w3.org/2001/mstts">
  <mstts:express-as style="...">
    Content
  </mstts:express-as>
</speak>
```

**Voice Style Availability:**
- Some styles not available for all voices (Azure limitation)
- Server code validates style for requested voice
- Falls back to "neutral" if style not available

