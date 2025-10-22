import type { ActionFunctionArgs } from "react-router"
import { transcribeAudio } from "~/lib/stt-service.server"
import { logger } from "~/lib/logger.server"

// Global state for speaker tracking
// Maps Deepgram speaker IDs (0, 1, 2...) to "agent" or "customer"
const speakerMapping: { [key: number]: "agent" | "customer" } = {}
let firstSpeakerAssigned = false

// For Whisper (no diarization): track last speaker and text length
let lastSpeaker: "agent" | "customer" = "agent"
let consecutiveChunksFromSameSpeaker = 0

function mapSpeakerToRole(deepgramSpeakerId: number): "agent" | "customer" {
  // If we haven't seen this speaker before, assign a role
  if (speakerMapping[deepgramSpeakerId] === undefined) {
    if (!firstSpeakerAssigned) {
      // First speaker is typically the agent (they answer the call)
      speakerMapping[deepgramSpeakerId] = "agent"
      firstSpeakerAssigned = true
    } else {
      // Second speaker is typically the customer
      speakerMapping[deepgramSpeakerId] = "customer"
    }
  }

  return speakerMapping[deepgramSpeakerId]
}

function inferSpeakerForWhisper(text: string, chunkIndex: number): "agent" | "customer" {
  // Heuristic-based speaker detection for when diarization isn't available

  // First chunk is usually the agent greeting
  if (chunkIndex === 0) {
    lastSpeaker = "agent"
    consecutiveChunksFromSameSpeaker = 1
    return "agent"
  }

  // Detect potential speaker change based on:
  // 1. Long pauses (we're getting separate chunks)
  // 2. Question patterns (likely indicates turn-taking)
  // 3. Consecutive chunks from same speaker (people speak in bursts)

  const hasQuestionMark = text.includes("?")
  const hasGreeting = /\b(hello|hi|good morning|good afternoon|thank you for calling)\b/i.test(text)
  const isShort = text.split(/\s+/).length < 8 // Short responses often indicate turn-taking

  // If the previous chunk ended with a question, next chunk is likely different speaker
  if (hasQuestionMark && consecutiveChunksFromSameSpeaker > 0) {
    // Switch speakers after questions
    lastSpeaker = lastSpeaker === "agent" ? "customer" : "agent"
    consecutiveChunksFromSameSpeaker = 1
    return lastSpeaker
  }

  // Agent typically gives greetings
  if (hasGreeting && chunkIndex < 3) {
    lastSpeaker = "agent"
    consecutiveChunksFromSameSpeaker++
    return "agent"
  }

  // Short responses after long statements often indicate speaker change
  if (isShort && consecutiveChunksFromSameSpeaker > 2) {
    lastSpeaker = lastSpeaker === "agent" ? "customer" : "agent"
    consecutiveChunksFromSameSpeaker = 1
    return lastSpeaker
  }

  // If same speaker for many chunks, assume speaker change
  if (consecutiveChunksFromSameSpeaker > 4) {
    lastSpeaker = lastSpeaker === "agent" ? "customer" : "agent"
    consecutiveChunksFromSameSpeaker = 1
    return lastSpeaker
  }

  // Default: continue with same speaker (people speak in bursts)
  consecutiveChunksFromSameSpeaker++
  return lastSpeaker
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get("audio") as File | null
    const timestamp = formData.get("timestamp") as string
    const chunkIndex = formData.get("chunkIndex") as string
    const sequenceNumber = formData.get("sequenceNumber") as string | null
    const channelStrategy = formData.get("channelStrategy") as string | null
    const detectedSpeaker = formData.get("detectedSpeaker") as string | null

    if (!audioBlob) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    logger.debug("Processing audio chunk", {
      chunkIndex,
      timestamp,
      sequenceNumber,
      channelStrategy,
      detectedSpeaker,
      sizeKB: (audioBlob.size / 1024).toFixed(2)
    })

    // Convert File to Blob
    const blob = new Blob([await audioBlob.arrayBuffer()], { type: audioBlob.type })

    // Transcribe the audio chunk using STT service
    const result = await transcribeAudio(blob, "auto")

    const currentChunkIndex = parseInt(chunkIndex, 10)
    const currentSequence = sequenceNumber ? parseInt(sequenceNumber, 10) : currentChunkIndex

    logger.debug("Transcription complete for chunk", {
      chunkIndex,
      sequenceNumber: currentSequence,
      textLength: result.text.length,
      speaker: result.speaker,
      confidence: result.confidence,
      wordsCount: result.words?.length || 0,
      isEmpty: !result.text || result.text.trim().length === 0
    })

    // Skip empty transcriptions (silence or no speech)
    if (!result.text || result.text.trim().length === 0) {
      logger.debug("Skipping chunk - no speech detected", { chunkIndex })
      return Response.json({
        timestamp: parseFloat(timestamp),
        text: "",
        speaker: detectedSpeaker || "agent",
        confidence: 0,
        chunkIndex: currentChunkIndex,
        sequenceNumber: currentSequence,
        words: [],
        isEmpty: true,
      })
    }

    // Determine speaker based on available information
    let speaker: "agent" | "customer"

    // Priority 1: Use speaker detected from channel analysis (most accurate for stereo)
    if (detectedSpeaker === "agent" || detectedSpeaker === "customer") {
      speaker = detectedSpeaker as "agent" | "customer"
      logger.debug("Using channel-based speaker detection", {
        channelStrategy,
        detectedSpeaker: speaker
      })
    }
    // Priority 2: Deepgram provides speaker diarization (for stereo "both" or mono)
    else if (result.speaker !== undefined) {
      speaker = mapSpeakerToRole(result.speaker)
      logger.debug("Using Deepgram diarization", {
        deepgramSpeaker: result.speaker,
        mappedRole: speaker
      })
    }
    // Priority 3: Whisper doesn't provide diarization - use heuristic
    else {
      speaker = inferSpeakerForWhisper(result.text, currentChunkIndex)
      logger.debug("Using heuristic diarization", {
        speaker,
        consecutiveChunks: consecutiveChunksFromSameSpeaker
      })
    }

    return Response.json({
      timestamp: parseFloat(timestamp),
      text: result.text,
      speaker,
      confidence: result.confidence,
      chunkIndex: currentChunkIndex,
      sequenceNumber: currentSequence,
      words: result.words,
      segments: result.segments, // Speaker segments for mid-chunk speaker changes
      channelStrategy,
      deepgramSpeaker: result.speaker, // Include raw speaker ID for debugging
    })
  } catch (error) {
    logger.error("Error transcribing audio chunk", { error })
    return Response.json(
      {
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
