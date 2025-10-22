# Booking Context - Persistent Source of Truth

## Overview

The **Booking Context** is a persistent panel that displays extracted booking information throughout the conversation. It serves as the **single source of truth** for all MCP tool calls and provides agents with a clear, editable view of customer requirements.

## Problem It Solves

### Before: Scattered Information
- **Missing info lists**: "Still need: dates, party size, budget..." (tells what's missing, not what we have)
- **Transient insights**: Appeared/disappeared as conversation progressed
- **No editing**: Agent couldn't override incorrect extractions
- **Parameter confusion**: Tools called with incomplete or wrong data
- **Cognitive load**: Agent had to remember what was already gathered

### After: Persistent Source of Truth
- **Always visible**: Booking details stay at the top of copilot panel
- **Shows what we know**: Displays gathered information, not just gaps
- **Editable**: Agent can manually correct or add details
- **Tool integration**: MCP actions automatically use this as source of truth
- **Clear status**: Agent knows exactly what's confirmed vs. what's needed

## Features

### 1. **Persistent Display**

The booking context shows at the top of the copilot and never disappears:

```
┌─ Booking Details ─────────────────┐
│ ✨ Sparkles                  [Edit]│
├────────────────────────────────────┤
│ 👤 Guest: John Smith              │
│                                    │
│ 📅 Dates: Jul 15 → Jul 20         │
│        5 nights                    │
│        [Flexible dates]            │
│                                    │
│ 👥 Guests: 2 adults               │
│                                    │
│ 💵 Budget: $2,000 - $3,000        │
│        (≈$400/night)               │
│                                    │
│ 📍 Preferences:                    │
│    [ocean view] [balcony]         │
│                                    │
│ ✨ Special Requests:               │
│    [anniversary]                   │
└────────────────────────────────────┘
```

### 2. **Auto-Population from Conversation**

As the agent workflow extracts information, it automatically appears:

**Conversation:**
```
Customer: "I'm looking to book for July 15th to 20th"
→ Dates appear: Jul 15 → Jul 20 (5 nights)

Customer: "It's for me and my wife"
→ Guests appear: 2 adults

Customer: "We're celebrating our anniversary"
→ Special Request appears: [anniversary]
```

### 3. **Manual Override**

Agent can click "Edit" to modify any field:

```
┌─ Booking Details ─────────────────┐
│ ✨ Sparkles        [Save] [Cancel]│
├────────────────────────────────────┤
│ 📅 Dates:                          │
│    Check-in:  [2025-07-15]        │
│    Check-out: [2025-07-20]        │
│                                    │
│ 👥 Guests:                         │
│    Adults:   [2]                   │
│    Children: [0]                   │
└────────────────────────────────────┘
```

**Use Cases:**
- Customer said "mid-July" → Agent pins it to specific dates
- Agent misheard "8 people" as "8th" → Correct party size
- Customer changed their mind → Update requirements
- Add details customer mentioned but AI missed

### 4. **Source of Truth for MCP Tools**

When executing actions, the system automatically enriches parameters from the booking context:

**Action Generated:**
```json
{
  "label": "Check Availability",
  "toolName": "palace:checkAvailability",
  "parameters": {
    "property": "Le Blanc Cancun"
  }
}
```

**Actual Execution (Enriched):**
```json
{
  "toolName": "palace:checkAvailability",
  "parameters": {
    "property": "Le Blanc Cancun",
    "checkIn": "2025-07-15",      // ← From booking context
    "checkOut": "2025-07-20",     // ← From booking context
    "adults": 2,                   // ← From booking context
    "preferences": ["ocean view", "balcony"]  // ← From booking context
  }
}
```

**Log Output:**
```javascript
🚀 MCP_EXEC_START {
  actionId: "exec-123",
  toolName: "palace:checkAvailability",
  parameters: { /* enriched params */ },
  originalParams: { property: "Le Blanc Cancun" },
  enrichedFromProfile: ["checkIn", "checkOut", "adults", "preferences"],
  ← Shows what was added from profile
}
```

## Implementation

### Component Structure

```
app/components/copilot/
├── booking-context.tsx          ← New persistent context component
└── agent-copilot-v2.tsx         ← Modified to include booking context

app/routes/
└── _index.tsx                    ← Modified to handle profile updates
                                     and enrich MCP parameters
```

### Data Flow

```
1. Audio Transcript
   ↓
2. Agent Workflow (workflow.server.ts)
   ├→ analyzeIntent() extracts customer info
   ↓
3. Update customerProfile in AgentState
   ↓
4. BookingContext component displays profile
   ↓
5. Agent clicks Edit → Manual override
   ↓
6. handleProfileUpdate() merges changes
   ↓
7. Action triggered → executeMCPAction()
   ↓
8. Parameters enriched from customerProfile
   ↓
9. MCP tool called with complete data
```

### Key Code Locations

**Booking Context Component** (app/components/copilot/booking-context.tsx):
- Displays customer profile fields
- Handles edit mode with save/cancel
- Shows empty state when no data
- Calculates derived values (nights, per-night cost)

**Profile Update Handler** (app/routes/_index.tsx:750-767):
```typescript
const handleProfileUpdate = useCallback((updates: Partial<CustomerProfile>) => {
  logger.info("👤 PROFILE_UPDATE", {
    type: "manual_override",
    updates: Object.keys(updates),
    hasNewDates: !!updates.travelDates,
    hasNewPartySize: !!updates.partySize,
    hasNewBudget: !!updates.budget
  })

  setAgentState(prev => ({
    ...prev,
    customerProfile: {
      ...prev.customerProfile,
      ...updates
    }
  }))
}, [])
```

**Parameter Enrichment** (app/routes/_index.tsx:464-487):
```typescript
const enrichedParameters = {
  ...action.parameters,
  // Override with customer profile data if available
  ...(agentState.customerProfile?.travelDates?.checkIn && {
    checkIn: agentState.customerProfile.travelDates.checkIn
  }),
  ...(agentState.customerProfile?.partySize?.adults && {
    adults: agentState.customerProfile.partySize.adults
  }),
  // ... more fields
}
```

## Field Mapping

| Profile Field | MCP Parameter | Example |
|---------------|---------------|---------|
| `travelDates.checkIn` | `checkIn` | `"2025-07-15"` |
| `travelDates.checkOut` | `checkOut` | `"2025-07-20"` |
| `partySize.adults` | `adults` | `2` |
| `partySize.children` | `children` | `0` |
| `budget.max` | `maxBudget` | `3000` |
| `preferences` | `preferences` | `["ocean view", "balcony"]` |

## UI/UX Details

### Visual Hierarchy

1. **Always at top** - Never scrolls away
2. **Gradient background** - Blue gradient to distinguish from other sections
3. **Icon-based** - Quick visual scanning (📅 dates, 👥 guests, etc.)
4. **Conditional display** - Only shows fields with values
5. **Badges for tags** - Preferences and special requests as pills

### Empty State

When no data extracted yet:

```
┌─ Booking Details ─────────────────┐
│ ✨ Sparkles                  [Edit]│
├────────────────────────────────────┤
│                                    │
│          ✨                        │
│    No booking details yet          │
│                                    │
│  Information will appear as the    │
│  conversation progresses           │
│                                    │
└────────────────────────────────────┘
```

### Responsive Behavior

- **Compact mode**: Shows key fields only
- **Edit mode**: Expands to show input fields
- **Validation**: Date picker, number inputs with min/max
- **Auto-save**: Saves on blur or Enter key

## Benefits

### For Agents

1. **Clear visibility**: See all gathered info at a glance
2. **Easy corrections**: Fix misheard or incorrect extractions
3. **Confidence**: Know exactly what will be sent to tools
4. **Efficiency**: No need to re-ask confirmed details
5. **Control**: Manual override when AI gets it wrong

### For Customers

1. **Fewer repetitions**: Information is captured and remembered
2. **Accuracy**: Agent can verify details visually
3. **Faster service**: Tools called with complete data
4. **Better results**: Search parameters match actual needs

### For System

1. **Single source of truth**: No parameter confusion
2. **Better tool calls**: Complete data = better results
3. **Debugging**: Clear logs show what was enriched
4. **Flexibility**: Agent and AI work together
5. **Reliability**: Manual fallback when extraction fails

## Logging

### Profile Updates

```javascript
👤 PROFILE_UPDATE {
  type: "manual_override",
  updates: ["travelDates", "partySize"],
  hasNewDates: true,
  hasNewPartySize: true,
  hasNewBudget: false
}
```

### Parameter Enrichment

```javascript
🚀 MCP_EXEC_START {
  actionId: "exec-123",
  label: "Check Availability",
  toolName: "palace:checkAvailability",
  parameters: {
    property: "Le Blanc Cancun",
    checkIn: "2025-07-15",
    checkOut: "2025-07-20",
    adults: 2,
    preferences: ["ocean view"]
  },
  originalParams: { property: "Le Blanc Cancun" },
  enrichedFromProfile: ["checkIn", "checkOut", "adults", "preferences"],
  confidence: 96,
  triggeredBy: "auto_exec"
}
```

## Future Enhancements

### Suggested Improvements

1. **Field validation with feedback**
   - Check-out must be after check-in
   - Adults must be >= 1
   - Show warnings for unusual values

2. **Confidence indicators**
   - Show confidence scores for extracted values
   - Highlight fields needing confirmation

3. **History tracking**
   - Show when each field was updated
   - Allow reverting to previous values

4. **Smart suggestions**
   - Suggest missing but related fields
   - Auto-complete based on patterns

5. **Multi-room support**
   - Handle multiple rooms in one booking
   - Different party sizes per room

6. **Integration with CRM**
   - Pre-fill from customer database
   - Save to customer profile

## Related Documentation

- [NOISE_REDUCTION_IMPROVEMENTS.md](./NOISE_REDUCTION_IMPROVEMENTS.md) - Early conversation handling
- [CONTEXT_BUILDING_IMPROVEMENTS.md](./CONTEXT_BUILDING_IMPROVEMENTS.md) - Initial UX states
- [LOGGING_STRATEGY.md](./LOGGING_STRATEGY.md) - Complete logging reference
- [app/lib/agent/state.ts](./app/lib/agent/state.ts) - CustomerProfile type definition

## Testing

### Test Scenarios

1. **Auto-population**
   - Upload conversation with dates mentioned
   - Verify dates appear in booking context
   - Check format is correct (MMM DD, YYYY)

2. **Manual override**
   - Click Edit
   - Change check-in date
   - Click Save
   - Verify MCP tools use new date

3. **Parameter enrichment**
   - Set dates in booking context
   - Trigger "Check Availability" action
   - Verify logs show enrichment
   - Verify MCP called with dates

4. **Empty state**
   - Start new conversation
   - Verify empty state shows
   - Add first field
   - Verify empty state disappears

5. **Multiple fields**
   - Add dates, guests, budget
   - Verify all display correctly
   - Verify calculations (nights, per-night)
   - Edit one field, verify others unchanged

## Key Principles

1. **Persistence Over Transience**: Information stays visible, doesn't disappear
2. **Human + AI Collaboration**: AI extracts, human verifies/overrides
3. **Single Source of Truth**: One place for all booking details
4. **Explicit Over Implicit**: Show what we know, not just what's missing
5. **Control for Agents**: Tools to correct AI when needed
