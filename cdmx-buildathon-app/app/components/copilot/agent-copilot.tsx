import { useState } from "react"
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
  onActionClick?: (actionId: string) => void
  onFeedback?: (actionId: string, positive: boolean) => void
}

export function AgentCopilot({
  stages,
  currentStep,
  conversationHealth = 75,
  onActionClick,
  onFeedback,
}: AgentCopilotProps) {
  // Show waiting state if no conversation data yet
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

        {/* Waiting State */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-sm">
            <div className="mb-4 flex justify-center">
              <div className="relative">
                <Sparkles className="h-12 w-12 text-purple-300 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Waiting for conversation...
            </h3>
            <p className="text-sm text-gray-600">
              The AI copilot will analyze the conversation and provide real-time suggestions as the call progresses.
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

  const getPriorityStyles = (priority: NextAction["priority"]) => {
    switch (priority) {
      case "critical":
        return "border-red-200 bg-red-50 hover:bg-red-100"
      case "recommended":
        return "border-blue-200 bg-blue-50 hover:bg-blue-100"
      case "optional":
        return "border-gray-200 bg-gray-50 hover:bg-gray-100"
    }
  }

  const copyScript = () => {
    if (currentStep.script) {
      navigator.clipboard.writeText(currentStep.script)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">AI Copilot</h2>
          </div>
          {conversationHealth && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold border",
                getHealthColor(conversationHealth)
              )}
            >
              Health: {conversationHealth}%
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-600">
          Real-time guidance powered by AI
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Progress Section - only show if stages exist */}
        {stages.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggleSection("progress")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedSections.progress ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <CardTitle className="text-sm font-medium">
                    Conversation Progress
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stages.filter((s) => s.status === "completed").length}/
                  {stages.length}
                </Badge>
              </div>
            </CardHeader>
            {expandedSections.progress && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {stage.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : stage.status === "current" ? (
                        <div className="h-5 w-5 rounded-full border-2 border-blue-600 bg-blue-100 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        </div>
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      {index < stages.length - 1 && (
                        <div
                          className={cn(
                            "w-0.5 h-6 my-0.5",
                            stage.status === "completed"
                              ? "bg-green-600"
                              : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          stage.status === "completed"
                            ? "text-green-700"
                            : stage.status === "current"
                              ? "text-blue-700"
                              : "text-gray-500"
                        )}
                      >
                        {stage.label}
                      </p>
                      {stage.status === "current" && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          In progress...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
          </Card>
        )}

        {/* Current Step Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => toggleSection("currentStep")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {expandedSections.currentStep ? (
                  <ChevronDown className="h-4 w-4 text-blue-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                )}
                <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Current Step
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          {expandedSections.currentStep && (
            <CardContent className="pt-0 pb-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {currentStep.stage}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {currentStep.description}
                </p>
              </div>

              {currentStep.aiSuggestion && (
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 mb-1">
                        AI Suggestion
                      </p>
                      <p className="text-xs text-gray-700">
                        {currentStep.aiSuggestion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Next Actions Section */}
        <Card>
          <CardHeader
            className="cursor-pointer py-3"
            onClick={() => toggleSection("nextActions")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {expandedSections.nextActions ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Recommended Actions
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentStep.nextActions.length}
              </Badge>
            </div>
          </CardHeader>
          {expandedSections.nextActions && (
            <CardContent className="pt-0 pb-4 space-y-2">
              {currentStep.nextActions.map((action) => (
                <div
                  key={action.id}
                  className={cn(
                    "border rounded-lg p-3 transition-colors",
                    getPriorityStyles(action.priority)
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getPriorityIcon(action.priority)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {action.label}
                      </p>
                      {action.description && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {action.description}
                        </p>
                      )}
                      {action.confidence && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${action.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {Math.round(action.confidence * 100)}%
                          </span>
                        </div>
                      )}
                      {action.reasoning && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {action.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => onActionClick?.(action.id)}
                    >
                      Take Action
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onFeedback?.(action.id, true)}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onFeedback?.(action.id, false)}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Suggested Script Section */}
        {currentStep.script && (
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggleSection("script")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedSections.script ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <CardTitle className="text-sm font-medium">
                    Suggested Script
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            {expandedSections.script && (
              <CardContent className="pt-0 pb-4">
                <div className="bg-gray-100 rounded-lg p-3 relative">
                  <p className="text-sm text-gray-800 leading-relaxed pr-8">
                    "{currentStep.script}"
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={copyScript}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Pro Tips Section */}
        {currentStep.tips && currentStep.tips.length > 0 && (
          <Card>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => toggleSection("tips")}
            >
              <div className="flex items-center gap-2">
                {expandedSections.tips ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  Pro Tips
                </CardTitle>
              </div>
            </CardHeader>
            {expandedSections.tips && (
              <CardContent className="pt-0 pb-4">
                <ul className="space-y-2">
                  {currentStep.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Suggestions refresh in real-time based on conversation
        </p>
      </div>
    </div>
  )
}
