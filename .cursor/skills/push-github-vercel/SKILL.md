---
name: push-github-vercel
description: Push repository updates to GitHub and deploy to Vercel production with verification. Use when the user asks to push latest changes, deploy to Vercel, ship to production, or publish updates.
---

# Push GitHub + Vercel

## Goal
Ship the current workspace changes safely to GitHub and Vercel production.

## Workflow
1. Check repository state:
   - `git status --short --branch`
   - `git diff --stat`
   - `git log -5 --oneline`
2. Validate before shipping:
   - Run `npm run build` (or project build command) and confirm success.
3. Commit only what should ship:
   - Stage intended files explicitly.
   - Never stage secrets (`.env`, credential files).
   - Write a concise commit message focused on why.
4. Push to GitHub:
   - `git push origin <current-branch>`
5. Deploy to Vercel production:
   - `vercel --prod --yes`
   - If command backgrounds, monitor until status is `Ready` with:
     - `vercel inspect <deployment-url>`
     - `vercel inspect <deployment-url> --logs`
6. Report back:
   - Commit SHA
   - Pushed branch
   - Vercel production URL
   - Any warnings (large bundles, vulnerabilities, long build time)

## Guardrails
- Do not use destructive git commands.
- Do not amend commits unless explicitly requested.
- If unexpected unrelated changes appear, pause and ask the user.
- If deploy is slow because of local artifacts, recommend adding `.vercelignore`.
