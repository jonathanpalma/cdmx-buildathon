import { useEffect, useRef, useState } from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import {
  Bookmark,
  Copy,
  Flag,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react"

export interface TranscriptEntry {
  id: string
  speaker: "agent" | "customer"
  text: string
  timestamp: number
  isCurrent?: boolean
  sentiment?: "positive" | "negative" | "neutral" | "concerned"
  confidence?: number
  isFinal?: boolean
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[]
  isListening?: boolean
  currentTime?: number
  conversationHealth?: number
  currentStage?: string
  autoScroll?: boolean
  showConfidence?: boolean
}

export function LiveTranscriptImproved({
  entries,
  isListening = true,
  currentTime = 0,
  conversationHealth = 75,
  currentStage = "Initial Assessment",
  autoScroll = true,
  showConfidence = false,
}: LiveTranscriptProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set())
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getRelativeTime = (timestamp: number) => {
    const diff = currentTime - timestamp
    if (diff < 10) return "Just now"
    if (diff < 60) return `${Math.floor(diff)}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return formatTime(timestamp)
  }

  useEffect(() => {
    if (!isUserScrolling && messagesEndRef.current && autoScroll) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      setNewMessageCount(0)
    } else if (isUserScrolling) {
      setNewMessageCount((prev) => prev + 1)
    }
  }, [entries, isUserScrolling, autoScroll])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsUserScrolling(!isNearBottom)
      if (isNearBottom) {
        setNewMessageCount(0)
      }
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    setIsUserScrolling(false)
    setNewMessageCount(0)
  }

  const toggleBookmark = (messageId: string) => {
    setBookmarkedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const copyMessage = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const getHealthColor = (health: number) => {
    if (health >= 70) return "text-green-600"
    if (health >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getSpeakerColor = (speaker: "agent" | "customer") => {
    return speaker === "agent" ? "text-blue-700" : "text-gray-700"
  }

  const getSpeakerBorder = (speaker: "agent" | "customer") => {
    return speaker === "agent" ? "border-l-blue-500" : "border-l-gray-400"
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">Live Transcript</h2>
          <div className="flex items-center gap-3">
            <Badge variant={isListening ? "default" : "secondary"} className="text-xs gap-1.5">
              <span className={cn(
                "inline-block w-1.5 h-1.5 rounded-full",
                isListening ? "bg-white animate-pulse" : "bg-gray-400"
              )} />
              {isListening ? "Listening" : "Paused"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-mono text-gray-700">{formatTime(currentTime)}</span>
          </div>

          {entries.length > 0 && (
            <>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600">Health:</span>
                <span className={cn("font-semibold", getHealthColor(conversationHealth))}>
                  {conversationHealth}%
                </span>
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600">Stage:</span>
                <span className="font-medium text-gray-900">{currentStage}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages - Continuous Format */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pl-16 pr-4 py-4 space-y-1 min-h-0 bg-white"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Waiting for conversation to begin...</p>
            <p className="text-sm text-gray-400 mt-1">
              The transcript will appear here as people speak
            </p>
          </div>
        ) : (
          entries.map((message, index) => {
            const prevMessage = index > 0 ? entries[index - 1] : null
            const isNewSpeaker = !prevMessage || prevMessage.speaker !== message.speaker
            const isBookmarked = bookmarkedMessages.has(message.id)
            const isCopied = copiedId === message.id
            const isHovered = hoveredMessageId === message.id
            const showLowConfidence = showConfidence && message.confidence && message.confidence < 0.8

            return (
              <div
                key={message.id}
                className="group"
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {/* Speaker Label (only when speaker changes) */}
                {isNewSpeaker && (
                  <div className={cn(
                    "flex items-center gap-2 mt-4 mb-1.5",
                    index === 0 && "mt-0"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 font-semibold text-sm",
                      getSpeakerColor(message.speaker)
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                        message.speaker === "agent" ? "bg-blue-600" : "bg-gray-500"
                      )}>
                        {message.speaker === "agent" ? "A" : "C"}
                      </div>
                      <span>{message.speaker === "agent" ? "Agent" : "Customer"}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {getRelativeTime(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message Content - Continuous Format */}
                <div className={cn(
                  "relative pl-8 pr-20 py-1.5 rounded group-hover:bg-gray-50 transition-colors",
                  getSpeakerBorder(message.speaker),
                  "border-l-4"
                )}>
                  {/* Exact Timestamp (on hover, positioned in left margin) */}
                  {isHovered && (
                    <div className="absolute -left-12 top-1.5 text-xs text-gray-500 font-mono whitespace-nowrap">
                      {formatTime(message.timestamp)}
                    </div>
                  )}

                  <div className={cn(
                    "text-sm leading-relaxed text-gray-900",
                    !message.isFinal && "opacity-60 italic"
                  )}>
                    {message.text}
                    {showLowConfidence && (
                      <span
                        className="ml-1 text-orange-500 cursor-help"
                        title={`Confidence: ${(message.confidence! * 100).toFixed(0)}%`}
                      >
                        <span className="inline-block w-1 h-1 rounded-full bg-orange-500" />
                      </span>
                    )}
                  </div>

                  {/* Action Buttons (appear on hover) */}
                  {isHovered && (
                    <div className="absolute top-1 right-2 flex items-center gap-1 bg-white rounded-md shadow-sm border px-1 py-1">
                      <button
                        onClick={() => toggleBookmark(message.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Bookmark message"
                        title="Bookmark"
                      >
                        <Bookmark
                          className={cn(
                            "w-3.5 h-3.5",
                            isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-gray-400"
                          )}
                        />
                      </button>
                      <button
                        onClick={() => copyMessage(message.text, message.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Copy message"
                        title="Copy"
                      >
                        {isCopied ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Flag message"
                        title="Flag for review"
                      >
                        <Flag className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && newMessageCount > 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20">
          <Button
            onClick={scrollToBottom}
            className="shadow-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            size="sm"
          >
            <ChevronDown className="w-4 h-4" />
            {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex-shrink-0 bg-gray-50 border-t px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <span>{entries.length} message{entries.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Powered by Deepgram</span>
          </div>
        </div>
      </div>
    </div>
  )
}
