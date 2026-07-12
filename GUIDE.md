# TokenDrift — Plain Guide

This file explains the whole project in plain words. It also lists every
command you may need, and when to use it.

The other files in this project (`CLAUDE.md`, `docs/tokendrift-prd_1.md`,
`docs/tokendrift-landing-copy_1.md`) are written for other readers — a
business plan and marketing copy. This file is written for you.

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
code. It reads every CSS and React file. It finds:

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

---

## 2. The two parts of this project

This project has two separate pieces of software living in one folder.

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

This is a normal website, built with a framework called **Next.js**. It
does two jobs:

1. Shows a homepage that explains the product (a landing page).
2. Hosts shared reports. When someone runs the CLI with `--share`, it
   uploads the report here, and this website shows it at a web address
   like `usetokendrift.com/r/abc123`.

This website needs a place to live online. We chose **Vercel**, a hosting
company built for this kind of website. It also needs two storage
services connected to it:
- **Vercel Blob** — stores the actual report files.
- **Redis** (via Upstash) — a fast lookup table that remembers which
  report ID points to which file.

Without those two connected, the website still runs, but it saves files
to its own hard drive instead — which does not work once it's hosted
online. That's why both must be set up before the shared-link feature
works for real users.

---

## 3. How a scan actually works, step by step

1. You type a command like `npx tokendrift .` in a project's folder.
2. The tool looks at the project's settings, if any exist
   (`tokendrift.config.js`), to learn the team's real tokens and spacing
   sizes.
3. It walks through every `.css`, `.scss`, `.tsx`, `.jsx`, `.ts`, and `.js`
   file, skipping folders like `node_modules` and `dist`.
4. For each file, it checks every color and spacing value it finds. It
   marks each one as "on token" (good) or "hardcoded" (a problem).
5. It adds up all the results and calculates the Drift Score.
6. It writes an HTML report file to your computer.
7. If you added `--share`, it also removes anything that looks like a
   secret (like an API key), then uploads just the report data — never
   your actual source code — to the website, and gives you back a link.

---

## 4. Commands — what to run, and when

All commands below assume you are inside the project's main folder
(`D:\Application\tokendrift`), unless a step says otherwise.

### Set up the project (do this once, or after pulling new code)

```
npm install
```
Downloads everything the project needs to run.

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
The first command checks for type mistakes. The second runs all the
automated tests. Both should say everything passed before you publish or
push code.

### Scan a project with the CLI (the main feature)

```
node packages/cli/dist/index.js <folder-to-scan> -o report.html
```
Replace `<folder-to-scan>` with the path to the project you want to
check. This writes `report.html` — open it in any browser.

Useful extra flags:
- `--json scan.json` — also saves the raw results as data, not just HTML.
- `--share` — uploads the report and gives you a web link (requires the
  website to be deployed and connected to storage — see Part B above).

Once the CLI is published to npm (see below), this becomes simpler:
```
npx tokendrift <folder-to-scan>
```

### Publish the CLI to npm (makes `npx tokendrift` work for everyone)

```
npm login
```
Do this once, in your own terminal — it opens a login step you must
complete yourself.

```
cd packages/cli
npm publish
```
This makes the tool public and downloadable by anyone in the world. This
step is **hard to undo** — think of it like hitting "publish" on a blog
post that strangers immediately start reading.

### Run the website on your own computer

```
cd apps/web
npm run dev
```
Then open `http://localhost:3000` in your browser to see it.

### Save your code with git (version history)

```
git add <file names>
git commit -m "short description of what changed"
```
This saves a snapshot of your code on your own computer. It does not
send anything anywhere yet.

### Send your code to GitHub (so others can see it, and so Vercel can
auto-update the website)

```
git remote add origin <your GitHub repo URL>
git push -u origin master
```
This uploads your saved snapshots to GitHub. This is **visible to
others** if the repo is public.

### Put the website online with Vercel

```
cd apps/web
npx vercel --prod
```
This uploads the website and gives you a live web address. Like
publishing to npm, this makes something public — other people can visit
it once deployed.

---

## 5. Where things are (folder map)

```
tokendrift/
├── CLAUDE.md                    Rules for how this project should be built
├── GUIDE.md                     This file — plain explanation for you
├── docs/                        Business plan and marketing copy
├── examples/sample-repo/        A tiny fake project, used to test scans
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

- The CLI tool works. It has been tested against the sample project and
  correctly found 13 real problems, giving a Drift Score of 36 out of 100.
- The CLI has **not** been published to npm yet — `npx tokendrift` will
  not work until you run `npm login` and `npm publish` yourself.
- A local git history has been started and one commit has been made. It
  has **not** been pushed to GitHub yet — that needs a GitHub repo you
  create, plus a `git push`.
- The website has been linked to a Vercel project
  (`vedantyedes-projects/web`), but has **not** been deployed live yet,
  and the storage services (Blob + Redis) are not connected yet.

---

## 7. Word list (plain meanings)

| Word | What it means |
|---|---|
| **Token** | A named, shared design value, like a color or spacing size, meant to be reused everywhere instead of retyped. |
| **Drift** | Code slowly stopping using the shared tokens, replaced by one-off hardcoded values. |
| **Drift Score** | A single number, 0–100, showing how much drift a project has. Higher is better. |
| **CLI** | A tool you run by typing a command in a terminal, instead of clicking in an app. |
| **npm** | The official store where JavaScript tools and libraries are published and downloaded. |
| **npx** | A command that downloads and runs an npm tool for you, without installing it permanently. |
| **Repo** (repository) | A project's folder, tracked by git, so every change is saved as history. |
| **git** | Software that saves snapshots ("commits") of your code over time. |
| **GitHub** | A website that stores your git repo online, so others can see or contribute to it. |
| **Vercel** | A hosting company. It runs the TokenDrift website and gives it a public web address. |
| **CI** (Continuous Integration) | Automated checks that run every time code changes, to catch problems early. |
