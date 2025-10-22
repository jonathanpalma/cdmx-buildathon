# Operation Context & Action History

## Overview

This feature introduces two powerful capabilities:

1. **Operation Context** - Different UI layouts and available tools based on call type (booking vs. sales vs. support)
2. **Action History** - A stacked, persistent timeline of all suggested/executed/dismissed actions

## Problem It Solves

### Before: One-Size-Fits-All

- Same UI regardless of call type (booking, sales, support)
- Actions appeared and disappeared - no history
- No feedback when actions dismissed or became irrelevant
- Agent couldn't review what was suggested earlier
- No visual confirmation of what was executed

### After: Context-Aware with Full History

- **Adaptive UI**: Booking calls show booking details, support calls show ticket info
- **Persistent Timeline**: All actions stay visible in chronological order
- **Status Tracking**: See if action was suggested, confirmed, executing, completed, failed, dismissed, or outdated
- **Full Context**: Review conversation flow through action history
- **User Control**: Confirm or dismiss suggestions explicitly

## 1. Operation Context

### Concept

Different types of calls require different information and tools. The operation context determines:
- Which UI sections are visible
- Which MCP tools are available
- What information to track

### Supported Contexts

```typescript
type OperationContext = "booking" | "sales" | "support" | "general"
```

### Configuration

**Booking Context** (Hotel reservations):
```typescript
{
  type: "booking",
  label: "Booking",
  icon: "🏨",
  sections: {
    bookingDetails: true,      // Show booking context panel
    customerHistory: false,
  },
  availableTools: [
    "palace:checkAvailability",
    "palace:calculateQuote",
    "palace:searchProperties"
  ]
}
```

**Sales Context** (Lead generation, proposals):
```typescript
{
  type: "sales",
  label: "Sales",
  icon: "💼",
  sections: {
    salesOpportunity: true,     // Show deal/opportunity panel
    customerHistory: true,
  },
  availableTools: [
    "crm:createLead",
    "crm:updateOpportunity",
    "email:sendProposal"
  ]
}
```

**Support Context** (Issue resolution):
```typescript
{
  type: "support",
  label: "Support",
  icon: "🎧",
  sections: {
    supportTicket: true,        // Show ticket details panel
    customerHistory: true,
  },
  availableTools: [
    "ticket:create",
    "ticket:update",
    "kb:search"
  ]
}
```

### UI Adaptation

**Booking Call:**
```
┌─ Copilot ────────────────────┐
│ 🏨 Booking Context           │ ← Booking-specific
│ ┌─ Booking Details ─────┐   │
│ │ 📅 Jul 15 → 20        │   │
│ │ 👥 2 adults           │   │
│ └───────────────────────┘   │
│                              │
│ Action History               │
│ Suggested Actions            │
│ Insights                     │
└──────────────────────────────┘
```

**Support Call:**
```
┌─ Copilot ────────────────────┐
│ 🎧 Support Context           │ ← Support-specific
│ ┌─ Ticket Details ──────┐   │
│ │ Issue: Login problem  │   │
│ │ Priority: High        │   │
│ │ Customer: John Smith  │   │
│ └───────────────────────┘   │
│                              │
│ Action History               │
│ Suggested Actions            │
│ Customer History             │
└──────────────────────────────┘
```

## 2. Action History

### Concept

Every action suggested by the AI agent is tracked through its entire lifecycle:
- **Suggested** → User sees it, can confirm/dismiss
- **Confirmed** → User approved, waiting to execute
- **Executing** → Currently running
- **Completed** → Successfully finished with results
- **Failed** → Error occurred
- **Dismissed** → User rejected
- **Invalidated** → Conversation moved past this, no longer relevant

### Visual Timeline

```
┌─ Actions ──────────────────────────────────┐ 2 active │
│                                                       │
├───────────────────────────────────────────────────────┤
│ 🟠 Check Availability          [Suggested] 96%       │
│    Search for rooms matching customer dates          │
│    10:32 AM                                           │
│    [Confirm] [Dismiss]                                │
├───────────────────────────────────────────────────────┤
│ ⏳ Calculate Quote             [Executing]  92%       │
│    Generate pricing estimate                          │
│    10:31 AM • 5s                                      │
│    [Cancel]                                           │
├───────────────────────────────────────────────────────┤
│ ✅ Search Properties          [Completed]  89%        │
│    Find properties matching preferences               │
│    10:29 AM • 2s • Auto-executed                      │
│    ✓ Found 12 matching properties                    │
├───────────────────────────────────────────────────────┤
│ 🚫 Send Welcome Email         [Dismissed]  85%        │
│    10:28 AM • 1s • User dismissed                     │
│    Agent already sent greeting                        │
├───────────────────────────────────────────────────────┤
│ ⏰ Create Lead               [Outdated]   78%         │
│    10:25 AM                                           │
│    Conversation moved to booking phase                │
├───────────────────────────────────────────────────────┤
│                    Show 5 more actions                │
└───────────────────────────────────────────────────────┘
```

### Action States

| Status | Icon | Color | Meaning | User Actions |
|--------|------|-------|---------|--------------|
| **Suggested** | 🟠 | Orange | AI proposed this | Confirm, Dismiss |
| **Confirmed** | 🔵 | Blue | User approved | Cancel |
| **Executing** | ⏳ | Blue | Running now | Cancel |
| **Completed** | ✅ | Green | Success | View results |
| **Failed** | ❌ | Red | Error occurred | Retry (if available) |
| **Dismissed** | 🚫 | Gray | User rejected | - |
| **Invalidated** | ⏰ | Light gray | No longer relevant | - |

### Lifecycle Flow

```
┌─ Action Suggested ─┐
│  confidence: 92%   │
└──────┬─────────────┘
       │
       ├──→ User Confirms ──→ [Confirmed] ──→ Execute ──→ [Executing]
       │                                                        │
       │                                                        ├──→ Success → [Completed]
       │                                                        └──→ Error → [Failed]
       │
       ├──→ User Dismisses ──→ [Dismissed]
       │
       ├──→ Auto-execute ──→ [Executing] ──→ ...
       │
       └──→ Conversation moves on ──→ [Invalidated]
```

### Benefits

**For Agents:**
1. **Full visibility**: See all suggestions made during call
2. **Review past decisions**: "Did I already check availability?"
3. **Track execution**: Know what's running vs. completed
4. **Understand dismissals**: See why actions were rejected
5. **Learn patterns**: Notice which suggestions are most useful

**For Debugging:**
1. **Complete audit trail**: Every action logged with timestamps
2. **User interaction tracking**: See what agents confirmed/dismissed
3. **Failure analysis**: Review what went wrong and when
4. **Performance metrics**: Calculate suggestion acceptance rates
5. **Conversation flow**: Visualize progression through actions

## Implementation

### State Management

**AgentState Extension:**
```typescript
export interface AgentState {
  // ... existing fields

  operationContext?: OperationContext  // NEW
  actionHistory: ActionHistoryEntry[]  // NEW

  executableActions: ExecutableAction[] // Active/suggested only
}
```

**Action with History Tracking:**
```typescript
export interface ExecutableAction {
  // ... existing fields

  status: "suggested" | "confirmed" | "executing" |
          "completed" | "failed" | "dismissed" | "invalidated"

  createdAt: number
  updatedAt?: number
  dismissedReason?: string
  invalidatedReason?: string
}
```

**History Entry:**
```typescript
export interface ActionHistoryEntry {
  action: ExecutableAction
  suggestedAt: number
  resolvedAt?: number
  userInteraction?: "confirmed" | "dismissed" | "auto_executed"
}
```

### Component Structure

```
app/components/copilot/
├── agent-copilot-v2.tsx      ← Main copilot (context-aware)
├── booking-context.tsx        ← Booking-specific panel
├── action-history.tsx         ← NEW: Action timeline
└── [future]
    ├── sales-opportunity.tsx  ← Sales-specific panel
    └── support-ticket.tsx     ← Support-specific panel
```

### Action Lifecycle Management

**When action suggested:**
```typescript
// Add to executableActions with "suggested" status
const newAction = {
  id: generateId(),
  label: "Check Availability",
  status: "suggested",
  createdAt: Date.now(),
  confidence: 92,
  // ... other fields
}

setAgentState(prev => ({
  ...prev,
  executableActions: [...prev.executableActions, newAction]
}))
```

**When user confirms:**
```typescript
handleActionConfirm(actionId) {
  setAgentState(prev => ({
    ...prev,
    executableActions: prev.executableActions.map(a =>
      a.id === actionId
        ? { ...a, status: "confirmed", updatedAt: Date.now() }
        : a
    )
  }))

  // Then execute the action
  executeAction(action)
}
```

**When user dismisses:**
```typescript
handleActionDismiss(actionId, reason) {
  const action = findAction(actionId)

  // Move to history
  setAgentState(prev => ({
    ...prev,
    executableActions: prev.executableActions.filter(a => a.id !== actionId),
    actionHistory: [
      ...prev.actionHistory,
      {
        action: {
          ...action,
          status: "dismissed",
          dismissedReason: reason,
          updatedAt: Date.now()
        },
        suggestedAt: action.createdAt,
        resolvedAt: Date.now(),
        userInteraction: "dismissed"
      }
    ]
  }))
}
```

**When action completes:**
```typescript
handleActionComplete(actionId, result) {
  const action = findAction(actionId)

  // Move to history
  setAgentState(prev => ({
    ...prev,
    executableActions: prev.executableActions.filter(a => a.id !== actionId),
    actionHistory: [
      ...prev.actionHistory,
      {
        action: {
          ...action,
          status: "completed",
          result: result.summary,
          updatedAt: Date.now()
        },
        suggestedAt: action.createdAt,
        resolvedAt: Date.now(),
        userInteraction: action.requiresConfirmation ? "confirmed" : "auto_executed"
      }
    ]
  }))
}
```

**When conversation invalidates action:**
```typescript
// Detect when stage changes and old actions no longer relevant
if (stageChanged && hasOldActions) {
  const outdatedActions = getActionsForOldStage()

  outdatedActions.forEach(action => {
    moveToHistory(action, {
      status: "invalidated",
      invalidatedReason: `Conversation moved to ${newStage}`
    })
  })
}
```

## Logging

### Operation Context
```javascript
📋 OPERATION_CONTEXT_SET {
  context: "booking",
  previousContext: "general",
  sectionsEnabled: ["bookingDetails"],
  toolsAvailable: ["palace:checkAvailability", "palace:calculateQuote"]
}
```

### Action Lifecycle
```javascript
📝 ACTION_SUGGESTED {
  actionId: "act-123",
  label: "Check Availability",
  confidence: 92,
  status: "suggested"
}

👆 ACTION_CONFIRMED {
  actionId: "act-123",
  label: "Check Availability",
  userDecision: "confirmed"
}

🚫 ACTION_DISMISSED {
  actionId: "act-124",
  label: "Send Welcome",
  userDecision: "dismissed",
  reason: "Already sent greeting",
  timeVisible: "5s"
}

⏰ ACTION_INVALIDATED {
  actionId: "act-125",
  label: "Create Lead",
  reason: "Stage changed from sales to booking",
  timeVisible: "45s"
}

✅ ACTION_COMPLETED {
  actionId: "act-123",
  label: "Check Availability",
  duration: "850ms",
  result: "Found 5 available rooms"
}
```

## Future Enhancements

### 1. Context Auto-Detection
```typescript
// Analyze conversation to automatically set context
if (intents.includes("booking_inquiry")) {
  setOperationContext("booking")
} else if (intents.includes("technical_issue")) {
  setOperationContext("support")
}
```

### 2. Action Suggestions Based on Context
```typescript
// Only suggest tools available in current context
const availableTools = OPERATION_CONTEXTS[context].availableTools
const filteredActions = actions.filter(a =>
  availableTools.includes(a.toolName)
)
```

### 3. Custom Context Panels
```typescript
// Allow custom panels per context
{
  sales: {
    sections: {
      opportunityTracker: true,
      competitorComparison: true,
      pricingCalculator: true
    }
  }
}
```

### 4. Action Analytics
```typescript
// Track metrics per action type
{
  "checkAvailability": {
    suggested: 45,
    confirmed: 38,
    dismissed: 5,
    autoExecuted: 30,
    failed: 2,
    avgConfidence: 91,
    avgExecutionTime: "1.2s"
  }
}
```

### 5. Smart Invalidation
```typescript
// AI determines when actions become irrelevant
if (customerChangedDates && actionWasForOldDates) {
  invalidateAction(actionId, "Customer changed travel dates")
}
```

## Related Documentation

- [BOOKING_CONTEXT_FEATURE.md](./BOOKING_CONTEXT_FEATURE.md) - Persistent booking details
- [NOISE_REDUCTION_IMPROVEMENTS.md](./NOISE_REDUCTION_IMPROVEMENTS.md) - Reducing unhelpful suggestions
- [app/lib/agent/state.ts](./app/lib/agent/state.ts) - Type definitions

## Key Principles

1. **Context-Aware UIs**: Show only what's relevant to the current operation
2. **Full Transparency**: Never hide what the AI suggested
3. **User Control**: Agent can confirm, dismiss, or let auto-execute
4. **Persistent History**: Actions don't disappear, they move to history
5. **Clear Status**: Always know if something is running, done, or failed
6. **Adaptive Tools**: Available actions match the operation context
