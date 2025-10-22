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
 * Action Generation Prompt
 * Purpose: Create actionable suggestions for the agent
 */
export function buildActionGenerationPrompt(state: AgentState): string {
  return `Generate 1-2 ACTIONABLE suggestions for the call center agent.

CRITICAL RULES:
1. Actions must be EXECUTABLE - they should DO something concrete
2. Each action should either:
   - Trigger a specific task (check availability, send email, create quote)
   - Provide exact words to say (short script/phrase)
   - Give a specific question to ask
3. Only suggest if TRULY needed - empty array if conversation flowing naturally
4. Make it clear what happens when the agent clicks the action

CURRENT STAGE: ${state.currentStage}
CUSTOMER PROFILE:
${JSON.stringify(state.customerProfile, null, 2)}

DETECTED INTENTS:
${state.detectedIntents.join(", ")}

LAST 3 MESSAGES:
${state.messages.slice(-3).map(m => `${m.speaker}: ${m.text}`).join("\n")}

TASK: Suggest EXECUTABLE actions the agent can take RIGHT NOW.

Respond with JSON:
{
  "actions": [
    {
      "id": "action-1",
      "label": "Verb + Object (max 4 words)",
      "description": "What happens when clicked (max 12 words)",
      "priority": "critical" | "recommended",
      "actionType": "script" | "task" | "question"
    }
  ],
  "reasoning": "ONE sentence context (max 20 words)",
  "backgroundTasks": [
    {
      "id": "task-1",
      "label": "Task name",
      "type": "api_call" | "mcp_tool" | "data_lookup" | "calculation",
      "status": "pending"
    }
  ]
}

ACTION TYPES:
- "script": Provides exact words to say. Label should be the phrase itself.
  Example: { label: "Ask about travel dates", description: "Opens date picker for customer" }
- "task": Executes a system action (check availability, send email, create quote)
  Example: { label: "Check room availability", description: "Searches inventory for requested dates" }
- "question": Suggests a specific question to ask
  Example: { label: "Ask party size", description: "'How many adults and children?'" }

ONLY include actions if:
- Critical: Missing essential information (dates, party size, contact info)
- Critical: Customer has objection/concern that needs addressing
- Critical: Time-sensitive opportunity (limited availability, promo ending)
- Recommended: Clear next step to progress conversation (send quote, check calendar)

DO NOT include actions for:
- Routine conversation flow (customer is already talking, agent is listening appropriately)
- Generic suggestions (be friendly, use customer name - agent should know this)
- Optional upsells when customer hasn't committed yet
- Information already collected

Keep it MINIMAL. Agent is listening to a call in real-time. Less is more.

REASONING: Provide ONE concise sentence (max 20 words) explaining why this action matters NOW.

BACKGROUND TASKS: Suggest tasks that can run in the background (API calls, data lookups):
- Examples: "Check room availability", "Calculate pricing quote", "Look up customer history"
- Only suggest if you have enough info (e.g., need dates to check availability)
- These show the agent that AI is actively working for them
- Keep to 0-2 tasks maximum`
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
