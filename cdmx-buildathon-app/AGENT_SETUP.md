# AI Agent Setup Guide

## Overview

OneVoice now uses a **LangGraph-based AI agent** powered by **Claude 3.5 Haiku** for real-time conversation analysis and intelligent suggestions.

## What Changed

### Before (Static)
- Hardcoded conversation stages (message count based)
- Static suggestions for each stage
- Simple health calculation

### After (AI Agent)
- ✅ Dynamic stage detection based on conversation content
- ✅ Context-aware suggestions generated in real-time
- ✅ Automatic customer profile extraction (dates, party size, budget)
- ✅ Intent detection (asking about dates, price objections, etc.)
- ✅ AI-powered conversation health scoring

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Plays Audio                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Deepgram STT (Speaker Diarization)             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Transcript Display)              │
│                                                             │
│  For each new message → POST /api/agent                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph Agent Workflow                 │
│                                                             │
│  1. Analyze Intent          → Extract info, detect intents │
│  2. Check Stage Transition  → Smart stage progression      │
│  3. Generate Actions        → Context-aware suggestions    │
│  4. Calculate Health        → AI-powered quality score     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             Updated Copilot UI (Dynamic Suggestions)        │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
app/
├── lib/
│   └── agent/
│       ├── state.ts           # Agent state types
│       ├── prompts.ts         # AI prompts for each workflow step
│       ├── workflow.server.ts # LangGraph workflow (4 nodes)
│       ├── index.ts          # Exports
│       └── README.md         # Agent documentation
│
├── routes/
│   ├── _index.tsx            # Main UI (integrated with agent)
│   └── api.agent.ts          # Agent API endpoint
│
└── components/
    └── copilot/
        └── agent-copilot.tsx # Copilot UI component
```

## Environment Setup

### Required Environment Variable

Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com/

### Verify Setup

```bash
# Check if API key is configured
grep "ANTHROPIC_API_KEY" .env

# Should output: ANTHROPIC_API_KEY=sk-ant-...
```

## How to Test

1. **Start the dev server:**
   ```bash
   pnpm run dev
   ```

2. **Upload your Palace audio file** (stereo with agent on left, customer on right)

3. **Observe the AI agent in action:**
   - Watch the **Live Transcript** fill with real-time STT
   - Watch the **AI Copilot** update with dynamic suggestions
   - Notice how **stage progression** is intelligent (not just message count)
   - See **customer profile** being extracted automatically
   - Monitor **health score** adjusting based on conversation quality

## Agent Behavior Examples

### Example 1: Date Detection
```
Customer: "We're looking to travel in December"
↓
Agent detects:
  - Intent: asking_about_dates
  - Extracted: travelDates.checkIn = "December"
  - Stage: Progress to "Needs Assessment"
  - Actions:
    1. "Confirm specific dates" (critical, 98%)
    2. "Ask about party size" (recommended, 92%)
```

### Example 2: Price Objection
```
Customer: "That's more expensive than I expected"
↓
Agent detects:
  - Intent: price_objection
  - Health score: Drops from 85 → 72
  - Actions:
    1. "Break down all-inclusive value" (critical, 95%)
    2. "Mention payment plan options" (recommended, 89%)
    3. "Compare to alternative vacation costs" (recommended, 85%)
```

### Example 3: Buying Signal
```
Customer: "Okay, let's book it!"
↓
Agent detects:
  - Intent: ready_to_book
  - Stage: Progress to "Closing & Follow-up"
  - Health score: Increases to 95
  - Actions:
    1. "Process reservation" (critical, 99%)
    2. "Send confirmation email" (critical, 97%)
```

## Model Choice: Claude 3.5 Haiku

**Why Haiku?**
- ⚡ **Speed**: 300-400ms latency (real-time feel)
- 💰 **Cost**: ~$0.02 per conversation
- 🎯 **Quality**: Excellent at structured JSON output
- 📊 **Reliability**: Consistent performance

**Upgrade to Sonnet (if needed):**
Edit `app/lib/agent/workflow.server.ts`, line 28:
```typescript
modelName: "claude-3-5-sonnet-20241022"
```

Trade-off: Better quality, 4x more expensive, ~800ms latency

## Cost Estimation

### Per Conversation
- **Average agent calls**: 20 (one per message)
- **Tokens per call**: ~2,000
- **Total tokens**: 40,000

**Cost:**
- Haiku: ~$0.02
- Sonnet: ~$0.08

### At Scale (100 agents × 50 calls/day)
- Haiku: ~$100/day
- Sonnet: ~$400/day

## Debugging

### Check Agent Logs
Look for these console logs:
```
[Agent] Executing workflow for new message: ...
[Agent] Analyzing intent...
[Agent] Checking stage transition...
[Agent] Generating actions...
[Agent] Calculating health score...
[Agent] Workflow complete. Stage: Needs Assessment
```

### Common Issues

**Issue:** Agent not responding
- Check: `ANTHROPIC_API_KEY` in `.env`
- Check: Network tab in browser DevTools for `/api/agent` calls
- Check: Console for error messages

**Issue:** Suggestions not updating
- Check: Agent state is being updated in React DevTools
- Check: `agentState.nextActions` has values
- Check: No errors in API response

**Issue:** Slow responses (>2s)
- Consider switching to Haiku if using Sonnet
- Check internet connection
- Verify Anthropic API status

## What's Next?

### Potential Enhancements
1. **Add tools** - Let agent check availability via Palace MCP
2. **Streaming responses** - Show agent thinking in real-time
3. **Semantic caching** - Reduce cost by 50% (cache common patterns)
4. **A/B testing** - Test different prompts and measure outcomes
5. **Analytics** - Track agent accuracy and acceptance rates

## Questions?

See `app/lib/agent/README.md` for technical details.
