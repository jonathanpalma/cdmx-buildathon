# Log Viewer Guide - Understanding Agent Flow

## How to View Logs

### Browser Console
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Filter by log level or emoji prefix

### Log Format

All logs follow this structure:
```
[Emoji] LOG_TYPE | { structured data }
```

Example:
```
🤖 AGENT_GENERATION_START | { messageCount: 5, currentStage: "Discovery", lastMessage: "I want to book for July..." }
```

## Log Types & Emojis

### 🎬 Conversation Flow
- `TRANSCRIPT` - New message received
- `AGENT_ANALYSIS_START` - Starting to analyze conversation
- `AGENT_GENERATION_START` - Generating actions/insights

### 🤖 Agent Thinking
- `AGENT_RAW_RESPONSE` - What Claude generated (before filtering)
- `🔍 ACTION_FILTERING` - Which actions kept/suppressed and why
- `💡 INSIGHTS_GENERATED` - Quality of insights produced
- `⚡ AUTO_EXEC_CANDIDATES` - Actions eligible for auto-execution

### 📊 UI Updates
- `UI_UPDATE_DECISION` - Whether/why UI will update
- `📌 KEEPING_CURRENT_UI` - Why current UI staying visible

### ⚡ Auto-Execution
- `AUTO_EXEC_DETECTED` - High-confidence action found
- `⏱️ AUTO_EXEC_COUNTDOWN` - Countdown ticking (3...2...1)
- `✅ AUTO_EXEC_TRIGGERED` - Countdown completed, executing
- `🛑 AUTO_EXEC_CANCELLED` - User cancelled auto-exec

### 👆 User Actions
- `USER_ACTION` - User clicked/cancelled/copied
- `📋 SCRIPT_COPIED` - Script successfully copied
- `❌ SCRIPT_COPY_FAILED` - Clipboard error

### 🚀 MCP Execution
- `MCP_EXEC_START` - Starting tool execution
- `✅ MCP_EXEC_COMPLETE` - Tool succeeded
- `❌ MCP_EXEC_FAILED` - Tool failed

## Reading a Conversation Flow

### Example: Successful Auto-Execution

```
[10:05:32] TRANSCRIPT
{
  speaker: "customer",
  text: "I want to book for July 15-20",
  messageCount: 5,
  triggerReason: "speaker_change"
}

[10:05:32] 🤖 AGENT_GENERATION_START
{
  messageCount: 5,
  currentStage: "Discovery",
  lastMessage: "I want to book for July 15-20",
  hasExistingActions: 0,
  detectedIntents: []
}

[10:05:33] 📥 AGENT_RAW_RESPONSE
{
  executableActions: 1,
  quickScripts: 0,
  backgroundTasks: 0,
  insights: {
    hasEmotion: false,
    hasConcerns: 0,
    hasMissingInfo: 1,
    healthScore: 75
  },
  processingTime: "1250ms"
}

[10:05:33] 🔍 ACTION_FILTERING
{
  raw: [
    {
      label: "Check Availability",
      confidence: 96,
      toolName: "palace:checkAvailability",
      status: "kept"
    }
  ],
  kept: 1,
  suppressed: 0,
  suppressReasons: { low_confidence: 0 }
}

[10:05:33] ⚡ AUTO_EXEC_CANDIDATES
{
  count: 1,
  actions: [
    {
      id: "exec-123",
      label: "Check Availability",
      confidence: 96,
      toolName: "palace:checkAvailability",
      riskLevel: "low"
    }
  ]
}

[10:05:33] 💡 INSIGHTS_GENERATED
{
  meaningful: true,
  concerns: 0,
  missingInfo: 1,
  emotion: null,
  healthAlert: null
}

[10:05:33] 📊 UI_UPDATE_DECISION
{
  willUpdate: true,
  reason: "new_suggestions",
  before: { actions: 0, stage: "Initial", hasInsights: false },
  after: {
    actions: 1,
    stage: "Discovery",
    hasInsights: true,
    topAction: { label: "Check Availability", confidence: 96 }
  }
}

[10:05:33] ⚡ AUTO_EXEC_DETECTED
{
  actionId: "exec-123",
  label: "Check Availability",
  confidence: 96,
  toolName: "palace:checkAvailability",
  requiresConfirmation: false,
  riskLevel: "low",
  countdownSeconds: 3,
  canCancel: true
}

[10:05:34] ⏱️ AUTO_EXEC_COUNTDOWN { remaining: 2 }
[10:05:35] ⏱️ AUTO_EXEC_COUNTDOWN { remaining: 1 }

[10:05:36] ✅ AUTO_EXEC_TRIGGERED
{
  actionId: "exec-123",
  label: "Check Availability"
}

[10:05:36] 🚀 MCP_EXEC_START
{
  actionId: "exec-123",
  label: "Check Availability",
  toolName: "palace:checkAvailability",
  parameters: {
    checkIn: "2025-07-15",
    checkOut: "2025-07-20",
    adults: 2
  },
  confidence: 96,
  triggeredBy: "auto_exec"
}

[10:05:37] ✅ MCP_EXEC_COMPLETE
{
  actionId: "exec-123",
  label: "Check Availability",
  toolName: "palace:checkAvailability",
  success: true,
  summary: "Found 5 available rooms",
  duration: "850ms",
  dataKeys: ["available", "rooms", "property"]
}
```

### Example: User Cancelled Auto-Execution

```
[10:05:33] ⚡ AUTO_EXEC_DETECTED
{
  actionId: "exec-456",
  label: "Send Quote Email",
  confidence: 92,
  ...
}

[10:05:34] ⏱️ AUTO_EXEC_COUNTDOWN { remaining: 2 }

[10:05:35] 👆 USER_ACTION
{
  type: "action_cancel",
  actionId: "exec-456",
  actionLabel: "Send Quote Email",
  wasAutoExecuting: true
}

[10:05:35] 🛑 AUTO_EXEC_CANCELLED
{
  reason: "user_cancel",
  actionId: "exec-456"
}
```

### Example: Low Confidence Suppression

```
[10:05:33] 📥 AGENT_RAW_RESPONSE
{
  executableActions: 2,
  ...
}

[10:05:33] 🔍 ACTION_FILTERING
{
  raw: [
    {
      label: "Check Availability",
      confidence: 96,
      status: "kept"
    },
    {
      label: "Generic Welcome",
      confidence: 65,
      status: "suppressed"
    }
  ],
  kept: 1,
  suppressed: 1,
  suppressReasons: {
    low_confidence: 1
  }
}
```

## Troubleshooting with Logs

### Problem: Actions Not Showing

Look for:
1. `ACTION_FILTERING` - Are actions being suppressed?
2. `UI_UPDATE_DECISION` - Is UI choosing not to update?
3. `KEEPING_CURRENT_UI` - Are old actions staying visible?

**Example Finding:**
```
🔍 ACTION_FILTERING | { kept: 0, suppressed: 1, suppressReasons: { low_confidence: 1 } }
```
→ **Solution**: Agent not confident enough. Check if customer provided enough info.

### Problem: Auto-Execution Not Triggering

Look for:
1. `AUTO_EXEC_CANDIDATES` - Is action eligible?
2. `AUTO_EXEC_DETECTED` - Was countdown started?
3. `AUTO_EXEC_CANCELLED` - Was it cancelled?

**Example Finding:**
```
🔍 ACTION_FILTERING | { actions: [{ confidence: 92, requiresConfirmation: true }] }
```
→ **Solution**: Confidence too low (needs 95%+) or risk level too high.

### Problem: MCP Execution Failed

Look for:
1. `MCP_EXEC_START` - What parameters were sent?
2. `MCP_EXEC_FAILED` - What was the error?

**Example Finding:**
```
❌ MCP_EXEC_FAILED | {
  toolName: "palace:checkAvailability",
  error: "Missing required parameter: checkIn",
  duration: "50ms"
}
```
→ **Solution**: Parameter extraction failed. Check customer profile state.

### Problem: Request Getting Cancelled

Look for:
1. `AGENT_ANALYSIS_START` - How many started?
2. `AGENT_RAW_RESPONSE` - How many completed?
3. Time gaps between start/response

**Example Finding:**
```
[10:05:32] 🤖 AGENT_ANALYSIS_START
[10:05:33] 🤖 AGENT_ANALYSIS_START  ← Started again before first completed
```
→ **Solution**: Messages arriving too quickly. First request likely cancelled.

## Performance Analysis

### Agent Response Time
Look for `processingTime` in `AGENT_RAW_RESPONSE`:
- Good: < 1500ms
- Acceptable: 1500-2500ms
- Slow: > 2500ms

### MCP Execution Time
Look for `duration` in `MCP_EXEC_COMPLETE`:
- Fast: < 500ms
- Normal: 500-1500ms
- Slow: > 1500ms

### UI Update Latency
Calculate time between:
- `TRANSCRIPT` → `UI_UPDATE_DECISION`
- Should be < 2000ms total

## Common Patterns

### ✅ Healthy Flow
```
TRANSCRIPT → AGENT_START → AGENT_RESPONSE (quick) →
ACTION_FILTERING (kept 1-2) → UI_UPDATE (new_suggestions) →
AUTO_EXEC_DETECTED → MCP_EXEC → SUCCESS
```

### ⚠️ Warning Signs
```
AGENT_START → AGENT_START → AGENT_START (multiple rapid starts)
ACTION_FILTERING (suppressed all)
MCP_EXEC_FAILED (repeated failures)
UI_UPDATE (reason: stage_changed) (frequent stage changes)
```

### 🚨 Problem Patterns
```
TRANSCRIPT → [silence] (no AGENT_START = bug)
AGENT_START → [timeout] (no AGENT_RESPONSE = API issue)
AUTO_EXEC → CANCELLED → AUTO_EXEC → CANCELLED (confusing user)
MCP_EXEC_FAILED → MCP_EXEC_FAILED (same error = config issue)
```

## Log Filtering Tips

### Chrome DevTools Filters

**Show only agent decisions:**
```
/🤖|🔍|💡|📊/
```

**Show only user interactions:**
```
/👆|⚡|🛑/
```

**Show only MCP execution:**
```
/🚀|✅ MCP|❌ MCP/
```

**Show only errors:**
```
/❌|ERROR|FAILED/
```

**Performance tracking:**
```
/duration|processingTime/
```

## Next Steps

With these logs, you can now:
1. **Debug issues** - Trace exact flow to find where things break
2. **Optimize performance** - Identify slow steps
3. **Improve accuracy** - See when/why actions suppressed
4. **Validate UX** - Confirm users engaging with suggestions
5. **Track metrics** - Analyze success rates over time
