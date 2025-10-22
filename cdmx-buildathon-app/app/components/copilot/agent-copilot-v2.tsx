/**
 * AgentCopilot v2 - Intent-Driven, Confidence-Based UI
 *
 * NEW DESIGN:
 * 1. Critical Action (top, prominent) - Highest confidence executable action
 * 2. Background Tasks (middle) - Running MCP tools with progress
 * 3. Insights (sidebar, subtle) - Health, emotion, missing info
 * 4. Quick Scripts (collapsed) - Communication templates
 */

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Activity,
} from "lucide-react"
import type {
  ExecutableAction,
  BackgroundTask,
  ConversationInsight,
  QuickScript,
  ConversationStage
} from "~/lib/agent/state"

interface AgentCopilotV2Props {
  // New structured data
  executableActions?: ExecutableAction[]
  insights?: ConversationInsight
  quickScripts?: QuickScript[]
  backgroundTasks?: BackgroundTask[]
  stages?: ConversationStage[]

  // Callbacks
  onActionClick?: (actionId: string) => void
  onActionCancel?: (actionId: string) => void
  onScriptCopy?: (scriptId: string) => void

  // State
  isProcessing?: boolean
}

export function AgentCopilotV2({
  executableActions = [],
  insights,
  quickScripts = [],
  backgroundTasks = [],
  stages = [],
  onActionClick,
  onActionCancel,
  onScriptCopy,
  isProcessing = false,
}: AgentCopilotV2Props) {
  const [scriptsExpanded, setScriptsExpanded] = useState(false)
  const [autoExecuteCountdown, setAutoExecuteCountdown] = useState<{
    actionId: string
    remaining: number
  } | null>(null)

  // Get highest confidence action
  const criticalAction = executableActions[0]

  // Get running/pending tasks
  const activeTasks = backgroundTasks.filter(t =>
    t.status === "pending" || t.status === "running"
  )

  // Get completed tasks (last 3)
  const completedTasks = backgroundTasks
    .filter(t => t.status === "completed")
    .slice(-3)

  // Check if insights have meaningful content (not just empty/generic)
  const hasMeaningfulInsights = insights && (
    (insights.concerns && insights.concerns.length > 0) ||
    (insights.missingInformation && insights.missingInformation.length > 0) ||
    insights.detectedEmotion ||
    (insights.healthScore && insights.healthScore < 60) // Only show health if concerning
  )

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case "positive": return "😊"
      case "frustrated": return "😤"
      case "confused": return "🤔"
      default: return "😐"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return "text-green-600 bg-green-50"
    if (confidence >= 85) return "text-blue-600 bg-blue-50"
    return "text-orange-600 bg-orange-50"
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* ========== SECTION 1: CRITICAL ACTION ========== */}
      {criticalAction && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {criticalAction.confidence >= 95 && !criticalAction.requiresConfirmation ? (
                  <Zap className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                )}
                <h3 className="font-semibold text-sm text-gray-900">
                  {criticalAction.label}
                </h3>
                <Badge className={cn("text-xs", getConfidenceColor(criticalAction.confidence))}>
                  {criticalAction.confidence}%
                </Badge>
              </div>

              <p className="text-xs text-gray-600 mb-3">
                {criticalAction.description}
              </p>

              {/* Auto-execute countdown */}
              {criticalAction.confidence >= 95 && !criticalAction.requiresConfirmation && (
                <div className="mb-2 text-xs text-green-700 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Auto-executing in 3s...
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {criticalAction.requiresConfirmation ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => onActionClick?.(criticalAction.id)}
                      className="text-xs h-7"
                    >
                      Execute Now
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onActionCancel?.(criticalAction.id)}
                      className="text-xs h-7"
                    >
                      Dismiss
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActionCancel?.(criticalAction.id)}
                    className="text-xs h-7"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {/* Tool info */}
              {criticalAction.toolName && (
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  {criticalAction.toolName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== SECTION 2: BACKGROUND TASKS ========== */}
      {activeTasks.length > 0 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-900">
              Running Tasks ({activeTasks.length})
            </h3>
          </div>

          <div className="space-y-2">
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
                <span className="text-gray-700 flex-1">{task.label}</span>
                {task.progress !== undefined && (
                  <span className="text-xs text-gray-500">{task.progress}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== SECTION 3: INSIGHTS (Subtle) ========== */}
      {hasMeaningfulInsights && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-xs text-gray-700 mb-3 uppercase tracking-wide">
            Conversation Insights
          </h3>

          <div className="space-y-2">
            {/* Health Score - only show if concerning (<60) */}
            {insights && insights.healthScore < 60 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Health:</span>
                <span className={cn("font-semibold", getHealthColor(insights.healthScore))}>
                  {insights.healthScore}%
                </span>
              </div>
            )}

            {/* Current Stage - always show if available */}
            {insights && insights.currentStage && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Stage:</span>
                <span className="font-medium text-gray-900 text-xs">
                  {insights.currentStage}
                </span>
              </div>
            )}

            {/* Customer Emotion - only if not neutral */}
            {insights && insights.detectedEmotion && insights.detectedEmotion !== "neutral" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="text-xs">
                  {getEmotionIcon(insights.detectedEmotion)} {insights.detectedEmotion}
                </span>
              </div>
            )}

            {/* Missing Information - only show if not empty */}
            {insights && insights.missingInformation && insights.missingInformation.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-700 font-medium mb-1">Missing Info:</div>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {insights.missingInformation.map((info, i) => (
                    <li key={i}>• {info}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Concerns - only show if not empty */}
            {insights && insights.concerns && insights.concerns.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 text-xs text-orange-700 font-medium mb-1">
                  <AlertCircle className="h-3 w-3" />
                  Concerns:
                </div>
                <ul className="text-xs text-orange-600 space-y-0.5">
                  {insights.concerns.map((concern, i) => (
                    <li key={i}>• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== SECTION 4: QUICK SCRIPTS (Collapsed) ========== */}
      {quickScripts.length > 0 && (
        <div className="p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setScriptsExpanded(!scriptsExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-sm text-gray-900">
                Quick Scripts ({quickScripts.length})
              </h3>
            </div>
            {scriptsExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {scriptsExpanded && (
            <div className="mt-3 space-y-2">
              {quickScripts.map(script => (
                <Card key={script.id} className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-sm text-gray-900">{script.label}</div>
                    <Badge variant="outline" className="text-xs">
                      {script.confidence}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 italic mb-2">"{script.script}"</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onScriptCopy?.(script.id)}
                    className="text-xs h-7"
                  >
                    Copy to Clipboard
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== COMPLETED TASKS (Recent) ========== */}
      {completedTasks.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h3 className="font-semibold text-xs text-gray-700 mb-2 uppercase tracking-wide">
            Recently Completed
          </h3>
          <div className="space-y-1.5">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-start gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{task.label}</div>
                  {task.result?.summary && (
                    <div className="text-gray-600">{task.result.summary}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && !criticalAction && activeTasks.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-700 font-medium">Analyzing conversation...</p>
            <p className="text-xs text-gray-500 mt-1">
              Detecting intents and checking for actionable opportunities
            </p>
          </div>
        </div>
      )}

      {/* Empty State - Listening (only show if no meaningful content yet) */}
      {!criticalAction && activeTasks.length === 0 && !isProcessing && !hasMeaningfulInsights && (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <div className="text-4xl mb-2">👂</div>
            <p className="text-sm text-gray-600 font-medium">Listening to conversation...</p>
            <p className="text-xs text-gray-500 mt-1">
              I'll suggest actions when needed
            </p>
          </div>
        </div>
      )}

      {/* Spacer when insights visible but no actions */}
      {!criticalAction && activeTasks.length === 0 && !isProcessing && hasMeaningfulInsights && (
        <div className="flex-1" />
      )}

      {/* Status Footer - Always show when not processing */}
      {!isProcessing && (
        <div className="mt-auto border-t border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span>Analysis up to date</span>
            </div>
            {!criticalAction && activeTasks.length === 0 && (
              <span className="text-gray-400">No immediate actions needed</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
