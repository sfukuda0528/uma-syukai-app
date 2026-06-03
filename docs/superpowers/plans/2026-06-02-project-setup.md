# Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** README/CODEX に沿って、Next.js と Python ワーカーを前提にした最小プロジェクト構成を作る。

**Architecture:** Next.js app router をルートに配置し、UI コンポーネントを `components/` に分ける。解析・保存・型の境界は `lib/` と `worker/` に分離し、ローカル保存用ディレクトリを実体化する。

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Python worker, ffmpeg, OCR engine, Pillow, local file storage.

---

### Task 1: Project Files

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.gitignore`

- [x] **Step 1: Add framework configuration**

Create package scripts and configuration for Next.js, TypeScript, Tailwind CSS, linting, and build.

### Task 2: App Shell

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `components/upload/upload-panel.tsx`
- Create: `components/analysis/status-panel.tsx`
- Create: `components/review/candidate-review.tsx`
- Create: `components/icon-studio/theme-picker.tsx`

- [x] **Step 1: Add MVP workflow UI**

Create a dense work-oriented first screen that covers upload, analysis status, candidate review, theme selection, and download preparation.

### Task 3: Domain Scaffolding

**Files:**
- Create: `lib/jobs/types.ts`
- Create: `lib/storage/paths.ts`
- Create: `lib/schemas/candidates.ts`
- Create: `data/app-name-dictionary.json`
- Create: `data/default-icon-themes.json`
- Create: `worker/README.md`
- Create: `worker/requirements.txt`
- Create: `uploads/.gitkeep`
- Create: `tmp/.gitkeep`
- Create: `artifacts/.gitkeep`

- [x] **Step 1: Add domain boundaries**

Create typed job/candidate definitions, local storage path helpers, seed data files, worker documentation, and local storage directories.

### Task 4: Verification

**Files:**
- Read: `package.json`
- Read: `app/page.tsx`

- [ ] **Step 1: Install dependencies**

Run: `npm install`

- [ ] **Step 2: Lint**

Run: `npm run lint`

- [ ] **Step 3: Build**

Run: `npm run build`
