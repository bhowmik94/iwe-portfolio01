# AI Usage Overview (`ai-sessions`)

This folder documents all AI assistance used while developing the chess FEN parser and HTTP board API (`web-application-server`).

## Workflow & Tools Used

1. **Primary Development — Codex (VS Code with `AGENTS.md`)**
   - **Session Reference:** `session-01-codex.md` (View link: https://chatgpt.com/s/cx_6b08b29e3b348191983fdb61638f1701)
   - **How it was used:** Core design, architecture decisions, and implementation of the FEN parser (`src/board.js`), piece representation (`src/piece.js`), API routes (`src/controller/api.js`), server setup (`src/app.js`, `src/server.js`), and unit tests (`test/board.test.js`) were carried out in VS Code with Codex reading `AGENTS.md` directly.

2. **Supplementary Verification & Error Formatting — Gemini (Web Chat)**
   - **Session Log:** `session-02-gemini-api-checks.md`
   - **How it was used:** Used as a secondary reference to:
     - Check quick local verification workflows for `Board.parse` (`bun -e` and `bun test`).
     - Review JSON serialization structures (`src/server-view/serialize.js`) and refine `serializeFenError` so `error` outputs a single-line summary (`error.message.split("\n")[0]`).
     - Align the first line of `FenError.message` (`src/errors.js`) with the Task 2.2 specification while keeping a clean constructor and visual `^` marker.
     - Standardize HTTP `400` validation messages and generate `curl` commands to test all endpoints end-to-end through Caddy (`https://localhost:8443`).