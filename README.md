# Hollywood Rumour

A static, single-page reputation experiment implementing [the UX specification](hollywood_rumour_mockup_ux_spec_tabloid_noir_3d.md). Become a fictional celebrity, watch a society form, introduce a rumour, and compare four communication strategies against the same starting conditions.

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

- **Identity:** three celebrity archetypes.
- **Society:** 229 deterministic personas in five organic 3D clusters; influence-based node sizes, sentiment colours, a short genesis sequence, and two camera highlights. The rumour action unlocks after about 11 seconds.
- **Rumour:** one source, first-hop propagation, an accelerating cascade, and four increasingly distorted interpretations. Settles after about 15 seconds.
- **Response:** silence, a short denial, an apology with clarification, or a full statement. Each plays a 14-second sequence of divergent fan, journalist and critic reactions.
- **Outcome:** sentiment, support, hostility, belief and reach; a tradeoff for every strategy; a comparison table after trying two or more responses.

The progress indicator is informational. Back only moves one step; the explicit start-over action returns to identity. Returning from an outcome preserves the original rumour snapshot and previous experiment results. Pause freezes the narrative and ambient activity. Reduced motion respects the operating-system preference and can also be toggled in the footer.

## Implementation

The design uses a subdued premiere backdrop throughout, with the live graph visible from the opening. Reusable silhouettes connect the role cards to the central graph identity; hovering or focusing a card previews its silhouette. Sentiment has one compact colour key, and results show the three principal measures with expandable explanations. Visual refinements live in `src/design.css` and the native SVG portraits in `src/IdentityPortrait.tsx`. The optimised backdrop and generation prompt are in `public/images/premiere-v2.webp` and `public/images/premiere-v2.md`.

Interface copy presents the demo as a reputation simulation for public and investor audiences. Stage descriptions and outcome summaries use neutral language, while simulated posts retain natural audience voices. `src/Brand.tsx` reuses the SVG mark from the Artificial Societies website for the header and the attribution beneath the opening question. The footer identifies outcomes as scripted illustrations.

| File | Responsibility |
| --- | --- |
| `src/data.ts` | Identities, seeded 3D population, sentiment snapshots, narrative events and four outcomes |
| `src/simulation.ts` | Explicit transition reducer, time-based phases, sequential guards and saved rewind times |
| `src/GraphStage.tsx` | Persistent Three.js scene, instanced nodes, reusable edge buffers, camera choreography, pulses, hover and highlight overlays |
| `src/App.tsx` | Story controls, metrics, response selection, results and comparison |
| `src/style.css` | Tabloid Noir palette, responsive layout and motion preferences |

React handles the interface at a limited update rate; Three.js renders independently with `requestAnimationFrame`. Perspective-projected nodes have real x/y/z coordinates. Camera targets are scripted and there are no orbit controls. Sparse local relationships and temporary travelling edges avoid a permanent dense network. If WebGL creation fails, the same story uses a Canvas 2D perspective fallback.

Typography uses locally bundled, OFL-licensed DM Sans as a practical grotesk fallback for the Die Grotesk typography on [societies.ai](https://societies.ai). No production font assets from that site are copied. Net sentiment is supportive percentage minus hostile percentage, keeping all displayed metrics internally consistent; the post-rumour baseline is −11.

## Verify

```sh
npx playwright install chromium
npm test
```

The suite checks deterministic snapshots and all four outcomes; walks through the full desktop story, mutation highlights, response interpretations, comparison and reset; and checks the mobile story, reduced motion, pause, rewind and all three identities. It also checks for browser runtime errors, mobile horizontal overflow, clear layouts at 320px, and keyboard selection with WebGL disabled. Desktop and mobile screenshots are written to the ignored `test-results/` folder.

The tests use Chromium with software WebGL for reproducible environments. Actual frame rate depends on the browser and GPU; the renderer caps device pixel ratio at 1.8 and reuses geometry to keep the scene light.
