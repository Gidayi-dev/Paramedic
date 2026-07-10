# Paramedic Triage Intake App

An offline-first triage intake application for field paramedics, built with **React Native**, **TypeScript**, and **WatermelonDB**. Paramedics can log critical patient data instantly, even with zero connectivity — records are guaranteed to persist locally and sync automatically the moment the network returns.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [How the Offline-First Sync Engine Works](#how-the-offline-first-sync-engine-works)
- [Tech Stack & Key Decisions](#tech-stack--key-decisions)
- [Project Structure](#project-structure)
- [Setup & Run Instructions](#setup--run-instructions)
- [Testing](#testing)
- [Demo](#demo)
- [Known Limitations & Future Improvements](#known-limitations--future-improvements)

## Overview

Field paramedics often work in areas with unstable or nonexistent cellular coverage. This app ensures that submitting a triage record **never fails and never loses data**, regardless of connectivity, by treating the local device as the source of truth and the network as an eventually-consistent sync target.

**Core requirements met:**
- Single-screen triage intake form (Patient Name, Condition Description, Priority 1–5, Status)
- High-visibility hazard color-coding for critical priorities (P1/P2 in deep red/orange)
- Form validation before submission
- Immediate local persistence via WatermelonDB (SQLite), regardless of network state
- Automatic background sync queue that drains to the server the moment connectivity returns
- No UI freezing, no user intervention required to sync
- Redux Toolkit for state management, cleanly decoupled from persistence/sync logic
- Handles app foreground/background transitions correctly

## Architecture

The app is split into four layers with strict one-directional dependencies — each layer only knows about the one(s) beneath it:

```
┌─────────────────────────────────────────────┐
│  ui/            Screens & components          │
│                 (TriageFormScreen)             │
└───────────────────┬─────────────────────────┘
                     │ dispatches to / reads from
┌───────────────────▼─────────────────────────┐
│  state/         Redux Toolkit store            │
│                 (triageSlice, store)            │
└───────────────────┬─────────────────────────┘
                     │ calls into
┌───────────────────▼─────────────────────────┐
│  sync/          Sync engine                    │
│  (mockApi, SyncQueueManager, syncController,   │
│   useNetworkSync)                              │
└───────────────────┬─────────────────────────┘
                     │ reads/writes
┌───────────────────▼─────────────────────────┐
│  data/          WatermelonDB                   │
│  (schema, TriageRecord model, database.ts)     │
└─────────────────────────────────────────────┘
```

| Layer | Responsibility | Depends on |
|---|---|---|
| `data/` | WatermelonDB schema, model, database instance. Pure persistence — no knowledge of React, Redux, or networking. | Nothing |
| `sync/` | Mock API repository, connectivity-aware sync queue, and the hook that ties it to app/network lifecycle events. | `data/` |
| `state/` | Redux Toolkit slice + store. The **only** layer the UI is allowed to talk to. | `data/`, `sync/` |
| `ui/` | Screens and components. Never touches WatermelonDB or the network directly — only dispatches actions and reads state. | `state/` |

This separation means the persistence and sync logic can be fully unit-tested without React, and the UI can be redesigned without touching a single line of sync logic.

## How the Offline-First Sync Engine Works

### 1. Write path — always local first

When a paramedic taps **Submit Triage**, the form:
1. Validates all fields client-side (non-empty name/condition, priority selected)
2. Writes the record directly into WatermelonDB with `syncState: Pending` — **this happens unconditionally, whether the device is online or offline**
3. Immediately reflects the new record in the UI via Redux
4. *Only after* the local write succeeds does it attempt a sync and that attempt is non-blocking and never surfaces an error to the user if it fails

This ordering is the core of the offline-first guarantee: the local database, not the network, is the source of truth at write time.

### 2. The mock API (`src/sync/mockApi.ts`)

Simulates the backend endpoint`POST /api/v1/triage` with:
- A configurable artificial delay (default **2000ms**)
- A configurable random failure rate (`setFailureRate(0–1)`), used in tests to prove retry behavior

### 3. The sync queue (`src/sync/syncQueue.ts` — `SyncQueueManager`)

On each drain cycle:
1. **Checks real device connectivity first**, via `NetInfo.fetch()`. If offline, it exits immediately without touching any records they remain safely `Pending`.
2. Queries WatermelonDB for every record with `sync_state` of `Pending` or `Failed`
3. Processes them **sequentially** (not in parallel) to preserve chronological order and avoid overwhelming the mock endpoint
4. For each record: marks it `Syncing` → attempts the API call → marks it `Synced` on success, or `Failed` on error (never deletes or corrupts the local record — only the sync bookkeeping field changes)
5. Guards against overlapping drains with an `isProcessing` flag

### 4. Connectivity & lifecycle listener (`src/sync/useNetworkSync.ts`)

A React hook, mounted once at the app root, that:
- Subscribes to `NetInfo.addEventListener` the moment the device regains connectivity, it triggers a drain automatically, with no user action required
- Subscribes to `AppState` changes if the app is brought back to the foreground from the background, it re-checks connectivity and triggers a drain if online (covers the case where connectivity was restored while the app was minimized)
- Runs an initial drain attempt on mount, in case there are already-pending records from a previous session

### 5. Keeping the UI in sync (`src/sync/syncController.ts`)

`drainQueue()` only touches WatermelonDB it has no way to notify Redux on its own. `triggerSyncAndRefresh()` wraps it: drain the queue, then re-read all records from WatermelonDB and push the fresh state into Redux. This is what the UI actually calls (both on manual submit and from the background listener), ensuring the "X of Y records synced" indicator always reflects reality rather than stale state.

### Why this satisfies the requirement

> "The moment the device regains connection, the application must automatically stream or batch-upload all pending cached records to the server in the background without freezing the UI or requiring user intervention."

- **Automatic**: `NetInfo` event listener triggers the drain with zero user interaction.
- **No UI freezing**: all database and network operations are `async`, and syncing runs independently of form interaction the paramedic can keep entering new records while a previous batch syncs in the background.
- **No data loss**: every write lands in SQLite before any network attempt is made; a failed or interrupted sync leaves the record queued for the next opportunity, never lost.

## Tech Stack & Key Decisions

| Choice | Reasoning |
|---|---|
| **Bare React Native**, not Expo | WatermelonDB requires native module linking not supported by Expo Go without ejecting to a dev client. |
| **WatermelonDB** for persistence | Purpose-built for offline-first apps with reactive queries; battle-tested SQLite layer. |
| **JSI enabled only on iOS** (`jsi: Platform.OS === 'ios'` in `database.ts`) | Android JSI mode requires substantial manual native wiring (NDK, custom Gradle module, `MainApplication` edits) that's fragile to set up correctly. The async bridge adapter needs zero extra native config via standard autolinking and is functionally identical at this app's record volumes (tens, not millions, of records). |
| **Redux Toolkit** over Context API | Assignment explicitly allows either; Redux Toolkit gives cleaner action-based decoupling between the sync engine (which needs to push state updates from outside any component) and the UI. |
| **Mock API with artificial delay + failure toggle**, not a real backend | Per assignment instructions proves the sync queue's resilience without requiring live infrastructure. |
| Real `NetInfo` connectivity check inside the sync queue itself (not just at the UI trigger point) | Prevents the mock API's simulated success/failure from being decoupled from the device's *actual* network state without this, toggling airplane mode would have no observable effect, since the mock API doesn't check real connectivity on its own. |

### A note on React Native's New Architecture

An earlier attempt to disable the New Architecture via `newArchEnabled=false` in `android/gradle.properties` was made for WatermelonDB stability. As of React Native 0.82+, this flag is **ignored** the New Architecture runs by default regardless. WatermelonDB's async bridge adapter (used on Android per the decision above) relies on React Native's backward-compatibility layer for legacy native modules, which continues to function under the New Architecture. No native crashes have been observed as a result; if Fabric/TurboModule-related native errors surface in the future, this is the first place to look.

## Project Structure

```
src/
├── data/                     # WatermelonDB layer — pure persistence
│   ├── schema/
│   │   ├── schema.ts         # Table definition (triage_records)
│   │   └── migrations.ts     # Schema version migrations
│   ├── models/
│   │   └── TriageRecord.ts   # WatermelonDB Model class
│   ├── testUtils/
│   │   └── testDatabase.ts   # In-memory LokiJS database for tests
│   ├── __tests__/
│   │   └── TriageRecord.test.ts
│   └── database.ts           # Database singleton (SQLiteAdapter config)
│
├── sync/                     # Offline sync engine
│   ├── mockApi.ts            # Simulated POST /api/v1/triage
│   ├── syncQueue.ts          # SyncQueueManager — drains pending records
│   ├── syncController.ts     # Bridges sync engine output back into Redux
│   ├── useNetworkSync.ts     # NetInfo + AppState listener hook
│   └── __tests__/
│       └── syncQueue.test.ts
│
├── state/                    # Redux Toolkit
│   ├── triageSlice.ts        # records[], isSyncing
│   ├── store.ts
│   └── __tests__/
│       └── triageSlice.test.ts
│
├── ui/
│   └── screens/
│       └── TriageFormScreen.tsx   # The single-screen intake form
│
└── types/
    └── triage.ts              # Shared domain types (TriagePriority, TriageStatus, SyncState, DTOs)
```

## Setup & Run Instructions

### Prerequisites

- **Node.js** ≥ 22.11.0
- **Java JDK 17+** (or use the JDK bundled with Android Studio, at `Android Studio/jbr`)
- **Android Studio**, with the Android SDK, Build Tools, and an emulator or physical device configured
- Environment variables set: `ANDROID_HOME` and `JAVA_HOME`, both added to `PATH` (see React Native's official [environment setup guide](https://reactnative.dev/docs/environment-setup) for OS-specific steps)

### Install & run

```bash
npm install

# Terminal 1 — Metro bundler
npx react-native start

# Terminal 2 — build and install on a connected device or running emulator
npx react-native run-android
```

For iOS (macOS only):
```bash
cd ios && RCT_NEW_ARCH_ENABLED=0 pod install && cd ..
npx react-native run-ios
```

### Testing the offline-first behavior manually

**On an emulator**, toggle airplane mode via ADB (more reliable than the UI swipe gesture in an emulator window):
```bash
# ON
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true

# OFF
adb shell settings put global airplane_mode_on 0
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false
```

**On a physical device**, use the real airplane mode toggle in Quick Settings.

1. Enable airplane mode
2. Fill out and submit a triage record — confirm it saves instantly and shows as unsynced
3. Disable airplane mode
4. Without touching anything else, watch the sync counter update automatically within a couple of seconds

## Testing

```bash
npx tsc --noEmit    # type check
npm test -- --ci     # unit tests
```

Test coverage includes:
- **`TriageRecord.test.ts`** — WatermelonDB model creation, field mapping, `toDTO()` serialization, updates
- **`syncQueue.test.ts`** — sync queue behavior under success and simulated failure, including recovery on retry
- **`triageSlice.test.ts`** — Redux reducer behavior (adding records, updating sync state, syncing flag)
- **`App.test.tsx`** — smoke test that the app renders without crashing

## Demo

[[Link to demo video/GIF](https://drive.google.com/file/d/1KDriQk-grHw3Z96ioxiHqyoBqConb2QM/view?usp=sharing)]

The demo shows: submitting a triage record while the emulator is in airplane mode (record saves locally, stays unsynced), then disabling airplane mode and observing the record automatically sync without any further user interaction.

## Known Limitations & Future Improvements

- The mock API is purely local/simulated no real backend integration yet. Swapping in a real endpoint means replacing `mockApi.ts`'s `submitTriage()` body with an actual `fetch()` call; nothing else in the sync layer needs to change, since the rest of the app depends only on the shape of that function.
- No retry backoff strategy failed records are retried on the next drain trigger (connectivity restore, app foreground, or manual submit), not on a timer. A production version would likely add exponential backoff for repeated failures.
- No authentication/multi-user support out of scope for this assessment.
- Android currently runs with the New Architecture enabled by default (see note above) despite the original intent to keep it off; this has not caused observed issues but is worth monitoring as WatermelonDB and React Native both continue to evolve.