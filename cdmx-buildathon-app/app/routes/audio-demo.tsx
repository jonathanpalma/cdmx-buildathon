import { useState, useCallback, useEffect } from "react"
import type { Route } from "./+types/audio-demo"
import { AudioUpload } from "~/components/audio/audio-upload"
import { AudioPlaybackSimulator } from "~/components/audio/audio-playback-simulator"
import { LiveTranscript, type TranscriptEntry } from "~/components/audio/live-transcript"
import { ConversationNavigator } from "~/components/conversation"
import type { ConversationStageData, ConversationPathData } from "~/components/conversation"
import { getAudioDuration } from "~/lib/audio-utils"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Audio Simulation Demo - CloseLoop" },
    { name: "description", content: "Real-time audio transcription simulation" },
  ]
}

export default function AudioDemo() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Conversation stages
  const stages: ConversationStageData[] = [
    {
      id: "greeting",
      label: "Initial Greeting",
      status: currentStageIndex > 0 ? "completed" : "current",
    },
    {
      id: "needs-assessment",
      label: "Needs Assessment",
      status: currentStageIndex > 1 ? "completed" : currentStageIndex === 1 ? "current" : "future",
    },
    {
      id: "property-selection",
      label: "Property Selection",
      status: currentStageIndex > 2 ? "completed" : currentStageIndex === 2 ? "current" : "future",
    },
    {
      id: "pricing-quote",
      label: "Pricing & Quote",
      status: currentStageIndex > 3 ? "completed" : currentStageIndex === 3 ? "current" : "future",
    },
    {
      id: "closing",
      label: "Closing & Follow-up",
      status: currentStageIndex === 4 ? "current" : "future",
    },
  ]

  // Paths for current stage
  const pathsByStage: Record<number, ConversationPathData[]> = {
    0: [
      {
        id: "greeting-standard",
        label: "Standard Greeting",
        probability: 90,
        recommended: true,
        icon: "check",
        steps: [
          "Greet warmly and introduce yourself",
          "Ask how you can help today",
          "Listen actively to customer needs",
        ],
        script:
          "Good morning! Thank you for calling Palace Resorts. My name is Sarah. How can I help make your vacation dreams come true today?",
        actions: [{ label: "Follow This Path", variant: "default" }],
      },
    ],
    1: [
      {
        id: "assess-family",
        label: "Family Vacation Assessment",
        probability: 85,
        recommended: true,
        icon: "check",
        steps: [
          "Ask about travel dates and flexibility",
          "Identify number of travelers and ages",
          "Understand budget expectations",
          "Note special occasions or preferences",
        ],
        script:
          "I'd love to help you plan the perfect family vacation! Can you tell me when you're looking to travel and how many people will be joining you?",
        actions: [
          { label: "Follow This Path", variant: "default" },
          { label: "Ask About Budget", variant: "outline" },
        ],
      },
    ],
    2: [
      {
        id: "recommend-beach-palace",
        label: "Recommend Beach Palace Cancún",
        probability: 85,
        recommended: true,
        icon: "check",
        steps: [
          "Highlight family-friendly amenities",
          "Mention current kids-stay-free promotion",
          "Check availability for requested dates",
          "Prepare customized quote",
        ],
        script:
          "Based on what you've shared, Beach Palace Cancún would be perfect for your family! It's in the heart of the Hotel Zone with beautiful beaches. We have a kids-stay-free promotion that could save you up to 40%. Let me check availability for December.",
        actions: [
          { label: "Follow This Path", variant: "default" },
          { label: "Check Availability", variant: "outline" },
        ],
      },
      {
        id: "compare-properties",
        label: "Compare Multiple Properties",
        probability: 60,
        recommended: false,
        icon: "info",
        steps: [
          "Present 2-3 property options",
          "Highlight unique features of each",
          "Compare pricing and value",
          "Let customer choose",
        ],
        script:
          "I can show you a few excellent options! Beach Palace is great for families, while Moon Palace has an amazing water park. Le Blanc is adults-only luxury. Which sounds most appealing?",
        actions: [
          { label: "Follow This Path", variant: "default" },
          { label: "Show Comparison", variant: "secondary" },
        ],
      },
    ],
    3: [
      {
        id: "present-quote",
        label: "Present Quote with Value",
        probability: 80,
        recommended: true,
        icon: "check",
        steps: [
          "Break down all-inclusive value",
          "Highlight current promotions",
          "Offer payment plan options",
          "Create urgency with limited availability",
        ],
        script:
          "For your family of 4 in December, the total is $4,850 for 7 nights - that includes all meals, premium drinks, water sports, kids' activities, and entertainment. With our kids-stay-free promotion, you're saving $1,200! We only have 3 rooms left for those dates.",
        actions: [
          { label: "Follow This Path", variant: "default" },
          { label: "Send Quote", variant: "outline" },
          { label: "Adjust Dates", variant: "secondary" },
        ],
      },
    ],
  }

  const currentPaths = pathsByStage[currentStageIndex] || []

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setAudioFile(file)
    setTranscriptEntries([])
    setCurrentStageIndex(0)
    setIsProcessing(false)
  }, [])

  // Handle transcript updates from playback
  const handleTranscriptUpdate = useCallback((event: any) => {
    setCurrentTime(event.timestamp)
  }, [])

  // Connect to SSE stream when processing starts
  useEffect(() => {
    if (!audioFile || !isProcessing) return

    const eventSource = new EventSource("/api/transcribe-stream?mock=true&chunkDuration=2")

    eventSource.addEventListener("message", (event) => {
      const data = JSON.parse(event.data)

      if (data.type === "transcript") {
        const newEntry: TranscriptEntry = {
          id: `entry-${Date.now()}-${Math.random()}`,
          timestamp: data.timestamp,
          text: data.text,
          speaker: data.speaker,
          confidence: data.confidence,
          isFinal: data.isFinal,
        }

        setTranscriptEntries((prev) => [...prev, newEntry])

        // Progress stages based on conversation flow
        const entryCount = transcriptEntries.length + 1
        if (entryCount >= 2 && currentStageIndex === 0) {
          setCurrentStageIndex(1)
        } else if (entryCount >= 4 && currentStageIndex === 1) {
          setCurrentStageIndex(2)
        } else if (entryCount >= 6 && currentStageIndex === 2) {
          setCurrentStageIndex(3)
        } else if (entryCount >= 8 && currentStageIndex === 3) {
          setCurrentStageIndex(4)
        }
      }
    })

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "complete") {
        eventSource.close()
        setIsProcessing(false)
      }
    })

    eventSource.addEventListener("error", (event) => {
      console.error("SSE error:", event)
      eventSource.close()
      setIsProcessing(false)
    })

    return () => {
      eventSource.close()
    }
  }, [audioFile, isProcessing, transcriptEntries.length, currentStageIndex])

  // Start processing when playback begins
  useEffect(() => {
    if (audioFile && !isProcessing) {
      // Small delay before starting SSE
      const timer = setTimeout(() => setIsProcessing(true), 500)
      return () => clearTimeout(timer)
    }
  }, [audioFile, isProcessing])

  const handleFollowPath = useCallback((pathId: string) => {
    console.log("Following path:", pathId)
    alert(`Path selected: ${pathId}`)
  }, [])

  const handleAction = useCallback((pathId: string, actionLabel: string) => {
    console.log("Action:", actionLabel, "for path:", pathId)
    alert(`Action: ${actionLabel}`)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Audio Simulation Demo
          </h1>
          <p className="text-gray-600">
            Upload an audio sample and watch real-time transcription with AI-powered guidance
          </p>
        </div>

        {/* Audio Upload */}
        {!audioFile && (
          <div className="max-w-2xl mx-auto">
            <AudioUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {/* Main Content */}
        {audioFile && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Audio Player & Transcript */}
            <div className="space-y-6">
              <AudioPlaybackSimulator
                audioFile={audioFile}
                onTranscriptUpdate={handleTranscriptUpdate}
                simulateRealtime={true}
                chunkDuration={2}
              />

              <LiveTranscript
                entries={transcriptEntries}
                currentTime={currentTime}
                autoScroll={true}
                showConfidence={true}
              />
            </div>

            {/* Right Column: Conversation Navigator */}
            <div>
              <ConversationNavigator
                stages={stages}
                currentStagePaths={currentPaths}
                onFollowPath={handleFollowPath}
                onAction={handleAction}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        {!audioFile && (
          <div className="max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Upload an audio sample (MP3, WAV, or M4A)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Watch as the audio is transcribed in real-time</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>See AI-powered conversation guidance appear based on the dialogue</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Follow suggested paths and take actions to optimize the conversation</span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
