/**
 * SSE (Server-Sent Events) endpoint for streaming audio transcription
 *
 * This endpoint receives audio chunks and streams back transcriptions in real-time
 */

import type { LoaderFunctionArgs } from "react-router"
import { transcribeAudio, mockTranscription } from "~/lib/stt-service.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const useMock = url.searchParams.get("mock") === "true"
  const chunkDuration = parseInt(url.searchParams.get("chunkDuration") || "2")

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Helper to send SSE message
      const sendEvent = (data: any, event = "message") => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      try {
        // Send initial connection message
        sendEvent({ type: "connected", timestamp: Date.now() }, "status")

        // If using mock mode, simulate streaming
        if (useMock) {
          let chunkIndex = 0
          const mockInterval = chunkDuration * 1000

          const intervalId = setInterval(() => {
            const result = mockTranscription(chunkIndex)
            const speaker = chunkIndex % 2 === 0 ? "agent" : "customer"

            sendEvent({
              type: "transcript",
              timestamp: chunkIndex * chunkDuration,
              text: result.text,
              speaker,
              confidence: result.confidence,
              isFinal: true,
              chunkIndex,
            })

            chunkIndex++

            // Stop after 10 chunks (20 seconds of conversation)
            if (chunkIndex >= 10) {
              clearInterval(intervalId)
              sendEvent({ type: "complete", timestamp: Date.now() }, "status")
              controller.close()
            }
          }, mockInterval)

          // Clean up on stream close
          return () => clearInterval(intervalId)
        }

        // For real transcription, we'd process uploaded chunks
        // This would be called by the client sending chunks via POST
        sendEvent(
          {
            type: "error",
            message: "Real-time transcription requires audio chunks to be sent via POST",
          },
          "error"
        )
        controller.close()
      } catch (error) {
        console.error("Stream error:", error)
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
    console.error("Transcription error:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Transcription failed",
      },
      { status: 500 }
    )
  }
}
