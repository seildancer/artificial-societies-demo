# Hollywood Rumour Simulation — Mockup UX / Interaction Spec

## Goal

Build a **single-page, highly animated interactive mockup** that demonstrates the feeling of an Artificial Societies (societies.ai) simulation through a Hollywood rumour scenario.

The experience should feel less like a SaaS dashboard and more like an **interactive simulation exhibit**:

- minimal UI
- graph-first
- cinematic camera movement
- large simulated society
- many ambient reactions
- occasional zoom-in highlights
- clear user interventions
- visible second-order consequences

All simulation data will be **hardcoded**. The purpose is not to build a real simulation engine. The purpose is to make the mockup feel alive, legible, compelling, and technically polished.

The central narrative is:

> **Become someone → watch your world form → introduce a rumour → respond → see what happened**

---

# Core Product Principle

The graph should remain the visual stage throughout almost the entire experience.

Do **not** design five disconnected pages.

Instead, build one persistent full-screen graph canvas whose state changes over time:

1. identity selection
2. society generation
3. successful status quo
4. rumour propagation
5. response propagation
6. outcome comparison

The user should feel like they are manipulating the same living society, not navigating between screens.

---

# Overall Visual Direction

## Style

Minimal, clean, contemporary.

Avoid:

- heavy SaaS card layouts
- dense dashboards
- obvious admin-panel aesthetics
- too many labels on screen
- large sidebars
- complex navigation
- unnecessary controls

Prefer:

- lots of whitespace / breathing room
- graph occupying most of the viewport
- subtle typography
- contextual floating UI
- soft transitions
- restrained colour palette
- smooth camera movement
- animation used to explain causality

The graph should feel visually sophisticated enough that someone could understand the concept by watching it without reading much explanatory copy.

---

## Visual Theme — Tabloid Noir

Use the following colour system consistently across the experience.

```text
Background:        #0D0D0F
Primary Cream:     #F4EDE4
Rumour / Danger:   #E9364A
Fame / Status:     #D6A84B
Main Text:         #F7F5F2

Card Background:   #17171A
Subtle Border:     #343439
Muted Text:        #A8A3A0
Hover Gold:        #E6BE63
Deep Red Hover:    #B92335
```

The visual direction should feel like **Tabloid Noir**: cinematic, editorial, slightly dangerous, and prestige-driven rather than futuristic or SaaS-like.

### Colour semantics

- `#0D0D0F` should dominate the canvas and page background.
- `#F4EDE4` and `#F7F5F2` should be used for primary editorial typography and high-contrast neutral elements.
- `#D6A84B` represents fame, influence, status, selection, and moments of attention.
- `#E9364A` represents rumour propagation, hostility, instability, and reputational danger.
- `#17171A` is used for floating cards, tooltips, outcome panels, and contextual overlays.
- `#343439` should be used sparingly for borders, separators, inactive edges, and subtle graph structure.
- `#A8A3A0` is the default secondary / muted text colour.
- `#E6BE63` is the interactive gold hover / emphasis state.
- `#B92335` is the darker active / hover state for rumour or danger interactions.

Avoid introducing additional saturated colours unless they are necessary for graph legibility.

Sentiment should primarily be communicated as a transition between:

- warm neutral / cream
- desaturated states
- danger red

Gold should **not** represent positive sentiment. It should represent **status, influence, fame, or user focus**, so sentiment and social importance remain visually distinct.

### Typography

Use the typography on **societies.ai** as the visual reference for the experience.

Match its typographic character as closely as practical, including:

- display / headline treatment
- body type
- weight hierarchy
- letter spacing
- numeral treatment where relevant

If the exact production font files are not available or licensed for reuse, use the closest available fallback rather than embedding or copying proprietary font assets.

Typography should feel editorial and cinematic rather than product-dashboard-like.

Large headlines may carry stronger personality, while labels, metrics, progress indicators, and graph annotations should remain restrained and highly legible.

---

# Persistent Page Structure

Approximate layout:

```text
┌──────────────────────────────────────────────┐
│ small brand / title              progress    │
│                                              │
│                                              │
│                GRAPH STAGE                   │
│                                              │
│                                              │
│                                              │
│ ──────────────────────────────────────────── │
│ contextual text / controls / actions         │
└──────────────────────────────────────────────┘
```

The graph stage should dominate the viewport.

The bottom interaction area should be lightweight and change depending on the current step.

---

# Navigation Model

The experience is intentionally linear.

The user may only move:

- one step backward
- one step forward

Do **not** allow arbitrary jumping to any step.

Show progress as a non-clickable indicator, e.g.:

```text
01 Identity  —  02 Society  —  03 Rumour  —  04 Response  —  05 Outcome
                  ●
```

Navigation rules:

## Step 1
- selecting a persona moves forward to Step 2
- no Back button required

## Step 2
- Back → return to persona selection
- primary action → advance to Step 3

## Step 3
- Back → restore the pre-rumour society state
- primary action → continue to response selection

## Step 4
- Back → restore the rumour-complete state
- choosing a response runs the response simulation and advances to Step 5

## Step 5
- Back → return to Step 4 with the exact same rumour state preserved
- optional secondary action: Start over

Important:

When going backward, restore the **exact visual state** appropriate to the previous step, with smooth transition animation. Do not simply reset the entire application unless explicitly starting over.

---

# Step 1 — Identity Selection

## Purpose

Immediately establish the premise:

> You are now famous. Your social world is about to be simulated.

## Hero Copy

Main heading:

> **You're famous in Hollywood now. Can you survive a rumour?**

Subheading / prompt:

> **You are...**

## Persona Selection

Show approximately 3 fictional celebrity archetypes.

Do not over-describe them.

The persona cards should be concise and primarily establish different public positions.

Example:

```text
[ Breakout actor ]
Suddenly famous after a hit streaming series

[ Pop star ]
Huge online fandom and constant scrutiny

[ Veteran actor ]
Established reputation and a carefully managed image
```

Avoid detailed backstories, biographies, personality traits, or lots of statistics.

The point is not to make the selected celebrity psychologically complex.

The point is to create a simple anchor around which a large social world can form.

## Interaction

On selection:

1. selected card subtly expands
2. other cards fade away
3. selected identity transitions toward the centre of the screen
4. the graph canvas becomes visible
5. begin Step 2

Use one fictional identity per archetype internally if needed, but keep the UI simple.

---

# Step 2 — Society Formation / Successful Status Quo

## Purpose

This is one of the most important parts of the demo.

The user should understand, without much explanation:

> Artificial Societies creates a large population around the selected person, and that population continuously reacts to events.

The society must feel **large**.

Do not make the demo look like 8–12 hand-authored characters having a conversation.

---

## 2A. Persona Genesis

Start with only the selected celebrity node in the centre.

Then generate many surrounding nodes rapidly.

Target visual scale:

- approximately 150–300 nodes total
- enough to feel like a population
- not so many that rendering becomes chaotic

All data may be hardcoded.

### Example categories

Internally, personas can belong to categories such as:

- entertainment journalists
- mainstream news outlets
- gossip / tabloid accounts
- influencers / commentators
- fans
- anti-fans / critics
- neutral members of the public
- colleagues / co-stars / collaborators
- friends / insiders
- PR-adjacent observers

For visual grouping, it may be cleaner to use larger cluster families such as:

- Media
- Fans
- Critics
- Industry
- Public

More specific roles can appear only when an individual node is highlighted.

### Genesis UI

During creation, briefly show something like:

```text
Creating your social world…

Fans                  68
Journalists           19
News outlets          12
Gossip accounts       14
Influencers           23
Critics               31
Colleagues            11
Friends / insiders     8
Public                74

229 personas generated
```

The counts can animate upward.

This overlay should be temporary and lightweight.

Suggested micro-label:

> Persona Genesis

This is optional but useful as a subtle reference to the underlying Artificial Societies concept.

---

## 2B. Graph Formation

The central celebrity node should remain visually distinct.

Surrounding personas should emerge in clusters.

The user does **not** need to see detailed names or bios for all personas.

At normal zoom:

- most nodes are unlabeled
- category is expressed visually
- individual identity is mostly hidden
- clusters should look organic, not like a rigid grid

Only reveal detailed role information when a node becomes a highlight target or the user hovers it.

Example reveal:

```text
Entertainment journalist
@ScreenWire
```

That is enough.

---

# Graph Visual Grammar

Use the graph itself to communicate state.

## Node Size

Represents influence.

Examples:

- major outlet → larger
- large influencer → larger
- normal fan → small
- anonymous account → small

Avoid extreme size differences.

---

## Node Colour

Represents sentiment toward the selected celebrity.

Suggested semantic scale:

- supportive → muted positive tone
- neutral / uncertain → grey / desaturated
- hostile → muted red / warm negative tone

Do not use bright traffic-light colours.

The visual should feel editorial / cinematic, not like a financial heatmap.

---

## Node Glow / Pulse

Represents current activity.

When a persona is posting, reacting, or propagating information:

- briefly pulse
- optionally show a small ring
- optionally animate outgoing edges

---

## Edges

Edges should appear mostly during active interactions.

Do not render the entire social graph as a permanent dense hairball.

Possible behaviours:

- faint persistent local relationships
- temporary animated propagation edges
- edge appears, travels, then fades
- stronger propagation event = slightly more visible edge

The goal is to show information movement without overwhelming the screen.

---

# 2C. Living Status Quo

After persona genesis finishes, the society should begin to feel alive.

The selected celebrity is currently doing well.

The graph should show a successful, mostly positive social environment.

Example high-level state:

```text
Public sentiment

72% positive
18% neutral
10% negative
```

These numbers are illustrative and can be hardcoded.

## Ambient Activity

Continuously generate small background activity:

- posts
- replies
- reposts
- reactions
- follows
- mentions
- conversations

Do not force the user to read all of it.

Most activity should function as ambient motion.

Example small counter:

```text
12 posts
47 reactions
8 reposts
3 conversations
```

These numbers can increment during the sequence.

---

# Highlight / Zoom System

This interaction pattern is extremely important.

Build it carefully because it should be reused in:

- status quo
- rumour propagation
- response propagation
- potentially outcome explanation

The highlight system should feel like a camera entering a large society to inspect a meaningful local event.

## Default State

The user sees the full graph.

Many small reactions occur.

## Highlight Trigger

When a notable event occurs:

1. graph movement slows slightly
2. non-relevant nodes dim
3. camera smoothly pans / zooms toward a selected node or small subgraph
4. relevant nodes remain sharp
5. a compact contextual card appears near the highlighted node
6. reaction / influence is shown
7. camera smoothly zooms back out
8. normal ambient simulation resumes

Do not make highlights feel like a normal carousel.

They should feel like **camera events inside the simulation**.

---

## Status Quo Highlight Example

```text
Entertainment journalist

“Maya Chen has apparently joined the
next major sci-fi project.”

posted 8 sec ago
```

Then show a few related reactions:

```text
@ScreenTea reposted
↳ “Huge if true.”

Fan reacted positively

Casual viewer followed Maya
```

Subtle impact label:

```text
Influenced 14 personas
Reach +2.1%
```

Then zoom back out.

---

## Timing

Highlights should be short.

Suggested rough rhythm:

- zoom in: 500–900 ms
- hold / read: ~1.5–2.5 sec
- reaction animation: ~1 sec
- zoom out: 500–900 ms

Exact timing can be adjusted based on feel.

The experience should stay fluid rather than forcing long reading pauses.

---

# Status Quo Completion

Do not make the user watch a long passive intro.

The user should understand the society within roughly 5–10 seconds after persona genesis.

After a few ambient interactions and 1–2 highlights, show:

> **Your world looks pretty good.**

Primary action:

> **Spread a rumour**

Alternative wording if it feels better in the final UI:

> **Drop a rumour into the simulation**

Avoid overly technical wording such as “Run simulation”.

---

# Step 3 — Rumour Propagation

## Purpose

Show how one piece of information can spread, mutate, and alter the social environment.

The graph should transition from mostly calm / positive to visibly unstable / hostile.

---

## Rumour Source

When the user starts the rumour:

1. select one gossip / anonymous / low-credibility persona
2. camera briefly focuses on it
3. show the original rumour post
4. begin propagation

The exact rumour text can be decided later.

For now use a placeholder structure such as:

```text
Anonymous gossip account

“I heard [celebrity] walked out of rehearsals after
a huge argument with the director.”
```

---

# Propagation Behaviour

The first moments should be slow and legible.

Example rhythm:

```text
1 → 2 → 5 → 14 → 38 → 90+
```

Begin with:

- one source node
- a few first-hop reactions
- visible propagation lines

Then accelerate into a cascade.

As the cascade grows:

- more nodes pulse
- hostile / sceptical colours spread
- graph energy increases
- activity counters rise quickly
- edges appear in bursts
- clusters react differently

This should visually feel like a contagion spreading through the network.

---

# Rumour Mutation

This is critical.

Do not show identical text being copied everywhere.

The rumour should visibly mutate as different categories reinterpret it.

Example chain:

Original:

> “Maya left rehearsal after arguing with the director.”

Influencer:

> “Apparently Maya stormed off set.”

Tabloid:

> “Chaos on Maya Chen set after star clashes with director.”

Anti-fan:

> “She's impossible to work with. We've been saying this.”

Use the highlight / zoom system to show 2–4 important mutations.

The point is to demonstrate:

> information is transformed by the people and institutions through which it passes.

---

# Step 3 Visual End State

At the end of propagation:

- many nodes should be hostile / sceptical
- the graph should visibly look more red / tense
- motion should gradually settle
- central celebrity remains visible
- the user should immediately understand that the social state has changed

Example summary:

```text
Public sentiment

Before rumour     +62
Now               -18
```

Exact numbers can be hardcoded.

Primary action:

> **Decide how to respond**

Back action:

> **← Before the rumour**

Back should restore the successful pre-rumour society state.

---

# Step 4 — Response Selection

## Purpose

Allow the user to intervene.

The user is not writing free text.

Use a few distinct response strategies.

The choices should represent meaningfully different communication approaches.

---

## Response Options

Recommended set:

### 1. Say nothing

```text
Say nothing
Let the story burn out on its own.
```

### 2. Short denial

```text
Short denial

“This story isn't true. I left rehearsal because…”
```

### 3. Apologise + clarify

```text
Apologise + clarify

“I did have a disagreement with the director, but…”
```

### 4. Full statement

```text
Full statement

A longer, polished PR-style response.
```

The exact copy can be replaced later.

The important thing is that the strategies are visibly different:

- silence
- denial
- partial acknowledgement
- full public statement

---

# Response Propagation

When the user selects a response:

1. centre the celebrity node
2. celebrity node emits a visible pulse
3. response enters the network
4. first recipients react
5. different clusters reinterpret the response
6. second-order reactions propagate
7. sentiment changes over time

Conceptually:

```text
YOU
 ↓
journalists / fans / tabloids / industry
 ↓
reinterpretation
 ↓
other personas
```

Do not make it look like the celebrity directly broadcasts to every node simultaneously.

---

# Response Highlight Examples

Reuse the exact same camera / highlight system.

## Highlight 1 — Supportive fan

```text
Fan

“Honestly this is a fair explanation.”

11 personas influenced
```

## Highlight 2 — Journalist

```text
Entertainment journalist

“Chen confirms there was an argument but disputes
reports that she stormed off set.”

28 personas influenced
```

## Highlight 3 — Critic

```text
Critic

“So she admits there WAS an argument.”

19 personas influenced
```

This is one of the most important parts of the demo.

The same statement should create **different reactions in different parts of society**.

The experience should make clear that there is no single universal “LLM evaluation” of the statement.

---

# Step 5 — Outcome

## Purpose

Explain what happened without removing the user from the simulation.

Do **not** replace the graph with a static results page.

Keep the graph visible in the background.

Overlay a compact summary panel.

---

## Result Panel

Example:

```text
YOUR RESPONSE

“...”

────────────────

Public sentiment
-18  →  +7

Supportive
31% → 46%

Hostile
42% → 34%

Rumour belief
58% → 41%

────────────────

What happened

✓ Core fans rallied around you
✓ Mainstream coverage became more neutral
✕ Critics reframed your clarification as an admission
✕ The response created a second wave of attention
```

The exact metrics can be hardcoded.

---

# Key Outcome Insight

Each response strategy should produce an interesting tradeoff.

Avoid:

> Response A is obviously correct and fixes everything.

Prefer paradoxical outcomes.

Example:

> **Your apology improved sentiment — but extended the rumour's reach by 38%.**

Other possible tradeoffs:

- denial lowers belief among fans but increases hostile coverage
- silence reduces total reach but leaves belief high
- long statement improves mainstream coverage but creates more quote-mining
- apology increases trust but confirms part of the underlying event

This is what makes replaying Step 4 meaningful.

---

# Retry / Comparison Loop

Primary action:

> **Try another response**

This returns the user to Step 4.

Important:

- restore the same rumour-complete graph state
- preserve the same starting conditions
- let the user select another response
- rerun the response propagation

The user should feel they are testing alternative strategies against the same simulated society.

Optional secondary action:

> Start over

This returns to Step 1.

---

# Hardcoded Data Model

A real backend or simulation engine is not required.

Suggested minimal data model:

```ts
type PersonaCategory =
  | "media"
  | "fan"
  | "critic"
  | "industry"
  | "public";

type PersonaRole =
  | "entertainment_journalist"
  | "mainstream_outlet"
  | "tabloid"
  | "influencer"
  | "fan"
  | "anti_fan"
  | "neutral_public"
  | "co_star"
  | "friend"
  | "pr_observer";

type PersonaNode = {
  id: string;
  category: PersonaCategory;
  role: PersonaRole;
  influence: number;
  initialSentiment: number; // e.g. -1 to +1
  x?: number;
  y?: number;
};

type SimulationEvent = {
  id: string;
  phase: "status_quo" | "rumour" | "response";
  sourceNodeId: string;
  targetNodeIds?: string[];
  text?: string;
  sentimentDelta?: number;
  influenceCount?: number;
  highlight?: boolean;
  delayMs: number;
};
```

Response-specific data can be completely scripted.

Example:

```ts
type ResponseStrategy =
  | "silence"
  | "short_denial"
  | "apology_clarification"
  | "full_statement";
```

Each response can point to:

- predefined highlight events
- predefined sentiment changes
- predefined graph colour changes
- predefined summary metrics

No generative AI is necessary.

---

# State Machine

Suggested high-level state:

```ts
type ExperienceStep =
  | "identity"
  | "society"
  | "rumour"
  | "response"
  | "outcome";
```

Within steps, use sub-phases.

Example:

```ts
type SocietyPhase =
  | "genesis"
  | "status_quo"
  | "ready";

type RumourPhase =
  | "source"
  | "early_spread"
  | "cascade"
  | "settled";

type ResponsePhase =
  | "choosing"
  | "broadcast"
  | "reaction"
  | "settled";
```

Keep state transitions explicit.

Avoid animation logic scattered unpredictably across components.

---

# Animation Architecture

Prefer scripted timelines over random uncontrolled animation.

The experience should look alive, but it must be reproducible and polished.

Use deterministic hardcoded event sequences.

Recommended concept:

```ts
timeline = [
  { at: 0, action: "pulseNode", node: "x" },
  { at: 500, action: "drawEdge", from: "x", to: "y" },
  { at: 900, action: "changeSentiment", node: "y", value: -0.2 },
  { at: 1400, action: "startHighlight", event: "rumourMutation1" },
  ...
];
```

A small amount of ambient randomness is acceptable for decorative motion, but all important narrative moments should be deterministic.

---

# Graph Rendering

Use a **controlled 3D graph** rather than a flat 2D network.

The goal is not to build a freely explorable 3D network visualizer. The goal is to use depth, perspective, parallax, and scripted camera choreography to make the simulated society feel larger, more cinematic, and more spatially alive.

Think of this as **2.5D / cinematic 3D**:

- nodes exist in real `x`, `y`, `z` space
- social clusters can occupy slightly different depth bands
- the default whole-graph view remains close to frontal and legible
- highlight moments may move the camera slightly into the network
- propagation can travel across depth as well as across the screen
- users should not freely orbit or spin the graph
- important camera paths should be scripted and deterministic

Priority order:

1. smoothness
2. controllable cinematic camera
3. legibility of propagation and causality
4. predictable animation
5. visual polish
6. ease of implementation

Recommended stack:

- React
- Three.js
- React Three Fiber
- Drei where useful for camera / scene helpers

For 150–300 nodes, prefer GPU-friendly rendering patterns such as `InstancedMesh` rather than rendering every node as a heavy independent React component.

Animated edges should also avoid unnecessary geometry churn. Prefer reusable line buffers, lightweight geometry, or shader-driven propagation effects where practical.

Avoid:

- generic force-directed 3D graph aesthetics
- spherical node clouds
- unrestricted orbit controls
- dense permanent 3D edge hairballs
- heavy bloom that makes the experience feel like a sci-fi neural network
- depth layouts that make propagation difficult to read

The intended visual metaphor is a **Hollywood reputation machine**, not a futuristic data visualizer.

If a 3D library or graph abstraction visibly constrains the desired camera choreography, use lower-level Three.js / React Three Fiber primitives instead.

---

# Camera Behaviour

Treat camera movement as a first-class interaction system.

Required operations:

- fit full graph
- zoom toward node
- zoom toward small subgraph
- dim irrelevant nodes
- restore previous camera state
- smooth interpolation

Do not snap abruptly between views.

Camera movement should reinforce causality.

Because the graph is 3D, camera depth should be used carefully:

- whole-network views should remain easy to read
- highlight events can introduce subtle dolly-in, parallax, and perspective shifts
- avoid dramatic rotations that disorient the user
- preserve a clear visual sense of where the central celebrity sits within the wider society
- return smoothly to a known framing after each highlight

---

# Hover Behaviour

Optional but useful.

When hovering a node during stable states:

- slightly enlarge node
- show concise tooltip
- show category / specific role
- optionally show sentiment

Example:

```text
Entertainment journalist
Neutral → sceptical
```

Do not expose a long biography.

---

# Colour / Sentiment Notes

Sentiment should be visible but tasteful.

Recommended:

- supportive = muted cool / green-adjacent
- neutral = warm grey / silver
- hostile = muted coral / red
- current actor / selected node = distinct accent or bright neutral

Do not make every category a different saturated colour if sentiment is already encoded by colour.

Under the Tabloid Noir theme, use cream / warm neutral for calm or supportive states, desaturated greys for uncertainty, and `#E9364A` for hostile or rumour-driven states. Reserve `#D6A84B` for fame, influence, focus, and status rather than sentiment.

If category needs visual encoding, prefer:

- node shape
- ring style
- cluster placement
- tiny icon
- subtle outline

This prevents category and sentiment from fighting for the same colour channel.

---

# Cluster Layout

At normal zoom, nodes should loosely cluster by social role.

Example conceptual layout:

```text
        MEDIA

  CRITICS       INDUSTRY


         YOU


    FANS        PUBLIC
```

Do not make this rigid or geometrically obvious.

The graph should feel organic.

Clusters can overlap at edges.

---

# Performance / Polish

This is a mockup, but it should feel production-quality.

Important:

- 60fps where possible
- no layout jumps
- no slow React re-render loops for every node
- animations should remain smooth on laptop browsers
- preload fonts/assets
- avoid excessive shadows / blur filters if they harm performance
- use reduced-motion fallback where reasonable

---

# Responsive Behaviour

Primary target: desktop / laptop.

This demo is graph-heavy, so optimize desktop first.

For mobile:

- preserve the narrative
- reduce node count if needed
- simplify labels
- keep bottom actions reachable
- maintain camera/highlight behaviour

Do not let mobile constraints compromise the desktop experience.

---

# Suggested Component Structure

Example only:

```text
App
├─ ExperienceShell
│  ├─ ProgressIndicator
│  ├─ GraphStage
│  │  ├─ GraphRenderer
│  │  ├─ CameraController
│  │  ├─ HighlightOverlay
│  │  └─ AmbientActivity
│  └─ InteractionPanel
│
├─ IdentityStep
├─ SocietyStep
├─ RumourStep
├─ ResponseStep
└─ OutcomeStep
```

Keep simulation data separate from rendering logic.

Possible folders:

```text
/data
  personas.ts
  statusQuoEvents.ts
  rumourEvents.ts
  responseEvents.ts
  outcomes.ts

/simulation
  timeline.ts
  stateMachine.ts

/components
  GraphStage.tsx
  HighlightCard.tsx
  ProgressIndicator.tsx
  InteractionPanel.tsx
```

---

# Implementation Priority

Do not try to polish everything at once.

## Phase 1 — Graph foundation

Build:

- centre celebrity node
- ~200 surrounding nodes
- category clusters
- sentiment colours
- influence-based sizing
- camera zoom / pan

This is the foundation.

## Phase 2 — Highlight system

Build the reusable:

> full graph → dim → zoom → show event → propagate local reaction → zoom out

interaction.

Polish this heavily.

## Phase 3 — Persona genesis + status quo

Build:

- node generation animation
- category counters
- ambient activity
- 1–2 highlights

## Phase 4 — Rumour cascade

Build:

- source post
- slow initial spread
- accelerated cascade
- mutation highlights
- sentiment colour transition

## Phase 5 — Response loop

Build:

- response selection
- central broadcast
- mixed reactions
- second-order effects
- result metrics

## Phase 6 — Navigation / rewind

Build reliable:

- previous step
- next step
- state restoration
- try another response
- start over

## Phase 7 — Final visual polish

Improve:

- typography
- spacing
- easing
- camera timing
- node motion
- colour calibration
- copy
- microinteractions

---

# Important UX Rules

1. **The society must feel large.**  
   Do not over-focus on a small cast of detailed characters.

2. **Individual personas need only lightweight identity.**  
   Category / role is enough unless they are currently highlighted.

3. **The graph is the main product surface.**  
   UI overlays should support it, not compete with it.

4. **Highlights explain the simulation.**  
   Most activity is ambient; only a few important events deserve zoom-in treatment.

5. **Rumours mutate.**  
   Do not simply copy the same sentence through the graph.

6. **Responses create disagreement.**  
   Different groups should interpret the same statement differently.

7. **Outcomes should contain tradeoffs.**  
   Avoid a clearly optimal answer.

8. **Navigation is sequential.**  
   Only previous / next step movement.

9. **Back navigation restores state.**  
   Do not reset the whole experience.

10. **Use hardcoded data confidently.**  
    The mockup is about interaction design and storytelling, not backend realism.

---

# Definition of Done

A successful version should let a new visitor understand the following with little or no explanation:

1. a simulated society containing many personas is created around them
2. those personas continuously interact
3. information spreads through the network
4. information changes as different personas reinterpret it
5. a rumour can shift the overall social state
6. the user can intervene with a response
7. different personas interpret the response differently
8. the response causes second-order consequences
9. different communication strategies can be compared
10. the experience feels alive, polished, and worth interacting with

The strongest moments should be:

- hundreds of personas forming around the user
- the first smooth zoom-in highlight
- the rumour suddenly cascading through the network
- seeing the rumour mutate across personas
- the graph visibly becoming hostile
- the user's response radiating back through the society
- contradictory reactions to the same statement
- a counterintuitive final result

Those moments matter more than adding more features.
