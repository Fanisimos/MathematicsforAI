# Descent: Maths for AI, played

Interactive, game-based companion for first-year **Mathematics for AI (MA4700)**, Teaching Block 1 calculus (weeks 7–12).

Unofficial student project. Not affiliated with or endorsed by the university.

## Modules

All 16 topics of Teaching Block 1, grouped as on the home page.

| Week | Topic | Highlights |
|---|---|---|
| 1 | Sets, logic & number systems | Venn explorer, *Shade It* (3-set game), *Number Sorter*, truth tables, √2 proof |
| 2 | Mapping & functions | mapping builder (injective/surjective live), composition, inverse reflection |
| 2 | Quadratics & polynomials | discriminant explorer, drag-the-roots cubic, curve fitting & overfitting |
| 3 | Exponentials & logarithms | e as its own slope, log as inverse, slide rule, softmax & cross-entropy |
| 3 | Vectors, matrices & norms | vector playground, p-norm unit balls, matrix as transformation, matrix multiply |
| 4 | Linear systems & Gaussian elimination | 2×2 geometry, elimination stepper (watch / do-it-yourself) |
| 5 | LU decomposition & error | LU stepper, cost chart, floating point, conditioning, iterative refinement |
| 7 | Gradient & differentiation | secant → tangent, paint f′(x), *Slope Sniper* |
| 7 | Iterative methods | Jacobi vs Gauss–Seidel paths, iteration table, cobweb diagrams |
| 8 | Minimum & maximum | stationary points, *Gradient Descent Golf* |
| 8–9 | Newton's method | animated Newton, bisection/secant/Newton race, multivariable Newton basins |
| 9 | Chain rule & partials | chain-rule machine, surface slices, *Summit in the Fog* |
| 10 | Integration | Riemann sums, Fundamental Theorem, *Area Guess* |
| 10–11 | Numerical integration | trapezium/midpoint/Simpson, log-log convergence, Monte Carlo |
| 11 | Further integration | substitution & by-parts steppers with numeric check |
| 12 | Applications | area between curves, average value, probability, TB1 boss quiz |

Every module also has a **Do it in MATLAB** section (commented scripts + a "Predict the Output" quiz), and all scripts are collected on the **MATLAB Lab** page (`#/matlab`). Scripts live in `src/matlab/snippets.ts`.

Every module ends with randomised drills (`src/topics/gens*.tsx`) that show worked solutions. XP and best scores are kept in the browser's `localStorage`.

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
