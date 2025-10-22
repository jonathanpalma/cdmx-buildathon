/**
 * Speech-to-Text Service Integration
 * Supports both Deepgram and OpenAI Whisper
 */

import { createClient } from "@deepgram/sdk"

export interface TranscriptionResult {
  text: string
  confidence?: number
  speaker?: number // Speaker ID from diarization (0, 1, 2, etc.)
  words?: Array<{
    word: string
    start: number
    end: number
    confidence: number
    speaker?: number
  }>
}

/**
 * Transcribe audio using Deepgram SDK
 */
export async function transcribeWithDeepgram(
  audioBlob: Blob
): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY

  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY environment variable is not set")
  }

  const deepgram = createClient(apiKey)

  try {
    // Convert Blob to Buffer for the SDK
    const arrayBuffer = await audioBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-2",
        smart_format: true,
        punctuate: true,
        diarize: true,
        multichannel: true,
      }
    )

    if (error) {
      console.error("Deepgram SDK error:", error)
      throw new Error(`Deepgram transcription failed: ${error.message}`)
    }

    if (!result) {
      throw new Error("No result from Deepgram")
    }

    console.log("Deepgram response:", {
      hasResults: !!result.results,
      hasChannels: !!result.results?.channels,
      channelCount: result.results?.channels?.length || 0,
    })

    // With multichannel=true, Deepgram returns separate results for each channel
    const channels = result.results?.channels || []

    if (channels.length === 0) {
      console.warn("No channels in Deepgram response")
      return { text: "", confidence: 0, speaker: undefined }
    }

    // Collect all words from all channels with their timestamps
    interface WordWithChannel {
      word: string
      start: number
      end: number
      confidence: number
      speaker: number
      channel: number
    }

    const allWords: WordWithChannel[] = []
    let totalConfidence = 0
    let wordCount = 0

    channels.forEach((channel, channelIndex: number) => {
      const alternative = channel?.alternatives?.[0]
      console.log(`Channel ${channelIndex}:`, {
        hasWords: !!alternative?.words,
        wordCount: alternative?.words?.length || 0,
        transcript: alternative?.transcript?.substring(0, 50),
      })

      if (alternative?.words) {
        alternative.words.forEach((word) => {
          // For multichannel stereo recordings (agent/customer on separate channels),
          // use the channel index as the speaker ID instead of Deepgram's speaker ID
          // Channel 0 = Speaker 0 (typically agent)
          // Channel 1 = Speaker 1 (typically customer)
          const speakerId = channelIndex

          allWords.push({
            word: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence || 0,
            speaker: speakerId,
            channel: channelIndex,
          })
          totalConfidence += word.confidence || 0
          wordCount++
        })
      }
    })

    if (allWords.length === 0) {
      console.warn("No words found in any channel")
      return { text: "", confidence: 0, speaker: undefined }
    }

    // Group words by speaker/channel
    const wordsBySpeaker: { [key: number]: WordWithChannel[] } = {}
    for (const word of allWords) {
      if (!wordsBySpeaker[word.speaker]) {
        wordsBySpeaker[word.speaker] = []
      }
      wordsBySpeaker[word.speaker].push(word)
    }

    // Count which speaker spoke the most words in this chunk
    const speakerCounts: { [key: number]: number } = {}
    for (const [speaker, words] of Object.entries(wordsBySpeaker)) {
      speakerCounts[Number.parseInt(speaker, 10)] = words.length
    }

    // Determine the primary speaker for this chunk
    let primarySpeaker = 0
    let maxCount = 0
    for (const [speaker, count] of Object.entries(speakerCounts)) {
      if (count > maxCount) {
        maxCount = count
        primarySpeaker = Number.parseInt(speaker, 10)
      }
    }

    // Sort words by start time to reconstruct proper conversation order
    allWords.sort((a, b) => a.start - b.start)

    // Build transcript from sorted words
    const text = allWords.map((w) => w.word).join(" ")
    const avgConfidence = totalConfidence / wordCount

    // Log first few words to debug speaker assignment
    const sampleWords = allWords.slice(0, 5).map((w) => ({
      word: w.word,
      speaker: w.speaker,
      channel: w.channel,
    }))

    console.log("Parsed multichannel response:", {
      channels: channels.length,
      totalWords: allWords.length,
      primarySpeaker,
      speakerCounts,
      sampleWords,
      text: `${text.substring(0, 100)}...`,
    })

    return {
      text,
      confidence: avgConfidence,
      speaker: primarySpeaker,
      words: allWords,
    }
  } catch (error) {
    console.error("Deepgram transcription error:", error)
    throw error
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 * Note: Whisper doesn't have built-in speaker diarization
 */
export async function transcribeWithWhisper(
  audioBlob: Blob
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
  }

  const formData = new FormData()
  formData.append("file", audioBlob, "audio.wav")
  formData.append("model", "whisper-1")
  formData.append("response_format", "verbose_json")
  formData.append("timestamp_granularities[]", "word")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`OpenAI Whisper API error: ${response.statusText}`)
  }

  const data = await response.json()

  // Whisper doesn't provide speaker diarization
  // We'll return undefined for speaker, and the API endpoint
  // will use a smarter heuristic based on previous chunks
  return {
    text: data.text,
    confidence: data.confidence,
    words: data.words,
    speaker: undefined, // No diarization available
  }
}

/**
 * Main transcription function with fallback
 */
export async function transcribeAudio(
  audioBlob: Blob,
  provider: "deepgram" | "whisper" | "auto" = "auto"
): Promise<TranscriptionResult> {
  // Determine which provider to use
  let selectedProvider = provider

  if (provider === "auto") {
    // Prefer Deepgram if available, fallback to Whisper
    selectedProvider = process.env.DEEPGRAM_API_KEY ? "deepgram" : "whisper"
  }

  try {
    if (selectedProvider === "deepgram") {
      return await transcribeWithDeepgram(audioBlob)
    } else {
      return await transcribeWithWhisper(audioBlob)
    }
  } catch (error) {
    console.error(`Transcription error with ${selectedProvider}:`, error)

    // Try fallback provider
    if (provider === "auto") {
      const fallbackProvider = selectedProvider === "deepgram" ? "whisper" : "deepgram"
      console.log(`Attempting fallback to ${fallbackProvider}`)

      try {
        if (fallbackProvider === "deepgram") {
          return await transcribeWithDeepgram(audioBlob)
        } else {
          return await transcribeWithWhisper(audioBlob)
        }
      } catch (fallbackError) {
        console.error(`Fallback transcription error:`, fallbackError)
      }
    }

    // If all else fails, return mock data for development
    if (process.env.NODE_ENV === "development") {
      console.warn("Using mock transcription data for development")
      return {
        text: "[Mock transcription - API key not configured]",
        confidence: 0.5,
      }
    }

    throw error
  }
}

/**
 * Mock transcription for testing/demo without API keys
 */
export function mockTranscription(chunkIndex: number): TranscriptionResult {
  const mockTranscripts = [
    "Hi, thank you for calling Palace Resorts. How can I help you today?",
    "Hello! I'm interested in booking a family vacation to Cancun.",
    "That's wonderful! When are you looking to travel?",
    "We're thinking sometime in December, around the holidays.",
    "Great choice! December is beautiful in Cancun. How many people will be traveling?",
    "It'll be me, my wife, and our two kids - ages 8 and 12.",
    "Perfect! I'd like to recommend Beach Palace Cancún. It's very family-friendly.",
    "That sounds good. What's included in the package?",
    "It's all-inclusive - meals, drinks, water sports, and kids activities.",
    "What about pricing? We're trying to stay within budget.",
  ]

  const index = chunkIndex % mockTranscripts.length

  return {
    text: mockTranscripts[index],
    confidence: 0.85 + Math.random() * 0.15,
  }
}
