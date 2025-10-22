import type { Route } from "./+types/conversation-demo"
import { ConversationNavigator } from "~/components/conversation"
import type { ConversationStageData, ConversationPathData } from "~/components/conversation"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Conversation Navigator Demo - CloseLoop" },
    { name: "description", content: "Demo of the conversation navigator component" },
  ]
}

export default function ConversationDemo() {
  const stages: ConversationStageData[] = [
    {
      id: "greeting",
      label: "Initial Greeting",
      status: "completed",
    },
    {
      id: "needs-assessment",
      label: "Needs Assessment",
      status: "completed",
    },
    {
      id: "property-selection",
      label: "Property Selection",
      status: "current",
    },
    {
      id: "pricing-quote",
      label: "Pricing & Quote",
      status: "future",
    },
    {
      id: "booking-confirmation",
      label: "Booking Confirmation",
      status: "future",
    },
  ]

  const currentStagePaths: ConversationPathData[] = [
    {
      id: "path-beach-palace",
      label: "Recommend Beach Palace Cancún",
      probability: 85,
      recommended: true,
      icon: "check",
      steps: [
        "Highlight family-friendly amenities",
        "Mention kids-stay-free promotion",
        "Check availability for requested dates",
        "Prepare quote with promotional pricing",
      ],
      script:
        "Based on what you've shared, Beach Palace Cancún would be perfect for your family! It's located right in the heart of the Hotel Zone with pristine beaches. We currently have a kids-stay-free promotion that could save you up to 40%. Let me check availability for your dates.",
      actions: [
        { label: "Follow This Path", variant: "default" },
        { label: "Check Availability", variant: "outline" },
      ],
    },
    {
      id: "path-moon-palace",
      label: "Alternative: Moon Palace Cancún",
      probability: 65,
      recommended: false,
      icon: "info",
      steps: [
        "Present as premium alternative",
        "Emphasize all-inclusive water park",
        "Discuss pricing difference",
        "Offer to compare both properties",
      ],
      script:
        "Another excellent option is Moon Palace Cancún. While it's a bit farther from downtown, it features the largest water park in the Caribbean - perfect for kids! The all-inclusive experience is more comprehensive. Would you like me to compare both properties?",
      actions: [
        { label: "Follow This Path", variant: "default" },
        { label: "Compare Properties", variant: "secondary" },
      ],
    },
    {
      id: "path-objection",
      label: "Handle Price Objection",
      probability: 45,
      recommended: false,
      icon: "alert",
      steps: [
        "Acknowledge budget concerns",
        "Break down all-inclusive value",
        "Highlight flexible payment options",
        "Offer alternative dates for better rates",
      ],
      script:
        "I completely understand budget is important. Let me break down what's included - all meals, premium drinks, water sports, kids' activities, and entertainment. When you add it up, the all-inclusive package often costs less than paying separately. We also have flexible payment plans. Would that help?",
      actions: [
        { label: "Follow This Path", variant: "default" },
        { label: "Show Payment Options", variant: "outline" },
        { label: "Check Alternative Dates", variant: "secondary" },
      ],
    },
  ]

  const handleFollowPath = (pathId: string) => {
    console.log("Following path:", pathId)
    // In a real app, this would trigger navigation or state changes
    alert(`Following path: ${pathId}`)
  }

  const handleAction = (pathId: string, actionLabel: string) => {
    console.log("Action triggered:", { pathId, actionLabel })
    // In a real app, this would trigger specific actions
    alert(`Action: ${actionLabel} for path: ${pathId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto mb-8 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Conversation Navigator</h1>
        <p className="text-gray-600">
          Real-time guidance for call center agents during customer conversations
        </p>
      </div>

      <ConversationNavigator
        stages={stages}
        currentStagePaths={currentStagePaths}
        onFollowPath={handleFollowPath}
        onAction={handleAction}
      />
    </div>
  )
}
