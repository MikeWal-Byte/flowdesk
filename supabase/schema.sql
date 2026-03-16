-- FlowDesk Database Schema
-- Run this in your Supabase SQL editor at: https://supabase.com/dashboard

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- PROJECTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  color       TEXT        DEFAULT '#7c3aed',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  title      TEXT        NOT NULL DEFAULT 'Untitled Note',
  content    TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_project_cards_project_id ON project_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_project_cards_column ON project_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_card_todos_card_id ON card_todos(card_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (disable for single-user / enable later for auth)
-- ─────────────────────────────────────────
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_cards    ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_todos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes            ENABLE ROW LEVEL SECURITY;

-- Allow all operations without auth (single-user mode)
-- Replace these with user-scoped policies if you add authentication
CREATE POLICY "allow_all_projects"        ON projects        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_project_cards"   ON project_cards   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_card_todos"      ON card_todos      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_daily_tasks"     ON daily_tasks     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notes"           ON notes           FOR ALL USING (true) WITH CHECK (true);
