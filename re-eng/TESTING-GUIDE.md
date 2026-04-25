# Voice Implementation Testing Guide

## ✅ Server Status
- **Client**: http://localhost:5174/ (Vite dev server, port 5174)
- **Server**: http://localhost:3010/ (Node.js, running ✅)
- **TTS Provider**: Azure ✅
- **LLM Provider**: Gemini ✅

---

## Testing Checklist

### 1. UI Changes Verify (`client/src/components/inspector/AvatarInspector.jsx`)

**Step 1: Open Avatar Inspector**
- [ ] Open app at http://localhost:5174/
- [ ] Create a scene or select existing scene
- [ ] Click on an avatar in the scene to open Avatar Inspector
- [ ] Navigate to "Avatar Settings" tab (the third tab)

**Step 2: Voice Selection Dropdown**
- [ ] **Expected**: Dropdown shows 9 real Azure voice names organized by region:
  - US English - Female
    - en-US-AriaNeural (F)
    - en-US-EveNeural (F)
    - en-US-JennyNeural (F)
  - US English - Male
    - en-US-BrianNeural (M)
    - en-US-ChristopherNeural (M)
    - en-US-GuyNeural (M)
  - British English - Female
    - en-GB-SoniaNeural (F)
  - British English - Male
    - en-GB-RyanNeural (M)
    - en-GB-ThomasNeural (M)

- [ ] **Old behavior**: Should NOT show "American Voice (M)", "British Voice (F)", etc.
- [ ] Try selecting different voices
- [ ] Click "Test Voice" button - should hear audio with selected voice

**Step 3: Voice Style Dropdown (NEW)**
- [ ] Below voice selector, NEW dropdown should appear: "Voice Style"
- [ ] **Expected options** (11 total):
  - neutral (no emotion)
  - cheerful
  - sad
  - angry
  - calm
  - fearful
  - disgruntled
  - serious
  - shouting
  - unfriendly
  - whispering
- [ ] Default should be "neutral"
- [ ] Select different styles (e.g., "cheerful", "serious")

**Step 4: Style Intensity Slider (NEW)**
- [ ] Below style dropdown, NEW slider should appear: "Style Intensity"
- [ ] **Expected range**: 0.5 to 2.0
- [ ] **Default**: 1.0
- [ ] **Label**: Shows current value (e.g., "Style Intensity: 1.0x")
- [ ] **Description**: "0.5 (subtle) to 2.0 (very expressive)"
- [ ] Drag slider to test values:
  - 0.5 (subtle emotion)
  - 1.0 (normal emotion)
  - 1.5 (stronger emotion)
  - 2.0 (very expressive emotion)

### 2. Data Persistence Tests

**Step 5: Save and Reload**
- [ ] Set voice to "en-US-male-brian"
- [ ] Set style to "serious"
- [ ] Set intensity to 1.5
- [ ] Refresh page (Ctrl+R or Cmd+R)
- [ ] **Expected**: Avatar inspector should show same settings after reload
- [ ] Check browser DevTools → Application → Local Storage → "avatar-config-{avatarname}"
- [ ] **Expected**: JSON should contain:
  ```json
  {
    "voice": "en-US-male-brian",
    "settings": {
      "voiceStyle": "serious",
      "styleDegree": 1.5
    }
  }
  ```

**Step 6: Multiple Avatars**
- [ ] Set Avatar 1 voice to "en-US-female-aria" + style "cheerful"
- [ ] Set Avatar 2 voice to "en-GB-male-ryan" + style "serious"
- [ ] Click between avatars in inspector
- [ ] **Expected**: Each avatar should remember its own voice and style settings

### 3. TTS Integration Tests (Server-Side)

**Step 7: Voice Mapping Backward Compatibility**
- [ ] In browser DevTools Console, check for any errors
- [ ] Go to server log (terminal where "npm start" is running)
- [ ] **Expected**: No errors about voice mapping
- [ ] If old voice names are used, should log: "Converting legacy Google voice 'X' to 'Y'"

**Step 8: SSML Generation**
- [ ] Trigger a conversation with an avatar
- [ ] Check server logs
- [ ] **Expected output** should show:
  ```
  [timestamp] Azure Speech TTS: Making API call to https://...
  ```
- [ ] **Should NOT show errors** like "Invalid voice" or "Unknown style"

### 4. Audio Testing (If TTS Configured)

**Step 9: Test Voice Audio Output**
- [ ] Select an avatar and voice
- [ ] Click "Test Voice" button in Avatar Inspector
- [ ] **Expected**: Avatar should speak test text using selected voice
- [ ] Try different voices - sound should differ
- [ ] Try different styles - emotional tone should differ:
  - cheerful = upbeat, happy tone
  - serious = formal, neutral tone
  - sad = downbeat, sorrowful tone

**Step 10: Conversation Audio**
- [ ] (Requires full conversation setup)
- [ ] Start a conversation with avatar
- [ ] Avatar responses should use voice from Avatar Inspector
- [ ] Avatar responses should have emotional style applied

### 5. Error Handling Tests

**Step 11: Invalid Voice Handling**
- [ ] If somehow invalid voice is in localStorage, app should:
  - [ ] Not crash
  - [ ] Fall back to default voice
  - [ ] Show error in console (optional)

**Step 12: Browser Compatibility**
- [ ] Test in Chrome/Chromium ✅ (current)
- [ ] Test in Firefox (if available)
- [ ] Test on mobile responsive view (F12 → Toggle Device Toolbar)

---

## Server-Side Testing Commands

### Check TTS/LLM Configuration
```bash
# Check server is using Azure TTS
grep "TTS: Initialized" /workspaces/DialogLab/server/server.log

# Check for voice mapping errors
grep "Azure TTS:" /workspaces/DialogLab/server/server.log
```

### Manual Voice Mapping Test
```bash
# Test old voice name mapping
curl -X POST http://localhost:3010/api/generate-audio \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test.",
    "voice": {"name": "en-US-Standard-B", "style": "cheerful", "styleDegree": 1.5}
  }'
```

**Expected**: Should work without errors (backward compatible)

---

## Browser Console

### What to Look For (Should NOT see):
❌ `TypeError: Cannot read property 'map' of undefined`
❌ `VOICE_CATALOG is not defined`
❌ `voice.style is undefined`
❌ `localStorage error`

### What to Look For (Should see):
✅ Voice changes: `handleVoiceChange`
✅ Style changes: `handleVoiceStyleChange`
✅ Config saves: `Saved configuration for avatar`
✅ No errors in console

---

## Success Criteria

### ✅ UI Tests Pass
- [ ] Voice dropdown shows 9 real Azure voices (not old generic names)
- [ ] Voice style dropdown appears with 11 options
- [ ] Style intensity slider works (0.5-2.0)
- [ ] All controls are properly labeled and visible

### ✅ Data Persistence Tests Pass
- [ ] Settings saved to localStorage with correct JSON structure
- [ ] Settings load after page refresh
- [ ] Multiple avatars have separate voice/style configs

### ✅ Server Tests Pass
- [ ] No errors in server logs
- [ ] Backward compatible with old voice names
- [ ] SSML generation includes style tags when needed

### ✅ Audio Tests Pass (If TTS works)
- [ ] Voice test audio plays
- [ ] Different voices sound different
- [ ] Emotional styles are audible in speech

---

## Common Issues & Solutions

### Issue: Voice dropdown empty
**Solution**: Check browser console for errors. Check that VOICE_CATALOG was imported correctly.

### Issue: Style intensity slider not responsive
**Solution**: Clear browser cache (Ctrl+Shift+Delete). Restart Vite dev server.

### Issue: Settings not saving
**Solution**: Check localStorage is enabled. Check for errors in browser DevTools.

### Issue: Server error on TTS call
**Solution**: Check Azure TTS endpoint and key are configured. Check server logs for detailed error.

### Issue: Old voices still showing
**Solution**: Vite should hot-reload. If not, restart client server (Ctrl+C in terminal, then `npm run dev`).

---

## Testing Notes

- All console logs use `console.log()` - check DevTools Console tab for output
- Server logs go to terminal where `npm start` is running
- localStorage is specific per avatar - each avatar has `avatar-config-{name}` key
- Voice style is stored in `settings.voiceStyle` and `settings.styleDegree`

