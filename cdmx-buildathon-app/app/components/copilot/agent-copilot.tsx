import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  Sparkles,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"

export interface ConversationStage {
  id: string
  label: string
  status: "completed" | "current" | "future"
}

export interface NextAction {
  id: string
  label: string
  description?: string
  priority: "critical" | "recommended" | "optional"
  confidence?: number
  reasoning?: string
}

export interface BackgroundTask {
  id: string
  label: string
  type: "api_call" | "mcp_tool" | "data_lookup" | "calculation"
  status: "pending" | "running" | "completed" | "failed"
  progress?: number
  result?: string
  startedAt?: number
  completedAt?: number
}

export interface CurrentStepData {
  stage: string
  description: string
  aiSuggestion?: string
  nextActions: NextAction[]
  script?: string
  tips?: string[]
}

interface AgentCopilotProps {
  stages: ConversationStage[]
  currentStep: CurrentStepData | null
  conversationHealth?: number
  isProcessing?: boolean
  backgroundTasks?: BackgroundTask[]
  onActionClick?: (actionId: string) => void
  onFeedback?: (actionId: string, positive: boolean) => void
  onRefresh?: () => void
  suggestionTimestamp?: number // When current suggestion was generated
}

export function AgentCopilot({
  stages,
  currentStep,
  conversationHealth = 75,
  isProcessing = false,
  backgroundTasks = [],
  onActionClick,
  onFeedback,
  onRefresh,
  suggestionTimestamp,
}: AgentCopilotProps) {
  // All hooks must be called before any conditional returns
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [expandedSections, setExpandedSections] = useState({
    progress: true,
    currentStep: true,
    nextActions: true,
    script: false,
    tips: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getHealthColor = (health: number) => {
    if (health >= 70) return "text-green-600 bg-green-50 border-green-200"
    if (health >= 40) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getPriorityIcon = (priority: NextAction["priority"]) => {
    switch (priority) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "recommended":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      case "optional":
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getTaskStatusIcon = (status: BackgroundTask["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-gray-400" />
      case "running":
        return <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      case "failed":
        return <XCircle className="h-3.5 w-3.5 text-red-600" />
    }
  }

  // Track time since suggestion was generated
  useEffect(() => {
    if (!suggestionTimestamp || isProcessing) {
      setTimeElapsed(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - suggestionTimestamp) / 1000)
      setTimeElapsed(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [suggestionTimestamp, isProcessing])

  // Show waiting/processing state if no conversation data yet
  if (!currentStep) {
    return (
      <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Copilot</h2>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Real-time guidance powered by AI
          </p>
        </div>

        {/* Waiting/Processing State */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-sm">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <Sparkles className={cn(
                  "h-12 w-12",
                  isProcessing ? "text-purple-500 animate-spin" : "text-purple-300 animate-pulse"
                )} />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isProcessing ? "Analyzing conversation..." : "Waiting for conversation..."}
            </h3>
            <p className="text-sm text-gray-600">
              {isProcessing
                ? "AI is processing the conversation and generating suggestions."
                : "The AI copilot will analyze the conversation and provide real-time suggestions as the call progresses."
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2">
          <p className="text-xs text-gray-500 text-center">
            Powered by Claude 3.5 Haiku
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={cn(
              "h-5 w-5",
              isProcessing ? "text-purple-500 animate-pulse" : "text-purple-600"
            )} />
            <h2 className="text-lg font-semibold text-gray-900">AI Copilot</h2>
            {isProcessing && (
              <Badge variant="outline" className="text-xs border-purple-200 bg-purple-50 text-purple-700">
                Analyzing...
              </Badge>
            )}
          </div>
          {conversationHealth && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold border",
                getHealthColor(conversationHealth)
              )}
            >
              {conversationHealth}%
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-600 flex-1">
            {isProcessing ? "Processing conversation context..." : "Real-time guidance powered by AI"}
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Compact Progress Indicator - No Layout Shift */}
        {stages.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-700">Progress</p>
              <Badge variant="secondary" className="text-xs">
                {stages.filter((s) => s.status === "completed").length}/{stages.length}
              </Badge>
            </div>
            {/* Horizontal Progress Bar */}
            <div className="flex items-center gap-1.5">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex-1 group relative"
                  title={stage.label}
                >
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      stage.status === "completed"
                        ? "bg-green-600"
                        : stage.status === "current"
                          ? "bg-blue-600 animate-pulse"
                          : "bg-gray-200"
                    )}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Stage - Always Visible, Minimal */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-medium text-blue-900">
              {currentStep.stage}
            </p>
          </div>
          <p className="text-xs text-blue-700 pl-6">
            {currentStep.description}
          </p>
        </div>

        {/* Suggestions Header with Timestamp and Dismiss */}
        {currentStep.nextActions.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-gray-700">Suggestions</p>
              {!isProcessing && timeElapsed > 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    timeElapsed > 15
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                  )}
                >
                  {timeElapsed}s ago
                </Badge>
              )}
            </div>
            {onRefresh && !isProcessing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                className="h-6 text-xs px-2 text-gray-600 hover:text-gray-900"
              >
                Dismiss
              </Button>
            )}
          </div>
        )}

        {/* AI Context - Only Show if Meaningful */}
        {currentStep.nextActions.length > 0 && currentStep.aiSuggestion && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">
                {currentStep.aiSuggestion}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons - Only Show Critical/Recommended */}
        {currentStep.nextActions
          .filter(action => action.priority === "critical" || action.priority === "recommended")
          .slice(0, 3) // Max 3 actions to avoid overwhelming
          .map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick?.(action.id)}
              className={cn(
                "w-full text-left border-2 rounded-lg p-3 transition-all hover:shadow-md",
                action.priority === "critical"
                  ? "border-red-300 bg-red-50 hover:bg-red-100 hover:border-red-400"
                  : "border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400"
              )}
            >
              <div className="flex items-start gap-2">
                {getPriorityIcon(action.priority)}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-semibold mb-0.5",
                    action.priority === "critical" ? "text-red-900" : "text-blue-900"
                  )}>
                    {action.label}
                  </p>
                  {action.description && (
                    <p className="text-xs text-gray-700 line-clamp-2">
                      {action.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        }

        {/* Background Tasks - Show if any exist */}
        {backgroundTasks.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-3.5 w-3.5 text-gray-600" />
              <p className="text-xs font-medium text-gray-700">Working in background</p>
            </div>
            <div className="space-y-1.5">
              {backgroundTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-xs"
                >
                  {getTaskStatusIcon(task.status)}
                  <span className={cn(
                    task.status === "completed" ? "text-gray-500 line-through" : "text-gray-700"
                  )}>
                    {task.label}
                  </span>
                  {task.status === "running" && task.progress && (
                    <span className="text-gray-500 ml-auto">{task.progress}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Minimal Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-400 text-center">
          Claude 3.5 Haiku
        </p>
      </div>
    </div>
  )
}
