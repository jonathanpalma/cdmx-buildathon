import { Check, AlertTriangle, Info, Star } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { cn } from "~/lib/utils"

const iconMap = {
  check: Check,
  alert: AlertTriangle,
  info: Info,
}

interface PathHeaderProps {
  icon: "check" | "alert" | "info"
  label: string
  recommended: boolean
  probability: number
}

export function PathHeader({ icon, label, recommended, probability }: PathHeaderProps) {
  const Icon = iconMap[icon]

  return (
    <div className="flex items-center gap-3 flex-1">
      <Icon
        className={cn(
          "h-5 w-5",
          icon === "check" && "text-green-600",
          icon === "alert" && "text-yellow-600",
          icon === "info" && "text-blue-600"
        )}
      />
      <span className="font-medium text-left flex-1">{label}</span>
      <div className="flex items-center gap-2">
        {recommended && (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <Star className="h-3 w-3 mr-1 fill-green-600" />
            Recommended
          </Badge>
        )}
        <Badge className={cn("font-semibold", getProbabilityColor(probability))}>
          {probability}%
        </Badge>
      </div>
    </div>
  )
}

function getProbabilityColor(probability: number) {
  if (probability > 80) return "bg-green-100 text-green-800"
  if (probability >= 50) return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-800"
}
