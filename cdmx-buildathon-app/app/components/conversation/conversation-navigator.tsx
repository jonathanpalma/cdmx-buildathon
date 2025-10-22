import { useState } from "react"
import { Accordion } from "~/components/ui/accordion"
import { ConversationStage } from "./conversation-stage"
import { ConversationPath } from "./conversation-path"
import type { ConversationStageData, ConversationPathData } from "./types"

interface ConversationNavigatorProps {
  stages: ConversationStageData[]
  currentStagePaths?: ConversationPathData[]
  onFollowPath?: (pathId: string) => void
  onAction?: (pathId: string, actionLabel: string) => void
}

export function ConversationNavigator({
  stages,
  currentStagePaths = [],
  onFollowPath,
  onAction,
}: ConversationNavigatorProps) {
  const recommendedPath = currentStagePaths.find((path) => path.recommended)
  const [openAccordion, setOpenAccordion] = useState<string>(recommendedPath?.id || "")

  return (
    <div className="w-full space-y-4">
      {stages.map((stage, index) => {
        const isCurrent = stage.status === "current"

        return (
          <ConversationStage key={stage.id} stage={stage} index={index}>
            {isCurrent && currentStagePaths.length > 0 && (
              <Accordion
                type="single"
                collapsible
                value={openAccordion}
                onValueChange={setOpenAccordion}
                className="space-y-2"
              >
                {currentStagePaths.map((path) => (
                  <ConversationPath
                    key={path.id}
                    path={path}
                    onFollowPath={onFollowPath}
                    onAction={onAction}
                  />
                ))}
              </Accordion>
            )}
          </ConversationStage>
        )
      })}
    </div>
  )
}
