# Audio Simulation System

Real-time audio transcription and conversation guidance system for OneVoice.

## Overview

This system allows you to upload audio sample files (MP3, WAV, M4A, MP4, WebM) and perform real-time call transcription with AI-powered conversation guidance. The audio is processed in chunks as it plays, simulating a real call scenario with live transcription using Deepgram or OpenAI Whisper.

## Features

- 📤 **Drag-and-drop audio upload** - Support for common audio formats
- 🎵 **Audio playback controls** - Play, pause, seek, and restart
- 📝 **Live transcription** - Real-time speech-to-text using Deepgram or OpenAI Whisper
- 💬 **Speaker diarization** - Automatic detection of agent vs. customer
  - **Deepgram**: Built-in ML-based speaker identification (highly accurate)
  - **Whisper**: Heuristic-based detection using conversation patterns (less accurate)
- 🎯 **Conversation guidance** - AI-powered suggestions based on conversation flow
- 📊 **Stage progression** - Automatic conversation stage tracking
- ⚡ **Real-time chunk processing** - Extracts and processes audio as it plays

## Architecture

```
┌─────────────────────┐
│   Audio Upload      │
│   (Browser)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Audio Playback     │
│  Simulator          │
│  + Web Audio API    │
│  (Chunk Extraction) │
└──────────┬──────────┘
           │ (real audio chunks)
           ▼
┌─────────────────────┐
│   POST /api/        │
│   transcribe-chunk  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   STT Service       │
│   (Deepgram/Whisper)│
└──────────┬──────────┘
           │ (transcription)
           ▼
┌─────────────────────┐
│  Live Transcript    │
│  Display            │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Conversation       │
│  Navigator          │
└─────────────────────┘
```

## Setup

### 1. Install Dependencies

All required dependencies are already in `package.json`:

```bash
npm install
```

### 2. Configure API Keys

Copy the environment template:

```bash
cp .env.example .env
```

Add your API key (choose ONE):

**Option A: Deepgram (Recommended)**
```env
DEEPGRAM_API_KEY=your_api_key_here
```
- Free tier: 45,000 minutes/year
- Sign up: https://deepgram.com

**Option B: OpenAI Whisper**
```env
OPENAI_API_KEY=your_api_key_here
```
- Pay-as-you-go pricing
- Sign up: https://platform.openai.com
- Note: Whisper doesn't have built-in speaker diarization, so the system uses heuristic-based detection (less accurate)

**Important:** An API key (Deepgram or OpenAI) is required for real transcription. The system extracts actual audio from your uploaded files and sends them to the STT service.

**Recommendation:** Use Deepgram for best speaker diarization accuracy. Deepgram's built-in diarization accurately identifies who is speaking, while Whisper requires heuristic-based guessing.

### 3. Run the App

```bash
npm run dev
```

Visit: http://localhost:5173/audio-demo

## Components

### Audio Upload (`app/components/audio/audio-upload.tsx`)

Drag-and-drop file upload with validation.

**Features:**
- Accepts .mp3, .wav, .m4a, .ogg, .mp4, .webm
- Max file size: 50MB (configurable)
- Automatically extracts audio from video files
- File type and size validation
- Visual feedback for errors

**Usage:**
```tsx
import { AudioUpload } from "~/components/audio"

<AudioUpload
  onFileSelect={(file) => console.log(file)}
  acceptedFormats={[".mp3", ".wav", ".m4a", ".mp4", ".webm"]}
  maxSizeMB={50}
/>
```

### Audio Playback Simulator (`app/components/audio/audio-playback-simulator.tsx`)

Audio player with real-time audio chunk extraction and transcription.

**Features:**
- Standard playback controls (play, pause, restart)
- Seekable progress bar
- Web Audio API-based chunk extraction
- Automatic chunk submission to STT endpoint
- Visual processing indicator

**How it works:**
1. Decodes uploaded audio file into an AudioBuffer using Web Audio API
2. As playback progresses, extracts 2-3 second chunks of raw audio
3. **Smart channel analysis** (NEW):
   - Analyzes each channel's RMS (Root Mean Square) and peak levels
   - Detects silence: Skips chunks with no audio activity
   - Detects single-speaker activity: Sends only the active channel (left=agent, right=customer)
   - Detects overlapping speech: Sends stereo when both speakers are active
   - Assigns sequence numbers to prevent race condition ordering issues
4. **Channel-based sending strategy**:
   - **Mono audio**: Sends as-is, relies on STT diarization
   - **Stereo - left only active**: Sends left channel only, speaker=agent
   - **Stereo - right only active**: Sends right channel only, speaker=customer
   - **Stereo - both active**: Sends full stereo for Deepgram's ML diarization
5. Converts chunk to WAV format (mono or stereo based on strategy)
6. POSTs chunk to `/api/transcribe-chunk` with metadata (sequence, speaker, strategy)
7. **Sequence-based ordering**: UI buffers out-of-order responses and displays them sequentially
8. Emits transcription results via `onTranscriptUpdate` callback

**Usage:**
```tsx
import { AudioPlaybackSimulator } from "~/components/audio"

<AudioPlaybackSimulator
  audioFile={file}
  onTranscriptUpdate={(event) => {
    // event.text contains the transcribed text
    // event.speaker is "agent" or "customer"
    // event.confidence is 0-1
    console.log(event)
  }}
  simulateRealtime={true}
  chunkDuration={2}
/>
```

### Live Transcript (`app/components/audio/live-transcript.tsx`)

Real-time transcript display with speaker diarization.

**Features:**
- Auto-scrolling to latest entry
- Speaker avatars (agent vs. customer)
- Confidence scores
- Interim vs. final transcript indication
- Timestamp display

**Usage:**
```tsx
import { LiveTranscript } from "~/components/audio"

<LiveTranscript
  entries={transcriptEntries}
  currentTime={audioTime}
  autoScroll={true}
  showConfidence={true}
/>
```

## API Endpoints

### `POST /api/transcribe-chunk`

Process individual audio chunks and return transcriptions.

**Request:**
```typescript
const formData = new FormData()
formData.append("audio", wavBlob, "chunk-0.wav")
formData.append("timestamp", "0.0")
formData.append("chunkIndex", "0")

const response = await fetch("/api/transcribe-chunk", {
  method: "POST",
  body: formData
})

const result = await response.json()
// {
//   timestamp: 0.0,
//   text: "Hello, how can I help you?",
//   speaker: "agent",
//   confidence: 0.95,
//   chunkIndex: 0,
//   words: [...]
// }
```

**Response Fields:**
- `timestamp` - Start time of this chunk in seconds
- `text` - Transcribed text from STT service
- `speaker` - "agent" or "customer" (alternating heuristic)
- `confidence` - 0-1 confidence score from STT
- `chunkIndex` - Index of this chunk
- `words` - Word-level timing data (if available)

**How it works:**
1. Receives WAV audio chunk (16kHz mono)
2. Sends to Deepgram or Whisper API
3. Returns transcription result
4. Used by AudioPlaybackSimulator during playback

## Utilities

### Audio Utils (`app/lib/audio-utils.ts`)

Audio processing utilities:

**Functions:**
- `convertToWav(audioFile)` - Convert to 16kHz mono WAV
- `splitAudioIntoChunks(audioFile, chunkDuration)` - Split into processable chunks
- `getAudioDuration(audioFile)` - Get file duration
- `formatTimestamp(seconds)` - Format for display (MM:SS)

**Example:**
```typescript
import { splitAudioIntoChunks, formatTimestamp } from "~/lib/audio-utils"

const chunks = await splitAudioIntoChunks(audioFile, 2)
console.log(`Duration: ${formatTimestamp(chunks[0].duration)}`)
```

### STT Service (`app/lib/stt-service.server.ts`)

Speech-to-text integration with auto-fallback.

**Uses @deepgram/sdk** for better type safety and error handling.

**Functions:**
- `transcribeAudio(blob, provider)` - Main transcription function with auto-detection
- `transcribeWithDeepgram(blob)` - Deepgram SDK integration with multichannel support
- `transcribeWithWhisper(blob)` - OpenAI Whisper API integration
- `mockTranscription(chunkIndex)` - Mock data for testing

**Deepgram SDK Benefits:**
- TypeScript types for all responses
- Built-in error handling and retries
- Cleaner API for configuration
- Automatic version compatibility

**Example:**
```typescript
import { transcribeAudio } from "~/lib/stt-service.server"

const result = await transcribeAudio(audioBlob, "auto")
console.log(result.text, result.confidence, result.speaker)
```

## Workflow

### 1. Upload Audio
```typescript
<AudioUpload onFileSelect={setAudioFile} />
```

### 2. Start Playback & Transcription
```typescript
const handleTranscriptUpdate = useCallback((event) => {
  setCurrentTime(event.timestamp)

  if (event.text && event.text.trim()) {
    setTranscriptEntries(prev => [...prev, {
      id: `entry-${event.chunkIndex}-${event.timestamp}`,
      timestamp: event.timestamp,
      text: event.text,
      speaker: event.speaker,
      confidence: event.confidence,
      isFinal: true
    }])
  }
}, [])

<AudioPlaybackSimulator
  audioFile={audioFile}
  onTranscriptUpdate={handleTranscriptUpdate}
  chunkDuration={2}
/>
```

The AudioPlaybackSimulator automatically:
- Extracts audio chunks as the file plays
- Sends each chunk to `/api/transcribe-chunk`
- Calls `onTranscriptUpdate` with the transcription result

### 3. Display Transcript
```typescript
<LiveTranscript
  entries={transcriptEntries}
  currentTime={currentTime}
/>
```

### 4. Show Guidance
```typescript
<ConversationNavigator
  stages={stages}
  currentStagePaths={currentPaths}
  onFollowPath={handleFollowPath}
/>
```

## Testing

### With Deepgram API (Recommended)

```bash
DEEPGRAM_API_KEY=your_key pnpm dev
```

Upload any audio file and it will be transcribed in real-time using Deepgram.

### With Whisper API

```bash
OPENAI_API_KEY=your_key pnpm dev
```

Upload any audio file and it will be transcribed in real-time using OpenAI Whisper.

## Speaker Diarization

Speaker diarization is the process of identifying "who spoke when" in an audio recording.

### Deepgram (Recommended)

Deepgram uses machine learning models trained on millions of hours of audio to accurately identify different speakers:

1. **How it works**: Analyzes voice characteristics (pitch, tone, speech patterns) at the word level
2. **Accuracy**: Very high - can distinguish similar-sounding voices
3. **Consistency**: Maintains speaker identity across the entire conversation
4. **Output**: Each word gets a speaker ID (0, 1, 2, etc.)

**Implementation** (`app/lib/stt-service.server.ts:164-221`):
- Enabled with `diarize=true` and `multichannel=true` parameters
- **Word-level analysis**: Processes each word with speaker timestamp
- **Segment detection**: Groups consecutive words by same speaker into segments
- **Mid-chunk speaker changes**: Automatically splits when speaker changes
- Maps speaker IDs (0, 1, 2...) to "agent" or "customer"
  - Channel 0 (left) = Agent
  - Channel 1 (right) = Customer

**Example segment output:**
```typescript
// Input: "How are you today? yep Great to hear!"
// Deepgram word-level output:
[
  { word: "How", speaker: 0 },      // Agent
  { word: "are", speaker: 0 },      // Agent
  { word: "you", speaker: 0 },      // Agent
  { word: "today", speaker: 0 },    // Agent
  { word: "yep", speaker: 1 },      // Customer (interruption!)
  { word: "Great", speaker: 0 },    // Agent
  { word: "to", speaker: 0 },       // Agent
  { word: "hear", speaker: 0 }      // Agent
]

// Our segment output:
[
  { speaker: "agent", text: "How are you today?" },
  { speaker: "customer", text: "yep" },         // Correctly identified!
  { speaker: "agent", text: "Great to hear!" }
]
```

### OpenAI Whisper (Heuristic Fallback)

Whisper doesn't have built-in speaker diarization, so we use conversation pattern analysis:

1. **First chunk**: Assumed to be agent (greetings)
2. **Question detection**: Speaker likely changes after questions
3. **Greeting patterns**: "Thank you for calling", "Hello" → agent
4. **Turn-taking**: Short responses after long statements → speaker change
5. **Consecutive chunks**: Same speaker for 4+ chunks → assume change

**Implementation** (`app/routes/api.transcribe-chunk.ts:29-80`):
- Tracks last speaker and consecutive chunk count
- Uses regex patterns to detect greetings and questions
- Analyzes text length (short responses often indicate turn-taking)

**Limitations**:
- Less accurate than ML-based approaches
- Can misidentify speakers in complex conversations
- Doesn't handle interruptions or overlapping speech well

### Improving Whisper Diarization

For production use with Whisper, consider:

1. **pyannote.audio**: Add separate Python service for ML-based diarization
2. **Assembly AI**: Alternative STT provider with built-in diarization
3. **Post-processing**: Train a custom model on your call center data
4. **Voice embeddings**: Use OpenAI's embeddings API to cluster similar voices

## Performance Optimization

### Chunk Duration

Balance between responsiveness and API costs:

- **1 second**: Very responsive, more API calls
- **2 seconds**: Good balance (recommended)
- **3-5 seconds**: Fewer calls, slight delay

### Audio Format

For best performance:
- **Sample Rate**: 16kHz (automatically converted)
- **Channels**: Mono (automatically converted)
- **Format**: WAV (automatically converted)

### Browser Compatibility

Requires:
- Web Audio API
- EventSource (SSE)
- Clipboard API (for script copying)

Supported in all modern browsers (Chrome, Firefox, Safari, Edge).

## Troubleshooting

### "API key not configured"

**Solution:** Add Deepgram or OpenAI API key to `.env` file.

### Transcript not updating

**Solution:**
- Check browser console for errors
- Ensure `/api/transcribe-chunk` endpoint is accessible
- Verify API key is valid
- Check that audio file is being properly decoded

### Audio won't play

**Solution:**
- Check file format (must be .mp3, .wav, .m4a, .ogg, .mp4, or .webm)
- Check file size (max 50MB)
- Try a different audio/video file
- For MP4/video files, ensure they contain an audio track

### "Failed to convert audio"

**Solution:** File may be corrupted or unsupported format. Try converting to MP3 or WAV first.

### Only one speaker being transcribed (missing customer/agent)

**Cause:** Your audio file is stereo with each speaker on a separate channel (left/right)

**Solution:** The system automatically processes both stereo channels. If you're still seeing this issue:
1. Check browser console for "Audio buffer info: X channel(s)" message
2. If it shows "1 channel(s)", your file is already mono - speaker diarization should work
3. If it shows "2 channel(s)" but you're missing speech, check the RMS values in logs
4. The system sends stereo when both speakers active, or mono when one speaker dominant

### Speaker misattribution during interruptions

**Problem:** When customer interrupts agent (e.g., "yep", "okay"), the interruption gets attributed to the wrong speaker.

**Example:**
```
Agent: "Do I have the pleasure of speaking with Mr. William, how are you today yep that's great"
         ↑ The "yep" is actually the customer!
```

**Solution (v2.1 - FIXED):**
- System now uses **word-level speaker segments** from Deepgram
- Automatically detects mid-chunk speaker changes
- Splits transcript into separate entries per speaker
- Each interruption gets its own transcript entry with correct speaker

**Result:**
```
Agent: "Do I have the pleasure of speaking with Mr. William, how are you today"
Customer: "yep"  ← Correctly identified!
Agent: "that's great"
```

**How stereo call recordings work:**
- **Industry standard**: Most telephony systems (Twilio, Avaya) record agent on left channel, customer on right channel
- **Configurable assumption**: The system assumes left=agent, right=customer (standard convention)
- **Smart processing**:
  - When only one speaker is active → sends single channel with known speaker identity
  - When both speakers overlap → sends stereo for Deepgram's ML-based separation
- **Benefits**:
  - Higher accuracy: Channel separation provides definitive speaker identification
  - Better handling of overlapping speech: Reduces transcription errors from mixed audio
  - Lower latency: Smaller payloads when only one speaker is active
  - Prevents race conditions: Sequence numbering ensures correct display order

## Channel Mapping Configuration

### Standard Convention (Default)
```
Left Channel (0)  = Agent
Right Channel (1) = Customer
```

This follows industry standards from:
- **Twilio Media Streams**: Left=customer, Right=agent in dual-channel recording
- **Avaya**: Participant channels separated for agent/customer
- **Most PBX systems**: Convention for outbound call recordings

### Why This Works in Production

Real-time call streaming from Twilio and Avaya provides separated audio channels:

**Twilio**:
- Media Streams API delivers audio over WebSocket
- `track` attribute allows capturing inbound and outbound separately
- Dual-channel recording keeps participants on separate channels

**Avaya**:
- DMCC API provides call recording with separate participant channels
- Real-time monitoring supports channel-separated streaming

### Customization (Future)

To make channel mapping configurable:
```typescript
// Add to AudioPlaybackSimulator props
channelMapping?: {
  leftChannel: 'agent' | 'customer'
  rightChannel: 'agent' | 'customer'
}
```

Current hardcoded mapping in `audio-utils.ts:258-262,269-272`.

## Recent Improvements (v2)

✅ **Smart Channel Analysis**
- RMS-based silence detection skips empty chunks
- Per-channel peak detection identifies active speaker
- Automatic switching between mono/stereo sending

✅ **Intelligent Speaker Detection**
- Channel-based speaker identification (most accurate)
- **Word-level diarization** for mid-chunk speaker changes
- Automatic speaker segmentation when speakers interrupt each other
- Falls back to Deepgram ML diarization for overlapping speech
- Heuristic-based detection for Whisper (when needed)

✅ **Mid-Chunk Speaker Change Handling**
- Detects when speaker changes within a single audio chunk
- Example: "How are you today? [AGENT] **yep** [CUSTOMER] Great to hear! [AGENT]"
- Splits chunks into speaker segments based on word-level timestamps
- Displays each segment with correct speaker attribution
- Prevents misattribution of interruptions and confirmations

✅ **Race Condition Prevention**
- Sequence numbering for all chunks
- Client-side buffering of out-of-order responses
- Sequential processing ensures correct display order

✅ **Optimized Bandwidth**
- Silence detection reduces unnecessary API calls
- Single-channel transmission when only one speaker active
- Stereo only sent when both speakers overlap

## Future Enhancements

- [ ] Real-time audio streaming (WebRTC/Twilio integration)
- [ ] Configurable channel mapping (swap agent/customer channels)
- [ ] Multi-speaker diarization (3+ speakers, conference calls)
- [ ] Custom vocabulary/phrases for better accuracy
- [ ] Sentiment analysis integration
- [ ] Intent detection and keyword spotting
- [ ] Export transcript to PDF/text
- [ ] Playback speed control
- [ ] Waveform visualization with channel separation view

## Related Documentation

- [Component Structure](./COMPONENT_STRUCTURE.md)
- [Palace API Reference](../PALACE_API_REFERENCE.md)
- [Implementation Plans](../IMPLEMENTATION_PLAN_v2.md)
