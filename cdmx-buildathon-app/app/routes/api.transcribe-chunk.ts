import type { ActionFunctionArgs } from "react-router"
import { transcribeAudio } from "~/lib/stt-service.server"

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

    if (!audioBlob) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log(
      `Processing chunk ${chunkIndex} at ${timestamp}s (${(audioBlob.size / 1024).toFixed(2)} KB)`
    )

    // Convert File to Blob
    const blob = new Blob([await audioBlob.arrayBuffer()], { type: audioBlob.type })

    // Transcribe the audio chunk using STT service
    const result = await transcribeAudio(blob, "auto")

    const currentChunkIndex = parseInt(chunkIndex, 10)

    console.log(
      `Transcription complete for chunk ${chunkIndex}:`,
      {
        text: result.text,
        textLength: result.text.length,
        speaker: result.speaker,
        confidence: result.confidence,
        wordsCount: result.words?.length || 0,
        isEmpty: !result.text || result.text.trim().length === 0
      }
    )

    // Skip empty transcriptions (silence or no speech)
    if (!result.text || result.text.trim().length === 0) {
      console.log(`Skipping chunk ${chunkIndex} - no speech detected`)
      return Response.json({
        timestamp: parseFloat(timestamp),
        text: "",
        speaker: "agent",
        confidence: 0,
        chunkIndex: currentChunkIndex,
        words: [],
        isEmpty: true,
      })
    }

    // Determine speaker based on available information
    let speaker: "agent" | "customer"

    if (result.speaker !== undefined) {
      // Deepgram provides speaker diarization - use it
      speaker = mapSpeakerToRole(result.speaker)
      console.log(`Using Deepgram diarization: Speaker ${result.speaker} → ${speaker}`)
    } else {
      // Whisper doesn't provide diarization - use heuristic
      speaker = inferSpeakerForWhisper(result.text, currentChunkIndex)
      console.log(`Using heuristic diarization: ${speaker} (consecutive: ${consecutiveChunksFromSameSpeaker})`)
    }

    return Response.json({
      timestamp: parseFloat(timestamp),
      text: result.text,
      speaker,
      confidence: result.confidence,
      chunkIndex: currentChunkIndex,
      words: result.words,
      deepgramSpeaker: result.speaker, // Include raw speaker ID for debugging
    })
  } catch (error) {
    console.error("Error transcribing audio chunk:", error)
    return Response.json(
      {
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
