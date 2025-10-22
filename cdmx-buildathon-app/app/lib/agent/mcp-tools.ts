/**
 * MCP Tool Definitions for Palace Resorts API
 *
 * Maps customer intents to executable MCP tools with confidence thresholds
 * and safety classifications.
 *
 * MCP Server: https://office-hours-buildathon.palaceresorts.com
 */

export interface MCPToolDefinition {
  name: string
  description: string
  intent: string // Primary intent this tool addresses
  parameters: Record<string, {
    type: string
    description: string
    required: boolean
    source?: string // Where to extract from customer profile
  }>

  // Execution characteristics
  estimatedDuration: number // seconds
  riskLevel: "low" | "medium" | "high"
  cost: "free" | "paid" | "commits_inventory"

  // Auto-execution rules
  autoExecuteThreshold: number // Confidence level for auto-execution (0-100)
  requiresConfirmation: boolean // Always require confirmation regardless of confidence
  maxConcurrent: number // Max simultaneous executions of this tool
}

/**
 * Palace API MCP Tools
 * Based on standard hotel booking API patterns
 */
export const PALACE_MCP_TOOLS: Record<string, MCPToolDefinition> = {
  // ==================== DATA LOOKUPS (Low Risk) ====================

  checkAvailability: {
    name: "palace:checkAvailability",
    description: "Search for available rooms matching customer criteria",
    intent: "check_availability",
    parameters: {
      checkIn: {
        type: "string",
        description: "Check-in date (YYYY-MM-DD)",
        required: true,
        source: "customerProfile.travelDates.checkIn"
      },
      checkOut: {
        type: "string",
        description: "Check-out date (YYYY-MM-DD)",
        required: true,
        source: "customerProfile.travelDates.checkOut"
      },
      adults: {
        type: "number",
        description: "Number of adults",
        required: true,
        source: "customerProfile.partySize.adults"
      },
      children: {
        type: "number",
        description: "Number of children",
        required: false,
        source: "customerProfile.partySize.children"
      },
      propertyId: {
        type: "string",
        description: "Specific property ID (optional)",
        required: false,
        source: "customerProfile.preferredProperty"
      }
    },
    estimatedDuration: 3,
    riskLevel: "low",
    cost: "free",
    autoExecuteThreshold: 95,
    requiresConfirmation: false,
    maxConcurrent: 2
  },

  searchProperties: {
    name: "palace:searchProperties",
    description: "Find properties matching customer preferences",
    intent: "search_properties",
    parameters: {
      location: {
        type: "string",
        description: "Destination (e.g., 'Cancun', 'Riviera Maya')",
        required: false,
        source: "customerProfile.preferences.location"
      },
      amenities: {
        type: "array",
        description: "Required amenities",
        required: false,
        source: "customerProfile.preferences.amenities"
      },
      budget: {
        type: "object",
        description: "Price range",
        required: false,
        source: "customerProfile.budget"
      }
    },
    estimatedDuration: 2,
    riskLevel: "low",
    cost: "free",
    autoExecuteThreshold: 95,
    requiresConfirmation: false,
    maxConcurrent: 1
  },

  getPropertyDetails: {
    name: "palace:getPropertyDetails",
    description: "Get detailed information about a specific property",
    intent: "get_property_details",
    parameters: {
      propertyId: {
        type: "string",
        description: "Property ID",
        required: true,
        source: "context.mentionedPropertyId"
      }
    },
    estimatedDuration: 1,
    riskLevel: "low",
    cost: "free",
    autoExecuteThreshold: 95,
    requiresConfirmation: false,
    maxConcurrent: 3
  },

  calculateQuote: {
    name: "palace:calculateQuote",
    description: "Generate pricing quote for specific dates and property",
    intent: "calculate_pricing",
    parameters: {
      propertyId: {
        type: "string",
        description: "Property ID",
        required: true,
        source: "context.selectedPropertyId"
      },
      checkIn: {
        type: "string",
        description: "Check-in date",
        required: true,
        source: "customerProfile.travelDates.checkIn"
      },
      checkOut: {
        type: "string",
        description: "Check-out date",
        required: true,
        source: "customerProfile.travelDates.checkOut"
      },
      adults: {
        type: "number",
        description: "Number of adults",
        required: true,
        source: "customerProfile.partySize.adults"
      },
      children: {
        type: "number",
        description: "Number of children",
        required: false,
        source: "customerProfile.partySize.children"
      },
      roomType: {
        type: "string",
        description: "Preferred room type",
        required: false,
        source: "customerProfile.preferences.roomType"
      }
    },
    estimatedDuration: 2,
    riskLevel: "low",
    cost: "free",
    autoExecuteThreshold: 95,
    requiresConfirmation: false,
    maxConcurrent: 2
  },

  lookupCustomer: {
    name: "palace:lookupCustomer",
    description: "Find existing customer record",
    intent: "lookup_customer",
    parameters: {
      email: {
        type: "string",
        description: "Customer email",
        required: false,
        source: "customerProfile.email"
      },
      phone: {
        type: "string",
        description: "Customer phone",
        required: false,
        source: "customerProfile.phone"
      },
      name: {
        type: "string",
        description: "Customer name",
        required: false,
        source: "customerProfile.name"
      }
    },
    estimatedDuration: 1,
    riskLevel: "low",
    cost: "free",
    autoExecuteThreshold: 90,
    requiresConfirmation: false,
    maxConcurrent: 1
  },

  // ==================== COMMUNICATIONS (Medium Risk) ====================

  sendPropertyEmail: {
    name: "palace:sendPropertyEmail",
    description: "Email property details to customer",
    intent: "send_property_details",
    parameters: {
      propertyId: {
        type: "string",
        description: "Property ID",
        required: true,
        source: "context.selectedPropertyId"
      },
      customerEmail: {
        type: "string",
        description: "Customer email address",
        required: true,
        source: "customerProfile.email"
      },
      includeQuote: {
        type: "boolean",
        description: "Include pricing quote",
        required: false
      }
    },
    estimatedDuration: 2,
    riskLevel: "medium",
    cost: "free",
    autoExecuteThreshold: 92,
    requiresConfirmation: false,
    maxConcurrent: 2
  },

  sendQuoteEmail: {
    name: "palace:sendQuoteEmail",
    description: "Email detailed quote to customer",
    intent: "send_quote",
    parameters: {
      quoteId: {
        type: "string",
        description: "Quote ID",
        required: true,
        source: "context.generatedQuoteId"
      },
      customerEmail: {
        type: "string",
        description: "Customer email",
        required: true,
        source: "customerProfile.email"
      }
    },
    estimatedDuration: 2,
    riskLevel: "medium",
    cost: "free",
    autoExecuteThreshold: 90,
    requiresConfirmation: false,
    maxConcurrent: 2
  },

  scheduleCallback: {
    name: "palace:scheduleCallback",
    description: "Schedule follow-up callback",
    intent: "schedule_callback",
    parameters: {
      customerPhone: {
        type: "string",
        description: "Customer phone number",
        required: true,
        source: "customerProfile.phone"
      },
      preferredTime: {
        type: "string",
        description: "Preferred callback time",
        required: true,
        source: "context.requestedCallbackTime"
      },
      notes: {
        type: "string",
        description: "Notes for callback",
        required: false
      }
    },
    estimatedDuration: 1,
    riskLevel: "medium",
    cost: "free",
    autoExecuteThreshold: 85,
    requiresConfirmation: true,
    maxConcurrent: 1
  },

  // ==================== BOOKINGS (High Risk) ====================

  createHold: {
    name: "palace:createHold",
    description: "Place temporary hold on rooms",
    intent: "create_hold",
    parameters: {
      propertyId: {
        type: "string",
        description: "Property ID",
        required: true
      },
      checkIn: {
        type: "string",
        description: "Check-in date",
        required: true
      },
      checkOut: {
        type: "string",
        description: "Check-out date",
        required: true
      },
      roomCount: {
        type: "number",
        description: "Number of rooms",
        required: true
      },
      holdDuration: {
        type: "number",
        description: "Hold duration in minutes",
        required: false
      }
    },
    estimatedDuration: 3,
    riskLevel: "high",
    cost: "commits_inventory",
    autoExecuteThreshold: 0, // Never auto-execute
    requiresConfirmation: true,
    maxConcurrent: 1
  },

  createBooking: {
    name: "palace:createBooking",
    description: "Create confirmed booking",
    intent: "create_booking",
    parameters: {
      propertyId: {
        type: "string",
        description: "Property ID",
        required: true
      },
      checkIn: {
        type: "string",
        description: "Check-in date",
        required: true
      },
      checkOut: {
        type: "string",
        description: "Check-out date",
        required: true
      },
      guestInfo: {
        type: "object",
        description: "Guest information",
        required: true
      },
      paymentInfo: {
        type: "object",
        description: "Payment information",
        required: true
      }
    },
    estimatedDuration: 5,
    riskLevel: "high",
    cost: "commits_inventory",
    autoExecuteThreshold: 0, // Never auto-execute
    requiresConfirmation: true,
    maxConcurrent: 1
  },

  applyDiscount: {
    name: "palace:applyDiscount",
    description: "Apply discount code to quote",
    intent: "apply_discount",
    parameters: {
      quoteId: {
        type: "string",
        description: "Quote ID",
        required: true
      },
      discountCode: {
        type: "string",
        description: "Discount code",
        required: true,
        source: "context.mentionedDiscountCode"
      }
    },
    estimatedDuration: 2,
    riskLevel: "high",
    cost: "paid",
    autoExecuteThreshold: 0, // Never auto-execute
    requiresConfirmation: true,
    maxConcurrent: 1
  }
}

/**
 * Intent to MCP Tool Mapping
 * Maps detected intents to their corresponding MCP tools
 */
export const INTENT_TO_TOOL_MAP: Record<string, string> = {
  check_availability: "palace:checkAvailability",
  search_properties: "palace:searchProperties",
  get_property_details: "palace:getPropertyDetails",
  calculate_pricing: "palace:calculateQuote",
  lookup_customer: "palace:lookupCustomer",
  send_property_details: "palace:sendPropertyEmail",
  send_quote: "palace:sendQuoteEmail",
  schedule_callback: "palace:scheduleCallback",
  create_hold: "palace:createHold",
  create_booking: "palace:createBooking",
  apply_discount: "palace:applyDiscount",
}

/**
 * Get MCP tool definition by intent
 */
export function getToolByIntent(intent: string): MCPToolDefinition | null {
  const toolName = INTENT_TO_TOOL_MAP[intent]
  if (!toolName) return null

  const toolKey = toolName.replace("palace:", "")
  return PALACE_MCP_TOOLS[toolKey] || null
}

/**
 * Check if all required parameters are available for a tool
 */
export function hasRequiredParameters(
  tool: MCPToolDefinition,
  customerProfile: any,
  context: any = {}
): { hasAll: boolean; missing: string[] } {
  const missing: string[] = []

  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (!paramDef.required) continue

    // Try to extract from source path
    if (paramDef.source) {
      const value = extractFromPath(
        paramDef.source.startsWith("context.") ? context : customerProfile,
        paramDef.source
      )
      if (!value) missing.push(paramName)
    } else {
      missing.push(paramName)
    }
  }

  return {
    hasAll: missing.length === 0,
    missing
  }
}

/**
 * Extract value from nested object path
 */
function extractFromPath(obj: any, path: string): any {
  const parts = path.replace(/^(customerProfile|context)\./, "").split(".")
  let current = obj

  for (const part of parts) {
    if (!current || typeof current !== "object") return null
    current = current[part]
  }

  return current
}

/**
 * Build parameters for MCP tool execution
 */
export function buildToolParameters(
  tool: MCPToolDefinition,
  customerProfile: any,
  context: any = {}
): Record<string, any> {
  const params: Record<string, any> = {}

  for (const [paramName, paramDef] of Object.entries(tool.parameters)) {
    if (paramDef.source) {
      const value = extractFromPath(
        paramDef.source.startsWith("context.") ? context : customerProfile,
        paramDef.source
      )
      if (value) params[paramName] = value
    }
  }

  return params
}
