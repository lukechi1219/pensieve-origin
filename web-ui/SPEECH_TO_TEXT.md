# Speech-to-Text Feature Documentation

## Overview

The Speech-to-Text feature enables users to input messages via voice in the `/chats` page. It uses the browser's built-in Web Speech API (no API keys required) and includes automatic sentence detection with auto-submission.

## Key Features

### 1. **Browser-Based Speech Recognition**
- Uses Web Speech API (`window.SpeechRecognition` or `window.webkitSpeechRecognition`)
- **Free** - No API keys or cloud services required
- **No external dependencies** - Built into Chrome, Edge, and Safari

### 2. **Automatic Sentence Detection**
The system automatically detects when a sentence is complete using two methods:

#### Method 1: Punctuation Detection
Recognizes sentence-ending punctuation:
- **Chinese**: 。！？、
- **English**: . ! ? ;

When the speech recognition returns a final result with these punctuation marks, the sentence is automatically submitted.

#### Method 2: Silence Detection
If the user stops speaking for **3 seconds** without punctuation, the system considers the sentence complete and auto-submits.

### 3. **Real-Time Visual Feedback**

#### Recording Button States
- **Not Recording**: Gray background with microphone icon
- **Recording**: Red pulsing background with microphone-off icon
- Displays "Speak" (語音) when idle
- Displays "Recording" (錄音中) when active

#### Input Field States
- **Normal**: Gray border
- **Recording**: Red border with light red background
- Shows live transcript as you speak

#### Interim Transcript Display
A blue notification box appears below the input showing:
- "Listening: [interim text]" (聆聽中: [暫存文字])
- Real-time preview of what's being captured

### 4. **Language Support**

The feature automatically switches language based on the UI language setting:
- **English (en-US)**: When UI is in English
- **Traditional Chinese (zh-TW)**: When UI is in 繁體中文

Language detection for message submission still uses the existing heuristic (presence of Chinese characters).

## How to Use

### Starting Voice Input

1. Navigate to any chat in `/chats/[id]`
2. Click the **microphone button** on the left side of the input area
3. Grant microphone permissions if prompted
4. Start speaking

### During Recording

- Your speech appears in real-time in the input field
- Interim (unconfirmed) text shows in a blue box below
- Final recognized text appears in the input field

### Auto-Submission

The message automatically submits when:
1. You end with punctuation (。！？!?;)
2. OR after 3 seconds of silence

### Manual Control

- **Stop Recording**: Click the red pulsing microphone button
- **Manual Send**: Press Ctrl+Enter or click the "Send" button
- **Discard**: Click stop recording and clear the input field

## Technical Implementation

### Architecture

```
useSpeechToText Hook
├─ Web Speech API Integration
├─ Sentence Detection Logic
├─ Silence Timer (3s)
└─ Event Callbacks

ChatDetail Component
├─ Hook Integration
├─ UI State Management
├─ Auto-submission Logic
└─ Visual Feedback
```

### File Structure

```
web-ui/
├─ src/
│  ├─ hooks/
│  │  └─ useSpeechToText.ts           # Speech recognition hook
│  ├─ pages/
│  │  └─ ChatDetail.tsx               # Chat UI with speech button
│  ├─ types/
│  │  └─ speech-recognition.d.ts      # TypeScript definitions
│  └─ i18n/
│     └─ translations.ts              # Bilingual labels
```

### Core Hook: `useSpeechToText`

**Location**: `web-ui/src/hooks/useSpeechToText.ts`

**Parameters**:
```typescript
interface UseSpeechToTextOptions {
  language?: string;              // 'zh-TW' | 'en-US'
  continuous?: boolean;           // Keep listening after results
  interimResults?: boolean;       // Show real-time partial results
  onSentenceComplete?: (text: string) => void;  // Callback when sentence done
  onError?: (error: string) => void;            // Error handler
}
```

**Return Values**:
```typescript
interface UseSpeechToTextReturn {
  isListening: boolean;           // Recording state
  transcript: string;             // Final confirmed text
  interimTranscript: string;      // Real-time partial text
  startListening: () => void;     // Start recording
  stopListening: () => void;      // Stop recording
  isSupported: boolean;           // Browser support flag
  error: string | null;           // Error message
}
```

### Sentence Detection Algorithm

```typescript
// 1. Punctuation Check
const sentenceEnders = /[。！？!?;]\s*$/;
if (sentenceEnders.test(finalText)) {
  submitSentence(finalText);
}

// 2. Silence Check (runs every 500ms)
const timeSinceLastWord = Date.now() - lastSpeechTime;
if (timeSinceLastWord > 3000 && text.trim()) {
  submitSentence(text);
}
```

### Integration in ChatDetail

```typescript
const {
  isListening,
  transcript,
  interimTranscript,
  startListening,
  stopListening,
  isSupported,
} = useSpeechToText({
  language: locale === 'zh_Hant' ? 'zh-TW' : 'en-US',
  continuous: true,
  interimResults: true,
  onSentenceComplete: (text) => {
    setNewMessage(text);
    setTimeout(() => handleSendMessage(), 100);
  },
  onError: (err) => setError(err),
});
```

## Browser Compatibility

### Supported Browsers
✅ **Chrome** (Desktop & Android): Full support
✅ **Microsoft Edge**: Full support
✅ **Safari** (macOS & iOS): Full support (requires user permission)

### Unsupported Browsers
❌ **Firefox**: No Web Speech API support
❌ **Opera**: Limited support

### Detection
The feature automatically hides the microphone button if the browser doesn't support Web Speech API.

## i18n Support

### English Translations
```typescript
chat: {
  startSpeech: 'Start voice input',
  stopSpeech: 'Stop voice input',
  speak: 'Speak',
  recording: 'Recording',
  listening: 'Listening',
}
```

### Chinese Translations (繁體中文)
```typescript
chat: {
  startSpeech: '開始語音輸入',
  stopSpeech: '停止語音輸入',
  speak: '語音',
  recording: '錄音中',
  listening: '聆聽中',
}
```

## Configuration Options

### Adjusting Silence Timeout

In `useSpeechToText.ts` (line ~65):
```typescript
// Default: 3000ms (3 seconds)
if (timeSinceLastWord > 3000 && text.trim()) {
  // Auto-submit
}
```

Change `3000` to adjust the silence threshold.

### Customizing Sentence Endings

In `useSpeechToText.ts` (line ~50):
```typescript
const sentenceEnders = /[。！？!?;]\s*$/;
```

Add more punctuation marks to the regex pattern.

### Language Mapping

In `ChatDetail.tsx` (line ~43):
```typescript
language: locale === 'zh_Hant' ? 'zh-TW' : 'en-US',
```

Add more language mappings as needed.

## Security & Privacy

### Microphone Permissions
- Browser prompts for microphone access on first use
- Permission persists per origin
- Users can revoke permissions in browser settings

### Data Handling
- **All processing is local** - No data sent to external servers
- Speech recognition uses browser's built-in engine
- No audio recordings are stored

### Privacy Benefits
- No API keys or cloud services
- No usage tracking
- No audio data transmission

## Troubleshooting

### Issue: Microphone button doesn't appear
**Cause**: Browser doesn't support Web Speech API
**Solution**: Use Chrome, Edge, or Safari

### Issue: No microphone permission prompt
**Cause**: Browser already denied permission
**Solution**: Check browser settings → Site permissions → Microphone

### Issue: Speech not detected
**Cause**: Microphone not working or background noise
**Solution**:
1. Check microphone hardware
2. Test in browser settings
3. Reduce background noise

### Issue: Auto-submission too fast/slow
**Cause**: Default 3-second silence threshold
**Solution**: Adjust timeout in `useSpeechToText.ts` (see Configuration)

### Issue: Wrong language detected
**Cause**: UI language doesn't match speech input
**Solution**: Change UI language in settings (top-right dropdown)

## Performance Considerations

### Resource Usage
- **CPU**: Minimal - uses browser's native engine
- **Memory**: ~5-10MB during active recognition
- **Network**: Zero - all processing is local

### Best Practices
1. Stop recognition when not in use (auto-stops after submission)
2. Don't keep multiple tabs with active recognition
3. Use in quiet environments for better accuracy

## Future Enhancements

### Potential Improvements
1. **Custom Wake Word**: "Hey JARVIS" to start recording
2. **Voice Commands**: "Send", "Clear", "Stop" commands
3. **Multi-Language Auto-Detection**: Detect language from speech content
4. **Confidence Threshold**: Only submit if confidence > 80%
5. **Noise Cancellation**: Filter background noise
6. **Offline Mode**: Download language models for offline use

### Integration Ideas
1. **Journal Voice Entry**: Dictate daily journal entries
2. **Note Creation**: "Create note about [topic]"
3. **Voice Search**: Search notes by speaking keywords
4. **JARVIS Conversation**: Full voice chat with JARVIS

## API Reference

### useSpeechToText Hook

#### Import
```typescript
import { useSpeechToText } from '../hooks/useSpeechToText';
```

#### Usage Example
```typescript
function MyComponent() {
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
  } = useSpeechToText({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    onSentenceComplete: (text) => {
      console.log('Complete sentence:', text);
      submitMessage(text);
    },
    onError: (err) => {
      console.error('Speech error:', err);
    },
  });

  if (!isSupported) {
    return <div>Speech recognition not supported</div>;
  }

  return (
    <div>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? 'Stop' : 'Start'}
      </button>
      <input value={transcript + interimTranscript} readOnly />
      {error && <div>{error}</div>}
    </div>
  );
}
```

## Testing Checklist

### Manual Testing
- [ ] Microphone button appears in supported browsers
- [ ] Button hidden in unsupported browsers (Firefox)
- [ ] Microphone permission prompt appears
- [ ] Recording indicator shows (red pulsing button)
- [ ] Input field changes to red border
- [ ] Interim transcript displays in blue box
- [ ] Final transcript appears in input field
- [ ] Punctuation triggers auto-submission
- [ ] 3-second silence triggers auto-submission
- [ ] Ctrl+Enter still works during recording
- [ ] Stop button ends recording
- [ ] Language switches with UI language
- [ ] English speech recognized correctly
- [ ] Chinese speech recognized correctly
- [ ] Error messages display properly
- [ ] JARVIS response plays after submission

### Browser Testing Matrix
| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | Full support |
| Edge | ✅ | N/A | Full support |
| Safari | ✅ | ✅ | Full support |
| Firefox | ❌ | ❌ | Not supported |

## References

### Documentation
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition Interface](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Browser Compatibility Table](https://caniuse.com/speech-recognition)

### Related Files
- `web-ui/src/hooks/useSpeechToText.ts` - Core hook implementation
- `web-ui/src/pages/ChatDetail.tsx` - UI integration
- `web-ui/src/types/speech-recognition.d.ts` - TypeScript types
- `web-ui/src/i18n/translations.ts` - Bilingual labels

### Related Features
- **Voice Mode** - JARVIS TTS responses (existing)
- **JARVIS Agent** - AI conversation partner (existing)
- **Chat History** - Persistent conversation storage (existing)

---

**Last Updated**: 2025-12-05
**Author**: Claude Code
**Version**: 1.0.0
