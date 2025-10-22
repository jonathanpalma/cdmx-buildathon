/**
 * LangGraph Agent Workflow
 *
 * This is the "brain" of the copilot. It:
 * 1. Analyzes each new transcript message
 * 2. Extracts customer information
 * 3. Detects intents and sentiment
 * 4. Decides when to progress conversation stages
 * 5. Generates actionable suggestions for the agent
 *
 * Flow: analyze_intent → check_stage_transition → generate_actions
 */

import { StateGraph, END, START } from "@langchain/langgraph"
import { ChatAnthropic } from "@langchain/anthropic"
import type { AgentState, TranscriptMessage } from "./state"
import { INITIAL_AGENT_STATE } from "./state"
import {
  SYSTEM_PROMPT,
  buildIntentAnalysisPrompt,
  buildStageManagementPrompt,
  buildActionGenerationPrompt,
  buildHealthScorePrompt,
} from "./prompts"
import { logger } from "../logger.server"

// Initialize Claude Haiku (fast, cost-effective, excellent at structured output)
const model = new ChatAnthropic({
  modelName: "claude-3-5-haiku-20241022",
  temperature: 0.3, // Lower = more consistent, higher = more creative
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024, // Limit output tokens for speed
})

// Note: Can switch to claude-3-5-sonnet-20241022 for better quality if latency isn't critical

/**
 * Node 1: Analyze Intent
 * Purpose: Understand what the customer wants and extract key info
 */
async function analyzeIntent(state: AgentState): Promise<Partial<AgentState>> {
  logger.debug("Agent analyzing intent")

  try {
    const prompt = buildIntentAnalysisPrompt(state)
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ])

    const analysis = JSON.parse(response.content as string)

    // Merge extracted info with existing profile
    const updatedProfile = {
      ...state.customerProfile,
      ...(analysis.extractedInfo || {}),
    }

    // Merge arrays (preferences, special requests)
    if (analysis.extractedInfo?.preferences) {
      updatedProfile.preferences = [
        ...(state.customerProfile.preferences || []),
        ...analysis.extractedInfo.preferences,
      ]
    }

    if (analysis.extractedInfo?.specialRequests) {
      updatedProfile.specialRequests = [
        ...(state.customerProfile.specialRequests || []),
        ...analysis.extractedInfo.specialRequests,
      ]
    }

    return {
      detectedIntents: analysis.intents || [],
      customerProfile: updatedProfile,
    }
  } catch (error) {
    logger.error("Agent intent analysis failed", { error })
    return { detectedIntents: [] }
  }
}

/**
 * Node 2: Manage Conversation Stages
 * Purpose: Dynamically create/update stages based on conversation flow
 */
async function manageConversationStages(
  state: AgentState
): Promise<Partial<AgentState>> {
  logger.debug("Agent managing conversation stages")

  try {
    const prompt = buildStageManagementPrompt(state)
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ])

    const result = JSON.parse(response.content as string)

    return {
      conversationStages: result.conversationStages || [],
      currentStage: result.currentStage || state.currentStage,
      reasoning: result.reasoning,
    }
  } catch (error) {
    logger.error("Agent stage management failed", { error })
    return {}
  }
}

/**
 * Node 3: Generate Actions
 * Purpose: Create actionable suggestions for the call center agent
 */
async function generateActions(
  state: AgentState
): Promise<Partial<AgentState>> {
  logger.debug("Agent generating actions")

  try {
    const prompt = buildActionGenerationPrompt(state)
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ])

    const result = JSON.parse(response.content as string)

    logger.debug("Agent generated actions", {
      actionCount: (result.actions || []).length,
      backgroundTaskCount: (result.backgroundTasks || []).length
    })

    return {
      nextActions: result.actions || [],
      reasoning: result.reasoning || "",
      backgroundTasks: result.backgroundTasks || [],
    }
  } catch (error) {
    logger.error("Agent action generation failed", { error })
    return { nextActions: [] }
  }
}

/**
 * Node 4: Calculate Health Score
 * Purpose: Assess conversation quality
 */
async function calculateHealthScore(
  state: AgentState
): Promise<Partial<AgentState>> {
  logger.debug("Agent calculating health score")

  // Skip if less than 3 messages
  if (state.messages.length < 3) {
    return { healthScore: 75 }
  }

  try {
    const prompt = buildHealthScorePrompt(state)
    const response = await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ])

    const result = JSON.parse(response.content as string)

    return {
      healthScore: Math.max(0, Math.min(100, result.score || 75)),
    }
  } catch (error) {
    logger.error("Agent health score calculation failed", { error })
    return {}
  }
}

/**
 * Build the Agent Workflow Graph
 *
 * This defines the sequence of steps the agent takes:
 * START → analyze_intent → manage_stages → generate_actions → calculate_health → END
 */
function buildWorkflow() {
  const workflow = new StateGraph({
    channels: {
      messages: {
        reducer: (current: TranscriptMessage[], update: TranscriptMessage[]) => {
          // Keep only last 10 messages for context window management
          const combined = [...current, ...update]
          return combined.slice(-10)
        },
        default: () => [],
      },
      conversationStages: {
        reducer: (_current: any, update: any) => update,
        default: () => [],
      },
      customerProfile: {
        reducer: (current: any, update: any) => ({ ...current, ...update }),
        default: () => ({}),
      },
      detectedIntents: {
        reducer: (_current: any, update: any) => update,
        default: () => [],
      },
      nextActions: {
        reducer: (_current: any, update: any) => update,
        default: () => [],
      },
      currentStage: {
        reducer: (_current: any, update: any) => update,
        default: () => "",
      },
      reasoning: {
        reducer: (_current: any, update: any) => update,
        default: () => "",
      },
      healthScore: {
        reducer: (_current: any, update: any) => update,
        default: () => 75,
      },
      backgroundTasks: {
        reducer: (_current: any, update: any) => update,
        default: () => [],
      },
    },
  } as any)

  // Add nodes (steps in the workflow)
  workflow.addNode("analyze_intent", analyzeIntent)
  workflow.addNode("manage_stages", manageConversationStages)
  workflow.addNode("generate_actions", generateActions)
  workflow.addNode("calculate_health", calculateHealthScore)

  // Define edges (flow between steps)
  workflow.addEdge(START, "analyze_intent" as any)
  workflow.addEdge("analyze_intent" as any, "manage_stages" as any)
  workflow.addEdge("manage_stages" as any, "generate_actions" as any)
  workflow.addEdge("generate_actions" as any, "calculate_health" as any)
  workflow.addEdge("calculate_health" as any, END)

  return workflow.compile()
}

// Compile the workflow once at module load
const agent = buildWorkflow()

/**
 * Execute Agent
 *
 * This is the main function called by the API endpoint.
 * It runs the agent workflow and returns updated state with suggestions.
 */
export async function executeAgent(
  currentState: Partial<AgentState>,
  newMessage: TranscriptMessage
): Promise<AgentState> {
  logger.debug("Agent executing workflow for new message", {
    speaker: newMessage.speaker,
    textLength: newMessage.text.length
  })

  // Merge with default state
  const inputState: AgentState = {
    ...INITIAL_AGENT_STATE,
    ...currentState,
    messages: [...(currentState.messages || []), newMessage],
  }

  try {
    // Run the agent workflow
    const result = await agent.invoke(inputState as any)

    logger.info("Agent workflow complete", { currentStage: result.currentStage })
    return result as AgentState
  } catch (error) {
    logger.error("Agent workflow execution failed", { error })
    // Return current state on error
    return inputState
  }
}
