/**
 * Agent API Endpoint
 *
 * POST /api/agent
 *
 * Receives new transcript messages and returns AI-powered suggestions.
 * This endpoint is called by the frontend after each transcript update.
 */

import type { Route } from "./+types/api.agent"
import { executeAgent } from "~/lib/agent/workflow.server"
import type { AgentState, TranscriptMessage } from "~/lib/agent/state"
import { logger } from "~/lib/logger.server"

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const body = await request.json()

    // Validate request
    if (!body.message) {
      return Response.json({ error: "Missing message field" }, { status: 400 })
    }

    const newMessage: TranscriptMessage = {
      speaker: body.message.speaker,
      text: body.message.text,
      timestamp: body.message.timestamp,
    }

    // Current agent state (sent from frontend to maintain context)
    const currentState: Partial<AgentState> = body.currentState || {}

    // Execute agent workflow
    const updatedState = await executeAgent(currentState, newMessage)

    // Return updated state with AI suggestions
    return Response.json({
      success: true,
      state: updatedState,
    })
  } catch (error) {
    logger.error("API agent execution error", { error })
    return Response.json(
      {
        error: "Failed to execute agent",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
