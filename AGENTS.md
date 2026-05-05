# AGENTS Guide for UI Refactor Work

## Purpose

This file defines implementation guardrails for agents and contributors working on the GenomeHubs UI phased refactor.

## Architecture direction

- Treat `src/genomehubs-api` in this repository as deprecated for new UI integration work.
- Target future API/SDK contracts from the external `cli-generator` project outputs.
- Preserve existing user-facing behavior first, then modernize internals incrementally.

## Core engineering constraints

- Keep both search paths fully supported:
  - chip-based query path
  - plain free-text search path
- Avoid introducing behavior drift between search paths.
- Maintain URL compatibility:
  - parse/accept legacy URL shapes
  - redirect/normalize to canonical URLs
- Embedded markdown reports are production-critical and must not regress.

## DRY and side-effect rules

- Do not duplicate query parsing/validation logic across components.
- Centralize shared behavior behind adapters/builders:
  - query adapter
  - URL builder/parser
  - report spec mapper
- Avoid hidden side effects:
  - no global mutable request controller for unrelated requests
  - no component-level ad hoc URL mutation that bypasses central builders
- Keep data fetch orchestration outside rendering components when possible.

## Coding conventions

- Prefer small composable modules over monolithic selectors/components.
- Keep UI rendering pure; move I/O and normalization into adapters/services.
- Enforce explicit input/output contracts for adapters.
- Add comments only where behavior is non-obvious.
- Preserve backward compatibility at boundaries until planned retirement phase.

## Testing conventions

- Every phase must include tests before phase completion.
- Required test categories during migration:
  - unit tests for adapters/parsers/builders
  - integration tests for store + selector/adapter interactions
  - URL roundtrip tests (legacy -> canonical -> stable)
  - report data and rendering regression snapshots
  - markdown embedded report smoke tests
- No phase is complete without a documented pass of its verification gates.

## Feature flags and rollout

- Use build-time flags for deployment-level rollout.
- Allow local/per-user test toggles for migration validation.
- Keep rollback controls until two stable cycles after cutover.

## Prohibited patterns during migration

- New direct `fetch()` calls in view components/selectors that bypass SDK adapters.
- New ad hoc string interpolation for API and navigation URLs outside approved builders.
- New global mutable state used for cross-request cancellation.
- Expanding deprecated legacy modules when adapter equivalents exist.

## Definition of done for each migration slice

- Behavior parity validated against existing path.
- Tests added/updated and passing.
- URL compatibility maintained.
- No unmanaged side effects introduced.
- Migration ledger updated with status (migrated, retained, deprecated).
