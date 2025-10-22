import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "~/components/ui/button"

interface PathScriptProps {
  script: string
}

export function PathScript({ script }: PathScriptProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy script to clipboard", err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-sm text-muted-foreground">Suggested Script:</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="bg-muted rounded-md p-4 font-mono text-sm border">{script}</div>
    </div>
  )
}
