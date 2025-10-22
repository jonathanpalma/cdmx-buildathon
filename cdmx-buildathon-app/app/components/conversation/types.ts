export interface ConversationStageData {
  id: string
  label: string
  status: "completed" | "current" | "future"
}

export interface ConversationPathData {
  id: string
  label: string
  probability: number
  recommended: boolean
  icon: "check" | "alert" | "info"
  steps: string[]
  script: string
  actions: { label: string; variant?: "default" | "outline" | "secondary" }[]
}
