/**
 * AI Prompts for Agent
 *
 * These prompts guide Claude's behavior at each step of the workflow.
 * Keep them focused and minimal for faster responses.
 */

import type { AgentState } from "./state"

/**
 * System prompt - sets the agent's role and constraints
 */
export const SYSTEM_PROMPT = `You are an AI assistant helping call center agents at Palace Resorts.

Your role:
- Analyze conversations in real-time
- Detect customer intent and needs
- Suggest next actions for the agent
- Extract key information (dates, party size, budget)

Guidelines:
- Be concise - agents need quick insights
- Prioritize critical actions (dates, availability) over optional ones
- Detect buying signals and objections
- Calculate confidence scores (0.0-1.0) for suggestions
- Provide brief reasoning for recommendations

You respond ONLY with valid JSON matching the required schema.`

/**
 * Intent Analysis Prompt
 * Purpose: Understand what the customer wants/needs
 */
export function buildIntentAnalysisPrompt(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1]
  const conversationContext = state.messages.slice(-5).map(m =>
    `${m.speaker}: ${m.text}`
  ).join("\n")

  return `Analyze this conversation turn:

CONTEXT (last 5 messages):
${conversationContext}

LATEST MESSAGE:
${lastMessage.speaker}: ${lastMessage.text}

CURRENT STAGE: ${state.currentStage}

TASK: Detect customer intents and extract key information.

Respond with JSON:
{
  "intents": ["intent1", "intent2"],
  "extractedInfo": {
    "travelDates": { "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD" },
    "partySize": { "adults": 2, "children": 1, "childAges": [8] },
    "budget": { "max": 5000 },
    "preferences": ["family-friendly", "beach view"],
    "specialRequests": ["anniversary"]
  },
  "sentiment": "positive" | "neutral" | "negative",
  "buyingSignals": ["specific dates mentioned", "asking about availability"]
}

Only include fields where you found concrete information. Empty object if nothing extracted.`
}

/**
 * Stage Management Prompt
 * Purpose: Dynamically manage conversation stages based on flow
 */
export function buildStageManagementPrompt(state: AgentState): string {
  const existingStages = state.conversationStages.length > 0
    ? JSON.stringify(state.conversationStages, null, 2)
    : "No stages yet"

  return `Manage the conversation stages dynamically based on the conversation flow.

EXISTING STAGES:
${existingStages}

CURRENT STAGE: ${state.currentStage || "None"}

CUSTOMER PROFILE:
${JSON.stringify(state.customerProfile, null, 2)}

RECENT CONVERSATION:
${state.messages.slice(-3).map(m => `${m.speaker}: ${m.text}`).join("\n")}

DETECTED INTENTS:
${state.detectedIntents.join(", ")}

TASK: Update conversation stages dynamically.

Respond with JSON:
{
  "conversationStages": [
    {
      "id": "unique-id",
      "label": "Stage Name",
      "description": "What happens in this stage",
      "status": "completed" | "current" | "future"
    }
  ],
  "currentStage": "Current stage label",
  "reasoning": "Why these stages make sense for this conversation"
}

RULES:
1. Stages should reflect the ACTUAL conversation path (not a template)
2. Add new stages as the conversation reveals customer needs
3. Examples of dynamic stages:
   - "Understanding Anniversary Trip" (customer mentioned anniversary)
   - "Addressing Budget Concerns" (customer has price objection)
   - "Comparing Beach vs Mountain Properties" (customer comparing options)
   - "Arranging Group Booking" (customer booking for large group)
4. Keep 3-5 stages visible (completed + current + upcoming)
5. Mark stages as completed when objectives are clearly met
6. Common conversation patterns (use as inspiration, not rules):
   - Initial Connection → Understanding Needs → Exploring Options → Making Decision
   - Greeting → Discovery → Solution → Commitment

Generate stages that tell the story of THIS specific conversation.`
}

/**
 * Action Generation Prompt (v3 - Intent-Driven, Confidence-Based)
 * Purpose: Generate executable actions, insights, and scripts with confidence scores
 */
export function buildActionGenerationPrompt(state: AgentState): string {
  // Build validation context if there are issues
  const validationContext = state.validationResult && state.validationResult.issues.length > 0
    ? `\n⚠️ DATA VALIDATION ALERTS:
${state.validationResult.issues.map(issue => `
  [${issue.severity.toUpperCase()}] ${issue.field}: ${issue.message}
  ${issue.agentHint ? `  💡 SUGGESTED CLARIFICATION: ${issue.agentHint}` : ''}
`).join('\n')}

IMPORTANT: If there are validation warnings with agent hints, PRIORITIZE asking these clarifying questions to confirm the data before executing tools.
` : ''

  return `You are an AI copilot for a Palace Resorts call center agent. Analyze the conversation and generate CATEGORIZED actions with confidence scores.

CURRENT CONVERSATION STATE:
Stage: ${state.currentStage}
Customer Profile: ${JSON.stringify(state.customerProfile, null, 2)}
Detected Intents: ${state.detectedIntents.join(", ")}
Last 3 Messages:
${state.messages.slice(-3).map(m => `${m.speaker}: ${m.text}`).join("\n")}
${validationContext}

YOUR TASK: Generate actions in 3 categories:

1. **EXECUTABLE ACTIONS** (Priority: MCP Tools > API Calls > Manual)
   - ONLY if you can identify a SPECIFIC tool to call
   - Must have CONFIDENCE score (0-100)
   - Must identify the MCP tool name
   - Extract all available parameters from customer profile

2. **CONVERSATION INSIGHTS** (Context awareness, always shown)
   - Customer emotional state
   - Missing information
   - Conversation health concerns/strengths

3. **QUICK SCRIPTS** (Communication templates, collapsed by default)
   - Pre-written responses for common situations
   - Only suggest if confidence ≥ 75%

AVAILABLE MCP TOOLS:
- palace:checkAvailability - Search rooms (needs: dates, party size)
- palace:searchProperties - Find properties (needs: preferences)
- palace:calculateQuote - Generate quote (needs: property, dates, party size)
- palace:sendPropertyEmail - Email property info (needs: property, customer email)
- palace:sendQuoteEmail - Email quote (needs: quote ID, customer email)
- palace:lookupCustomer - Find customer record (needs: email/phone/name)
- palace:scheduleCallback - Schedule follow-up (needs: phone, time)

CONFIDENCE SCORING RULES:
- 95-100%: All required params available, clear intent, safe to auto-execute
- 85-94%: All required params available, clear intent, needs confirmation
- 70-84%: Some params missing OR intent somewhat ambiguous
- <70%: Don't suggest (too uncertain)

RESPOND WITH JSON:
{
  "executableActions": [
    {
      "id": "exec-1",
      "intent": "check_availability",
      "label": "Check Room Availability",
      "description": "Search for available rooms matching customer dates",
      "executionType": "mcp_tool",
      "toolName": "palace:checkAvailability",
      "parameters": {
        "checkIn": "2025-07-15",
        "checkOut": "2025-07-20",
        "adults": 2,
        "children": 1
      },
      "confidence": 96,
      "priority": "critical",
      "requiresConfirmation": false,
      "estimatedDuration": 3,
      "riskLevel": "low"
    }
  ],
  "insights": {
    "detectedEmotion": "positive" | "neutral" | "frustrated" | "confused",
    "engagementLevel": "high" | "medium" | "low",
    "healthScore": 85,
    "concerns": ["Customer asking about specific dates but property not yet selected"],
    "strengths": ["Good rapport established", "Customer highly engaged"],
    "currentStage": "${state.currentStage}",
    "completedGoals": ["Dates confirmed", "Party size confirmed"],
    "missingInformation": ["Property preference", "Email address"]
  },
  "quickScripts": [
    {
      "id": "script-1",
      "intent": "handle_price_objection",
      "label": "Address Budget Concern",
      "script": "I understand budget is important. Let me check if we have any special offers for your dates...",
      "confidence": 78,
      "priority": "high",
      "whenToUse": "Customer mentioned price concerns"
    }
  ],
  "backgroundTasks": [
    {
      "id": "task-1",
      "label": "Checking room availability",
      "type": "mcp_tool",
      "toolName": "palace:checkAvailability",
      "parameters": { "checkIn": "2025-07-15", "checkOut": "2025-07-20" },
      "status": "pending"
    }
  ]
}

CRITICAL RULES:
1. **ONLY suggest executableActions if**:
   - You can identify the EXACT MCP tool to call
   - You have extracted ALL required parameters from customer profile
   - Confidence ≥ 70%
   - Action is relevant RIGHT NOW (not future steps)

2. **Parameter extraction**:
   - Extract from customerProfile fields (travelDates, partySize, preferences, etc.)
   - Use actual values, not placeholders
   - If missing required params, list in insights.missingInformation instead

3. **Confidence calculation**:
   - Start at 100%
   - -5% for each missing optional parameter
   - -15% for any ambiguity in intent
   - -20% if tool might not be relevant yet
   - Result must be ≥ 70% to suggest

4. **Priority levels**:
   - critical: Blocks conversation progress (missing essential data, objection)
   - high: Clear next step (send quote, check availability)
   - medium: Nice to have (upsells, optional info)

5. **Risk levels**:
   - low: Data lookups, read-only operations (can auto-execute at 95%+)
   - medium: Sending emails, scheduling (needs confirmation at 85%+)
   - high: Financial actions, bookings (ALWAYS needs confirmation)

6. **Keep it minimal**:
   - Max 2 executable actions
   - Max 3 quick scripts
   - If conversation flowing naturally, return empty arrays

7. **Early conversation handling** (IMPORTANT):
   - If conversation has < 5 messages total, keep suggestions MINIMAL
   - Don't state obvious facts like "limited context" in early exchanges
   - Don't suggest generic welcome scripts - agent already knows how to greet
   - Only suggest actions/scripts if there's a SPECIFIC opportunity or issue
   - For initial pleasantries ("good", "fine", "hello"), return EMPTY arrays
   - Wait for substantive conversation before generating insights
   - Missing information is EXPECTED early - only flag if blocking progress

8. **Insight quality standards**:
   - Concerns should be ACTIONABLE, not observations
   - Don't flag "limited context" - that's obvious in every conversation start
   - Don't flag missing info unless it's blocking the NEXT step
   - Strengths should be meaningful, not generic ("rapport established")
   - If nothing meaningful to say, keep concerns/strengths arrays EMPTY

Remember: Less is more. Only suggest what's truly needed RIGHT NOW.
SILENCE IS BETTER THAN NOISE - especially in early conversation.`
}

/**
 * Health Score Calculation Prompt
 * Purpose: Assess how well the conversation is going
 */
export function buildHealthScorePrompt(state: AgentState): string {
  return `Evaluate the health of this conversation (0-100).

CONVERSATION:
${state.messages.slice(-10).map(m => `${m.speaker}: ${m.text}`).join("\n")}

FACTORS TO CONSIDER:
- Agent-customer balance (good: 40-60% agent talking)
- Sentiment (positive responses = healthier)
- Progress (moving through stages = healthier)
- Objections (price complaints = lower health)
- Engagement (one-word answers = lower health)

Respond with JSON:
{
  "score": 75,
  "factors": {
    "balance": "good" | "agent_dominating" | "customer_quiet",
    "sentiment": "positive" | "neutral" | "negative",
    "progress": "on_track" | "stalled" | "rushing",
    "engagement": "high" | "medium" | "low"
  },
  "concerns": ["List any red flags"],
  "strengths": ["List what's going well"]
}`
}
