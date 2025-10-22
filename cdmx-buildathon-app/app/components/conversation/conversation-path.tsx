import { AccordionItem, AccordionTrigger, AccordionContent } from "~/components/ui/accordion"
import { cn } from "~/lib/utils"
import { PathHeader } from "./path-header"
import { PathSteps } from "./path-steps"
import { PathScript } from "./path-script"
import { PathActions } from "./path-actions"
import type { ConversationPathData } from "./types"

interface ConversationPathProps {
  path: ConversationPathData
  onFollowPath?: (pathId: string) => void
  onAction?: (pathId: string, actionLabel: string) => void
}

export function ConversationPath({ path, onFollowPath, onAction }: ConversationPathProps) {
  return (
    <AccordionItem
      value={path.id}
      className={cn(
        "border rounded-lg px-4 transition-all",
        path.recommended && "border-l-4 border-l-green-500 bg-green-50/50"
      )}
    >
      <AccordionTrigger className="hover:no-underline py-4">
        <PathHeader
          icon={path.icon}
          label={path.label}
          recommended={path.recommended}
          probability={path.probability}
        />
      </AccordionTrigger>
      <AccordionContent className="pt-4 pb-4 space-y-4">
        <PathSteps steps={path.steps} />
        <PathScript script={path.script} />
        <PathActions
          actions={path.actions}
          pathId={path.id}
          onFollowPath={onFollowPath}
          onAction={onAction}
        />
      </AccordionContent>
    </AccordionItem>
  )
}
