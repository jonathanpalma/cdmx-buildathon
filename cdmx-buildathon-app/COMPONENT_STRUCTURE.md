# Conversation Navigator Component Structure

This document describes the architecture and usage of the Conversation Navigator component system.

## Overview

The Conversation Navigator is a modular, reusable component system built for Remix (React Router v7) that provides real-time guidance for call center agents during customer conversations.

## Component Architecture

### 1. UI Base Components (`app/components/ui/`)

Reusable shadcn/ui-style components:

- **`accordion.tsx`** - Collapsible accordion component with context-based state management
- **`badge.tsx`** - Badge component with variants (default, secondary, destructive, outline)
- **`button.tsx`** - Button component with variants and sizes
- **`card.tsx`** - Card, CardHeader, CardTitle, CardContent, CardFooter components

### 2. Conversation Components (`app/components/conversation/`)

#### Core Components

**`types.ts`**
- `ConversationStageData` - Stage data interface
- `ConversationPathData` - Path data interface

**`conversation-navigator.tsx`** (Main Component)
- Orchestrates the entire conversation flow
- Manages accordion state
- Renders stages and paths
- Handles callbacks for path following and actions

**`conversation-stage.tsx`**
- Renders individual conversation stages
- Shows status indicators (completed, current, future)
- Contains `StageIndicator` sub-component

**`conversation-path.tsx`**
- Renders individual conversation paths within a stage
- Composes smaller components together
- Manages accordion item behavior

#### Sub-Components

**`path-header.tsx`**
- Displays path icon, label, recommended badge, and probability
- Handles icon mapping and styling

**`path-steps.tsx`**
- Renders the numbered list of next steps
- Simple ordered list component

**`path-script.tsx`**
- Displays suggested script with copy-to-clipboard functionality
- Manages clipboard state and user feedback

**`path-actions.tsx`**
- Renders action buttons for each path
- Handles action callbacks and routing

**`index.ts`**
- Barrel export file for clean imports

## Component Hierarchy

```
ConversationNavigator
├── ConversationStage (for each stage)
│   ├── StageIndicator
│   └── Accordion (if current stage)
│       └── ConversationPath (for each path)
│           ├── AccordionItem
│           ├── AccordionTrigger
│           │   └── PathHeader
│           └── AccordionContent
│               ├── PathSteps
│               ├── PathScript
│               └── PathActions
```

## Usage

### Basic Import

```tsx
import { ConversationNavigator } from "~/components/conversation"
import type { ConversationStageData, ConversationPathData } from "~/components/conversation"
```

### Example Usage

```tsx
const stages: ConversationStageData[] = [
  {
    id: "greeting",
    label: "Initial Greeting",
    status: "completed",
  },
  {
    id: "needs-assessment",
    label: "Needs Assessment",
    status: "current",
  },
  // ... more stages
]

const currentStagePaths: ConversationPathData[] = [
  {
    id: "path-1",
    label: "Recommend Beach Palace Cancún",
    probability: 85,
    recommended: true,
    icon: "check",
    steps: ["Step 1", "Step 2", "Step 3"],
    script: "Suggested script here...",
    actions: [
      { label: "Follow This Path", variant: "default" },
      { label: "Check Availability", variant: "outline" },
    ],
  },
  // ... more paths
]

export default function MyRoute() {
  const handleFollowPath = (pathId: string) => {
    // Handle path following
  }

  const handleAction = (pathId: string, actionLabel: string) => {
    // Handle action
  }

  return (
    <ConversationNavigator
      stages={stages}
      currentStagePaths={currentStagePaths}
      onFollowPath={handleFollowPath}
      onAction={handleAction}
    />
  )
}
```

## Props

### ConversationNavigator

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `stages` | `ConversationStageData[]` | Yes | Array of conversation stages |
| `currentStagePaths` | `ConversationPathData[]` | No | Paths for the current stage |
| `onFollowPath` | `(pathId: string) => void` | No | Callback when a path is followed |
| `onAction` | `(pathId: string, actionLabel: string) => void` | No | Callback when an action is triggered |

### ConversationStageData

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `id` | `string` | - | Unique stage identifier |
| `label` | `string` | - | Display name |
| `status` | `"completed" \| "current" \| "future"` | - | Stage status |

### ConversationPathData

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique path identifier |
| `label` | `string` | Path display name |
| `probability` | `number` | Success probability (0-100) |
| `recommended` | `boolean` | Whether this path is recommended |
| `icon` | `"check" \| "alert" \| "info"` | Icon type |
| `steps` | `string[]` | List of next steps |
| `script` | `string` | Suggested script text |
| `actions` | `Action[]` | Available actions |

### Action

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `label` | `string` | - | Action button label |
| `variant` | `string` | `"default" \| "outline" \| "secondary"` | Button variant |

## Styling

All components use Tailwind CSS with the `cn()` utility for conditional class merging. The design follows shadcn/ui conventions with:

- Consistent spacing and typography
- Responsive design
- Animation support (via `tw-animate-css`)
- Light/dark mode ready (via CSS variables)

## Routes

- **Home**: `/` - Landing page with demo links
- **Conversation Demo**: `/conversation-demo` - Full demonstration of the component

## Future Enhancements

Potential improvements:

1. **Real-time updates** - WebSocket integration for live data
2. **State persistence** - Save conversation state across page reloads
3. **Analytics tracking** - Track path selections and outcomes
4. **A/B testing** - Compare different conversation strategies
5. **Voice integration** - Connect with speech-to-text services
6. **MCP integration** - Connect with Palace API for real actions

## Testing

To test the component:

```bash
cd cdmx-buildathon-app
npm run dev
```

Then navigate to:
- http://localhost:5173/ (Home page)
- http://localhost:5173/conversation-demo (Demo page)
