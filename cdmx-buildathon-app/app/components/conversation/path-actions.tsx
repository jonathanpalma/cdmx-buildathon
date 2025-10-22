import { Button } from "~/components/ui/button"

interface PathAction {
  label: string
  variant?: "default" | "outline" | "secondary"
}

interface PathActionsProps {
  actions: PathAction[]
  pathId: string
  onFollowPath?: (pathId: string) => void
  onAction?: (pathId: string, actionLabel: string) => void
}

export function PathActions({ actions, pathId, onFollowPath, onAction }: PathActionsProps) {
  const handleActionClick = (actionLabel: string) => {
    if (actionLabel === "Follow This Path") {
      onFollowPath?.(pathId)
    } else {
      onAction?.(pathId, actionLabel)
    }
  }

  return (
    <div className="flex gap-2 pt-2">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          variant={action.variant || "default"}
          onClick={() => handleActionClick(action.label)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
