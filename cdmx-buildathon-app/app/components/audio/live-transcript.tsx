import { useEffect, useRef, useState } from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import {
  Bookmark,
  Copy,
  Flag,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"

interface TranscriptInsight {
  type: "intent" | "action-item" | "concern" | "key-info"
  text: string
}

export interface TranscriptEntry {
  id: string
  speaker: "agent" | "customer"
  text: string
  timestamp: number
  isCurrent?: boolean
  sentiment?: "positive" | "negative" | "neutral" | "concerned"
  insights?: TranscriptInsight[]
  keywords?: string[]
  confidence?: number
  isFinal?: boolean
}

interface LiveTranscriptProps {
  entries: TranscriptEntry[]
  isListening?: boolean
  currentTime?: number
  conversationHealth?: number // 0-100 score
  currentStage?: string
  autoScroll?: boolean
  showConfidence?: boolean
}

export function LiveTranscript({
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="w-3 h-3 text-green-600" />
      case "negative":
        return <TrendingDown className="w-3 h-3 text-red-600" />
      case "concerned":
        return <AlertCircle className="w-3 h-3 text-orange-600" />
      default:
        return <Minus className="w-3 h-3 text-gray-400" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "action-item":
        return <CheckCircle className="w-3 h-3 text-blue-600" />
      case "concern":
        return <AlertCircle className="w-3 h-3 text-orange-600" />
      case "key-info":
        return <Info className="w-3 h-3 text-purple-600" />
      default:
        return <Info className="w-3 h-3 text-gray-600" />
    }
  }

  const highlightKeywords = (text: string, keywords?: string[]) => {
    if (!keywords || keywords.length === 0) return text

    let highlightedText = text
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi")
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>',
      )
    })
    return highlightedText
  }

  const getHealthColor = (health: number) => {
    if (health >= 70) return "text-green-600"
    if (health >= 40) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white rounded-lg border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-b p-4 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Live Transcript</h2>
          <Badge variant={isListening ? "default" : "secondary"} className="text-xs gap-1">
            {isListening ? (
              <>
                <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
                Listening
              </>
            ) : (
              "Paused"
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-0.5">Duration</span>
            <span className="font-mono font-bold text-base text-gray-900">{formatTime(currentTime)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-0.5">Health Score</span>
            <span className={cn("font-bold text-base", getHealthColor(conversationHealth))}>{conversationHealth}%</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600">
              Current Stage: <span className="font-semibold text-gray-900">{currentStage}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>Waiting for transcript...</p>
            <p className="text-sm">Start playback to see real-time transcription</p>
          </div>
        ) : (
          entries.map((message, index) => {
            const isAgent = message.speaker === "agent"
            const prevMessage = index > 0 ? entries[index - 1] : null
            const isConsecutive = prevMessage?.speaker === message.speaker
            const isBookmarked = bookmarkedMessages.has(message.id)
            const isCopied = copiedId === message.id

            return (
              <div key={message.id} className="group">
                {!isConsecutive && (
                  <div
                    className={cn(
                      "text-xs font-semibold mb-1.5 flex items-center gap-1.5",
                      isAgent ? "justify-end text-blue-700" : "justify-start text-gray-700",
                    )}
                  >
                    {!isAgent && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        C
                      </div>
                    )}
                    <span>{isAgent ? "Agent" : "Customer"}</span>
                    {getSentimentIcon(message.sentiment)}
                    {isAgent && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        A
                      </div>
                    )}
                  </div>
                )}

                <div className={cn("flex items-start gap-2", isAgent ? "justify-end" : "justify-start")}>
                  <div className={cn("flex flex-col", isAgent ? "items-end" : "items-start", "max-w-[85%]")}>
                    <div
                      className={cn(
                        "relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                        isAgent
                          ? "bg-blue-500 text-white rounded-tr-sm"
                          : "bg-white border-2 border-gray-200 text-gray-900 rounded-tl-sm shadow-sm",
                        isConsecutive && (isAgent ? "rounded-tr-2xl" : "rounded-tl-2xl"),
                        !message.isFinal && "opacity-60"
                      )}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(message.text, message.keywords),
                        }}
                      />

                      {message.isCurrent && (
                        <div className="absolute -top-1 -right-1">
                          <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                        isAgent ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <span className="text-xs text-gray-500 font-mono">{formatTime(message.timestamp)}</span>
                      {showConfidence && message.confidence !== undefined && (
                        <span className="text-xs text-gray-500">
                          {(message.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleBookmark(message.id)}
                        >
                          <Bookmark
                            className={cn("w-3 h-3", isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-gray-400")}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyMessage(message.text, message.id)}
                        >
                          {isCopied ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Flag className="w-3 h-3 text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    {message.insights && message.insights.length > 0 && (
                      <div className={cn("mt-2 space-y-1", isAgent ? "items-end" : "items-start")}>
                        {message.insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-start gap-1.5 text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 max-w-[90%]",
                              isAgent && "flex-row-reverse text-right",
                            )}
                          >
                            {getInsightIcon(insight.type)}
                            <span className="leading-tight">{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {isUserScrolling && newMessageCount > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
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
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-sm border-t p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-green-500" : "bg-gray-400")} />
              <span className="text-gray-600">{isListening ? "Active" : "Paused"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Audio Quality: Good</span>
            </div>
          </div>
          <div className="text-gray-500">
            {entries.length} message{entries.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  )
}
