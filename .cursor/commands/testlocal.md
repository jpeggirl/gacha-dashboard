---
description: Start local dev server and open latest local URL.
---

Open the latest local version of this project in the browser.

Execution rules:
1. Prefer `npm run dev` for this repo (Vite project).
2. Check existing terminals first; if a healthy dev server is already running for this repo, reuse it and extract its local URL.
3. If no server is running, start `npm run dev`.
4. Wait until the server prints a local URL (for example `http://localhost:5173`), then run `open "<url>"`.
5. Return the URL opened and whether the server was reused or newly started.

Additional user context: `$ARGUMENTS`
