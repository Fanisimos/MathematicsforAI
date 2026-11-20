# Descent: Maths for AI, played

Interactive, game-based companion for first-year **Mathematics for AI (MA4700)**, Teaching Block 1 calculus (weeks 7–12).

Unofficial student project. Not affiliated with or endorsed by the university.

## Modules

| Week | Topic | Interactive pieces | Game |
|---|---|---|---|
| 7 | Gradient & differentiation | rise/run, secant → tangent (h → 0), paint f′(x) | Slope Sniper |
| 8 | Minimum & maximum | stationary-point explorer with sign chart | Gradient Descent Golf |
| 9 | Chain rule & partials | chain-rule machine, surface slices + gradient | Summit in the Fog |
| 10 | Integration | Riemann sums, Fundamental Theorem of Calculus | Area Guess |
| 11 | Further integration | substitution & by-parts steppers with numeric check | – |
| 12 | Applications | area between curves, average value, probability | Boss quiz (timed) |

Every module also has a **Do it in MATLAB** section (commented scripts + a "Predict the Output" quiz), and all scripts are collected on the **MATLAB Lab** page (`#/matlab`). Scripts live in `src/matlab/snippets.ts`.

Every module ends with randomised drills (`src/topics/gens.ts`) that show worked solutions. XP and best scores are kept in the browser's `localStorage`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
```

## Deploy (Netlify)

`netlify.toml` is already set up (build `npm run build`, publish `dist`). Connect the GitHub repo in Netlify and it deploys on every push.

## Adding a topic

1. Create `src/topics/MyTopic.tsx` (default export, built from `Section`, `Plot`, `Quiz`, …).
2. Add question generators to `src/topics/gens.ts`.
3. Register it in `src/topics/index.ts` and link it from `src/lib/course.ts`.
