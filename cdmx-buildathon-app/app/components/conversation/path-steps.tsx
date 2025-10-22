interface PathStepsProps {
  steps: string[]
}

export function PathSteps({ steps }: PathStepsProps) {
  return (
    <div>
      <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Next Steps:</h4>
      <ol className="space-y-1.5 ml-4">
        {steps.map((step, idx) => (
          <li key={idx} className="text-sm flex items-start gap-2">
            <span className="font-semibold text-muted-foreground min-w-[1.5rem]">{idx + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
