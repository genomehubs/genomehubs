# Testing Quick Reference

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run with interactive UI (see all tests, filter, debug)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Writing Your First Test

### Unit Test Template (Simple Function)

```javascript
import { describe, it, expect } from "vitest";
import myFunction from "../myFunction";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
});
```

**File location**: Place test files in `__tests__/` directory next to the source file:

- Source: `src/client/views/functions/myFunction.js`
- Test: `src/client/views/functions/__tests__/myFunction.test.js`

### Integration Test Template (Redux + Async)

```javascript
import { describe, it, expect } from "vitest";
import { renderWithStore } from "../../../test/renderWithStore";
import { mockFetchResponse } from "../../../test/mocks/fetch";

describe("my selector", () => {
  it("should fetch data and update store", async () => {
    mockFetchResponse({ data: "test" });

    const { store } = renderWithStore(<Component />, {
      initialState: {
        /* override defaults */
      },
    });

    // Dispatch action and verify store updated
    // store.dispatch(myThunk(params));
  });
});
```

### Component Test Template (React + RTL)

```javascript
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithStore } from "../../../test/renderWithStore";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    renderWithStore(<MyComponent prop="value" />);
    expect(screen.getByText("expected text")).toBeInTheDocument();
  });
});
```

## Available Test Utilities

### renderWithStore

Renders a component with Redux Provider and test store.

```javascript
const { container, store } = renderWithStore(<Component />, {
  initialState: { search: { queryTerms: [] } },
});
```

### Mock Data Fixtures

Pre-built mock objects for common data structures:

```javascript
import {
  mockSearchQuery,
  mockReportQuery,
  mockFieldMetadata,
  createMockSearchResponse,
  createMockReportResponse,
} from "../../../test/fixtures/mockData";
```

### Fetch Mocks

Set up fetch interception for API calls:

```javascript
import {
  mockFetch,
  mockFetchError,
  resetFetchMocks,
} from "../../../test/mocks/fetch";

// Setup
mockFetch({ data: "response" });
mockFetchError("Network error");

// Verification
const calls = getFetchCalls();
const lastCall = getLastFetchCall();
```

### Navigation Mocks

Mock React Router functions:

```javascript
import {
  mockNavigate,
  resetNavigationMocks,
} from "../../../test/mocks/navigation";

// mockNavigate is a vi.fn() that was called
expect(mockNavigate).toHaveBeenCalledWith("/search?q=test");
```

## Common Assertions

```javascript
// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();

// Equality
expect(value).toBe(expected); // Strict equality (===)
expect(value).toEqual(expected); // Deep equality

// Arrays/Objects
expect(arr).toContain(item);
expect(obj).toHaveProperty("key");
expect(value).toHaveLength(5);

// Functions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);

// Strings/DOM
expect(str).toMatch(/pattern/);
expect(element).toBeInTheDocument();
expect(element).toHaveTextContent("text");
expect(element).toHaveClass("className");

// Async
await expect(promise).rejects.toThrow();
await expect(promise).resolves.toBe(value);
```

## Best Practices

1. **Test behavior, not implementation**
   - Test what users/consumers see, not internal details
   - Mock external dependencies (fetch, navigation)

2. **Keep tests focused**
   - One test per behavior (one expect per test OK, but don't mix unrelated assertions)
   - Use descriptive test names: "should filter results when user types search term"

3. **Use fixtures for common data**
   - Don't hardcode mock data in tests
   - Store in `src/test/fixtures/`
   - Reuse across multiple tests

4. **Mock external dependencies**
   - API calls → use fetch mocks
   - Navigation → use navigation mocks
   - Redux thunks → dispatch and verify store changes

5. **Group related tests**
   - Use nested describe blocks
   - Group by component/function, then by behavior

## Debugging Tests

### Visual test runner

```bash
npm run test:ui
```

Opens interactive dashboard to run/filter/debug tests.

### Console in tests

```javascript
// Use console.log/console.table
console.log("state:", store.getState());
console.table(results);
```

### Watch mode with reporter

```bash
npm run test:watch
```

Tests re-run on file change, shows detailed output.

### Debug single file

```bash
npm test -- src/client/views/functions/__tests__/qs.test.js
```

## Next: Phase 1

Phase 1 will add:

- Story files (.stories.jsx) with interaction tests
- Component inventory and coverage roadmap
- Visual regression snapshots for reports
- Integration tests for critical user flows
