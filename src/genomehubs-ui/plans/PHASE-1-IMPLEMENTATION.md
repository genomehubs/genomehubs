# Phase 1 Implementation Plan

**Status**: Phase 1 - Baseline & Controls  
**Duration**: 1-2 weeks  
**Target Completion**: TBD  
**Last Updated**: May 2026

---

## Overview

Phase 1 establishes the baseline inventory, migration controls, and feature flag infrastructure needed for Phases 2-8. This is a **planning and documentation phase** with minimal code changes.

## Key Deliverables

| Deliverable               | File                                 | Status         |
| ------------------------- | ------------------------------------ | -------------- |
| URL Composition Inventory | `PHASE-1-URL-INVENTORY.md`           | ✅ Complete    |
| Search Path Parity Matrix | `PHASE-1-SEARCH-PARITY.md`           | ✅ Complete    |
| Migration Ledger & Flags  | `PHASE-1-MIGRATION-LEDGER.md`        | ✅ Complete    |
| Report Validation Rules   | `PHASE-1-REPORT-VALIDATION-RULES.md` | ⏳ In Progress |
| Component Inventory       | `PHASE-1-COMPONENT-INVENTORY.md`     | ⏳ In Progress |
| Phase 1 Exit Checklist    | `PHASE-1-EXIT-CRITERIA.md`           | ⏳ Pending     |

---

## Work Breakdown

### Week 1: Documentation & Analysis

#### Task 1: Report Validation Rules Documentation

**Objective**: Lock down all 35+ validation rules in `sortReportQuery()`

**Steps**:

1. Review `report.js:34-160` function
2. Extract all parameter validation rules
3. Organize by report type: tree, histogram, map, scatter, arc
4. Create validation matrix
5. Add test cases for each rule

**Owner**: TBD  
**Effort**: 2-3 days  
**Blocker for**: Phase 2 report builder work

**Deliverable**: `PHASE-1-REPORT-VALIDATION-RULES.md`

```markdown
# Report Type: Tree

- Required: query, result
- Optional: treeThreshold (0-100), countGenomes (true/false)
- Prohibited: histogramType, mapType
- Validation: treeThreshold must be numeric if provided
```

#### Task 2: Component Inventory & Categorization

**Objective**: Create complete baseline of 180+ components

**Steps**:

1. List all components in `src/client/views/components/`
2. Categorize: display, container, form, layout, report-specific
3. Note Redux HOC usage and current test coverage
4. Identify migration targets vs. retain-only components

**Owner**: TBD  
**Effort**: 2 days

**Deliverable**: `PHASE-1-COMPONENT-INVENTORY.md`

**Output Format**:

```markdown
## Display Components (120+)

- Count.jsx - display only, no Redux, HAS STORIES
- Badge.jsx - display only, no Redux, NO STORIES
- Highlight.jsx - display only, no Redux, HAS STORIES
  ...

## Container Components (45+)

- SearchPage.jsx - Redux connected, critical, NO STORIES
- ReportItem.jsx - Redux connected, critical (721 LOC), NO STORIES
  ...
```

#### Task 3: Search Path Parity Testing

**Objective**: Validate both search paths produce identical URLs

**Steps**:

1. Create parity test suite
2. Compare free-text vs. chip-based outputs for 20+ test cases
3. Document any differences
4. Identify default join operator behavior
5. Validate operator precedence with backend team

**Owner**: TBD  
**Effort**: 2-3 days  
**Files**:

- New test: `src/client/views/functions/__tests__/search-parity.test.js`

**Test Cases**:

- Single term: "Homo" → same URL
- AND operator: "Homo AND assembly" → same URL
- OR operator: "Homo OR Mus" → same URL
- NOT operator: "Homo NOT Mus" → same URL
- Filter: "assembly_level~chromosome" → same URL
- Complex: mixed operators → same URL

#### Task 4: Feature Flag Infrastructure Setup

**Objective**: Prepare feature flag system for Phase 2 rollout

**Steps**:

1. Create feature flag environment variables
2. Set up flag reading in app initialization
3. Create override mechanism for testing (query params in dev)
4. Document flag deployment procedure

**Owner**: TBD  
**Effort**: 1 day  
**Files**:

- Create: `src/client/utils/featureFlags.js`
- Update: `.env.*` template files

**Code**:

```javascript
// src/client/utils/featureFlags.js
export const FEATURE_FLAGS = {
  CENTRALIZED_ERROR_HANDLING:
    process.env.REACT_APP_CENTRALIZED_ERROR_HANDLING === "true",
  USE_SDK_SEARCH_BUILDER:
    process.env.REACT_APP_USE_SDK_SEARCH_BUILDER === "true",
  // ... other flags
};

export function overrideFlag(flagName, value) {
  // Dev-only: allow query param override
  if (process.env.NODE_ENV === "development") {
    const param = new URLSearchParams(window.location.search).get(flagName);
    if (param !== null) return param === "true";
  }
  return FEATURE_FLAGS[flagName];
}
```

#### Task 5: Fetch Error Handling Wrapper (MINIMAL)

**Objective**: Prepare error handling infrastructure for Phase 1

**Steps**:

1. Create fetch wrapper utility
2. Centralize error handling pattern
3. Document error dispatch conventions
4. Create feature flag to toggle wrapper

**Owner**: TBD  
**Effort**: 1 day  
**Status**: OPTIONAL (can defer to Phase 2 if time-constrained)

**File**: `src/client/utils/fetchWrapper.js`

---

### Week 2: Review & Finalization

#### Task 6: Phase 1 Exit Criteria Checklist

**Objective**: Verify all Phase 1 gates pass

**Steps**:

1. Review all deliverables
2. Conduct inventory diff check (catch any missed components)
3. Validate parity test coverage
4. Confirm migration ledger completeness
5. Sign-off on all three core documents

**Owner**: TBD  
**Effort**: 1 day

**Deliverable**: `PHASE-1-EXIT-CRITERIA.md`

---

## Ownership Model

### Required Roles

| Role                | Responsibilities                                             | Effort   |
| ------------------- | ------------------------------------------------------------ | -------- |
| **Lead**            | Overall Phase 1 coordination, documentation review           | 5 days   |
| **Backend Liaison** | Confirm query operators, precedence rules with API team      | 2 days   |
| **QA Lead**         | Validate parity tests, approval of feature flag testing plan | 3 days   |
| **DevOps**          | Feature flag deployment infrastructure                       | 1-2 days |

### Recommended Assignments

- **Documentation Lead**: Architect/Senior Developer (this role)
- **QA Lead**: QA Engineer or Test Automation Lead
- **Backend Liaison**: Backend architect or API team member
- **DevOps**: Deployment/Infrastructure engineer

---

## Risk & Dependencies

### Critical Dependencies

1. **API Team Clarification**: Query operator precedence and default join behavior
   - **Impact**: Blocks search parity validation
   - **Mitigation**: Sync with API team early (Week 1)

2. **Component Accessibility**: All components must be accessible for migration planning
   - **Impact**: Could delay component inventory
   - **Mitigation**: Use existing file structure; automate if needed

### Risks

| Risk                               | Probability | Impact | Mitigation                                 |
| ---------------------------------- | ----------- | ------ | ------------------------------------------ |
| Report validation rules incomplete | Low         | High   | Thorough code review + test cases          |
| Search parity test inconclusive    | Medium      | Medium | Collaborate with backend team early        |
| Component count > 180              | Low         | Low    | Extend inventory, prioritize by complexity |
| Feature flag infrastructure issues | Low         | Medium | Test thoroughly in dev environment first   |

---

## Success Criteria (Phase 1 Exit)

### Documentation Completeness

- [ ] URL Composition Inventory: All 15+ locations documented
- [ ] Search Path Parity Matrix: All test cases defined
- [ ] Migration Ledger: All items classified as MIGRATE/RETAIN/LOCK
- [ ] Component Inventory: 180+ components categorized
- [ ] Report Validation Rules: All 35+ rules documented with test cases

### Quality Gates

- [ ] All existing tests still pass (71 tests from Phase 0)
- [ ] Parity test suite created with ≥10 test cases
- [ ] No new code to production (Phase 1 is documentation)
- [ ] All three core documents reviewed by team

### Feature Flag Infrastructure

- [ ] Feature flag system implemented and tested
- [ ] All flags defined with deployment timeline
- [ ] Override mechanism working in dev environment
- [ ] Rollback procedures documented

### Ownership & Sign-off

- [ ] All work items assigned and started
- [ ] Backend team confirms query operator precedence
- [ ] QA approves testing approach
- [ ] Phase 2 kick-off ready

---

## Phase 1 to Phase 2 Transition

### Phase 2 (Adapters & Builders) Prerequisites

**Must Be Complete**:

- ✅ URL Composition Inventory (defines what to migrate)
- ✅ All 35+ Report Validation Rules documented
- ✅ Search Parity Matrix completed
- ✅ Feature flag infrastructure ready
- ✅ Component Inventory finalized

**Phase 2 First Tasks**:

1. Create `queryBuilder` adapter (search, report, record, types)
2. Implement feature flag infrastructure in build
3. Create SDK-compatible adapter patterns
4. Start SDK integration for Phase 5 cutover

---

## File Structure After Phase 1

```
src/genomehubs-ui/
├── plans/
│   ├── PHASE-0-STATUS.md ✅
│   ├── PHASE-0-IMPLEMENTATION.md ✅
│   ├── TESTING-QUICK-REFERENCE.md ✅
│   ├── PHASE-1-URL-INVENTORY.md ✅
│   ├── PHASE-1-SEARCH-PARITY.md ✅
│   ├── PHASE-1-MIGRATION-LEDGER.md ✅
│   ├── PHASE-1-REPORT-VALIDATION-RULES.md ⏳
│   ├── PHASE-1-COMPONENT-INVENTORY.md ⏳
│   ├── PHASE-1-EXIT-CRITERIA.md ⏳
│   └── phased-refactor.md (master roadmap)
├── src/
│   ├── client/
│   │   ├── utils/
│   │   │   ├── featureFlags.js (NEW)
│   │   │   └── fetchWrapper.js (OPTIONAL)
│   │   └── views/
│   │       ├── functions/
│   │       │   └── __tests__/
│   │       │       └── search-parity.test.js (NEW)
│   │       ├── components/
│   │       └── selectors/
└── vitest.config.js (from Phase 0)
```

---

## Communication Plan

### Weekly Status Updates

- **Monday**: Week kickoff, task assignments
- **Wednesday**: Mid-week check-in (any blockers?)
- **Friday**: Weekly summary + Phase 2 prep

### Stakeholder Touchpoints

- **Backend Team**: Query precedence discussion (Week 1, mid-week)
- **QA Team**: Parity testing approach review (Week 1, end)
- **Design/Product**: Component categorization validation (Week 2, start)

### Documentation Distribution

- Phase 1 documents pushed to: `/src/genomehubs-ui/plans/`
- Summary of Phase 1 shared with: Dev team, QA, Backend, Product
- Migration ledger shared with: All involved teams (ownership record)

---

## Rollover to Phase 2

**Go/No-Go Decision**: End of Week 2

**Gate**: All Phase 1 Exit Criteria must pass

**Approval**: Tech Lead + Backend Liaison + QA Lead

**Phase 2 Kickoff**: Week 3 (assuming Phase 1 gates pass)

---

## Appendix: Reference Links

### Core Documents (Generated This Phase)

- `PHASE-1-URL-INVENTORY.md` - All URL composition points
- `PHASE-1-SEARCH-PARITY.md` - Free-text vs chip-based comparison
- `PHASE-1-MIGRATION-LEDGER.md` - Migration tracking + feature flags

### Supporting Documents (From Phase 0)

- `PHASE-0-STATUS.md` - Testing infrastructure completion
- `TESTING-QUICK-REFERENCE.md` - How to run tests
- `phased-refactor.md` - Overall 9-phase roadmap

### Code References

- `src/client/views/selectors/report.js:34-160` - sortReportQuery() (critical)
- `src/client/views/functions/qs.js` - Query string parser (well-tested)
- `src/client/views/selectors/search.js:30-130` - Search URL builder (migrate Phase 2)

---

## Questions & Contact

For questions about Phase 1 execution or deliverables:

- **Documentation**: Contact Phase 1 Lead
- **Testing approach**: Contact QA Lead
- **Backend queries**: Contact Backend Liaison
- **Feature flags**: Contact DevOps
