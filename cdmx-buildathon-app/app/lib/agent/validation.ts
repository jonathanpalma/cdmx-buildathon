/**
 * Fast Validation Layer
 *
 * Provides immediate (<500ms) client-side validation of extracted data
 * Catches obvious errors before they reach the agent workflow
 */

import type { CustomerProfile, TranscriptMessage } from "./state"

export interface ValidationIssue {
  field: string
  severity: "error" | "warning" | "info"
  message: string
  suggestion?: string
  autoFix?: Partial<CustomerProfile>
  agentHint?: string // Suggested clarifying question for agent to ask customer
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  confidence: number // 0-100, how confident we are this is wrong
}

/**
 * Validate travel dates for logical consistency
 */
export function validateTravelDates(
  profile: CustomerProfile,
  recentMessages?: TranscriptMessage[]
): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!profile.travelDates?.checkIn || !profile.travelDates?.checkOut) {
    return { valid: true, issues: [], confidence: 100 }
  }

  const checkIn = new Date(profile.travelDates.checkIn)
  const checkOut = new Date(profile.travelDates.checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Check-out must be after check-in
  if (checkOut <= checkIn) {
    // Check if this might be a cross-month stay pattern
    // e.g., "May 28 til the 6th" → May 28 → Jun 6
    const checkInDay = checkIn.getDate()
    const checkOutDay = checkOut.getDate()
    const checkInMonth = checkIn.getMonth()
    const checkOutMonth = checkOut.getMonth()

    // Pattern: High day number (28+) to low day number (1-10)
    // AND same month extracted (which is wrong)
    if (checkInDay >= 25 && checkOutDay <= 10 && checkInMonth === checkOutMonth) {
      // Suggest moving check-out to next month
      const nextMonth = new Date(checkOut)
      nextMonth.setMonth(checkOutMonth + 1)

      issues.push({
        field: "travelDates.checkOut",
        severity: "warning",
        message: `Check-out (${checkOutDay}th) is before check-in (${checkInDay}th)`,
        suggestion: `Did customer mean ${nextMonth.toLocaleString('en-US', { month: 'short' })} ${checkOutDay} instead of ${checkOut.toLocaleString('en-US', { month: 'short' })} ${checkOutDay}?`,
        agentHint: `Ask: "Just to confirm - when you said '${checkIn.toLocaleString('en-US', { month: 'short' })} ${checkInDay} til the ${checkOutDay}th', did you mean checking out on ${nextMonth.toLocaleString('en-US', { month: 'short' })} ${checkOutDay}?"`,
        autoFix: {
          travelDates: {
            ...profile.travelDates,
            checkOut: nextMonth.toISOString().split('T')[0]
          }
        }
      })
    } else {
      // Standard error - dates are clearly wrong
      issues.push({
        field: "travelDates",
        severity: "error",
        message: "Check-out date must be after check-in date",
        suggestion: `Check-in: ${formatDate(checkIn)}, Check-out: ${formatDate(checkOut)} seems wrong`
      })
    }
  }

  // 2. Dates shouldn't be in the past (unless very recent)
  const daysBefore = Math.floor((today.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  if (daysBefore > 1) {
    issues.push({
      field: "travelDates.checkIn",
      severity: "error",
      message: "Check-in date is in the past",
      suggestion: `Did you mean ${checkIn.getFullYear() + 1} instead of ${checkIn.getFullYear()}?`,
      autoFix: {
        travelDates: {
          ...profile.travelDates,
          checkIn: new Date(checkIn.setFullYear(checkIn.getFullYear() + 1)).toISOString().split('T')[0],
          checkOut: new Date(checkOut.setFullYear(checkOut.getFullYear() + 1)).toISOString().split('T')[0]
        }
      }
    })
  }

  // 3. Stay duration seems unusual
  const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
  if (nights === 0) {
    issues.push({
      field: "travelDates",
      severity: "error",
      message: "Same-day check-in and check-out",
      suggestion: "This might be a mistake - typical stays are at least 1 night"
    })
  } else if (nights > 30) {
    issues.push({
      field: "travelDates",
      severity: "warning",
      message: `Very long stay (${nights} nights)`,
      suggestion: "Please verify - this is unusually long for a vacation booking"
    })
  } else if (nights < 0) {
    issues.push({
      field: "travelDates",
      severity: "error",
      message: "Negative stay duration detected",
      suggestion: "Check-in and check-out dates are reversed"
    })
  }

  // 4. Detect common transcription errors (e.g., 29th → 28th)
  if (recentMessages && recentMessages.length > 0) {
    const transcriptErrors = detectDateTranscriptionErrors(profile, recentMessages)
    issues.push(...transcriptErrors)

    // Also check for cross-month patterns in transcript
    const crossMonthIssues = detectCrossMonthPattern(profile, recentMessages)
    issues.push(...crossMonthIssues)
  }

  // 5. Month boundary issues (e.g., April 31 doesn't exist)
  const invalidCheckIn = isInvalidDate(checkIn)
  const invalidCheckOut = isInvalidDate(checkOut)

  if (invalidCheckIn || invalidCheckOut) {
    const maxDay = getMaxDayInMonth(checkIn.getMonth(), checkIn.getFullYear())
    issues.push({
      field: invalidCheckIn ? "travelDates.checkIn" : "travelDates.checkOut",
      severity: "error",
      message: `${checkIn.toLocaleString('default', { month: 'long' })} only has ${maxDay} days`,
      suggestion: `Did you mean ${maxDay}th instead?`,
      autoFix: {
        travelDates: {
          ...profile.travelDates,
          [invalidCheckIn ? "checkIn" : "checkOut"]: new Date(
            checkIn.getFullYear(),
            checkIn.getMonth(),
            maxDay
          ).toISOString().split('T')[0]
        }
      }
    })
  }

  const confidence = issues.length > 0 ? Math.max(...issues.map(i =>
    i.severity === "error" ? 95 : i.severity === "warning" ? 75 : 50
  )) : 100

  return {
    valid: issues.filter(i => i.severity === "error").length === 0,
    issues,
    confidence
  }
}

/**
 * Detect when extracted dates don't match what was said in transcript
 */
function detectDateTranscriptionErrors(
  profile: CustomerProfile,
  messages: TranscriptMessage[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Get last few customer messages
  const recentCustomer = messages
    .filter(m => m.speaker === "customer")
    .slice(-3)
    .map(m => m.text.toLowerCase())
    .join(" ")

  if (!profile.travelDates?.checkIn) return issues

  const checkIn = new Date(profile.travelDates.checkIn)
  const day = checkIn.getDate()

  // Pattern: Customer said "29th" but we extracted 28th
  const mentionedDays = extractMentionedDays(recentCustomer)

  if (mentionedDays.length > 0) {
    const closestMention = mentionedDays.find(mentioned =>
      Math.abs(mentioned - day) === 1 // Off by one day
    )

    if (closestMention) {
      const monthName = checkIn.toLocaleString('en-US', { month: 'long' })
      issues.push({
        field: "travelDates.checkIn",
        severity: "warning",
        message: `Customer said "${closestMention}${getOrdinalSuffix(closestMention)}" but extracted as ${day}${getOrdinalSuffix(day)}`,
        suggestion: `Did they mean ${closestMention}th instead of ${day}th?`,
        agentHint: `Confirm: "I have you checking in on ${monthName} ${day}${getOrdinalSuffix(day)} - is that correct, or did you mean the ${closestMention}${getOrdinalSuffix(closestMention)}?"`,
        autoFix: {
          travelDates: {
            ...profile.travelDates,
            checkIn: new Date(
              checkIn.getFullYear(),
              checkIn.getMonth(),
              closestMention
            ).toISOString().split('T')[0]
          }
        }
      })
    }
  }

  return issues
}

/**
 * Detect cross-month stay patterns in transcript
 * e.g., "May 28 til the 6th" → Should be May 28 → Jun 6
 */
function detectCrossMonthPattern(
  profile: CustomerProfile,
  messages: TranscriptMessage[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!profile.travelDates?.checkIn || !profile.travelDates?.checkOut) {
    return issues
  }

  const checkIn = new Date(profile.travelDates.checkIn)
  const checkOut = new Date(profile.travelDates.checkOut)
  const checkInDay = checkIn.getDate()
  const checkOutDay = checkOut.getDate()
  const checkInMonth = checkIn.getMonth()
  const checkOutMonth = checkOut.getMonth()

  // Get recent customer messages
  const recentCustomer = messages
    .filter(m => m.speaker === "customer")
    .slice(-5)
    .map(m => m.text.toLowerCase())
    .join(" ")

  // Pattern indicators:
  // - "til the Xth" or "to the Xth" (without explicit month for checkout)
  // - "through the Xth"
  // - High check-in day (25+) with low check-out day (1-10)
  const tilPattern = /(til|till|to|through)\s+(?:the\s+)?(\d{1,2})(st|nd|rd|th)?/i
  const match = recentCustomer.match(tilPattern)

  if (match && checkInDay >= 25 && checkOutDay <= 10) {
    const mentionedCheckOutDay = parseInt(match[2], 10)

    // If transcript mentions same day as extracted check-out
    // AND check-in is late in month
    // → Likely meant next month
    if (mentionedCheckOutDay === checkOutDay && checkInMonth === checkOutMonth) {
      const nextMonth = new Date(checkOut)
      nextMonth.setMonth(checkOutMonth + 1)

      issues.push({
        field: "travelDates.checkOut",
        severity: "warning",
        message: `Cross-month stay detected: "${match[0]}" likely means next month`,
        suggestion: `Customer said "${checkIn.toLocaleString('en-US', { month: 'short' })} ${checkInDay} til the ${checkOutDay}th" - probably means ${nextMonth.toLocaleString('en-US', { month: 'short' })} ${checkOutDay}`,
        agentHint: `Clarify: "Just to confirm - you mentioned ${checkIn.toLocaleString('en-US', { month: 'short' })} ${checkInDay} ${match[1]} the ${checkOutDay}th. Did you mean ${nextMonth.toLocaleString('en-US', { month: 'short' })} ${checkOutDay}?"`,
        autoFix: {
          travelDates: {
            ...profile.travelDates,
            checkOut: nextMonth.toISOString().split('T')[0]
          }
        }
      })
    }
  }

  return issues
}

/**
 * Extract day numbers mentioned in text
 */
function extractMentionedDays(text: string): number[] {
  const days: number[] = []

  // Match patterns like "29th", "twenty-ninth", "29", etc.
  const patterns = [
    /(\d{1,2})(st|nd|rd|th)/g,  // 29th, 1st, 2nd, 3rd
    /\b(\d{1,2})\b/g,             // standalone numbers
  ]

  patterns.forEach(pattern => {
    const matches = text.matchAll(pattern)
    for (const match of matches) {
      const num = parseInt(match[1], 10)
      if (num >= 1 && num <= 31) {
        days.push(num)
      }
    }
  })

  // Also check for word forms: "twenty-ninth"
  const wordNumbers: Record<string, number> = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "sixth": 6, "seventh": 7, "eighth": 8, "ninth": 9, "tenth": 10,
    "eleventh": 11, "twelfth": 12, "thirteenth": 13, "fourteenth": 14, "fifteenth": 15,
    "sixteenth": 16, "seventeenth": 17, "eighteenth": 18, "nineteenth": 19, "twentieth": 20,
    "twenty-first": 21, "twenty-second": 22, "twenty-third": 23, "twenty-fourth": 24,
    "twenty-fifth": 25, "twenty-sixth": 26, "twenty-seventh": 27, "twenty-eighth": 28,
    "twenty-ninth": 29, "thirtieth": 30, "thirty-first": 31
  }

  Object.entries(wordNumbers).forEach(([word, num]) => {
    if (text.includes(word)) {
      days.push(num)
    }
  })

  return [...new Set(days)] // Remove duplicates
}

/**
 * Check if a date is invalid (e.g., Feb 30)
 */
function isInvalidDate(date: Date): boolean {
  return Number.isNaN(date.getTime()) || date.getDate() !== new Date(date.toISOString().split('T')[0]).getDate()
}

/**
 * Get maximum day in a month
 */
function getMaxDayInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return "st"
  if (j === 2 && k !== 12) return "nd"
  if (j === 3 && k !== 13) return "rd"
  return "th"
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

/**
 * Validate party size
 */
export function validatePartySize(profile: CustomerProfile): ValidationResult {
  const issues: ValidationIssue[] = []

  if (!profile.partySize?.adults && !profile.partySize?.children) {
    return { valid: true, issues: [], confidence: 100 }
  }

  const adults = profile.partySize.adults || 0
  const children = profile.partySize.children || 0

  // Adults must be at least 1
  if (adults === 0 && children > 0) {
    issues.push({
      field: "partySize.adults",
      severity: "error",
      message: "At least one adult required",
      suggestion: "Booking requires at least 1 adult"
    })
  }

  // Unusually large groups
  if (adults + children > 10) {
    issues.push({
      field: "partySize",
      severity: "warning",
      message: `Large group (${adults + children} people)`,
      suggestion: "Please verify - may need multiple rooms"
    })
  }

  // Negative numbers
  if (adults < 0 || children < 0) {
    issues.push({
      field: "partySize",
      severity: "error",
      message: "Party size cannot be negative",
      suggestion: "Please correct the number of guests"
    })
  }

  const confidence = issues.length > 0 ? 90 : 100

  return { valid: issues.filter(i => i.severity === "error").length === 0, issues, confidence }
}

/**
 * Run all validations on a customer profile
 */
export function validateCustomerProfile(
  profile: CustomerProfile,
  recentMessages?: TranscriptMessage[]
): ValidationResult {
  const results: ValidationResult[] = [
    validateTravelDates(profile, recentMessages),
    validatePartySize(profile),
  ]

  const allIssues = results.flatMap(r => r.issues)
  const hasErrors = allIssues.some(i => i.severity === "error")
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

  return {
    valid: !hasErrors,
    issues: allIssues,
    confidence: avgConfidence
  }
}
