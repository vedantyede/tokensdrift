# TokenDrift — Plain Guide

This file explains the whole project in plain words. It also lists every
command you may need, and when to use it.

The other files in this project (`CLAUDE.md`, `docs/tokendrift-prd_1.md`,
`docs/tokendrift-landing-copy_1.md`, `ROADMAP.md`) are written for other
purposes — build rules, a business plan, marketing copy, and a feature
checklist. This file is written for you to understand what exists and how
to use it.

---

## 1. What TokenDrift does

Big companies build a "design system." That means a shared set of colors,
spacing sizes, and styles that every screen should use. Developers call
these shared values **design tokens**.

Over time, developers get busy. Instead of using the shared blue color,
someone types `#1D4ED8` directly into the code. Instead of the shared
spacing size, someone types `13px`. This is called **drift** — the code
slowly moves away from the design system.

**TokenDrift is a tool that finds this drift.** You point it at a project's
code. It reads every CSS and React file (skipping test files — see below).
It finds:

1. **Hardcoded colors** — a color typed directly (like `#1D4ED8` or `gray`)
   instead of using a shared token.
2. **Off-scale spacing** — a spacing number (like `13px`) that does not
   match the sizes the team agreed on.
3. **Token adoption** — out of all the colors and spacing in the code, what
   percent use real tokens vs. hardcoded values.

It then gives the project one number: the **Drift Score**, from 0 to 100.
A higher score means the code follows the design system well. A lower
score means there is a lot of drift.

Finally, it writes all of this into one HTML report file you can open in
a browser, or upload to get a shareable web link.

**What it deliberately does *not* flag** (learned from scanning real
open-source projects — see section 6): test files (`*.test.ts`,
`*.spec.ts`), since they're often full of color literals used as test
data, not real UI code. Named colors (`red`, `blue`, etc., but not hex
codes) are also only flagged inside actual style code — a `style={{}}`
prop or a stylesheet — not inside plain data objects, since English color
words show up constantly in non-styling data (e.g. `{ label: 'Akron',
color: 'blue' }` in a dropdown options list).

---

## 2. The three parts of this project

### Part A — The CLI tool (`packages/cli`)

This is the actual scanner. "CLI" means **Command Line Interface** — a tool
you run by typing a command, not by clicking buttons. This is the part
real developers will install and run on their own projects.

- It has **no other software installed inside it** (called "zero
  dependencies"). This is on purpose — it makes the tool small, fast, and
  safe to trust with someone else's code.
- It gets published to **npm**, the library store for JavaScript. Once
  published, anyone can run it with `npx tokendrift`.

### Part B — The website (`apps/web`)

A normal website, built with **Next.js**, live at
`tokendrift-vedantyedes-projects.vercel.app` (a real custom domain isn't
connected yet). It does several jobs now:

1. **Homepage** — explains the product, shows a real sample scan.
2. **Hosted reports** (`/r/{id}`) — when someone runs the CLI with
   `--share`, it uploads the report here and shows it at a web address.
3. **README badges** (`/badge/{slug}.svg`) — a small image showing a
   repo's latest Drift Score, meant to be pasted into a project's README.
   It tracks *the repo*, not one single scan: rescanning the same repo
   updates the same badge instead of creating a new one.
4. **Email capture** — a "notify me when this score changes" form on
   hosted report pages, for the future paid-launch list. Nothing
   automated sends emails yet — it just saves the address.
5. **Teardown mode** — hosted (and local) reports can be dressed up as a
   "Published by TokenDrift" editorial write-up, for public content about
   open-source projects.
6. **Usage stats** (`/api/stats`) — a simple, no-login page showing how
   many reports have been shared and viewed in total.

This website runs on **Vercel**, and needs two storage services connected:
- **Vercel Blob** — stores the actual report files.
- **Redis** (via Upstash) — a fast lookup table for reports and badges.

Both are already connected in production (see section 6).

### Part C — Internal scripts (`scripts/`)

Not part of the product — small tools for running the business.

- `scripts/draft-outreach.mjs` — scans a real target repo (a local path,
  or a public GitHub URL) and drafts a cold-outreach email from the real
  numbers. See section 4 for usage.

---

## 3. How a scan actually works, step by step

1. You type a command like `npx tokendrift .` in a project's folder.
2. The tool looks at the project's settings, if any exist
   (`tokendrift.config.js`), to learn the team's real tokens and spacing
   sizes.
3. It walks through every `.css`, `.scss`, `.tsx`, `.jsx`, `.ts`, and `.js`
   file, skipping folders like `node_modules` and `dist`, and skipping
   test files.
4. For each file, it checks every color and spacing value it finds. It
   marks each one as "on token" (good) or "hardcoded" (a problem).
5. It adds up all the results and calculates the Drift Score.
6. It writes an HTML report file to your computer.
7. If you added `--share`:
   - It removes anything that looks like a secret (like an API key).
   - It works out a stable ID for "this repo" from your git remote, so
     re-scanning the same repo later updates the same badge instead of
     making a new one.
   - It uploads just the report data — never your actual source code —
     to the website, and gives you back a link, a one-time delete link,
     and (if a git remote was found) a badge you can paste into a README.

---

## 4. Commands — what to run, and when

All commands below assume you are inside the project's main folder
(`D:\Application\tokendrift`), unless a step says otherwise.

### Set up the project (do this once, or after pulling new code)

```
npm install
```

### Build the CLI tool

```
npm run build --workspace packages/cli
```
Turns the CLI's source code into one runnable file:
`packages/cli/dist/index.js`. Run this again any time you change code
inside `packages/cli/src`.

### Check the code is correct (before publishing or committing)

```
npm run typecheck --workspace packages/cli
npm run test --workspace packages/cli
```
Both should say everything passed before you publish or push code.

### Scan a project with the CLI (the main feature)

```
node packages/cli/dist/index.js <folder-to-scan> -o report.html
```

Useful extra flags:
- `--json scan.json` — also saves the raw results as data, not just HTML.
- `--share` — uploads the report and gives you a web link, a delete link,
  and a badge (if a git remote is found).
- `--share-url <url>` — use a different server than the default (needed
  right now, since the real domain isn't connected — use
  `https://tokendrift-vedantyedes-projects.vercel.app`).
- `--teardown-title "..."` and `--teardown-note "..."` — render the
  report as a branded "Published by TokenDrift" editorial write-up
  instead of a plain report.

Once the CLI is published to npm, this becomes simpler:
```
npx tokendrift <folder-to-scan>
```

### Draft a cold-outreach email for a real target

```
node scripts/draft-outreach.mjs <path-or-github-url> [--name "Their Name"] [--share]
```
Scans the target and prints a ready-to-send email with the real score,
top offenders, and (with `--share`) a real hosted link.

### Publish the CLI to npm (makes `npx tokendrift` work for everyone)

```
npm login
cd packages/cli
npm publish
```
`npm login` must be run by you, interactively. Publishing is **hard to
undo** — once live, anyone can download it. As of this writing, `0.1.0`
is published; `0.1.1` (with several fixes) is built and ready but not yet
published — the last publish attempt needs a fresh npm auth token (a
Granular Access Token with "bypass 2FA" turned on).

### Run the website on your own computer

```
cd apps/web
npm run dev
```
Then open `http://localhost:3000`.

### Deploy the website to Vercel

```
npx vercel --prod
```
Run from the **repo root** (not `apps/web`) — the project needs the whole
monorepo present to resolve the CLI package it depends on. Already
connected to GitHub, so a normal `git push` to `master` also
auto-deploys.

### Save and share your code with git

```
git add <file names>
git commit -m "short description of what changed"
git push
```

---

## 5. Where things are (folder map)

```
tokendrift/
├── CLAUDE.md                    Rules for how this project should be built
├── GUIDE.md                     This file — plain explanation for you
├── ROADMAP.md                   Feature checklist by phase, with current status
├── vercel.json                  Tells Vercel how to build this monorepo
├── docs/                        Business plan and marketing copy
├── examples/sample-repo/        A tiny fake project, used to test scans
├── scripts/                     Internal tools (not part of the product)
├── packages/cli/                The scanner tool (Part A)
│   ├── src/                     Its source code
│   ├── test/                    Its automated tests
│   └── dist/                    The built, runnable tool (after `npm run build`)
└── apps/web/                    The website (Part B)
    ├── app/                     Its pages and API routes
    └── lib/                     Its storage logic (local vs. Vercel)
```

---

## 6. Where this project stands right now

- **The CLI tool works** and has been tested against real open-source
  projects (not just the sample repo) — Dub, Twenty, and Formbricks.
  Testing against real code found and fixed four real bugs: a crash on
  repos with tens of thousands of files, colors wrongly flagged outside
  real style code, colors wrongly flagged in test files, and (a known,
  unfixed limit) no way to recognize a company's own bespoke token files.
- **npm:** `tokendrift@0.1.0` is published — `npx tokendrift` works today.
  `0.1.1` is built locally with more fixes but not yet published (waiting
  on a fresh auth token).
- **GitHub:** pushed, at `github.com/vedantyede/tokendrift`.
- **Vercel:** deployed and live at
  `tokendrift-vedantyedes-projects.vercel.app`, connected to GitHub for
  auto-deploy, with Blob and Redis storage both connected.
- **Custom domain** (`usetokendrift.com`): not purchased/connected yet —
  deliberately deferred.
- **Phase 1 (share MVP) and Phase 2 (badge + capture) are done.** Phase 3
  (public launch) is in progress: 3 real teardowns are live (see
  `ROADMAP.md` for links), and basic usage-stat tracking is live. Launch
  posts (Show HN, r/webdev, dev.to) haven't been written or posted yet.

---

## 7. Word list (plain meanings)

| Word | What it means |
|---|---|
| **Token** | A named, shared design value, like a color or spacing size, meant to be reused everywhere instead of retyped. |
| **Drift** | Code slowly stopping using the shared tokens, replaced by one-off hardcoded values. |
| **Drift Score** | A single number, 0–100, showing how much drift a project has. Higher is better. |
| **Badge** | A small image (like `85/100`) you paste into a README that shows a repo's latest score, and updates automatically when rescanned. |
| **Teardown** | A branded, public write-up of a scan, meant to be shared as content — different from a private report someone runs on their own code. |
| **CLI** | A tool you run by typing a command in a terminal, instead of clicking in an app. |
| **npm** | The official store where JavaScript tools and libraries are published and downloaded. |
| **npx** | A command that downloads and runs an npm tool for you, without installing it permanently. |
| **Repo** (repository) | A project's folder, tracked by git, so every change is saved as history. |
| **git** | Software that saves snapshots ("commits") of your code over time. |
| **GitHub** | A website that stores your git repo online, so others can see or contribute to it. |
| **Vercel** | A hosting company. It runs the TokenDrift website and gives it a public web address. |
| **Redis** | A fast lookup-table database, used here to remember report/badge data. |
| **CI** (Continuous Integration) | Automated checks that run every time code changes, to catch problems early. |
