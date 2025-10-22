/**
 * MCP Client for Palace Resorts API
 *
 * Executes MCP tools on the Palace API server and tracks execution progress.
 * Server: https://office-hours-buildathon.palaceresorts.com
 */

import { logger } from "./logger.server"
import type { ExecutableAction, BackgroundTask } from "./agent/state"

const MCP_SERVER_URL = process.env.PALACE_MCP_SERVER_URL || "https://office-hours-buildathon.palaceresorts.com"

export interface MCPExecutionResult {
  success: boolean
  data?: any
  summary?: string
  error?: string
  duration?: number // milliseconds
}

/**
 * Execute an MCP tool with given parameters
 */
export async function executeMCPTool(
  toolName: string,
  parameters: Record<string, any>
): Promise<MCPExecutionResult> {
  const startTime = Date.now()

  logger.info("Executing MCP tool", {
    toolName,
    parameters: Object.keys(parameters),
    server: MCP_SERVER_URL
  })

  try {
    // Make HTTP request to MCP server
    // Note: Adjust endpoint format based on actual Palace MCP server API
    const response = await fetch(`${MCP_SERVER_URL}/tools/${toolName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication if required
        // "Authorization": `Bearer ${process.env.PALACE_API_KEY}`
      },
      body: JSON.stringify(parameters),
    })

    const duration = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("MCP tool execution failed", {
        toolName,
        status: response.status,
        error: errorText
      })

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        duration
      }
    }

    const data = await response.json()

    // Extract summary from response
    const summary = generateSummary(toolName, data)

    logger.info("MCP tool executed successfully", {
      toolName,
      duration,
      summaryLength: summary?.length || 0
    })

    return {
      success: true,
      data,
      summary,
      duration
    }
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error("MCP tool execution error", {
      toolName,
      error: error instanceof Error ? error.message : String(error)
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      duration
    }
  }
}

/**
 * Execute an ExecutableAction (wraps executeMCPTool with action context)
 */
export async function executeAction(
  action: ExecutableAction
): Promise<MCPExecutionResult> {
  if (action.executionType !== "mcp_tool" || !action.toolName) {
    return {
      success: false,
      error: "Action is not an MCP tool or missing toolName"
    }
  }

  return executeMCPTool(action.toolName, action.parameters || {})
}

/**
 * Create a BackgroundTask from an ExecutableAction
 */
export function createBackgroundTask(action: ExecutableAction): BackgroundTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    label: action.label,
    type: action.executionType as BackgroundTask["type"],
    toolName: action.toolName,
    parameters: action.parameters,
    status: "pending",
    startedAt: Date.now(),
    estimatedCompletion: action.estimatedDuration
      ? Date.now() + (action.estimatedDuration * 1000)
      : undefined
  }
}

/**
 * Update background task with execution result
 */
export function updateTaskWithResult(
  task: BackgroundTask,
  result: MCPExecutionResult
): BackgroundTask {
  return {
    ...task,
    status: result.success ? "completed" : "failed",
    completedAt: Date.now(),
    result: result.success
      ? {
          summary: result.summary || "Completed successfully",
          data: result.data
        }
      : undefined,
    error: result.error,
    progress: result.success ? 100 : undefined
  }
}

/**
 * Generate human-readable summary from MCP tool result
 */
function generateSummary(toolName: string, data: any): string {
  try {
    switch (toolName) {
      case "palace:checkAvailability":
        if (data.available && Array.isArray(data.rooms)) {
          return `Found ${data.rooms.length} available room${data.rooms.length !== 1 ? 's' : ''}`
        }
        return "No rooms available for selected dates"

      case "palace:searchProperties":
        if (Array.isArray(data.properties)) {
          return `Found ${data.properties.length} matching propert${data.properties.length !== 1 ? 'ies' : 'y'}`
        }
        return "No properties found matching criteria"

      case "palace:calculateQuote":
        if (data.total && data.currency) {
          return `Quote: ${data.currency} ${data.total}`
        }
        return "Quote generated successfully"

      case "palace:getPropertyDetails":
        if (data.name) {
          return `Retrieved details for ${data.name}`
        }
        return "Property details retrieved"

      case "palace:lookupCustomer":
        if (data.found && data.customerName) {
          return `Found customer: ${data.customerName}`
        }
        return data.found ? "Customer found" : "Customer not found"

      case "palace:sendPropertyEmail":
      case "palace:sendQuoteEmail":
        return data.sent ? "Email sent successfully" : "Failed to send email"

      case "palace:scheduleCallback":
        if (data.scheduled && data.callbackTime) {
          return `Callback scheduled for ${data.callbackTime}`
        }
        return "Callback scheduled"

      case "palace:createHold":
        if (data.holdId) {
          return `Hold created (ID: ${data.holdId})`
        }
        return "Hold created successfully"

      case "palace:createBooking":
        if (data.confirmationNumber) {
          return `Booking confirmed: ${data.confirmationNumber}`
        }
        return "Booking created successfully"

      case "palace:applyDiscount":
        if (data.newTotal && data.discountAmount) {
          return `Discount applied: -${data.discountAmount}, New total: ${data.newTotal}`
        }
        return "Discount applied"

      default:
        return "Tool executed successfully"
    }
  } catch (error) {
    logger.warn("Failed to generate summary", { toolName, error })
    return "Completed"
  }
}

/**
 * Simulate MCP tool execution (for testing without actual MCP server)
 */
export async function simulateMCPExecution(
  toolName: string,
  parameters: Record<string, any>
): Promise<MCPExecutionResult> {
  logger.debug("Simulating MCP tool execution", { toolName })

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Generate mock data based on tool name
  const mockData = generateMockData(toolName, parameters)

  return {
    success: true,
    data: mockData,
    summary: generateSummary(toolName, mockData),
    duration: 1500
  }
}

/**
 * Generate mock data for testing
 */
function generateMockData(toolName: string, parameters: Record<string, any>): any {
  switch (toolName) {
    case "palace:checkAvailability":
      return {
        available: true,
        rooms: [
          { id: "room-1", type: "Deluxe Ocean View", price: 450 },
          { id: "room-2", type: "Premium Suite", price: 650 },
          { id: "room-3", type: "Junior Suite", price: 550 }
        ]
      }

    case "palace:searchProperties":
      return {
        properties: [
          { id: "prop-1", name: "Moon Palace Cancun", location: "Cancun" },
          { id: "prop-2", name: "Beach Palace", location: "Cancun" }
        ]
      }

    case "palace:calculateQuote":
      return {
        total: 2250,
        currency: "USD",
        breakdown: {
          rooms: 2000,
          taxes: 250
        }
      }

    case "palace:lookupCustomer":
      return {
        found: true,
        customerName: "John Doe",
        email: parameters.email || "john@example.com"
      }

    default:
      return { success: true }
  }
}

/**
 * Check if MCP server is available
 */
export async function checkMCPServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    return response.ok
  } catch (error) {
    logger.warn("MCP server health check failed", { error })
    return false
  }
}
