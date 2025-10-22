# CloseLoop - AI Call Center Copilot

AI-powered copilot that supports call center agents during live conversations, built for the CDMX Buildathon.

## 🎯 Problem

Call centers lose sales opportunities because:
- Customers hang up before booking due to long handling times
- Agents juggle manual processes instead of focusing on persuasion
- Weak or missing follow-ups cause hot leads to go cold

## 🚀 Solution

**CloseLoop** provides real-time support for call center agents with:

1. **🎧 Real-Time Intelligence** - Live transcription, intent detection, and drop-off risk analysis
2. **💡 Smart Guidance** - Persuasive suggestions and upsell opportunities
3. **⚡ Instant Actions** - Check availability, generate quotes, create reservations on the spot
4. **🔁 Always-On Follow-Up** - 3-step automated recovery sequence

## 📦 What's Included

### Components

#### 1. Conversation Navigator
Interactive conversation flow guidance with stage tracking and recommended paths.

- **Location**: `app/components/conversation/`
- **Demo**: http://localhost:5173/conversation-demo
- **Docs**: [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)

#### 2. Audio Simulation System
Upload audio samples and simulate real-time transcription with AI guidance.

- **Location**: `app/components/audio/`
- **Demo**: http://localhost:5173/audio-demo
- **Docs**: [AUDIO_SIMULATION.md](./AUDIO_SIMULATION.md)

### Features

✅ **Drag-and-drop upload** (MP3, WAV, M4A, MP4, WebM)
✅ **Real-time transcription** using official `@deepgram/sdk` or OpenAI Whisper
✅ **Stereo audio support** with multichannel processing
✅ **Speaker diarization** (Agent vs. Customer) with ML-based accuracy
✅ **Live conversation guidance** based on dialogue
✅ **Stage progression tracking**
✅ **Suggested scripts** with copy-to-clipboard
✅ **Real audio chunk extraction** simulating live calls

## 🚀 Quick Start

### 1. Install

```bash
pnpm install
```

### 2. Configure (Optional)

For real transcription, add an API key:

```bash
cp .env.example .env
```

Edit `.env` and add **ONE** of:
- `DEEPGRAM_API_KEY` (recommended, free tier available)
- `OPENAI_API_KEY` (for Whisper API)

**Or skip this step** - the app works in mock mode without API keys!

### 3. Run

```bash
pnpm dev
```

Visit: http://localhost:5173

The single unified demo allows you to:
1. Upload an audio file
2. Watch it play with real-time transcription via STT
3. See the conversation copilot provide guidance as the conversation progresses

## 📚 Documentation

- **[AUDIO_SIMULATION.md](./AUDIO_SIMULATION.md)** - Complete audio system guide
- **[COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)** - Component architecture
- **[Palace API Reference](../PALACE_API_REFERENCE.md)** - MCP Server API docs

## 🏗️ Project Structure

```
app/
├── components/
│   ├── ui/                    # Base UI components (shadcn-style)
│   │   ├── accordion.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── conversation/          # Conversation navigator
│   │   ├── conversation-navigator.tsx
│   │   ├── conversation-stage.tsx
│   │   ├── conversation-path.tsx
│   │   ├── path-header.tsx
│   │   ├── path-steps.tsx
│   │   ├── path-script.tsx
│   │   ├── path-actions.tsx
│   │   └── types.ts
│   └── audio/                 # Audio simulation system
│       ├── audio-upload.tsx
│       ├── audio-playback-simulator.tsx
│       └── live-transcript.tsx
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── audio-utils.ts        # Audio processing
│   └── stt-service.server.ts # Speech-to-text integration
├── routes/
│   ├── _index.tsx            # Home page
│   ├── conversation-demo.tsx # Conversation navigator demo
│   ├── audio-demo.tsx        # Audio simulation demo
│   └── api.transcribe-stream.ts # SSE endpoint
└── routes.ts                 # Route configuration
```

## 🎨 Tech Stack

- **Framework**: Remix (React Router v7)
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom (shadcn-style)
- **Icons**: Lucide React
- **Audio**: Web Audio API
- **Streaming**: Server-Sent Events (SSE)
- **STT**: Deepgram or OpenAI Whisper

## 🎥 Demo

### Unified Call Center Copilot Demo
**URL**: `/` (home page)

Complete end-to-end simulation:
1. **Upload**: Drag-and-drop audio/video file (MP3, WAV, M4A, MP4, WebM)
2. **Play**: Audio playback with full controls
3. **Transcribe**: Real-time transcript via STT (Deepgram/Whisper)
4. **Guide**: Conversation stages progress automatically
5. **Assist**: AI-powered guidance paths appear based on dialogue
6. **Act**: Follow recommended scripts and actions

## 🔌 API Integration

### Palace MCP Server

Located in: `../office-hours-buildathon/`

The Python MCP server provides:
- Hotel property management
- Reservation handling
- Availability checking
- Dynamic pricing
- Quote generation

**Docs**: [PALACE_API_REFERENCE.md](../PALACE_API_REFERENCE.md)

### STT Providers

**Deepgram** (Recommended)
- Free tier: 45,000 minutes/year
- Real-time streaming support
- High accuracy
- https://deepgram.com

**OpenAI Whisper**
- Pay-as-you-go
- Excellent accuracy
- No streaming (batch only)
- https://platform.openai.com

## 🧪 Testing

### Mock Mode (No API Keys)
```bash
NODE_ENV=development pnpm dev
```
Uses pre-written sample transcripts.

### With Real Transcription
```bash
DEEPGRAM_API_KEY=your_key pnpm dev
```

## 📋 Environment Variables

See `.env.example` for all available options:

```env
# Required for real transcription (choose one)
DEEPGRAM_API_KEY=           # Recommended
OPENAI_API_KEY=             # Alternative

# Optional
NODE_ENV=development        # For mock mode
```

## 🚀 Deployment

### Vercel Deployment

**Frontend (This app):**
```bash
pnpm build
vercel deploy
```

**Note**: For WebSocket features, see [AUDIO_SIMULATION.md](./AUDIO_SIMULATION.md#deployment) for recommended architecture.

### Railway/Fly.io Deployment

Better suited for real-time features:
1. Push to Git repository
2. Connect to Railway/Fly.io
3. Add environment variables
4. Deploy!

## 🛠️ Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm typecheck    # Run TypeScript checks
```

### Adding New Features

1. **New Route**: Add to `app/routes/` and update `app/routes.ts`
2. **New Component**: Add to appropriate `app/components/` subfolder
3. **New Utility**: Add to `app/lib/`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit PR

## 📄 License

Office Hours Buildathon

## 🙋 Support

- **Documentation**: See markdown files in this directory
- **Issues**: Check browser console for errors
- **API Keys**: See `.env.example` for setup

## 🎯 Next Steps

- [ ] Connect to real Twilio Media Streams
- [ ] Implement conversation memory/context
- [ ] Add sentiment analysis
- [ ] Integrate with Palace MCP server
- [ ] Add analytics dashboard
- [ ] Export transcripts and call summaries

---

Built with ❤️ for the CDMX Buildathon
