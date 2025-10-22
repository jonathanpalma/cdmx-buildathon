import type { Route } from "./+types/_index";
import { useState, useCallback, useMemo } from "react"
import { AudioUpload } from "~/components/audio/audio-upload"
import { AudioPlaybackSimulator } from "~/components/audio/audio-playback-simulator"
import { LiveTranscriptImproved as LiveTranscript, type TranscriptEntry } from "~/components/audio/live-transcript-improved"
import { ConversationNavigator } from "~/components/conversation"
import type { ConversationStageData, ConversationPathData } from "~/components/conversation"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CloseLoop - AI Call Center Copilot" },
    { name: "description", content: "AI-powered copilot for call center agents" },
  ];
}

// Static conversation paths (moved outside component for performance)
const PATHS_BY_STAGE: Record<number, ConversationPathData[]> = {
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

export default function Index() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [conversationHealth, setConversationHealth] = useState(75)

  // Conversation stages (memoized to avoid recreating on every render)
  const stages = useMemo<ConversationStageData[]>(() => [
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
  ], [currentStageIndex])

  // Get paths for current stage
  const currentPaths = PATHS_BY_STAGE[currentStageIndex] || []

  // Calculate conversation health based on various metrics
  const calculateConversationHealth = useCallback((entries: TranscriptEntry[]) => {
    if (entries.length === 0) return 75 // Default starting health

    let health = 100

    // Factor 1: Average confidence score (lower confidence = worse health)
    const avgConfidence = entries.reduce((sum, e) => sum + (e.confidence || 0), 0) / entries.length
    health -= (1 - avgConfidence) * 20 // Reduce up to 20 points for low confidence

    // Factor 2: Sentiment analysis (if available)
    const negativeCount = entries.filter(e => e.sentiment === "negative" || e.sentiment === "concerned").length
    health -= (negativeCount / entries.length) * 30 // Reduce up to 30 points for negative sentiment

    // Factor 3: Agent-to-customer ratio (good conversations have balanced turns)
    const agentCount = entries.filter(e => e.speaker === "agent").length
    const customerCount = entries.filter(e => e.speaker === "customer").length
    const ratio = customerCount > 0 ? agentCount / customerCount : 1
    if (ratio > 3 || ratio < 0.3) {
      health -= 15 // Reduce 15 points if conversation is too one-sided
    }

    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, Math.round(health)))
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setAudioFile(file)
    setTranscriptEntries([])
    setCurrentStageIndex(0)
    setIsPlaying(false)
    setConversationHealth(75) // Reset health
  }, [])

  // Handle transcript updates from playback
  const handleTranscriptUpdate = useCallback((event: any) => {
    setCurrentTime(event.timestamp)

    // Skip empty transcriptions (silence or API returned no text)
    if (!event.text || !event.text.trim() || event.isEmpty) {
      return
    }

    setTranscriptEntries((prev) => {
      // Check if this message already exists
      const exists = prev.some(
        (entry) =>
          entry.timestamp === event.timestamp && entry.text === event.text
      )

      if (exists) {
        return prev
      }

      // Check if we should merge with the last entry from the same speaker
      const lastEntry = prev[prev.length - 1]
      const shouldMerge =
        lastEntry &&
        lastEntry.speaker === event.speaker &&
        event.timestamp - lastEntry.timestamp < 5 // Merge if within 5 seconds

      if (shouldMerge) {
        // Create merged entry
        const mergedEntry: TranscriptEntry = {
          ...lastEntry,
          text: `${lastEntry.text} ${event.text}`,
          confidence: (lastEntry.confidence! + event.confidence) / 2, // Average confidence
        }

        // Replace last entry with merged one
        return [...prev.slice(0, -1), mergedEntry]
      }

      // Create new entry
      const newEntry: TranscriptEntry = {
        id: `entry-${event.chunkIndex}-${event.timestamp}`,
        timestamp: event.timestamp,
        text: event.text,
        speaker: event.speaker,
        confidence: event.confidence,
        isFinal: true,
      }

      const newEntries = [...prev, newEntry]

      // Progress stages based on conversation flow (count unique speaker turns, not total messages)
      const speakerTurns = newEntries.reduce((count, entry, index) => {
        if (index === 0 || entry.speaker !== newEntries[index - 1].speaker) {
          return count + 1
        }
        return count
      }, 0)

      if (speakerTurns >= 2 && currentStageIndex === 0) {
        setCurrentStageIndex(1)
      } else if (speakerTurns >= 4 && currentStageIndex === 1) {
        setCurrentStageIndex(2)
      } else if (speakerTurns >= 6 && currentStageIndex === 2) {
        setCurrentStageIndex(3)
      } else if (speakerTurns >= 8 && currentStageIndex === 3) {
        setCurrentStageIndex(4)
      }

      // Update conversation health based on new entries
      setConversationHealth(calculateConversationHealth(newEntries))

      return newEntries
    })
  }, [currentStageIndex, calculateConversationHealth])

  const handleFollowPath = useCallback((pathId: string) => {
    // TODO: Implement path following logic
    // This will integrate with the Palace API to execute recommended actions
  }, [])

  const handleAction = useCallback((pathId: string, actionLabel: string) => {
    // TODO: Implement action handling logic
    // This will trigger specific actions like checking availability, generating quotes, etc.
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CloseLoop</h1>
              <p className="text-gray-600 mt-1">AI-Powered Call Center Copilot</p>
            </div>
            {audioFile && (
              <button
                onClick={() => {
                  setAudioFile(null)
                  setTranscriptEntries([])
                  setCurrentStageIndex(0)
                  setIsPlaying(false)
                  setConversationHealth(75)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50"
              >
                Upload New Audio
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Audio Upload Section */}
        {!audioFile && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Upload a Call Recording
              </h2>
              <p className="text-gray-600">
                Upload an audio or video file to see real-time transcription with AI-powered conversation guidance
              </p>
            </div>
            <AudioUpload onFileSelect={handleFileSelect} />

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Upload an audio/video file (MP3, WAV, M4A, MP4, WebM)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Play the audio and watch real-time transcription</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>See AI-powered conversation guidance based on the dialogue</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Follow suggested paths to optimize the conversation outcome</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Main Demo Interface */}
        {audioFile && (
          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
            {/* Left Column: Audio Player & Transcript */}
            <div className="flex flex-col gap-6 h-full overflow-hidden">
              <div className="flex-shrink-0">
                <AudioPlaybackSimulator
                  audioFile={audioFile}
                  onTranscriptUpdate={handleTranscriptUpdate}
                  onPlaybackStateChange={setIsPlaying}
                  simulateRealtime={true}
                  chunkDuration={2}
                />
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <LiveTranscript
                  entries={transcriptEntries}
                  isListening={isPlaying}
                  currentTime={currentTime}
                  conversationHealth={conversationHealth}
                  currentStage={stages[currentStageIndex]?.label || "Initial Assessment"}
                  autoScroll={true}
                  showConfidence={true}
                />
              </div>
            </div>

            {/* Right Column: Conversation Navigator */}
            <div className="h-full overflow-y-auto">
              <ConversationNavigator
                stages={stages}
                currentStagePaths={currentPaths}
                onFollowPath={handleFollowPath}
                onAction={handleAction}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
