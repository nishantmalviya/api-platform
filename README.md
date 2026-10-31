# API Studio (Web)

Web implementation of **API Studio** — the AI-native desktop API development and
testing platform described in the *API Studio — Technical Architecture & Implementation Blueprint*.

> Note: the source blueprint targets a Tauri 2 desktop shell with a Rust native
> execution engine and a Node.js AI sidecar. This repository is the **web
> platform** implementation of that architecture: the same contracts, execution
> semantics, security model, and module boundaries are preserved on top of the
> web runtime (browser fetch execution engine, local-first persistence).

## Status

Early MVP implementation of the blueprint's first deliverable:

- [x] Monorepo-style module layout (`apps`, feature modules, contracts, services, tests, docs)
- [x] React application shell with providers and routing
- [x] Design system with theme tokens (dark/light)
- [x] Main three-panel layout (explorer, editor + response, AI panel)
- [x] Typed IPC-equivalent bridge (`services` / execution contracts)
- [x] SQLite-equivalent local persistence (localStorage-backed store)
- [x] Unit test setup (Vitest)
- [x] README with local development commands

Next increments (per the blueprint's phased plan):

- [ ] REST execution engine hardening (cancellation, streaming, bounded payloads)
- [ ] Collections, environments, import/export
- [ ] Monaco-backed editing, auth, history
- [ ] AI runtime integration (tool gateway, approvals, redaction)
- [ ] Workflow engine and assertions
- [ ] Cross-platform packaging and release hardening

## Tech stack

| Concern | Choice |
| --- | --- |
| Desktop shell (web) | React + TypeScript + Vite |
| Styling | Tailwind CSS v4 + design tokens + shadcn-style components |
| State | Zustand + TanStack Query |
| Editor | Monaco |
| Execution engine (web) | Browser `fetch` + AbortController, contract-mapped responses |
| Persistence (web) | localStorage via storage abstraction |
| Validation | Zod contracts |
| AI orchestration | OpenAI Agents SDK (planned) |
| Testing | Vitest, Testing Library |

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default http://localhost:5173).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview the production build |
| `npm test` | Run the unit test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Module map

```
src/
├── app/          # Router, providers
├── features/     # Feature modules (collections, requests, responses, history, agents, workflows, settings)
├── components/   # Shared UI (design system) + layout
├── contracts/    # Versioned API contracts (Zod) shared across boundaries
├── lib/          # Cross-cutting utilities (variables, redaction, helpers)
├── services/     # Storage + integration boundaries
├── stores/       # Zustand workspace store
├── styles/       # Design tokens and global styles
└── types/        # Shared domain types
tests/           # Unit, integration, e2e, security, performance suites
docs/            # Architecture, ADRs, agent specs, releases
```

## Security notes

- Secrets live in environment variable definitions and are referenced by opaque
  credential references; they are never written into plain-text persistence.
- History entries and AI context payloads are redacted before storage.
- The AI panel remains non-functional until the tool gateway, approvals, and
  execution budget layer are complete.
