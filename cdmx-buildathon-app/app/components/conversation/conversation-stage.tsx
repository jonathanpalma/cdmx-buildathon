import { Check, Circle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import type { ConversationStageData } from "./types"

interface ConversationStageProps {
  stage: ConversationStageData
  index: number
  children?: React.ReactNode
}

export function ConversationStage({ stage, index, children }: ConversationStageProps) {
  const isCompleted = stage.status === "completed"
  const isCurrent = stage.status === "current"
  const isFuture = stage.status === "future"

  return (
    <Card
      className={cn(
        "transition-all duration-300",
        isCurrent && "border-2 border-blue-500 shadow-lg",
        isFuture && "opacity-50"
      )}
    >
      <CardHeader className={cn("flex flex-row items-center gap-3 space-y-0", isCompleted && "bg-muted/50")}>
        <StageIndicator
          status={stage.status}
          index={index}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
          isFuture={isFuture}
        />
        <CardTitle className={cn("text-lg", isFuture && "text-muted-foreground")}>{stage.label}</CardTitle>
      </CardHeader>

      {isCurrent && children && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  )
}

interface StageIndicatorProps {
  status: "completed" | "current" | "future"
  index: number
  isCompleted: boolean
  isCurrent: boolean
  isFuture: boolean
}

function StageIndicator({ isCompleted, isCurrent, isFuture, index }: StageIndicatorProps) {
  if (isCompleted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
        <Check className="h-5 w-5 text-white" />
      </div>
    )
  }

  if (isCurrent) {
    return (
      <div className="relative flex h-8 w-8 items-center justify-center">
        <Circle className="h-8 w-8 text-blue-500 fill-blue-500" />
        <div className="absolute h-8 w-8 rounded-full bg-blue-500 animate-ping opacity-75" />
      </div>
    )
  }

  if (isFuture) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30">
        <span className="text-sm text-muted-foreground">{index + 1}</span>
      </div>
    )
  }

  return null
}
