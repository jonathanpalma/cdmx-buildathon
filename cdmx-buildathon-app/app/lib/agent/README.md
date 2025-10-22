# OneVoice AI Agent

Minimalistic LangGraph-based AI agent for real-time call center guidance.

## Architecture

```
Transcript Update → Agent Workflow → AI Suggestions
                         ↓
    ┌────────────────────┴────────────────────┐
    │                                         │
    ├─ 1. Analyze Intent                     │
    │    - Extract customer info              │
    │    - Detect intents                     │
    │                                         │
    ├─ 2. Check Stage Transition             │
    │    - Decide if conversation progresses  │
    │                                         │
    ├─ 3. Generate Actions                   │
    │    - Create prioritized suggestions     │
    │                                         │
    └─ 4. Calculate Health Score             │
         - Assess conversation quality        │
                                              │
                         ↓                    │
              Updated Agent State ────────────┘
```

## Files

- **`state.ts`** - Agent state types and initial values
- **`prompts.ts`** - AI prompts for each workflow step
- **`workflow.server.ts`** - LangGraph workflow definition
- **`index.ts`** - Module exports

## Usage

```typescript
import { executeAgent } from "~/lib/agent"

const updatedState = await executeAgent(currentState, newMessage)
```

## Model Choice

**Current:** Claude 3.5 Haiku
- **Speed:** ~300-400ms latency
- **Cost:** ~$0.02 per conversation
- **Quality:** Excellent for structured tasks

**Alternative:** Claude 3.5 Sonnet (change 1 line in workflow.server.ts)
- Better quality, slower (~800ms), 4x more expensive

## API Endpoint

**POST `/api/agent`**

Request:
```json
{
  "message": {
    "speaker": "customer",
    "text": "I'm looking to book a family vacation",
    "timestamp": 10.5
  },
  "currentState": { ... }
}
```

Response:
```json
{
  "success": true,
  "state": {
    "nextActions": [ ... ],
    "currentStage": "Needs Assessment",
    "healthScore": 82,
    "customerProfile": { ... }
  }
}
```

## Environment Variables

Requires `ANTHROPIC_API_KEY` in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Estimation

Per conversation (20 agent calls):
- Haiku: ~$0.02
- Sonnet: ~$0.08

For 100 agents × 50 calls/day:
- Haiku: ~$100/day
- Sonnet: ~$400/day
