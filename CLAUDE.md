# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `yarn dev` — Vite dev server (SvelteKit).
- `yarn host` — dev server bound to all interfaces (used by `entrypoint.sh` in the container).
- `yarn build` — production build via `@sveltejs/adapter-auto`.
- `yarn preview` — preview the built app.
- `yarn run check` — runs `svelte-kit sync` then `svelte-check` against `tsconfig.json`. **Note:** call it as `yarn run check`, not `yarn check` — the bare form triggers Yarn's built-in integrity check instead of this script. There is no test runner or linter; `check` is the only type-safety gate.
- `yarn run check:watch` — watch mode.

The app has no backend service dependency — persistence is browser `localStorage`. `yarn dev` alone is enough to run it end-to-end.

## Architecture

SvelteKit 2 + Svelte 5 + TypeScript + Tailwind v4 + Vite 6. Single-user tool for recording timestamped annotations during interviews/meetings, with optional video playback synchronization.

### Persistence

All meeting data lives in `localStorage` under keys prefixed `meeting:`, with `meeting:registry` tracking the list of known meeting ids. This is encapsulated in `src/lib/meetingService.ts`, which is the only module that should read/write `localStorage` for meeting data. The callers (`/meeting/[type]/+page.svelte` on save, `/meeting/[type]/summary/+page.svelte` on load) go through its `saveMeetingData` / `getMeetingData` / `getAllMeetings` / `deleteMeetingData` API.

`meetingService` is safe to import from any context — every function guards on `typeof window` so SSR doesn't explode, and falls back to an empty/failed response when storage is unavailable.

There is **no** `/api` route any more. If you need a server-side operation (e.g. syncing to a real backend), add a new route and call it from `meetingService`, keeping the same exported function signatures so pages don't change.

### Client-side store

`src/lib/stores/meetingStore.ts` is the single source of truth for an active meeting. It manages timer state, video state (object URLs from local `File` uploads), time entries, timeline markers, summary counts, and locked timeline positions. The store exposes imperative methods (`init`, `startTimer`, `recordPoint`, `setVideo`, `lockPositions`, `exportData`, …) rather than being mutated directly.

### Timeline positioning model

`meetingStore` computes marker positions two different ways depending on context — both produce a percentage clamped to `[2, 98]`:

- Live (timer running, no locked positions): scaled by `elapsedTimeMs` against `maxRecordedElapsedTime` and `duration * 1000`. Entries with `elapsedTimeMs === 0` are spaced at the start.
- Locked / video-synced: when a video is loaded or `lockPositions()` is called, positions are computed from `currentTime / duration` and stored in `lockedPositions[entry.id]`, which then takes priority.

`timelineKey` is bumped on any mutation that should force Svelte to re-render the `Timeline` component. `maxRecordedElapsedTime` is tracked separately from `elapsedTime` so that stopped/scrubbed state doesn't shrink the timeline.

### Annotation taxonomy

`src/lib/types/index.ts` defines `ANNOTATION_TYPES` (id/icon/label/color tuples) and the `SummaryData` shape. **The ids in `ANNOTATION_TYPES` and the keys in `SummaryData` / `createSummaryData` must stay in sync** — `recordPoint` increments `summaryData[type]` directly by id. There is a current mismatch: `ANNOTATION_TYPES` uses singular ids like `question`, `answer`, `pain`, `success`, `idea`, `note` while `SummaryData` has `questions`, `answers`, `painPoints`, `successPoints`, `featureIdeas`, `notes`. Adding a new annotation type requires updating both.

### Routing

- `/` — meeting type selection (`+page.svelte`).
- `/meeting/[type]` — active meeting tracking UI, composed of components under `src/lib/components/meeting/` (`MeetingHeader`, `ControlPanel`, `AnnotationButtons`, `Timeline`, `TimeEntries`, `VideoPlayer`).
- `/meeting/[type]/summary` — summary/export view, reads from `localStorage` via `meetingService`.
- `/recorder` — separate recorder page.

## Styling

Tailwind v4 via `@tailwindcss/vite` and `@tailwindcss/postcss`. Global CSS lives in `src/app.css`. No component library — UI primitives are hand-rolled under `src/lib/components/ui/`.

## Known issues

- `yarn run check` currently reports ~41 type errors, mostly implicit-any in the `.svelte` pages. These pre-date the current work. Worth a pass, but not blocking the app from running.
- `recorder/+page.svelte` uses legacy `@tailwind base/components/utilities` directives that trigger warnings under Tailwind v4 — v4 expects `@import "tailwindcss"`.
