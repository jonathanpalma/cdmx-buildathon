/**
 * Agent State Types
 *
 * This defines the "memory" of our AI agent.
 * The agent maintains this state across the conversation.
 */

export interface TranscriptMessage {
  speaker: "agent" | "customer"
  text: string
  timestamp: number
}

/**
 * Executable Action - High-priority, tool-based actions
 */
export interface ExecutableAction {
  id: string
  intent: string // e.g., "check_availability", "calculate_pricing"
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
  requiresConfirmation: boolean
  estimatedDuration?: number // seconds
  riskLevel: "low" | "medium" | "high"

  // Status tracking
  status: "suggested" | "confirmed" | "executing" | "completed" | "failed"
  result?: string
  error?: string
}

/**
 * Conversation Insights - Context awareness
 */
export interface ConversationInsight {
  // Customer state
  detectedEmotion?: "positive" | "neutral" | "frustrated" | "confused"
  engagementLevel?: "high" | "medium" | "low"

  // Conversation health
  healthScore: number // 0-100
  concerns: string[]
  strengths: string[]

  // Progress
  currentStage: string
  completedGoals: string[]
  missingInformation: string[]
}

/**
 * Quick Script - Pre-written communication template
 */
export interface QuickScript {
  id: string
  intent: string
  label: string
  script: string
  confidence: number
  priority: "high" | "medium" | "low"
  whenToUse?: string // Contextual hint
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

  // Tool details
  toolName?: string
  parameters?: Record<string, any>

  // Progress
  progress?: number // 0-100
  startedAt?: number
  estimatedCompletion?: number
  completedAt?: number

  // Results
  result?: {
    summary: string
    data?: any
    suggestedAction?: ExecutableAction
  }
  error?: string
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

  // NEW: Categorized actions
  executableActions: ExecutableAction[] // High-priority, tool-based actions
  quickScripts: QuickScript[] // Communication templates
  insights: ConversationInsight // Context awareness

  // DEPRECATED: Old structure (kept for backward compatibility temporarily)
  nextActions?: ExecutableAction[] // Maps to executableActions
  reasoning?: string // Maps to insights.concerns/strengths

  // Conversation health score (kept at top level for easy access)
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
  executableActions: [],
  quickScripts: [],
  insights: {
    healthScore: 75,
    concerns: [],
    strengths: [],
    currentStage: "",
    completedGoals: [],
    missingInformation: [],
  },
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
