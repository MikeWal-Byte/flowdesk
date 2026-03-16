# FlowDesk

A full-stack productivity organiser — Kanban boards, daily planner, calendar, and notes — with Supabase cloud sync.

---

## Quick Start

### 1. Set up Supabase (free, ~2 minutes)

1. Go to [supabase.com](https://supabase.com) → **Start your project** → create a free account
2. Click **New project**, give it a name, choose a region, set a password → **Create project**
3. Once created, go to **SQL Editor** → **New query**
4. Paste the contents of `supabase/schema.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy your **Project URL** and **anon / public key**

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Features

| Section | What it does |
|---|---|
| **Projects** | Multi-project Kanban with drag-and-drop columns and card detail checklists |
| **Daily Planner** | Today's task list with progress bar, auto-archives by date |
| **Calendar** | Month / week / day views with colour-coded events |
| **Notes** | Multi-note scratchpad with 500ms auto-save |

### Priority colours
- **P1 — Green** = Highest priority
- **P2 — Amber** = Medium priority
- **P3 — Red** = Lowest priority

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Drag & Drop | @dnd-kit |
| State | Zustand |
| Database | Supabase (PostgreSQL) |
| Date utils | date-fns |

---

## Scripts

```bash
npm run dev      # Start dev server at localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```
