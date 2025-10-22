# Conversational AI Copilot UX Patterns for Call Center Agents

## Executive Summary

This research document synthesizes UX patterns from leading conversational AI platforms designed for call center agents, with a focus on real-time guidance, conversation flow visualization, and tree-based navigation patterns. The findings are organized to provide actionable design recommendations for building a React-based agent copilot interface.

---

## 1. Leading Platform Analysis

### 1.1 Cresta AI - Real-Time Agent Assistance

**Interface Pattern**: Dynamic, context-aware assistance with proactive interventions

**Key Features**:
- **AI Analyst (2025)**: Natural language question-answering with structured answers, reasoning explanations, and supporting evidence links
- **Omnichannel Experience**: Consistent branding and personalized experiences across voice and digital channels
- **Real-time coaching**: Live conversation monitoring with instant feedback

**UX Principles**:
- Moving away from chat-only interfaces toward task-oriented UIs (temperature controls, knobs, sliders, semantic interfaces)
- Step-by-step progress indicators for complex workflows
- Expandable "See More" panels for deeper explanations
- Confidence metrics showing prediction reliability
- Highlighted data sources influencing AI decisions

### 1.2 Balto.ai - Real-Time Guidance Cards

**Interface Pattern**: Card-based dynamic prompts with gamification

**Key Features**:
- **Checklists**: Automatically checked off when agents say required items (with confetti celebration)
- **Dynamic Prompts**: Real-time rebuttals, objection handling, compliance reminders
- **Guidance Cards**: Context-triggered cards showing what to say when callers ask questions or share critical info
- **Screen Customization**: Adjustable, customizable layout adapting to workflow needs
- **Gamification**: Healthy competition through achievement tracking

**Layout Strategy**:
- Unobtrusive, context-aware guidance
- Adapts to conversation flow without forcing agents to jump between screens
- Automatic card surfacing based on conversation context

### 1.3 Salesforce Einstein (Agentforce Assistant)

**Interface Pattern**: Conversational UI with embedded assistant across CRM

**Key Features**:
- **Conversational Interface**: Natural language interaction with context retention
- **Natively Embedded**: Consistent experience across Salesforce applications
- **Copilot Builder**: Library of customizable actions visible to users
- **Deep Integration**: Combined with company data and metadata for contextual responses

**UX Principles**:
- Answer questions, summarize content, create new content, interpret conversations
- Dynamic task automation from a consistent conversational UI
- Transparency in AI reasoning ("what Copilot is thinking")

### 1.4 Microsoft Dynamics 365 Copilot

**Interface Pattern**: Right-side panel with tab-based organization

**Layout**:
- **Location**: Right-side panel that opens upon sign-in
- **Tab Structure**: "Ask a question" and "Write an email" tabs at top
- **Productivity Pane**: Centralized access to all Copilot features

**Key Features**:
- Suggest a response
- Ask a question (knowledge base queries)
- Write an email (AI composition)
- Case summary
- Live conversation summary

**Integration Strategy**:
- Multiple sessions in single workspace
- Smart Assist identifies similar cases and relevant articles
- AI features accessible without leaving primary workflow

### 1.5 Google Contact Center AI (CCAI)

**Interface Pattern**: Omnichannel dashboard with separate Agent Assist panel

**Layout**:
- **Main Dashboard**: Handle calls, messages, SMS, access Google tools
- **Separate Panel**: Knowledge resources appear in dedicated agent application panel
- **Tab Organization**: Dashboard, Agents, Queues, Reports

**Key Features**:
- FAQ article suggestions with confidence scores
- Smart Reply options
- Generative knowledge assist
- Summarization
- Live translation
- Customer profiles and database information access

**Design Philosophy**:
- Modern, embeddable APIs optimized for smartphone era
- One ecosystem for all communication channels
- Flexible integration with existing platforms

---

## 2. Core UX Patterns

### 2.1 Layout Approaches Comparison

#### **Sidebar (Right-side Panel)** ⭐ RECOMMENDED for Call Centers

**Pros**:
- Persistent visibility without obscuring main workflow
- Natural eye movement (left to right for Western users)
- Dedicated real estate for AI guidance
- Doesn't interrupt main task focus
- Easy to scan while on call

**Cons**:
- Reduces horizontal space for main content
- Requires wider screens (minimum 1366px recommended)

**Best Practices**:
- Width: 320-400px (20-25% of 1920px screen)
- Collapsible for smaller screens (<1280px)
- Sticky positioning to remain visible during scroll
- Tab-based organization for multiple copilot features

**Examples**: Microsoft Dynamics 365, most enterprise agent assist tools

#### **Overlay/Modal**

**Pros**:
- Full attention to AI suggestion when needed
- No permanent screen real estate cost
- Works on any screen size

**Cons**:
- Interrupts workflow
- Requires dismissal action
- Can feel intrusive with frequent triggers
- Hides underlying conversation context

**Best Practices**:
- Use only for critical interventions
- Include "Don't show again for this scenario" option
- Semi-transparent backdrop to maintain context visibility
- Quick dismiss with ESC key or click outside

**Examples**: Critical compliance alerts, urgent escalation prompts

#### **Split-Screen**

**Pros**:
- Clear separation between conversation and guidance
- Both panels always visible
- Works well for training scenarios

**Cons**:
- Requires large screens (minimum 1600px)
- Fixed layout reduces flexibility
- Content scrolling challenges
- Not responsive-friendly

**Best Practices**:
- Use 60/40 or 70/30 split (conversation/guidance)
- Allow resize with drag handle
- Minimum 480px per panel
- Consider only for desktop-only applications

#### **Bottom Panel**

**Pros**:
- Preserves horizontal workspace
- Natural position for "next steps"
- Works with vertical scrolling patterns

**Cons**:
- Competes with chat/messaging interfaces
- Easy to ignore (below fold)
- Limited vertical space on laptops

**Best Practices**:
- Collapsible/expandable design
- Height: 200-300px when expanded
- Slide-up animation to draw attention
- Use for suggested responses or quick actions

### 2.2 Visual Hierarchy Principles

#### Information Density Tiers

**Tier 1: Critical/Immediate (Always Visible)**
- Current conversation stage/topic
- Next best action (1-3 options max)
- Compliance alerts
- Active checklist items

**Tier 2: Important/Contextual (Visible but secondary)**
- Conversation history breadcrumb
- Knowledge base suggestions
- Customer information
- Alternative paths available

**Tier 3: Optional/Reference (Expandable)**
- Full decision tree
- Historical patterns
- Training resources
- Detailed explanations

#### Visual Weight Hierarchy

```
1. Error/Compliance Warnings (Red, bold, icon)
2. Next Best Action (Primary color, medium emphasis)
3. Current Position (Neutral, subtle highlight)
4. Available Options (Secondary color, light)
5. Context/History (Gray, smallest text)
```

### 2.3 Confidence & Priority Indicators

#### Confidence Score Visualization Patterns

**Numeric + Visual**:
```
95% ████████████████████░  High confidence
72% ████████████░░░░░░░░  Medium confidence
45% ████████░░░░░░░░░░░░  Low confidence
```

**Color Coding**:
- Green (>80%): High confidence, safe to use
- Yellow (50-80%): Medium confidence, review recommended
- Red (<50%): Low confidence, verify before using

**Icon-Based**:
- ● ● ● (3 dots): High confidence
- ● ● ○ (2 dots): Medium confidence
- ● ○ ○ (1 dot): Low confidence

**Best Practices**:
- Always show confidence when suggesting actions
- Explain what the score means (not just a number)
- Provide reasoning: "Based on 47 similar conversations..."
- Allow agents to provide feedback to improve scores

#### Priority Indicators

**Urgency Levels**:
1. **Critical**: Red badge, animation, sound (compliance issues)
2. **High**: Orange/amber badge, subtle pulse
3. **Medium**: Blue badge, static
4. **Low**: Gray badge or no badge

**Visual Design**:
- Use badges/pills for categorical priority
- Use progress bars for completion-based priority
- Combine icon + color + text for accessibility

### 2.4 Real-Time Guidance Presentation

#### Static vs Dynamic Suggestions

**Static Guidance** (Always visible):
- Conversation checklist
- Compliance requirements
- Script outline
- Brand standards

**Dynamic Guidance** (Context-triggered):
- Objection responses (triggered by customer keywords)
- Upsell opportunities (triggered by conversation stage)
- Knowledge base articles (triggered by questions)
- Escalation prompts (triggered by sentiment)

**Hybrid Approach** (Recommended):
- Static frame with dynamic content
- Persistent checklist that highlights relevant items
- Always-visible "Next Step" card that updates content

#### Proactive Intervention Timing

**When to Show Suggestions**:

1. **Natural Conversation Pauses**:
   - After customer finishes speaking
   - During agent's note-taking
   - Before transferring call
   - When agent stops typing for 2-3 seconds

2. **Triggered Events**:
   - Specific keywords detected
   - Sentiment shift (positive to negative)
   - Checklist item coming up
   - Time threshold reached (e.g., 5 min without resolution)

3. **Agent-Initiated**:
   - Clicks "Suggest response"
   - Types question in copilot
   - Selects topic/intent manually

**When NOT to Show**:
- During active speaking (visual distraction)
- Immediately after previous suggestion (give time to process)
- When agent is mid-sentence typing
- During customer emotional moments (wait for de-escalation)

**Visual Behavior**:
- Fade in (300ms) rather than sudden appearance
- Subtle highlight pulse (1-2 times) for new suggestions
- Dismiss button always accessible
- Auto-dismiss after 30-60 seconds if not interacted with

---

## 3. Tree-Based Navigation Patterns

### 3.1 Decision Tree Visualization Approaches

#### Progressive Disclosure Pattern ⭐ RECOMMENDED

**Concept**: Show only current node + immediate children, hide distant branches

**Visual Structure**:
```
You are here:
┌─────────────────────────────────────┐
│ 🏠 Billing Inquiry                  │
│   └─ Payment Issue                  │
│       └─ 💡 Declined Card ← Current │
└─────────────────────────────────────┘

Next Steps (choose one):
┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐
│ Verify Card Info │ │ Try Another Card │ │ Contact Bank   │
└──────────────────┘ └──────────────────┘ └────────────────┘
```

**Benefits**:
- Reduces cognitive load
- Focuses agent on immediate decision
- Prevents overwhelm from seeing entire tree
- Easy to navigate forward

**Implementation**:
- Breadcrumb shows path taken
- "Expand tree" option for advanced users
- Back button to previous node
- "Start over" to root

#### Minimap + Detail View

**Concept**: Small overview tree + zoomed detail section

**Layout**:
```
┌─────────────────┐  ┌──────────────────────────────────┐
│  Overview       │  │  Detail View                     │
│                 │  │                                  │
│   [Tree]        │  │  Current: Declined Card         │
│    │            │  │                                  │
│    ├─ A         │  │  Question to Ask:               │
│    │  ├─ B ●   │  │  "Can you try a different card?" │
│    │  └─ C     │  │                                  │
│    └─ D         │  │  If Yes → Path A                │
│                 │  │  If No  → Path B                │
└─────────────────┘  └──────────────────────────────────┘
```

**Benefits**:
- Spatial awareness (see whole conversation map)
- Detail when needed
- Good for training/QA review

**Challenges**:
- Requires more screen space
- Complex trees hard to fit in minimap
- Can be overwhelming for new agents

#### Linear Timeline (No Tree)

**Concept**: Show conversation as linear progression, hide branching

**Visual Structure**:
```
✓ 1. Greeted Customer
✓ 2. Identified Issue
→ 3. Verify Account    ← You are here
  4. Resolve Issue
  5. Close Call
```

**Benefits**:
- Simplest cognitive model
- Works for linear processes
- Familiar checklist pattern

**Limitations**:
- Doesn't show alternative paths
- Can't handle complex branching
- No way to go back and choose different path

**Best For**: Simple, linear processes with minimal branching

### 3.2 Breadcrumb & Path Indicators

#### Breadcrumb Design Patterns

**Hierarchical Breadcrumb**:
```
Home > Billing > Payment Issues > Declined Card
                                  └─ You are here
```

**Conversational Breadcrumb**:
```
Topic: Billing
 └─ Sub-topic: Payment not processing
     └─ Cause: Card declined at gateway
```

**Step-based Breadcrumb**:
```
Step 1 > Step 2 > Step 3 > Step 4
  ✓       ✓        ●        ○
Done    Done    Current  Pending
```

**Best Practices**:
- Maximum 5 levels deep before truncation
- Click each level to jump back
- Show full path on hover (tooltip)
- Distinguish between completed/current/upcoming steps
- Use icons for quick visual scanning

### 3.3 Branch Switching Patterns

#### Scenario: Agent realizes they're on wrong path

**Pattern 1: Inline Path Switch**
```
Current: Troubleshooting Hardware
┌────────────────────────────────────────────┐
│ ℹ️  Did you mean Software Issue instead?   │
│ [Switch to Software Path]  [No, continue] │
└────────────────────────────────────────────┘
```

**Pattern 2: Sidebar Branch Options**
```
Alternative Paths:
○ Hardware Issue (current)
○ Software Issue
○ Account/Login Issue
○ Billing Question
```

**Pattern 3: Conversation Restart with Context**
```
┌─────────────────────────────────────────┐
│ Start Different Path                    │
│                                         │
│ Your notes and customer info will be   │
│ saved. Choose new topic:                │
│                                         │
│ • Hardware                              │
│ • Software                              │
│ • Billing                               │
└─────────────────────────────────────────┘
```

**Best Practices**:
- Preserve conversation history when switching
- Show what will be lost vs. kept
- Confirm before switching (undo is hard)
- AI can suggest path switch based on conversation

### 3.4 Depth Indicators & Orientation

#### Visual Depth Cues

**Indentation**:
```
Billing
  └─ Payment Issue
      └─ Declined Card
          └─ Try Different Payment
```

**Depth Counter**:
```
Level 1 > Level 2 > Level 3 > Level 4
```

**Progress Bar**:
```
Conversation Depth: [████████░░] 4 of 5 steps
```

**Color Gradient**:
```
🟦 Root (darkest)
  🟦 Level 1
    🟦 Level 2
      🟦 Level 3 (lightest)
```

#### "Where Am I?" Orientation Patterns

**Context Panel**:
```
┌──────────────────────────────────┐
│ 📍 Current Position              │
├──────────────────────────────────┤
│ Topic: Billing Inquiry           │
│ Issue: Card Declined             │
│ Stage: Troubleshooting           │
│ Time in Stage: 2:34              │
│ Options Available: 3             │
└──────────────────────────────────┘
```

**Visual Tree with Highlight**:
```
Billing ← You started here
├─ View Bill
├─ Dispute Charge
└─ Payment Issue ← Then selected this
    ├─ Card Declined ← 💡 You are here
    ├─ Insufficient Funds
    └─ Wrong Amount
```

**Timeline with Waypoints**:
```
🏁 Start Call → Identified Topic → Drilled Down → 💡 Current → 🎯 Resolution
```

---

## 4. Conversation Flow Patterns

### 4.1 Current Position + Next Steps + Available Branches

#### Combined View (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│ CURRENT STEP                                           │
│ Troubleshooting declined card                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ NEXT BEST ACTION ⭐                                    │
│ Ask: "Do you see any error message on your screen?"   │
│                                                         │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │ Yes (Error)  │ │ No (Silent)  │ │ Card Expired │   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│ OTHER PATHS                                            │
│ → Escalate to supervisor                              │
│ → Transfer to billing department                      │
│ → Schedule callback                                    │
└─────────────────────────────────────────────────────────┘
```

**Information Architecture**:
1. **Current Step** (Context): Where you are now
2. **Next Best Action** (Guidance): What AI recommends
3. **Response Branches** (Options): Paths based on customer response
4. **Alternative Paths** (Escape hatches): Other valid actions

### 4.2 Timeline vs Flow Diagram

#### Timeline Approach (Linear Time-based)

**Best For**: Sequential processes, support case tracking, audit trails

```
10:32 AM  Call started
10:33 AM  Customer identified
10:35 AM  Issue: Billing question
10:37 AM  Solution provided
10:40 AM  ← You are here
???       Call close
```

**Pros**:
- Chronological clarity
- Easy to understand
- Shows time spent per stage
- Good for review/QA

**Cons**:
- Doesn't show branching
- Linear only
- No future path visibility

#### Flow Diagram Approach (Decision-based)

**Best For**: Complex decision trees, troubleshooting, guided selling

```
          [Start]
             │
        [Identify Topic]
             │
      ┌──────┼──────┐
      │      │      │
  [Billing][Tech][General]
      │
  [Payment Issue] ← You are here
      │
  ┌───┼───┐
  │   │   │
[Card][ACH][Other]
```

**Pros**:
- Shows all possible paths
- Visual decision structure
- Clear branches
- Good for training

**Cons**:
- Can be overwhelming
- Requires more space
- Complex to maintain

#### Hybrid: Stepper with Branching ⭐ RECOMMENDED

```
Step 1 → Step 2 → Step 3 ← Current → Step 4 → Step 5
  ✓        ✓      ┌─────┐              ○        ○
                  │  A  │
                  │  B  │  ← Choose path
                  │  C  │
                  └─────┘
```

**Benefits**:
- Timeline simplicity
- Shows branching at current step
- Not overwhelming
- Familiar pattern (checkout flows, forms)

### 4.3 Progress Indicators for Conversation Stages

#### Visual Progress Patterns

**Linear Progress Bar**:
```
[████████████░░░░░░░░] 60% Complete

Identify → Troubleshoot → Resolve → Confirm → Close
   ✓            ✓           ●          ○         ○
```

**Circular Progress (Stage-based)**:
```
        Identify
           ✓
    Close     Troubleshoot
      ○            ✓
     Confirm → Resolve ●
        ○
```

**Checklist Progress**:
```
✓ Greeted customer
✓ Verified account
✓ Identified issue
● Provided solution (in progress)
○ Confirmed resolution
○ Offered additional help
○ Closed call
```

**Estimated Time Remaining**:
```
Conversation Progress: 45% complete
Estimated time remaining: ~3 minutes

Based on similar calls
```

#### Stage Transition Indicators

**Automatic Stage Detection**:
```
┌─────────────────────────────────────┐
│ 🎯 Detected: Resolution Phase       │
│ AI noticed customer said "got it"   │
│                                     │
│ Suggested next step:                │
│ "Is there anything else I can       │
│  help you with today?"              │
└─────────────────────────────────────┘
```

**Manual Stage Confirmation**:
```
Mark current stage as complete?
┌──────────────┐ ┌──────────────┐
│   Yes, Done  │ │ Not Yet      │
└──────────────┘ └──────────────┘
```

### 4.4 Context Switch Handling

#### Scenario: Customer changes topic mid-conversation

**Pattern 1: Pause & Switch**
```
┌──────────────────────────────────────────────────┐
│ 🔄 Topic Change Detected                         │
│                                                  │
│ Customer asked about: Billing                   │
│ Current topic: Technical Support                │
│                                                  │
│ Actions:                                         │
│ ┌──────────────────┐ ┌──────────────────┐      │
│ │ Switch to Billing│ │ Finish Tech First│      │
│ └──────────────────┘ └──────────────────┘      │
│                                                  │
│ ┌──────────────────┐                            │
│ │ Handle Both      │ (Multi-topic mode)         │
│ └──────────────────┘                            │
└──────────────────────────────────────────────────┘
```

**Pattern 2: Split View**
```
┌──────────────────┐  ┌──────────────────┐
│ Primary Topic    │  │ Secondary Topic  │
│                  │  │                  │
│ Tech Support     │  │ Billing Question │
│ (Active)         │  │ (Noted)          │
│                  │  │                  │
│ [Continue]       │  │ [Switch to This] │
└──────────────────┘  └──────────────────┘
```

**Pattern 3: Queue System**
```
Conversation Queue:
1. ● Tech Support (current)
2. ○ Billing Question (queued)

[Mark #1 Complete to Move to #2]
```

**Best Practices**:
- Auto-detect topic changes via NLP
- Suggest topic switch but don't force it
- Keep notes from previous topic
- Allow quick return to original topic
- Show both topics in context panel

---

## 5. Visual Metaphors & Design Systems

### 5.1 Visual Metaphor Comparison

| Metaphor | Best For | Pros | Cons |
|----------|----------|------|------|
| **Tree** | Hierarchical decisions | Familiar, shows relationships | Can look complex, hard to scale |
| **Timeline** | Sequential processes | Chronological clarity | No branching, linear only |
| **Map** | Exploratory navigation | Spatial awareness | Hard to show progress |
| **Flowchart** | Process documentation | Technical clarity | Overwhelming for agents |
| **Stepper** | Multi-step forms | Simple, familiar | Limited branching |
| **Kanban** | Status tracking | Clear states | Not conversational |
| **Breadcrumb** | Deep hierarchies | Shows path | No future visibility |

### 5.2 Recommended Metaphor: Hybrid Stepper + Cards

**Structure**:
```
┌──────────────────────────────────────────────────────┐
│ Progress: Identify → Troubleshoot → Resolve → Close │
│           ✓             ●              ○        ○    │
└──────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│ 💡 Current Step: Troubleshoot      │
│                                    │
│ Ask customer about error message  │
│                                    │
│ Choose customer response:          │
│ ┌──────────┐ ┌──────────┐        │
│ │ See Error│ │ No Error │        │
│ └──────────┘ └──────────┘        │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 📚 Relevant Knowledge              │
│                                    │
│ • How to read error codes          │
│ • Common card decline reasons      │
└────────────────────────────────────┘
```

**Why This Works**:
- Stepper shows overall progress (orientation)
- Card shows current decision point (focus)
- Knowledge panel provides context (support)
- Not overwhelming (progressive disclosure)
- Familiar patterns (e-commerce, forms)

---

## 6. React Component Implementation Recommendations

### 6.1 Component Library: CopilotKit

**Why CopilotKit** ⭐ RECOMMENDED:
- Purpose-built for React AI copilot interfaces
- Open source with active development
- AG-UI Protocol for agent-UI communication
- Headless UI with full customization
- Pre-built components + custom hooks
- Multi-step workflow support
- Real-time streaming output
- Integration with LangGraph, CrewAI, etc.

**Installation**:
```bash
npm i @copilotkit/react-core @copilotkit/react-ui
```

**Basic Setup**:
```jsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilot">
      <YourMainApp />
      <CopilotSidebar />
    </CopilotKit>
  );
}
```

**Custom Hooks**:
- `useCopilotChat()`: Full control over chat interface
- `useCopilotAction()`: Define custom agent actions
- `useCopilotReadable()`: Expose app state to copilot

### 6.2 Tree Visualization: react-d3-tree

**Why react-d3-tree**:
- Mature library (48+ dependent projects)
- Interactive D3 hierarchies in React
- Minimal setup for complex trees
- TypeScript support
- Customizable nodes and links

**Installation**:
```bash
npm i react-d3-tree
```

**Example**:
```jsx
import Tree from 'react-d3-tree';

const treeData = {
  name: 'Billing Inquiry',
  children: [
    {
      name: 'Payment Issue',
      children: [
        { name: 'Declined Card' },
        { name: 'Wrong Amount' }
      ]
    }
  ]
};

function DecisionTree() {
  return (
    <Tree
      data={treeData}
      orientation="vertical"
      translate={{ x: 200, y: 50 }}
      onNodeClick={(node) => console.log(node)}
    />
  );
}
```

### 6.3 Recommended Component Structure

```
src/
├── components/
│   ├── AgentCopilot/
│   │   ├── CopilotSidebar.tsx       # Main sidebar container
│   │   ├── ConversationProgress.tsx # Progress stepper
│   │   ├── CurrentStepCard.tsx      # Active step guidance
│   │   ├── NextStepsPanel.tsx       # Suggested actions
│   │   ├── BranchOptions.tsx        # Decision buttons
│   │   ├── KnowledgePanel.tsx       # Context articles
│   │   ├── ConfidenceIndicator.tsx  # AI confidence score
│   │   └── BreadcrumbPath.tsx       # Navigation trail
│   │
│   ├── TreeVisualization/
│   │   ├── DecisionTreeView.tsx     # Full tree with react-d3-tree
│   │   ├── MiniMap.tsx              # Overview tree
│   │   └── TreeNode.tsx             # Custom node component
│   │
│   └── Cards/
│       ├── GuidanceCard.tsx         # Reusable card component
│       ├── ComplianceAlert.tsx      # Warning/error card
│       └── SuggestedResponse.tsx    # Quick reply card
│
├── hooks/
│   ├── useConversationFlow.ts       # Conversation state management
│   ├── useDecisionTree.ts           # Tree navigation logic
│   └── useCopilotGuidance.ts        # AI suggestion integration
│
└── types/
    ├── conversation.ts
    ├── tree.ts
    └── copilot.ts
```

### 6.4 State Management Pattern

```typescript
// useConversationFlow.ts
interface ConversationState {
  currentNode: TreeNode;
  history: TreeNode[];
  stage: ConversationStage;
  progress: number;
  availableBranches: Branch[];
}

function useConversationFlow() {
  const [state, setState] = useState<ConversationState>({
    currentNode: rootNode,
    history: [],
    stage: 'identify',
    progress: 0,
    availableBranches: []
  });

  const navigateTo = (node: TreeNode) => {
    setState(prev => ({
      ...prev,
      currentNode: node,
      history: [...prev.history, prev.currentNode],
      progress: calculateProgress(node)
    }));
  };

  const goBack = () => {
    const previousNode = state.history[state.history.length - 1];
    setState(prev => ({
      ...prev,
      currentNode: previousNode,
      history: prev.history.slice(0, -1)
    }));
  };

  return { state, navigateTo, goBack };
}
```

### 6.5 Layout Component Example

```tsx
// CopilotSidebar.tsx
import { CopilotSidebar as BaseSidebar } from '@copilotkit/react-ui';
import { ConversationProgress } from './ConversationProgress';
import { CurrentStepCard } from './CurrentStepCard';
import { NextStepsPanel } from './NextStepsPanel';

export function CopilotSidebar() {
  const { state, navigateTo } = useConversationFlow();

  return (
    <aside className="w-96 h-screen bg-white border-l border-gray-200 flex flex-col">
      {/* Progress Header */}
      <header className="p-4 border-b">
        <ConversationProgress
          currentStage={state.stage}
          progress={state.progress}
        />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current Step */}
        <CurrentStepCard
          node={state.currentNode}
          confidence={0.85}
        />

        {/* Next Steps */}
        <NextStepsPanel
          branches={state.availableBranches}
          onSelect={navigateTo}
        />

        {/* Knowledge Base */}
        <BaseSidebar
          labels={{
            title: "Knowledge Assistant",
            initial: "How can I help with this conversation?"
          }}
        />
      </div>

      {/* Footer Actions */}
      <footer className="p-4 border-t">
        <button onClick={goBack} className="text-sm text-gray-600">
          ← Back
        </button>
      </footer>
    </aside>
  );
}
```

---

## 7. Best Practices Summary

### 7.1 Layout & Screen Real Estate

✅ **DO**:
- Use right sidebar (320-400px) for primary copilot interface
- Reserve overlays for critical/urgent interventions only
- Implement responsive collapse at <1280px screen width
- Use progressive disclosure to show only relevant information
- Maintain minimum 60% screen width for main conversation area

❌ **DON'T**:
- Use split-screen unless screen width >1600px
- Show full decision tree by default (too overwhelming)
- Place critical information below the fold
- Auto-expand panels without user action
- Cover main workflow with persistent overlays

### 7.2 Information Hierarchy

✅ **DO**:
- Show current step + next best action prominently
- Use visual hierarchy (size, color, position) to guide attention
- Display confidence scores for AI suggestions
- Provide breadcrumb for conversation path
- Group related information in cards

❌ **DON'T**:
- Show all possible paths simultaneously
- Use more than 3 levels of visual hierarchy
- Hide confidence/reasoning for AI suggestions
- Mix past, present, and future actions without clear distinction

### 7.3 Guidance Timing

✅ **DO**:
- Show suggestions during natural conversation pauses
- Trigger guidance on specific keywords/events
- Auto-dismiss suggestions after 30-60 seconds
- Allow manual suggestion requests
- Detect and suggest topic changes

❌ **DON'T**:
- Interrupt during active speaking
- Show new suggestions immediately after previous one
- Force guidance when agent is typing
- Trigger during emotional customer moments
- Auto-execute suggestions without agent approval

### 7.4 Tree Navigation

✅ **DO**:
- Use progressive disclosure (current + next only)
- Provide breadcrumb trail of path taken
- Allow quick "start over" to root
- Enable branch switching with context preservation
- Show depth indicators for orientation

❌ **DON'T**:
- Display entire tree structure by default
- Lose conversation history when switching paths
- Force linear progression (allow jumping back)
- Hide alternative paths completely
- Exceed 5 levels of depth without warning

### 7.5 Visual Design

✅ **DO**:
- Use consistent color system for priority/confidence
- Include icons for quick visual scanning
- Animate transitions (300ms fade) for new content
- Provide loading states for AI processing
- Use familiar UI patterns (cards, steppers, badges)

❌ **DON'T**:
- Rely on color alone (accessibility)
- Use more than 2-3 brand colors
- Create custom iconography (use standard libraries)
- Skip loading indicators for AI responses
- Reinvent common patterns

### 7.6 Conversation Flow

✅ **DO**:
- Combine timeline (stages) + decision tree (branches)
- Show progress percentage/time estimates
- Auto-detect conversation stage transitions
- Handle multi-topic conversations gracefully
- Preserve context during topic switches

❌ **DON'T**:
- Use only linear timeline (no branching support)
- Use only flow diagram (too complex)
- Force single-topic conversations
- Lose previous topic when switching
- Auto-switch topics without confirmation

---

## 8. Key Takeaways

### 8.1 Critical Design Decisions

**1. Layout**: Right sidebar (320-400px) wins for call center context
   - Pros: Persistent, non-intrusive, familiar, professional
   - Best for: Desktop agents with 1366px+ screens
   - Fallback: Collapsible panel for smaller screens

**2. Showing the Tree**: Progressive disclosure > full tree view
   - Show: Current node + immediate children only
   - Provide: Breadcrumb for path + expand option for full tree
   - Balance: Simplicity (don't overwhelm) vs. transparency (show options)

**3. Navigation Pattern**: Hybrid stepper + cards
   - Top: Progress stepper (overall stages)
   - Middle: Current step card (focused guidance)
   - Bottom: Next steps panel (decision branches)
   - Expandable: Full tree view, knowledge base

**4. Visual Metaphor**: Stepper + cards (not pure tree/timeline/map)
   - Familiar from e-commerce, forms, wizards
   - Shows progress + decisions + guidance
   - Scales from simple to complex conversations

### 8.2 Balancing Complexity

**For Simple Conversations** (1-3 levels deep):
- Linear stepper with minimal branching
- Just show next best action
- Hide tree visualization completely
- Focus on checklist completion

**For Complex Conversations** (4+ levels, multiple branches):
- Hybrid stepper + decision cards
- Breadcrumb for path awareness
- Minimap of tree (optional, expandable)
- Clear depth indicators
- Branch switching support

**The Key Question**: "Can the agent succeed without seeing the tree?"
- If YES → Hide tree, show next steps only
- If NO → Progressive disclosure with expand option
- If MAYBE → Provide both modes, let agent choose

### 8.3 Context-Specific Recommendations

**For Your Buildathon Project**:

Given you're building a hotel booking conversation copilot:

1. **Start Simple**: Linear stepper for booking flow
   ```
   Dates → Room → Guests → Extras → Payment → Confirmation
   ```

2. **Add Branches**: Decision cards for common variations
   ```
   Room Selection:
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Standard│ │ Deluxe  │ │ Suite   │
   └─────────┘ └─────────┘ └─────────┘
   ```

3. **Handle Context Switches**: Customer asks about amenities mid-booking
   ```
   Primary: Booking Flow (current)
   Queued: Amenities Question
   [Continue Booking] [Switch to Question]
   ```

4. **Use Cards for Upsells**: Dynamic suggestions based on conversation
   ```
   💡 Suggested Upsell
   Customer mentioned anniversary
   → Suggest: Romance package (+$50)
   [Add to Booking] [Dismiss]
   ```

5. **Layout**: Right sidebar with collapsible sections
   ```
   ┌─────────────────────────────────────┐
   │ Booking Progress: 60% complete      │
   ├─────────────────────────────────────┤
   │ 💡 Current Step: Room Selection     │
   │ "Which room type interests you?"    │
   │                                     │
   │ [Standard] [Deluxe] [Suite]         │
   ├─────────────────────────────────────┤
   │ 📋 Booking Summary (expandable)     │
   │ Check-in: Jan 15                    │
   │ Check-out: Jan 18                   │
   │ Guests: 2 adults                    │
   ├─────────────────────────────────────┤
   │ 💬 AI Assistant (collapsible)       │
   │ Ask me anything about the property  │
   └─────────────────────────────────────┘
   ```

---

## 9. Additional Resources

### 9.1 Documentation Links

- **CopilotKit**: https://www.copilotkit.ai/
- **react-d3-tree**: https://github.com/bkrem/react-d3-tree
- **Microsoft Copilot Design Guidelines**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
- **HAX Toolkit (Human-AI Experience)**: https://learn.microsoft.com/en-us/community/content/best-practices-ai-ux
- **Progressive Disclosure Pattern**: https://www.nngroup.com/articles/progressive-disclosure/

### 9.2 Design Systems to Reference

- **Microsoft Fluent UI**: Copilot components, agent patterns
- **Salesforce Lightning**: Service console layouts
- **Ant Design**: Sidebar, stepper, card components
- **Shadcn/ui**: Modern React components with Tailwind

### 9.3 Example Implementations to Study

1. **GitHub Copilot Chat**: Sidebar, context-aware suggestions
2. **Intercom Inbox**: Conversation + assistance sidebar
3. **Zendesk Agent Workspace**: Multi-panel layout, knowledge base
4. **HubSpot CRM**: Contact + conversation + suggestions

### 9.4 User Research Considerations

**Usability Testing Questions**:
- Can agents find next best action within 2 seconds?
- Do agents understand where they are in conversation?
- Can agents switch paths without confusion?
- Is the sidebar width appropriate (not too narrow/wide)?
- Are confidence scores helpful or distracting?

**Metrics to Track**:
- Time to first action after suggestion appears
- Percentage of suggestions accepted vs. dismissed
- Number of path switches per conversation
- Breadcrumb click rate (are agents using it?)
- Sidebar collapse/expand frequency

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install CopilotKit and set up basic sidebar
- [ ] Create conversation state management hook
- [ ] Build stepper component for conversation stages
- [ ] Implement basic card components (current step, next steps)
- [ ] Add breadcrumb navigation

### Phase 2: Tree Navigation (Week 2)
- [ ] Define conversation tree data structure
- [ ] Build progressive disclosure logic (show current + children)
- [ ] Add branch selection UI (button cards)
- [ ] Implement back navigation
- [ ] Create minimap view (optional/expandable)

### Phase 3: AI Integration (Week 3)
- [ ] Connect to AI backend for suggestions
- [ ] Build confidence score visualization
- [ ] Implement proactive suggestion timing logic
- [ ] Add knowledge base panel
- [ ] Create suggested response cards

### Phase 4: Polish (Week 4)
- [ ] Responsive sidebar (collapse at mobile)
- [ ] Animations and transitions
- [ ] Loading states for AI processing
- [ ] Error handling and fallbacks
- [ ] Accessibility (keyboard nav, screen readers)

### Phase 5: Testing & Iteration
- [ ] Usability testing with target users
- [ ] A/B test different layouts (if possible)
- [ ] Gather feedback on information density
- [ ] Refine visual hierarchy based on eye tracking
- [ ] Optimize for performance (lazy loading, virtualization)

---

## Conclusion

The research reveals a clear convergence around **right-sidebar layouts with progressive disclosure** as the dominant pattern for call center agent copilots. The most successful implementations balance:

1. **Simplicity** (don't overwhelm agents) with **transparency** (show reasoning, confidence)
2. **Guidance** (next best action) with **autonomy** (alternative paths available)
3. **Current focus** (what to do now) with **context awareness** (where am I in conversation)

For your buildathon project, start with a **hybrid stepper + cards approach** in a **collapsible right sidebar**, using **CopilotKit for React integration** and **progressive disclosure for tree navigation**. This provides the best balance of simplicity, familiarity, and scalability.

The key is not to show the entire tree, but to **guide agents through the conversation one decision at a time**, while maintaining visibility of their path and available alternatives.
