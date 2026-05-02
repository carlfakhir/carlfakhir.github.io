# AGENTS.md

Instructions for AI agents working on this repo.

## What this is

Carl Fakhir's personal portfolio site. Static HTML/CSS/JS — no framework, no build step.

## Hosting

- **Primary:** https://carl-fakhir.vercel.app (Vercel, Hobby/free tier)
- **Redirect:** https://carlfakhir.github.io → meta-refresh → carl-fakhir.vercel.app (GitHub Pages)

Vercel is the source of truth. GitHub Pages exists only to redirect the legacy URL.

## Branch layout

- `main` — real site source. Vercel auto-deploys on push.
- `gh-pages` — single redirect `index.html` only. Powers GitHub Pages. **Do not commit site code here.**

## Workflow

1. Edit files on `main` (e.g. `index.html`, `style.css`, `script.js`, `Carl_Fakhir_resume.pdf`).
2. `git push origin main`.
3. Vercel rebuilds and deploys to https://carl-fakhir.vercel.app within ~10s.
4. No action needed on `gh-pages` — the redirect is static and never changes unless the Vercel URL changes.

## If the Vercel URL ever changes

Update the redirect target in `gh-pages` branch's `index.html` (3 places: `<link rel="canonical">`, `<meta http-equiv="refresh">`, `<script>window.location.replace`).

## Vercel project

- Project: `carlfakhirs-projects/carlfakhir`
- Linked via `.vercel/` (gitignored)
- No env vars, no build command, no framework. Static output served from repo root.

## Don't

- Don't add a build step or framework unless explicitly asked — keep it static.
- Don't commit to `gh-pages` from work on `main`. The branches are unrelated (orphan).
- Don't disable Vercel's GitHub integration — it's how auto-deploy works.
