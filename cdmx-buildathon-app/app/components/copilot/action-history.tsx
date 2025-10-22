/**
 * ActionHistory - Stacked view of all suggested/executed/dismissed actions
 *
 * Shows a chronological timeline of actions:
 * - Currently suggested (active, can confirm/dismiss)
 * - Executing (in progress)
 * - Completed (success with results)
 * - Failed (error state)
 * - Dismissed (user rejected)
 * - Invalidated (conversation moved past this)
 */

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Card } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Ban,
  History,
} from "lucide-react"
import type { ExecutableAction, ActionHistoryEntry } from "~/lib/agent/state"

interface ActionHistoryProps {
  currentActions: ExecutableAction[]
  history: ActionHistoryEntry[]
  onConfirm?: (actionId: string) => void
  onDismiss?: (actionId: string, reason?: string) => void
  onActionClick?: (actionId: string) => void
}

export function ActionHistory({
  currentActions = [],
  history = [],
  onConfirm,
  onDismiss,
  onActionClick,
}: ActionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAllHistory, setShowAllHistory] = useState(false)

  // Combine current actions with history for unified view
  const allActions = [
    ...currentActions.map(action => ({
      action,
      suggestedAt: action.createdAt,
      isActive: true,
    })),
    ...history.map(entry => ({
      ...entry,
      isActive: false,
    })),
  ].sort((a, b) => b.suggestedAt - a.suggestedAt) // Most recent first

  const activeCount = currentActions.length
  const historyToShow = showAllHistory ? history : history.slice(0, 3)

  const getStatusIcon = (action: ExecutableAction) => {
    switch (action.status) {
      case "executing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "dismissed":
        return <Ban className="h-4 w-4 text-gray-400" />
      case "invalidated":
        return <Clock className="h-4 w-4 text-gray-300" />
      case "confirmed":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (action: ExecutableAction) => {
    switch (action.status) {
      case "executing":
        return "border-blue-200 bg-blue-50"
      case "completed":
        return "border-green-200 bg-green-50"
      case "failed":
        return "border-red-200 bg-red-50"
      case "dismissed":
      case "invalidated":
        return "border-gray-200 bg-gray-50 opacity-60"
      default:
        return "border-orange-200 bg-orange-50"
    }
  }

  const getStatusLabel = (action: ExecutableAction) => {
    switch (action.status) {
      case "suggested":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Suggested</Badge>
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Confirmed</Badge>
      case "executing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Running...</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
      case "dismissed":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Dismissed</Badge>
      case "invalidated":
        return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Outdated</Badge>
      default:
        return null
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (start: number, end?: number) => {
    if (!end) return null
    const duration = Math.round((end - start) / 1000)
    if (duration < 60) return `${duration}s`
    return `${Math.floor(duration / 60)}m ${duration % 60}s`
  }

  if (allActions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
          {activeCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {activeCount} active
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 text-xs"
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Action Timeline */}
      {isExpanded && (
        <div className="space-y-2">
          {allActions.map((entry, idx) => {
            const { action, isActive, resolvedAt, userInteraction } = entry as any
            const isActiveAction = isActive && (action.status === "suggested" || action.status === "confirmed")

            return (
              <Card
                key={action.id}
                className={cn(
                  "p-3 border-l-4 transition-all",
                  getStatusColor(action),
                  isActiveAction && "shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-0.5">{getStatusIcon(action)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">{action.label}</h4>
                          {getStatusLabel(action)}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{action.description}</p>
                      </div>

                      {/* Confidence Badge */}
                      {action.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {action.confidence}%
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>{formatTime(action.createdAt)}</span>
                      {resolvedAt && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(action.createdAt, resolvedAt)}</span>
                        </>
                      )}
                      {userInteraction && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{userInteraction.replace("_", " ")}</span>
                        </>
                      )}
                    </div>

                    {/* Result/Error Messages */}
                    {action.result && (
                      <div className="bg-green-100 border border-green-200 rounded p-2 text-xs text-green-800 mb-2">
                        ✓ {action.result}
                      </div>
                    )}
                    {action.error && (
                      <div className="bg-red-100 border border-red-200 rounded p-2 text-xs text-red-800 mb-2">
                        ✗ {action.error}
                      </div>
                    )}
                    {action.dismissedReason && (
                      <div className="bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-700 mb-2">
                        {action.dismissedReason}
                      </div>
                    )}
                    {action.invalidatedReason && (
                      <div className="bg-gray-100 border border-gray-200 rounded p-2 text-xs text-gray-600 mb-2 italic">
                        {action.invalidatedReason}
                      </div>
                    )}

                    {/* Action Buttons (for active suggestions) */}
                    {isActiveAction && (
                      <div className="flex gap-2">
                        {action.status === "suggested" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => onConfirm?.(action.id)}
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDismiss?.(action.id)}
                              className="h-7 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Dismiss
                            </Button>
                          </>
                        )}
                        {action.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDismiss?.(action.id, "Changed mind")}
                            className="h-7 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}

          {/* Show More Button */}
          {history.length > 3 && !showAllHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllHistory(true)}
              className="w-full h-8 text-xs text-gray-600"
            >
              Show {history.length - 3} more actions
            </Button>
          )}
          {showAllHistory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllHistory(false)}
              className="w-full h-8 text-xs text-gray-600"
            >
              Show less
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
