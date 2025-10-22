import * as React from "react"
import { cn } from "~/lib/utils"

const AccordionContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
}>({ value: "", onValueChange: () => {} })

const ItemContext = React.createContext("")

interface AccordionProps {
  type: "single"
  collapsible?: boolean
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function Accordion({
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  return (
    <AccordionContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <ItemContext.Provider value={value}>
      <div data-state={value} className={className}>
        {children}
      </div>
    </ItemContext.Provider>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const { value: contextValue, onValueChange } = React.useContext(AccordionContext)
  const itemValue = React.useContext(ItemContext)
  const isOpen = contextValue === itemValue

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between text-left transition-all",
        className
      )}
      onClick={() => onValueChange(isOpen ? "" : itemValue)}
    >
      {children}
      <svg
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  )
}

export function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { value: contextValue } = React.useContext(AccordionContext)
  const itemValue = React.useContext(ItemContext)
  const isOpen = contextValue === itemValue

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <div className={className}>{children}</div>
    </div>
  )
}
