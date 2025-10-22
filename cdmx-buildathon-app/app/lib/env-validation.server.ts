/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 */

import { logger } from "./logger.server"

interface EnvValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates required environment variables
 * @returns Validation result with errors and warnings
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required variables
  if (!process.env.ANTHROPIC_API_KEY) {
    errors.push("ANTHROPIC_API_KEY is required for AI agent functionality")
  }

  // At least one STT provider required
  if (!process.env.DEEPGRAM_API_KEY && !process.env.OPENAI_API_KEY) {
    errors.push(
      "Either DEEPGRAM_API_KEY or OPENAI_API_KEY is required for speech transcription"
    )
  }

  // Optional but recommended
  if (!process.env.DEEPGRAM_API_KEY) {
    warnings.push(
      "DEEPGRAM_API_KEY not set - will use OpenAI Whisper (no speaker diarization)"
    )
  }

  // Log results
  if (errors.length > 0) {
    logger.error("Environment validation failed", { errors })
  }

  if (warnings.length > 0) {
    logger.warn("Environment validation warnings", { warnings })
  }

  if (errors.length === 0 && warnings.length === 0) {
    logger.info("Environment validation passed")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates environment and throws if invalid
 * Call this during server startup
 */
export function requireValidEnvironment(): void {
  const result = validateEnvironment()

  if (!result.isValid) {
    const errorMessage = `Environment validation failed:\n${result.errors.join("\n")}`
    logger.error(errorMessage)
    throw new Error(errorMessage)
  }
}
