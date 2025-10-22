# Real-Time Optimization Strategy

## Problem Statement

**Current Flow:**
```
Transcription (2s) → Debounce (4s) → Agent Analysis (6s) = 12 seconds total
Meanwhile: 6+ new messages arrived, agent is analyzing OLD context
```

**User Experience:**
- Suggestions feel "behind" the conversation
- Actions proposed for topics already discussed
- Agent seems slow and out of sync

## Root Cause Analysis

### Bottleneck Identification

1. **Full Agent Workflow is Heavy** (~6s)
   - Intent analysis with LLM
   - Stage management
   - Action generation
   - Health scoring
   - All using Claude Haiku API calls

2. **Smart Batching is Conservative** (4s wait)
   - Good for data quality
   - Bad for real-time responsiveness

3. **No Lightweight Fast Path**
   - Every message goes through full analysis
   - Can't quickly react to urgent signals

## Solution: Two-Tier Architecture

### Architecture Overview

```
┌─ Fast Lane (< 500ms) ────────────────────────┐
│ Lightweight Intent Detector                  │
│ • Client-side pattern matching               │
│ • No API calls                                │
│ • Detects: dates, party size, urgency        │
│ • Updates: booking context immediately       │
│ • Triggers: validation hints                 │
└───────────────────────────────────────────────┘
         ↓ (runs in parallel)
┌─ Deep Lane (4-6s) ────────────────────────────┐
│ Full Agent Workflow                           │
│ • Claude Haiku API                            │
│ • Complete context analysis                   │
│ • Action generation                           │
│ • Stage management                            │
└───────────────────────────────────────────────┘
```

### Benefits

1. **Immediate Feedback** - Fast lane provides instant updates
2. **Parallel Processing** - Both lanes run simultaneously
3. **Progressive Enhancement** - Fast results now, deep analysis later
4. **Resource Efficient** - Heavy calls only when needed

## Implementation Plan

### Phase 1: Lightweight Intent Detector

**Location:** `app/lib/agent/fast-detector.ts`

```typescript
/**
 * Fast Intent Detector - Client-Side Pattern Matching
 *
 * Runs immediately on each message (<100ms)
 * No API calls, pure regex and logic
 */

export interface FastIntent {
  type: 'date_mention' | 'party_size' | 'budget' | 'urgent' | 'confirmation' | 'objection'
  confidence: number
  extractedData?: Partial<CustomerProfile>
  suggestAction?: string
}

export function detectFastIntents(text: string, speaker: 'agent' | 'customer'): FastIntent[] {
  const intents: FastIntent[] = []
  const lowerText = text.toLowerCase()

  // Skip agent messages for most intents
  if (speaker === 'agent') {
    return intents
  }

  // 1. Date Mention Detection
  const datePatterns = [
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/gi,
    /\d{1,2}(st|nd|rd|th)\s+(of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}/gi
  ]

  for (const pattern of datePatterns) {
    if (pattern.test(text)) {
      intents.push({
        type: 'date_mention',
        confidence: 0.95,
        suggestAction: 'highlight_booking_context'
      })
      break
    }
  }

  // 2. Party Size Detection
  const partySizePatterns = [
    /(\d+)\s+(adults?|people|persons?|guests?)/i,
    /(\d+)\s+(children|kids)/i,
    /(solo|alone|just\s+me)/i,
    /(couple|two\s+of\s+us)/i,
    /(family\s+of\s+(\d+))/i
  ]

  for (const pattern of partySizePatterns) {
    const match = text.match(pattern)
    if (match) {
      intents.push({
        type: 'party_size',
        confidence: 0.90,
        suggestAction: 'update_party_size'
      })
      break
    }
  }

  // 3. Budget Mention
  const budgetPatterns = [
    /\$(\d{1,3}(,\d{3})*)/,
    /around\s+(\d+)/i,
    /budget.*?(\d+)/i,
    /spend.*?(\d+)/i
  ]

  for (const pattern of budgetPatterns) {
    if (pattern.test(text)) {
      intents.push({
        type: 'budget',
        confidence: 0.85,
        suggestAction: 'update_budget'
      })
      break
    }
  }

  // 4. Urgency Detection
  const urgencyPatterns = [
    /\b(urgent|asap|immediately|right\s+now|today)\b/i,
    /\b(need\s+it|want\s+it)\s+(now|today|asap)/i,
    /\b(leaving|departing)\s+(tomorrow|today)/i
  ]

  if (urgencyPatterns.some(p => p.test(text))) {
    intents.push({
      type: 'urgent',
      confidence: 0.95,
      suggestAction: 'fast_track_analysis'
    })
  }

  // 5. Confirmation/Agreement
  const confirmationPatterns = [
    /\b(yes|yeah|yep|sure|okay|ok|correct|right|exactly)\b/i,
    /\b(that('s|\s+is)\s+(correct|right|perfect))\b/i,
    /\b(sounds?\s+(good|great|perfect))\b/i
  ]

  if (confirmationPatterns.some(p => p.test(text)) && text.split(' ').length < 5) {
    intents.push({
      type: 'confirmation',
      confidence: 0.80
    })
  }

  // 6. Objection/Concern
  const objectionPatterns = [
    /\b(but|however|though)\b/i,
    /\b(too\s+(expensive|much|high))/i,
    /\b(can't\s+afford|over\s+budget)/i,
    /\b(not\s+sure|hesitant|concerned)/i
  ]

  if (objectionPatterns.some(p => p.test(text))) {
    intents.push({
      type: 'objection',
      confidence: 0.85,
      suggestAction: 'handle_objection'
    })
  }

  return intents
}
```

### Phase 2: Integration into Message Flow

**Location:** `app/routes/_index.tsx`

```typescript
// Add fast detection before debouncing
const handleTranscriptUpdate = useCallback((event: any) => {
  // ... existing code ...

  const newEntry: TranscriptEntry = {
    speaker: determinedSpeaker,
    text: event.text,
    timestamp: event.timestamp,
    chunkIndex: event.chunkIndex,
  }

  // 🚀 FAST LANE: Immediate intent detection (client-side)
  const fastIntents = detectFastIntents(newEntry.text, newEntry.speaker)

  if (fastIntents.length > 0) {
    logger.debug("⚡ FAST_INTENTS_DETECTED", {
      intents: fastIntents.map(i => i.type),
      text: newEntry.text.slice(0, 50)
    })

    // Immediate actions based on fast intents
    for (const intent of fastIntents) {
      switch (intent.type) {
        case 'date_mention':
          // Highlight booking context immediately
          setBookingContextHighlight(true)
          setTimeout(() => setBookingContextHighlight(false), 3000)
          break

        case 'urgent':
          // Fast-track the full agent call (reduce debounce)
          // This will be handled in callAgent with urgency flag
          break

        case 'party_size':
        case 'budget':
          // Show loading indicator on relevant field
          break
      }
    }
  }

  // Then proceed with normal flow
  callAgent(newEntry, fastIntents) // Pass fast intents to inform timing
}, [])
```

### Phase 3: Adaptive Debouncing Based on Fast Intents

**Enhancement to `callAgent`:**

```typescript
const callAgent = useCallback((newEntry: TranscriptEntry, fastIntents: FastIntent[] = []) => {
  pendingMessagesRef.current.push(newEntry)

  const { isIncomplete, hasCriticalInfo } = analyzeMessageCompleteness(newEntry.text)

  // Check if fast intents indicate urgency
  const isUrgent = fastIntents.some(i => i.type === 'urgent')
  const hasDateMention = fastIntents.some(i => i.type === 'date_mention')
  const hasConfirmation = fastIntents.some(i => i.type === 'confirmation')

  let debounceDelay = 2500 // Default

  if (isUrgent) {
    // Urgent requests - process immediately
    debounceDelay = 500
    logger.debug("🔥 URGENT_FAST_TRACK", { delay: debounceDelay })
  } else if (hasConfirmation) {
    // Short confirmations - quick response
    debounceDelay = 1000
    logger.debug("✅ CONFIRMATION_FAST_TRACK", { delay: debounceDelay })
  } else if (isIncomplete && hasCriticalInfo) {
    // Critical but incomplete - wait a bit
    debounceDelay = 3000
    logger.debug("⏳ CRITICAL_INCOMPLETE", { delay: debounceDelay })
  } else if (isIncomplete) {
    debounceDelay = 4000
  } else if (hasCriticalInfo && !isIncomplete) {
    debounceDelay = 1500
  }

  // ... rest of debouncing logic
}, [executeAgentCall, analyzeMessageCompleteness])
```

## Alternative: Streaming Agent Responses

### Concept

Instead of waiting for complete agent analysis, stream partial results:

```typescript
// Server-side: Stream responses as they're ready
async function* streamAgentAnalysis(message: TranscriptMessage) {
  // 1. Quick intent extraction (500ms)
  yield { type: 'intents', data: await quickIntentDetection(message) }

  // 2. Customer profile update (1s)
  yield { type: 'profile', data: await extractCustomerInfo(message) }

  // 3. Stage update (2s)
  yield { type: 'stage', data: await determineStage(state) }

  // 4. Actions (3-4s)
  yield { type: 'actions', data: await generateActions(state) }
}

// Client-side: Apply updates progressively
for await (const update of streamAgentAnalysis(message)) {
  switch (update.type) {
    case 'intents':
      // Show detected intents immediately
      setDetectedIntents(update.data)
      break
    case 'profile':
      // Update booking context
      setAgentState(prev => ({ ...prev, customerProfile: update.data }))
      break
    case 'stage':
      // Update stage
      setAgentState(prev => ({ ...prev, currentStage: update.data }))
      break
    case 'actions':
      // Show actions
      setAgentState(prev => ({ ...prev, executableActions: update.data }))
      break
  }
}
```

## Optimization: Prompt Engineering

### Current Issue
Complex prompts → Slower LLM processing

### Solution: Streamlined Prompts

**Before:**
```typescript
`Analyze this conversation and:
1. Detect intents
2. Extract customer info
3. Update stages
4. Generate actions
5. Calculate health score
...`
```

**After:**
```typescript
// Split into focused calls
`Task: Extract ONLY customer information from this message.
Reply with JSON containing: dates, partySize, budget.
Do not analyze intent or generate actions.`

// Then separately:
`Task: Given customer profile, suggest ONE highest-priority action.`
```

### Benefits
- Faster per-call processing (2-3s instead of 6s)
- Can run in parallel
- More reliable JSON parsing

## Recommended Implementation Priority

### Phase 1 (Quick Win - 2 hours)
✅ **Optimize existing debounce timing**
- Reduce urgency detection → 500ms
- Reduce confirmation → 1s
- Keep data collection → 4s

✅ **Add visual feedback for "processing"**
- Show spinner when agent is analyzing
- Update status: "Analyzing dates mentioned..."

### Phase 2 (Better UX - 4 hours)
✅ **Implement Fast Lane Detection**
- Client-side pattern matching
- Immediate booking context highlights
- No API calls

✅ **Adaptive debouncing**
- Use fast intents to inform timing
- Urgent = 500ms, Normal = 2.5s, Incomplete = 4s

### Phase 3 (Advanced - 8 hours)
✅ **Split agent workflow into stages**
- Quick extraction → Full analysis → Actions
- Stream results progressively

✅ **Optimize prompts**
- Focused single-task prompts
- Parallel execution where possible

## Performance Targets

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| **Time to first feedback** | 10s | 1s | Fast lane detection |
| **Time to full analysis** | 10s | 4s | Optimized prompts + adaptive timing |
| **Messages behind** | 5-6 | 1-2 | Faster processing |
| **User perceived lag** | High | Low | Progressive updates |

## Logging Enhancements

```typescript
// Track timing metrics
logger.info("⏱️ TIMING_METRICS", {
  transcriptionLag: "2s",        // Audio → Transcript
  debounceWait: "4s",            // Debounce timer
  apiLatency: "6s",              // API call duration
  totalLatency: "12s",           // Total end-to-end
  messagesBehind: 6,             // Messages received during processing
  urgencyDetected: false
})

// Track fast lane effectiveness
logger.info("⚡ FAST_LANE_STATS", {
  detectionsPerMinute: 12,
  accuracyRate: 0.89,
  falsePositives: 2,
  averageDetectionTime: "45ms"
})
```

## Key Takeaways

1. **Don't make everything fast** - Keep quality checks in deep lane
2. **Do provide instant feedback** - Use fast lane for obvious signals
3. **Progressive enhancement** - Fast results now, better results later
4. **Adaptive timing** - Adjust based on what you detect
5. **Visual feedback** - Show user that system is working

## Industry Examples

- **Google Docs** - Instant typing, background save
- **Slack** - Instant message display, background indexing
- **Grammarly** - Fast typo detection, slow grammar analysis
- **GitHub Copilot** - Quick suggestions, detailed analysis on demand

All use **two-tier architecture**: fast heuristics + slow AI.
