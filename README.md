# Hollywood Rumour

A static, single-page reputation experiment implementing [the UX specification](hollywood_rumour_mockup_ux_spec_tabloid_noir_3d.md). Become a fictional celebrity, watch a society form, introduce a rumour, and compare three scenario-specific communication strategies against the same starting conditions.

## Run locally

Requires Node.js 22.12+ (or a supported newer LTS version).

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The default is `http://127.0.0.1:5173`.

## Build a static site

```sh
npm run build
npm run preview
```

Publish the contents of `dist/` to any static host. Relative asset paths support hosting in a subdirectory. No server, API key, database, runtime CDN, or AI service is needed. All identities and events are fictional; all outcomes are scripted illustrations, not predictions.

## The experience

- **Identity:** an A-list actor, a global pop star and an actor & studio founder, each with a distinct scandal from `artificial_societies_demo_scandal_concepts.md`.
- **Society:** 229 deterministic personas in five 3D communities, with a short genesis sequence and positive coverage before the incident.
- **Rumour:** an incident brief distinguishes visible facts from unverified claims. Four posts show social proof, amplification and narrative mutation over about 15 seconds.
- **Response:** three complete statements for each character. Each plays a 14-second sequence with reactions from the people involved, supporters and commentators.
- **Outcome:** all three branches appear side by side after the first run. Hostility, belief in the named rumour and story reach use a shared baseline, consistent scales and explicit deltas. Each branch explains its unresolved consequence and offers expandable reactions and direct replay.

The nine outcomes are deliberately illustrative, not empirically calibrated. A denial may reduce rumour belief while increasing hostility; an apology may cool anger without correcting the claim; a clarification may create fresh attention or supporter-driven harm. Reach is an index with the pre-response audience set to 100. Percentage-point changes use each scenario's own crisis snapshot.

Key posts accumulate in a side timeline, recording the source claim, embellishment, headline and character judgement alongside their effects. The full rumour history stays available while choosing a response, and new reactions append during the response sequence. The timeline follows new moments until the user scrolls up to read; a button returns to the latest activity. On mobile it sits beneath the network. Back only moves one step; the explicit start-over action returns to identity. Returning from an outcome preserves the original rumour snapshot and previous experiment results. Pause freezes the narrative and ambient activity. Reduced motion respects the operating-system preference and can also be toggled in the footer.

## Implementation

The design uses a subdued premiere backdrop throughout, with the live graph visible from the opening. Reusable portraits connect the role cards to the central graph identity; hovering or focusing a card previews its portrait. Sentiment has one compact colour key, and results show a responsive three-column comparison with expandable explanations. Visual refinements live in `src/design.css` and the portrait sprite mapping in `src/IdentityPortrait.tsx`. The optimised backdrop and generation prompt are in `public/images/premiere-v2.webp` and `public/images/premiere-v2.md`.

Interface copy presents the demo as a reputation simulation for public and investor audiences. Stage descriptions and outcome summaries use neutral language, while simulated posts retain natural audience voices. `src/Brand.tsx` reuses the SVG mark from the Artificial Societies website for the header and the attribution beneath the opening question. The footer identifies outcomes as scripted illustrations.

| File | Responsibility |
| --- | --- |
| `src/data.ts` | Identities, seeded 3D population, sentiment snapshots, narrative events and narrative types |
| `src/scenarios.ts` | Three incidents, nine statements, reactions and illustrative outcomes |
| `src/scenarios.css` | Full-statement choices and responsive outcome comparison |
| `src/simulation.ts` | Explicit transition reducer, time-based phases, sequential guards and saved rewind times |
| `src/GraphStage.tsx` | Persistent Three.js scene, instanced nodes, reusable edge buffers, camera choreography, pulses, hover and highlight overlays |
| `src/App.tsx` | Story controls, metrics, response selection, results and comparison |
| `src/EventHistory.tsx` | Persistent chronological posts, interpretation changes and reading-aware scrolling |
| `src/history.css` | Side timeline and mobile story layout |
| `src/style.css` | Tabloid Noir palette, responsive layout and motion preferences |

React handles the interface at a limited update rate; Three.js renders independently with `requestAnimationFrame`. Perspective-projected nodes have real x/y/z coordinates. Camera targets are scripted and there are no orbit controls. Sparse local relationships and temporary travelling edges avoid a permanent dense network. If WebGL creation fails, the same story uses a Canvas 2D perspective fallback.

Typography uses locally bundled, OFL-licensed DM Sans as a practical grotesk fallback for the Die Grotesk typography on [societies.ai](https://societies.ai). No production font assets from that site are copied. Each scenario has its own post-rumour baseline. Network sentiment uses the same support and hostility values as the scripted outcomes.

## Verify

```sh
npx playwright install chromium
npm test
```

The suite checks deterministic snapshots and all nine outcomes; walks through the full desktop story, mutation highlights, response interpretations, comparison, replay and reset; and checks the mobile story, reduced motion, pause, rewind and all three identities. It also checks for browser runtime errors, mobile horizontal overflow, clear layouts at 320px, and keyboard selection with WebGL disabled. Desktop and mobile screenshots are written to the ignored `test-results/` folder.

The tests use Chromium with software WebGL for reproducible environments. Actual frame rate depends on the browser and GPU; the renderer caps device pixel ratio at 1.8 and reuses geometry to keep the scene light.
