export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  username: string
  isAdmin: boolean
}

export type Priority = 1 | 2 | 3

export type ColumnId = 'not-started' | 'in-progress' | 'completed' | 'on-hold'

export interface Project {
  id: string
  title: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
  user_id?: string | null
}

export interface ProjectCard {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string | null
  priority: Priority
  column_id: ColumnId
  position: number
  created_at: string
  updated_at: string
  card_todos?: CardTodo[]
}

export interface CardTodo {
  id: string
  card_id: string
  text: string
  completed: boolean
  position: number
  created_at: string
}

export interface DailyTask {
  id: string
  text: string
  completed: boolean
  task_date: string
  created_at: string
  user_id?: string | null
}

export type CalendarEventType = 'note' | 'project' | 'task'

export interface CalendarEvent {
  id: string
  title: string
  event_date: string
  event_type: CalendarEventType
  project_id: string | null
  card_id: string | null
  color: string
  notes: string | null
  created_at: string
  user_id?: string | null
}

export interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id?: string | null
}

export const COLUMNS: { id: ColumnId; label: string; color: string; bg: string }[] = [
  { id: 'not-started', label: 'Not Started', color: '#64748b', bg: 'bg-slate-100' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6', bg: 'bg-blue-50' },
  { id: 'completed',   label: 'Completed',   color: '#10b981', bg: 'bg-emerald-50' },
  { id: 'on-hold',     label: 'On Hold',     color: '#f59e0b', bg: 'bg-amber-50' },
]

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; text: string }> = {
  1: { label: 'P1', color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  2: { label: 'P2', color: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700' },
  3: { label: 'P3', color: '#ef4444', bg: 'bg-red-100',     text: 'text-red-700' },
}

export const PROJECT_COLORS = [
  '#7c3aed', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
]
