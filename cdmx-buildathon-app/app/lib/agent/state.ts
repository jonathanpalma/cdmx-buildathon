/**
 * Agent State Types
 *
 * This defines the "memory" of our AI agent.
 * The agent maintains this state across the conversation.
 */

import type { NextAction } from "~/components/copilot"

export interface TranscriptMessage {
  speaker: "agent" | "customer"
  text: string
  timestamp: number
}

export interface CustomerProfile {
  // Extracted information about the customer
  name?: string
  travelDates?: {
    checkIn?: string
    checkOut?: string
    flexible?: boolean
  }
  partySize?: {
    adults?: number
    children?: number
    childAges?: number[]
  }
  budget?: {
    min?: number
    max?: number
    currency?: string
  }
  preferences?: string[]  // e.g., ["beach view", "family-friendly", "all-inclusive"]
  specialRequests?: string[]  // e.g., ["anniversary", "accessible room"]
}

export interface ConversationStage {
  id: string
  label: string
  description: string
  status: "completed" | "current" | "future"
  completedAt?: number  // timestamp
}

export interface BackgroundTask {
  id: string
  label: string
  type: "api_call" | "mcp_tool" | "data_lookup" | "calculation"
  status: "pending" | "running" | "completed" | "failed"
  progress?: number // 0-100
  result?: string
  startedAt?: number
  completedAt?: number
}

export interface AgentState {
  // Conversation history (kept minimal - last 10 messages)
  messages: TranscriptMessage[]

  // Dynamically generated conversation stages (evolves as conversation progresses)
  conversationStages: ConversationStage[]

  // Current conversation stage
  currentStage: string

  // Extracted customer information
  customerProfile: CustomerProfile

  // Detected intents in current message
  detectedIntents: string[]  // e.g., ["asking_about_dates", "price_objection"]

  // Agent's recommended next actions (what we show in copilot)
  nextActions: NextAction[]

  // AI's reasoning (for transparency)
  reasoning: string

  // Conversation health score (0-100)
  healthScore: number

  // Background tasks (API calls, MCP tools, etc.)
  backgroundTasks: BackgroundTask[]
}

export const INITIAL_AGENT_STATE: AgentState = {
  messages: [],
  conversationStages: [],
  currentStage: "",
  customerProfile: {},
  detectedIntents: [],
  nextActions: [],
  reasoning: "",
  healthScore: 75,
  backgroundTasks: [],
}

/**
 * Intent Categories
 * These are the key things we want to detect in customer messages
 */
export const INTENT_CATEGORIES = {
  // Information gathering
  ASKING_DATES: "asking_about_dates",
  ASKING_PRICE: "asking_about_price",
  ASKING_AMENITIES: "asking_about_amenities",
  ASKING_LOCATION: "asking_about_location",

  // Objections
  PRICE_OBJECTION: "price_too_high",
  TIMING_OBJECTION: "wrong_timing",
  COMPARISON_SHOPPING: "comparing_options",

  // Buying signals
  READY_TO_BOOK: "ready_to_book",
  POSITIVE_RESPONSE: "positive_response",
  NEEDS_TIME: "needs_time_to_decide",

  // Issues
  CONFUSION: "customer_confused",
  FRUSTRATION: "customer_frustrated",
  TECHNICAL_ISSUE: "technical_problem",
} as const

/**
 * Conversation Stages
 * Maps to the stages shown in the copilot UI
 */
export const CONVERSATION_STAGES = [
  "Initial Greeting",
  "Needs Assessment",
  "Property Selection",
  "Pricing & Quote",
  "Closing & Follow-up",
] as const
