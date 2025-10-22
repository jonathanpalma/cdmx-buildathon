# OneVoice - Quick Start Guide

Get up and running with OneVoice in under 2 minutes!

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd cdmx-buildathon-app
pnpm install
```

### 2. Configure API Keys

You need **ONE** STT API key for real-time transcription:

**Option A: Deepgram (Recommended)**
```bash
cp .env.example .env
# Add your Deepgram API key to .env
```
Get free API key: https://deepgram.com (45,000 minutes/year free)

**Option B: OpenAI Whisper**
```bash
cp .env.example .env
# Add your OpenAI API key to .env
```
Get API key: https://platform.openai.com

### 3. Run the App

```bash
pnpm dev
```

Open http://localhost:5173 and you're ready to go!

## 📋 How to Use

### Step 1: Upload Audio/Video
- Drag and drop an audio or video file (MP3, WAV, M4A, MP4, WebM) onto the upload area
- Or click "Browse Files" to select from your computer

### Step 2: Watch the Magic
Once uploaded, the demo will:
1. **Play the audio** with a built-in player
2. **Extract audio chunks** as the file plays (every 2 seconds)
3. **Generate real-time transcription** using your STT API (Deepgram or Whisper)
4. **Display conversation stages** that progress automatically
5. **Show AI-powered guidance** with recommended scripts and actions

### Step 3: Interact with Copilot
- **View transcripts** in real-time with speaker labels (Agent vs. Customer)
- **Follow suggested paths** for optimal conversation outcomes
- **Copy scripts** to clipboard with one click
- **Track progress** through conversation stages

## 🎯 How It Works

```
Upload Audio File
      ↓
Audio Plays in Browser
      ↓
Web Audio API Extracts Chunks (every 2 seconds)
      ↓
Each Chunk Sent to /api/transcribe-chunk
      ↓
STT Service Transcribes Chunk (Deepgram/Whisper)
      ↓
Transcript Appears in Real-time
      ↓
Conversation Stages Progress
      ↓
AI Copilot Shows Guidance Paths
      ↓
Agent Follows Suggestions
```

The system processes **real audio** from your uploaded file, not mock data. This accurately simulates a live call scenario.

## 🎨 Features in Action

### Audio Player
- ▶️ Play / Pause
- 🔄 Restart
- 📊 Progress bar with seek
- ⏱️ Time display

### Live Transcript
- 👤 Speaker diarization (Agent/Customer)
- ✅ Confidence scores
- 🕒 Timestamps
- 📜 Auto-scrolling

### Conversation Navigator
- 5 conversation stages (Greeting → Closing)
- Multiple path options per stage
- 📊 Success probability indicators
- 💡 Recommended paths highlighted
- 📝 Suggested scripts
- ⚡ Quick actions

## 🐛 Troubleshooting

### "Audio won't play"
- Check file format (must be MP3, WAV, M4A, or OGG)
- Try a different audio file
- Check browser console for errors

### "No transcripts appearing"
- Ensure you have a valid API key (Deepgram or OpenAI) in your `.env` file
- Check browser console for errors
- Ensure `/api/transcribe-chunk` endpoint is accessible
- Check Network tab to see if chunks are being sent

### "Build errors"
```bash
# Clear cache and reinstall
rm -rf node_modules .react-router
pnpm install
pnpm dev
```

## 📁 Sample Files

For testing, you can use:
- Any MP3/WAV/M4A audio recording of a conversation
- MP4/WebM video files (audio will be extracted)
- Phone call recordings
- Podcast clips
- YouTube videos (downloaded as MP4)
- Screen recordings with audio

The system will transcribe the **actual audio content** from your file using STT.

**Note**: For MP4/video files, only the audio track is processed for transcription.

## 🚀 Next Steps

Once you're comfortable with the demo:
1. Add real STT API key for accurate transcription
2. Customize conversation stages and paths
3. Integrate with Palace MCP server for live actions
4. Connect to Twilio for real-time calls
5. Add analytics and conversation insights

## 💡 Tips

- **Use Deepgram free tier** - 45,000 minutes/year is plenty for development
- **Upload a 30-60 second audio clip** for best demo experience
- **Watch the conversation stages progress** as transcripts appear
- **Try different guidance paths** to see how the copilot adapts
- **Check browser console** to see chunk processing in real-time

## 📚 More Information

- Full documentation: [README.md](./README.md)
- Audio system guide: [AUDIO_SIMULATION.md](./AUDIO_SIMULATION.md)
- Component architecture: [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)

---

Built with ❤️ for the CDMX Buildathon
