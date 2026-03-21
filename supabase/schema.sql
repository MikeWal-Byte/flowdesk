-- FlowDesk Database Schema
-- Run this in your Supabase SQL editor at: https://supabase.com/dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS (custom auth — NOT Supabase Auth)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name    TEXT        NOT NULL,
  last_name     TEXT        NOT NULL,
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  is_admin      BOOLEAN     DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ─────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  color       TEXT        DEFAULT '#7c3aed',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  user_id     UUID        REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- PROJECT CARDS (Kanban cards)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_cards (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id  UUID        REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  due_date    DATE,
  priority    INTEGER     DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  column_id   TEXT        DEFAULT 'not-started'
                          CHECK (column_id IN ('not-started','in-progress','completed','on-hold')),
  position    INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CARD TO-DO ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_todos (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id    UUID        REFERENCES project_cards(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  completed  BOOLEAN     DEFAULT FALSE,
  position   INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DAILY PLANNER TASKS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_tasks (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  text       TEXT        NOT NULL,
  completed  BOOLEAN     DEFAULT FALSE,
  task_date  DATE        DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id    UUID        REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- CALENDAR EVENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  event_date  DATE        NOT NULL,
  event_type  TEXT        DEFAULT 'note'
                          CHECK (event_type IN ('note','project','task')),
  project_id  UUID        REFERENCES projects(id) ON DELETE SET NULL,
  card_id     UUID        REFERENCES project_cards(id) ON DELETE SET NULL,
  color       TEXT        DEFAULT '#7c3aed',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  user_id     UUID        REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title      TEXT        NOT NULL DEFAULT 'Untitled Note',
  content    TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id    UUID        REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_cards_project_id ON project_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_project_cards_column ON project_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_card_todos_card_id ON card_todos(card_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id        ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_id     ON daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id           ON notes(user_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_cards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_todos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes            ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app-level isolation via user_id filter in queries)
CREATE POLICY "allow_all_projects"        ON projects        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_project_cards"   ON project_cards   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_card_todos"      ON card_todos      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_daily_tasks"     ON daily_tasks     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notes"           ON notes           FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────
-- MIGRATIONS (run these ALTER TABLEs on existing DBs)
-- ─────────────────────────────────────────
-- Step 1: Add user_id columns to existing tables
-- ALTER TABLE projects        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
-- ALTER TABLE daily_tasks     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
-- ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
-- ALTER TABLE notes           ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Step 2: Backfill existing rows to MikeW after seeding
-- UPDATE projects        SET user_id = (SELECT id FROM users WHERE username = 'MikeW') WHERE user_id IS NULL;
-- UPDATE daily_tasks     SET user_id = (SELECT id FROM users WHERE username = 'MikeW') WHERE user_id IS NULL;
-- UPDATE calendar_events SET user_id = (SELECT id FROM users WHERE username = 'MikeW') WHERE user_id IS NULL;
-- UPDATE notes           SET user_id = (SELECT id FROM users WHERE username = 'MikeW') WHERE user_id IS NULL;

-- ─────────────────────────────────────────
-- MIGRATION: Calendar/Planner integration
-- Run BOTH statements in Supabase SQL editor
-- ─────────────────────────────────────────

-- Step 1: Add completed_date column.
-- Tracks when a task was actually finished; null means incomplete.
-- Incomplete tasks auto-roll forward in the app; completed tasks
-- appear on the calendar on completed_date, not task_date.
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS completed_date DATE;

-- Step 2: Backfill historical completed tasks.
-- Any task that was marked complete before this column existed will have
-- completed_date = NULL and would be invisible on the calendar.
-- This sets completed_date = created_at::date as the best available approximation.
UPDATE daily_tasks
SET completed_date = created_at::date
WHERE completed = true AND completed_date IS NULL;
