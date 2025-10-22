# Logging Strategy - Agent Copilot Flow Analysis

## Purpose

Create insightful, structured logs that tell the story of:
1. What the agent is thinking
2. What decisions it's making
3. Why suggestions are shown or suppressed
4. What errors occur and why
5. How the user responds to suggestions

## Log Structure

Each log entry should answer:
- **WHAT** happened (action/decision)
- **WHY** it happened (context/reasoning)
- **RESULT** what came out
- **IMPACT** what changed in UI/state

## Key Logging Points

### 1. Transcript Processing
```typescript
logger.info("TRANSCRIPT", {
  speaker: "agent" | "customer",
  text: "first 50 chars...",
  messageCount: 5,
  triggerReason: "speaker_change" | "silence_detected" | "max_wait",
  timeSinceLastAgent: "2500ms"
})
```

### 2. Agent Analysis Started
```typescript
logger.info("AGENT_ANALYSIS_START", {
  messageCount: 5,
  lastSpeaker: "customer",
  lastMessage: "I want to book for July...",
  currentStage: "Discovery",
  hasExistingActions: false
})
```

### 3. Agent Response Received
```typescript
logger.info("AGENT_RESPONSE", {
  executableActions: 2,
  quickScripts: 1,
  insights: {
    hasEmotion: true,
    hasConcerns: false,
    hasMissingInfo: true,
    healthScore: 75
  },
  intentsDetected: ["check_availability", "price_inquiry"],
  processingTime: "1250ms"
})
```

### 4. Confidence Filtering
```typescript
logger.info("ACTION_FILTERING", {
  raw: [
    { label: "Check Availability", confidence: 96, status: "kept" },
    { label: "Generic Welcome", confidence: 65, status: "suppressed_low_confidence" }
  ],
  kept: 1,
  suppressed: 1,
  suppressReasons: {
    low_confidence: 1,
    missing_params: 0,
    early_conversation: 0
  }
})
```

### 5. UI Update Decision
```typescript
logger.info("UI_UPDATE", {
  decision: "show_new_actions" | "keep_visible" | "insights_only" | "skip",
  reason: "stage_changed" | "new_high_confidence" | "no_current" | "already_showing",
  before: {
    actions: 1,
    insights: true
  },
  after: {
    actions: 2,
    insights: true
  },
  userVisible: true
})
```

### 6. Auto-Execution Detection
```typescript
logger.info("AUTO_EXEC_DETECTED", {
  actionId: "exec-123",
  label: "Check Availability",
  confidence: 96,
  requiresConfirmation: false,
  riskLevel: "low",
  countdownSeconds: 3,
  canCancel: true
})
```

### 7. MCP Tool Execution
```typescript
logger.info("MCP_EXEC_START", {
  actionId: "exec-123",
  toolName: "palace:checkAvailability",
  parameters: {
    checkIn: "2025-07-15",
    checkOut: "2025-07-20",
    adults: 2
  },
  triggeredBy: "auto_exec" | "manual_click" | "confirmation"
})
```

### 8. MCP Tool Result
```typescript
logger.info("MCP_EXEC_COMPLETE", {
  actionId: "exec-123",
  toolName: "palace:checkAvailability",
  success: true,
  summary: "Found 5 available rooms",
  duration: "850ms",
  nextActions: ["show_rooms", "generate_quote"]
})
```

### 9. User Interactions
```typescript
logger.info("USER_ACTION", {
  type: "action_click" | "action_cancel" | "script_copy" | "refresh",
  actionId: "exec-123",
  actionLabel: "Check Availability",
  timeSinceShown: "5000ms",
  confidence: 96
})
```

### 10. Errors
```typescript
logger.error("AGENT_ERROR", {
  phase: "analysis" | "mcp_exec" | "state_update",
  error: "Failed to parse JSON",
  context: {
    messageCount: 5,
    currentStage: "Discovery",
    lastAction: "check_availability"
  },
  recoverable: true,
  fallback: "showing_cached_state"
})
```

## Log Aggregation Views

### Conversation Flow View
```
[10:05:32] TRANSCRIPT         | customer: "I want to book July"
[10:05:32] AGENT_ANALYSIS_START | msgs=3, stage=Initial, existing=none
[10:05:33] AGENT_RESPONSE     | ✓ 1 action (96%), 0 scripts, intents=[booking]
[10:05:33] ACTION_FILTERING   | kept=1, suppressed=0
[10:05:33] AUTO_EXEC_DETECTED | "Check Availability" in 3s
[10:05:36] MCP_EXEC_START     | palace:checkAvailability
[10:05:37] MCP_EXEC_COMPLETE  | ✓ "Found 5 rooms" (850ms)
[10:05:37] UI_UPDATE          | show_results
```

### Decision Trail View
```
Why did we show "Check Availability" action?
├─ [TRANSCRIPT] Customer said "I want to book July"
├─ [AGENT_RESPONSE] Detected intent: booking, confidence: 96%
├─ [ACTION_FILTERING] Kept (above 70% threshold)
├─ [UI_UPDATE] Shown (no existing actions, high confidence)
└─ [AUTO_EXEC] Started 3s countdown (95%+ confidence, low risk)
```

### Performance View
```
Agent Call Times (last 10):
├─ avg: 1250ms
├─ p95: 1800ms
├─ p99: 2300ms
└─ failures: 2/10 (cancelled)

MCP Tool Times:
├─ checkAvailability: avg 850ms
├─ calculateQuote: avg 1200ms
└─ sendEmail: avg 600ms
```

### User Engagement View
```
Actions Suggested: 15
├─ Auto-executed: 5 (33%)
├─ Manually executed: 7 (47%)
├─ Cancelled: 2 (13%)
└─ Ignored: 1 (7%)

Scripts Suggested: 8
├─ Copied: 6 (75%)
└─ Ignored: 2 (25%)
```

## Implementation Plan

### Phase 1: Core Flow Logging (Now)
- [x] Transcript processing
- [x] Agent analysis start/complete
- [x] Response parsing
- [ ] Confidence filtering details
- [ ] UI update decisions

### Phase 2: Execution Logging
- [ ] Auto-execution flow
- [ ] MCP tool execution
- [ ] Results and state updates
- [ ] Error tracking

### Phase 3: Analytics
- [ ] User interaction tracking
- [ ] Performance metrics
- [ ] Success/failure rates
- [ ] Suggestion relevance

### Phase 4: Debug Tools
- [ ] Real-time log viewer
- [ ] Conversation replay
- [ ] Decision tree visualization
- [ ] Performance dashboard
