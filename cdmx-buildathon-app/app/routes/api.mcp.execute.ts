/**
 * MCP Tool Execution API Endpoint
 *
 * Receives action execution requests from the frontend and executes
 * MCP tools against the Palace Resorts API server.
 */

import type { Route } from "./+types/api.mcp.execute"
import { executeAction } from "~/lib/mcp-client.server"
import type { ExecutableAction } from "~/lib/agent/state"
import { logger } from "~/lib/logger.server"

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const body = await request.json()
    const { actionId, toolName, parameters } = body

    logger.info("MCP execution request received", {
      actionId,
      toolName,
      parameterKeys: Object.keys(parameters || {}),
    })

    // Validate request
    if (!toolName) {
      return Response.json(
        {
          success: false,
          error: "Missing toolName parameter",
        },
        { status: 400 }
      )
    }

    // Create ExecutableAction object for execution
    const action: ExecutableAction = {
      id: actionId,
      intent: "",
      label: toolName,
      description: "",
      executionType: "mcp_tool",
      toolName,
      parameters,
      confidence: 100,
      priority: "high",
      requiresConfirmation: false,
      riskLevel: "low",
      status: "executing",
    }

    // Execute the MCP tool
    const result = await executeAction(action)

    logger.info("MCP execution result", {
      actionId,
      toolName,
      success: result.success,
      duration: result.duration,
    })

    return Response.json({
      success: result.success,
      data: result.data,
      summary: result.summary,
      error: result.error,
      duration: result.duration,
    })
  } catch (error) {
    logger.error("MCP execution endpoint error", { error })

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
