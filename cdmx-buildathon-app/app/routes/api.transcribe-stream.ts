/**
 * SSE (Server-Sent Events) endpoint for streaming audio transcription
 *
 * This endpoint receives audio chunks and streams back transcriptions in real-time
 */

import type { LoaderFunctionArgs } from "react-router"
import { transcribeAudio } from "~/lib/stt-service.server"
import { logger } from "~/lib/logger.server"

export async function loader({ request }: LoaderFunctionArgs) {
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper to send SSE message
      const sendEvent = (data: unknown, event = "message") => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        // Send initial connection message
        sendEvent({ type: "connected", timestamp: Date.now() }, "status")

        // For real transcription, clients should send audio chunks via POST
        sendEvent(
          {
            type: "error",
            message: "Real-time transcription requires audio chunks to be sent via POST to /api/transcribe-chunk",
          },
          "error"
        )
        controller.close()
      } catch (error) {
        logger.error("Stream error", { error })
        sendEvent(
          {
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
          "error"
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
}

/**
 * POST endpoint for processing individual audio chunks
 */
export async function action({ request }: LoaderFunctionArgs) {
  try {
    const formData = await request.formData()
    const audioBlob = formData.get("audio") as Blob
    const timestamp = parseFloat(formData.get("timestamp") as string)
    const speaker = formData.get("speaker") as "agent" | "customer" | null

    if (!audioBlob) {
      return Response.json({ error: "No audio provided" }, { status: 400 })
    }

    // Transcribe the audio chunk
    const result = await transcribeAudio(audioBlob, "auto")

    return Response.json({
      timestamp,
      text: result.text,
      speaker: speaker || "unknown",
      confidence: result.confidence,
      words: result.words,
    })
  } catch (error) {
    logger.error("Transcription error", { error })
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    )
  }
}
