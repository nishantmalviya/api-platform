# Initial Architecture

Status: **Draft** — mirrors the initial architecture decision captured in the
API Studio blueprint.

## Context

API Studio targets a desktop-first, AI-native API development and testing
platform for macOS, Windows, and Linux. The first architectural decision was to
build the application as a modular platform with three execution layers:

1. Presentation layer (React + TypeScript + Monaco + Zustand + Tailwind/shadcn).
2. Native execution layer (Rust via Tauri for HTTP, auth, storage, security).
3. AI orchestration layer (Node.js sidecar + TypeScript + OpenAI Agents SDK).

The binding architectural rule: **the AI agents must use the same underlying API
execution engine as the GUI**. There must not be a separate, less-secure HTTP
implementation for agents.

## Decisions

- Modular monorepo layout with clearly owned modules (`api-core`, `api-storage`,
  `api-workflows`, `api-protocols`, `api-security`) plus shared packages.
- One trusted execution engine for GUI and agents; agents go through a tool
  gateway with strict schemas, approvals, and budgets.
- Local-first persistence (SQLite in desktop; local storage in web) with
  migrations and secret handling via OS credential stores.
- Desktop over Electron; local-first over cloud-first; agent tools over
  unrestricted code execution; single-user MVP before collaboration.

## Consequences

- Strict, versioned request/response contracts shared by GUI, workflows, and AI
  tools.
- Redaction and approval flows are mandatory before any agent may trigger
  network execution.
- Performance and security acceptance criteria are defined per milestone.

## Implementation status (web)

The web implementation currently delivers the Phase 1–2 surface: application
shell, design system, layout, contracts, execution engine, persistence, history,
and an inert AI panel. Native (Tauri/Rust) and AI runtime increments remain.
