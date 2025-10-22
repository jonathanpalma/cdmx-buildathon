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
  return `Generate 2-3 recommended actions for the call center agent.

CURRENT STAGE: ${state.currentStage}
CUSTOMER PROFILE:
${JSON.stringify(state.customerProfile, null, 2)}

DETECTED INTENTS:
${state.detectedIntents.join(", ")}

LAST 3 MESSAGES:
${state.messages.slice(-3).map(m => `${m.speaker}: ${m.text}`).join("\n")}

TASK: Suggest next actions for the agent to take.

Respond with JSON:
{
  "actions": [
    {
      "id": "action-1",
      "label": "Clear, action-oriented label",
      "description": "Brief explanation of what to do",
      "priority": "critical" | "recommended" | "optional",
      "confidence": 0.95,
      "reasoning": "Why this action makes sense now"
    }
  ],
  "script": "Suggested exact words the agent can say",
  "tips": ["Pro tip 1", "Pro tip 2"]
}

Prioritize:
- Critical: Must-do actions (get dates, check availability)
- Recommended: Should-do actions (mention promotions, build rapport)
- Optional: Nice-to-have (upsells, additional info)

Keep actions specific to current stage and customer needs.`
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
