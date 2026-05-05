# Phase 0 Implementation Guide

## Testing Stack Decisions

### Why these choices:

1. **Vitest** (not Jest)
   - Native ESM support (modern imports work without config)
   - Faster than Jest in most scenarios
   - @storybook/test already uses Vitest (reuse same runner)
   - Smaller config footprint
2. **React Testing Library** (RTL)
   - Already recommended in Storybook docs
   - User-centric testing (queries match accessibility first)
   - Works directly with Vitest
3. **Storybook integration** (via @storybook/test addon)
   - Reuse story files as both visual catalog and test fixtures
   - story.play() hooks run through Vitest
   - Visual regression snapshots optional (Chromatic already configured)

4. **Coverage targets**
   - Critical path first: adapters/parsers/builders (Phase 2-5 dependencies)
   - Selectors (thunks, query normalization) — high regression risk
   - Components (UI rendering, event handling)
   - Utilities (URL, DSL parsing)

## Setup Roadmap

### Step 1: Install dependencies (15 min)

- vitest, @vitest/ui, @testing-library/react, @testing-library/user-event
- jsdom for DOM environment simulation
- happy-dom alternative if needed for speed

### Step 2: Configure vitest.config.js (20 min)

- DOM environment
- Module name mapping for @/ aliases
- Coverage thresholds (80% utils, 70% adapters/selectors, 50% UI initially)
- Mock setup file for Redux, fetch, window APIs

### Step 3: Create test utilities (30 min)

- setupTests.js (mock Redux store factory, fetch interceptor)
- renderWithStore() helper (RTL + Redux Provider)
- mockNavigation, mockUrl helpers

### Step 4: First batch of unit tests (1-2 hours)

- functions/qs.js (query string builder) → qs.test.js
- functions/validateKey.js, validateValue.js → validateKey.test.js, validateValue.test.js
- selectors/search.js — queryString construction logic (not fetch, logic only) → search.test.js

### Step 5: First batch of integration tests (1-2 hours)

- Mock store + async thunk dispatch flow
- QueryAdapter (Phase 2 deliverable preview)
- URL → Redux state roundtrip

### Step 6: Smoke test for embedded reports (1 hour)

- Load markdown with ::report directive
- Verify render without crash
- Check report data passed to renderer

### Step 7: Update CI and npm scripts (20 min)

- npm test → vitest
- npm run test:watch → vitest --watch
- npm run test:ui → vitest --ui
- npm run test:coverage → vitest --coverage

## Estimated Total: 5-6 hours for complete baseline

## File structure after completion

```
src/genomehubs-ui/
├── vitest.config.js                    (config)
├── src/
│   ├── setupTests.js                   (global mocks)
│   ├── test/                           (test utilities)
│   │   ├── renderWithStore.jsx         (RTL + Redux)
│   │   ├── mocks/
│   │   │   ├── navigation.js
│   │   │   ├── fetch.js
│   │   │   └── redux.js
│   │   └── fixtures/
│   │       ├── queries.js
│   │       └── mockData.js
│   ├── client/
│   │   ├── views/
│   │   │   ├── functions/
│   │   │   │   ├── __tests__/
│   │   │   │   │   ├── qs.test.js
│   │   │   │   │   ├── validateKey.test.js
│   │   │   │   │   └── validateValue.test.js
│   │   │   │   └── ...
│   │   │   ├── selectors/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── search.test.js
│   │   │   │   └── ...
│   │   │   └── components/
│   │   │       ├── __tests__/
│   │   │       │   └── SearchBox.test.jsx
│   │   │       └── ...
│   │   └── ...
│   └── stories/
│       ├── Configure.mdx
       ├── SearchBox.stories.jsx          (with .play() for interaction tests)
       └── ...other.stories.jsx           (components exported to Storybook)
├── package.json                        (test scripts updated)
└── .gitignore                          (coverage/dist added)
```

## Exit gates for Phase 0

✅ vitest installed and runs
✅ At least 1 unit test passing (qs.js)
✅ At least 1 integratio.stories.jsx file with .play() interaction testr)
✅ At least 1 Storybook story with .play() interaction
✅ npm test runs full suite in CI
✅ Coverage baseline recorded (even if low)
✅ No existing Storybook tests broken

## Next: Phase 1

Once Phase 0 gates pass, we:

1. Create baseline inventory of all components (122 total)
2. Identify "golden path" search routes (5-7 key user flows)
3. Build parity matrix (chip search vs. free-text search)
4. Document validation rules for both paths

Phase 1 testing will add:

- Story files for all components (prioritize search/report path)
- Interaction tests (.play) for user flows
- Visual snapshots for report renderers
