# Copilot UX Redesign: Intent-Driven, Confidence-Based Actions

## Problem Statement

Current copilot is **overwhelming and not actionable**:
- ❌ Mixes insights with executable actions
- ❌ No clear indication of what can be auto-executed
- ❌ Everything feels like "nice to know" instead of "must do"
- ❌ No confidence scoring for when to show suggestions
- ❌ Doesn't prioritize MCP/API-executable actions

## Design Principles

1. **Intent-Driven**: Detect specific, actionable customer intents
2. **Confidence-Based**: Only show high-confidence recommendations
3. **Action-Oriented**: Separate "do something" from "be aware"
4. **Real-Time Optimized**: Minimize cognitive load during live calls
5. **Tool-First**: Prioritize actions that can be executed via API/MCP

## New Information Architecture

### 1. **Executable Actions** (Top Priority)
**What**: Actions that can be performed right now (API calls, MCP tools, scripts)
**When to show**: Confidence ≥ 85%
**Auto-execute**: Confidence ≥ 95% (with notification)

```typescript
interface ExecutableAction {
  id: string
  intent: DetectedIntent
  label: string // "Check room availability"
  description: string // "Search for rooms matching customer dates"

  // Execution details
  executionType: "mcp_tool" | "api_call" | "script" | "manual"
  toolName?: string // e.g., "palace:checkAvailability"
  parameters?: Record<string, any>

  // Confidence & priority
  confidence: number // 0-100
  priority: "critical" | "high" | "medium"

  // Auto-execution
  requiresConfirmation: boolean // false if confidence ≥ 95%
  estimatedDuration?: number // seconds

  // Status tracking
  status: "suggested" | "confirmed" | "executing" | "completed" | "failed"
  result?: string
}
```

### 2. **Conversation Insights** (Context Awareness)
**What**: What's happening in the conversation right now
**When to show**: Always visible, but subtle

```typescript
interface ConversationInsight {
  type: "customer_state" | "conversation_health" | "stage_progress"

  // Customer state
  detectedEmotion?: "positive" | "neutral" | "frustrated" | "confused"
  engagementLevel?: "high" | "medium" | "low"

  // Conversation health
  healthScore: number // 0-100
  concerns?: string[] // ["Customer asking same question twice", "Price objection"]
  strengths?: string[] // ["Good rapport established", "Customer engaged"]

  // Progress
  currentStage: string
  completedGoals: string[]
  missingInformation: string[] // ["Travel dates", "Party size"]
}
```

### 3. **Background Tasks** (Async Operations)
**What**: MCP tools / API calls running in the background
**When to show**: When pending or completed with results

```typescript
interface BackgroundTask {
  id: string
  label: string
  type: "mcp_tool" | "api_call" | "data_lookup"
  status: "pending" | "running" | "completed" | "failed"

  // Tool details
  toolName?: string // "palace:searchProperties"
  parameters?: Record<string, any>

  // Progress
  startedAt: number
  estimatedCompletion?: number
  progress?: number // 0-100

  // Results
  result?: {
    summary: string // "Found 5 available rooms"
    data?: any
    suggestedAction?: ExecutableAction // Follow-up action
  }
  error?: string
}
```

### 4. **Quick Scripts** (Communication Templates)
**What**: Pre-written phrases for common situations
**When to show**: When specific intent detected with confidence ≥ 75%

```typescript
interface QuickScript {
  id: string
  intent: string // "handle_price_objection"
  label: string // "Address price concern"
  script: string // "I understand budget is important. Let me show you..."
  confidence: number
  priority: "high" | "medium" | "low"
}
```

## Intent Detection & Confidence Scoring

### High-Confidence Intents (Auto-Execute at 95%+)

```typescript
const AUTO_EXECUTABLE_INTENTS = {
  // Data lookups (safe to execute)
  CHECK_AVAILABILITY: {
    requiredFields: ["dates", "partySize"],
    mcpTool: "palace:checkAvailability",
    confidence Threshold: 95
  },

  CALCULATE_PRICING: {
    requiredFields: ["propertyId", "dates", "partySize"],
    mcpTool: "palace:calculateQuote",
    confidenceThreshold: 95
  },

  LOOKUP_CUSTOMER: {
    requiredFields: ["email" | "phone" | "name"],
    mcpTool: "palace:findCustomer",
    confidenceThreshold: 95
  },

  // Safe actions
  SEND_PROPERTY_DETAILS: {
    requiredFields: ["propertyId", "customerEmail"],
    mcpTool: "palace:sendPropertyEmail",
    confidenceThreshold: 92
  }
}
```

### Medium-Confidence Intents (Require Confirmation)

```typescript
const CONFIRMATION_REQUIRED_INTENTS = {
  // Financial actions
  CREATE_BOOKING: {
    requiredFields: ["propertyId", "dates", "partySize", "paymentMethod"],
    mcpTool: "palace:createBooking",
    confidenceThreshold: 85,
    requiresConfirmation: true
  },

  APPLY_DISCOUNT: {
    requiredFields: ["bookingId", "discountCode"],
    mcpTool: "palace:applyDiscount",
    confidenceThreshold: 85,
    requiresConfirmation: true
  },

  // Customer communications
  SCHEDULE_CALLBACK: {
    requiredFields: ["customerPhone", "preferredTime"],
    mcpTool: "palace:scheduleCallback",
    confidenceThreshold: 80,
    requiresConfirmation: true
  }
}
```

### Low-Confidence / Manual Actions

```typescript
const MANUAL_ACTIONS = {
  // Complex decisions
  HANDLE_SPECIAL_REQUEST: {
    type: "manual",
    suggestScript: true,
    confidenceThreshold: 70
  },

  ESCALATE_TO_MANAGER: {
    type: "manual",
    requiresReason: true,
    confidenceThreshold: 75
  }
}
```

## UI Layout Redesign

```
┌─────────────────────────────────────────────┐
│ 🎯 Next Action (Critical)                   │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ ⚡ Check Room Availability           │    │
│ │ Search for rooms matching dates      │    │
│ │ [Execute Now] [Dismiss]               │    │
│ │ Confidence: 96% • 2s estimated        │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🔄 Running Tasks (1)                        │
│                                             │
│ ┌─────────────────────────────────────┐    │
│ │ 🔍 Searching inventory...            │    │
│ │ palace:checkAvailability             │    │
│ │ [████████░░] 80%                     │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💡 Conversation Insights                    │
│                                             │
│ Health: 85% 🟢                              │
│ Stage: Pricing & Quote                      │
│                                             │
│ Missing Info:                               │
│ • Travel insurance preference               │
│                                             │
│ ⚠️ Customer mentioned budget concerns        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💬 Quick Scripts (collapse by default)      │
│                                             │
│ [Expand to see suggested responses]         │
└─────────────────────────────────────────────┘
```

## Confidence Threshold Rules

```typescript
const CONFIDENCE_RULES = {
  // Auto-execute (no confirmation needed)
  AUTO_EXECUTE: {
    min: 95,
    maxConcurrent: 2, // Don't auto-run >2 tasks at once
    allowedTypes: ["data_lookup", "read_only_api"],
    requiresAllParams: true
  },

  // Show with confirmation button
  SHOW_WITH_CONFIRMATION: {
    min: 85,
    max: 94,
    requiresAllParams: true,
    showEstimatedTime: true
  },

  // Show as suggestion only
  SHOW_AS_SUGGESTION: {
    min: 70,
    max: 84,
    allowPartialParams: true
  },

  // Don't show
  SUPPRESS: {
    max: 69,
    reason: "Too uncertain to distract agent"
  }
}
```

## MCP Tool Integration

### Example: Palace API MCP Server

```typescript
// MCP Tool Definition
const PALACE_TOOLS = {
  checkAvailability: {
    name: "palace:checkAvailability",
    description: "Search for available rooms",
    parameters: {
      checkIn: "string (YYYY-MM-DD)",
      checkOut: "string (YYYY-MM-DD)",
      adults: "number",
      children: "number"
    },
    executionTime: "2-5s",
    riskLevel: "low", // safe to auto-execute
    cost: "free"
  },

  calculateQuote: {
    name: "palace:calculateQuote",
    description: "Generate pricing quote",
    parameters: {
      propertyId: "string",
      checkIn: "string",
      checkOut: "string",
      guests: "number"
    },
    executionTime: "1-3s",
    riskLevel: "low",
    cost: "free"
  },

  createBooking: {
    name: "palace:createBooking",
    description: "Create confirmed booking",
    parameters: {
      propertyId: "string",
      // ... all booking details
    },
    executionTime: "3-8s",
    riskLevel: "high", // always requires confirmation
    cost: "commits inventory"
  }
}
```

## Agent Prompt Updates

### New Action Generation Prompt

```markdown
Your job: Detect customer intents and suggest EXECUTABLE actions.

PRIORITY: MCP/API tools > Scripts > Manual suggestions

For each detected intent:
1. Classify intent type (data_lookup, booking, communication, etc.)
2. Check if all required parameters are available
3. Calculate confidence (0-100)
4. Determine if confirmation needed
5. Select appropriate MCP tool or action type

Output JSON:
{
  "executableActions": [
    {
      "intent": "check_availability",
      "confidence": 96,
      "executionType": "mcp_tool",
      "toolName": "palace:checkAvailability",
      "parameters": { ... },
      "requiresConfirmation": false,
      "priority": "critical"
    }
  ],
  "insights": {
    "healthScore": 85,
    "detectedEmotion": "positive",
    "missingInfo": ["travel insurance preference"],
    "concerns": []
  },
  "quickScripts": [
    {
      "intent": "handle_price_objection",
      "confidence": 78,
      "script": "I understand budget is important..."
    }
  ]
}
```

## Implementation Plan

1. **Phase 1**: Add confidence scoring to existing actions
2. **Phase 2**: Implement MCP tool detection and parameter extraction
3. **Phase 3**: Add auto-execution logic with safety checks
4. **Phase 4**: Redesign UI with new layout
5. **Phase 5**: Add background task management

## Success Metrics

- **Cognitive Load**: Max 1-2 actions shown at once
- **Relevance**: >90% of suggested actions are clicked/executed
- **Speed**: Actions available within 500ms of intent detection
- **Safety**: 0% unintended auto-executions
- **Coverage**: 80%+ of common intents have MCP tool mapping
