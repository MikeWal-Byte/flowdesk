import { create } from 'zustand'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import type {
  Project, ProjectCard, CardTodo,
  DailyTask, CalendarEvent, Note,
  ColumnId, Priority,
} from '../types'

function getCurrentUserId(): string {
  const id = useAuthStore.getState().user?.id
  if (!id) throw new Error('Not authenticated')
  return id
}

interface AppState {
  // ── Projects ──────────────────────────────────
  projects: Project[]
  activeProjectId: string | null
  projectCards: ProjectCard[]
  cardTodos: CardTodo[]
  loadingProjects: boolean

  fetchProjects: () => Promise<void>
  createProject: (title: string, description: string, color: string, priority?: Priority) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string | null) => void

  fetchProjectCards: (projectId: string) => Promise<void>
  fetchAllProjectCards: () => Promise<void>
  createCard: (projectId: string, title: string, description: string, dueDate: string | null, priority: Priority, column: ColumnId) => Promise<void>
  updateCard: (id: string, updates: Partial<ProjectCard>) => Promise<void>
  moveCard: (cardId: string, newColumn: ColumnId, newPosition: number) => Promise<void>
  moveProject: (projectId: string, newColumn: ColumnId, newPosition: number) => Promise<void>
  saveColumnOrder: (updates: Array<{ id: string; position: number }>) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  reorderCards: (cards: ProjectCard[]) => void
  reorderProjects: (projects: Project[]) => void

  fetchCardTodos: (cardId: string) => Promise<void>
  createTodo: (cardId: string, text: string) => Promise<void>
  toggleTodo: (id: string, completed: boolean) => Promise<void>
  deleteTodo: (id: string) => Promise<void>

  // ── Daily Planner ──────────────────────────────
  dailyTasks: DailyTask[]
  allDailyTasks: DailyTask[]
  loadingTasks: boolean

  fetchDailyTasks: (date: string) => Promise<void>
  fetchAllDailyTasks: () => Promise<void>
  rolloverIncompleteTasks: () => Promise<void>
  createDailyTask: (text: string, date: string) => Promise<void>
  toggleDailyTask: (id: string, completed: boolean) => Promise<void>
  deleteDailyTask: (id: string) => Promise<void>

  // ── Calendar ───────────────────────────────────
  calendarEvents: CalendarEvent[]

  fetchCalendarEvents: () => Promise<void>
  createCalendarEvent: (data: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteCalendarEvent: (id: string) => Promise<void>

  // ── Notes ──────────────────────────────────────
  notes: Note[]
  activeNoteId: string | null
  loadingNotes: boolean

  fetchNotes: () => Promise<void>
  createNote: () => Promise<void>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setActiveNote: (id: string | null) => void

  // ── Auth helpers ───────────────────────────────
  clearData: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Projects ──────────────────────────────────
  projects: [],
  activeProjectId: null,
  projectCards: [],
  cardTodos: [],
  loadingProjects: false,

  fetchProjects: async () => {
    set({ loadingProjects: true })
    const userId = getCurrentUserId()
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    set({ projects: data ?? [], loadingProjects: false })
  },

  createProject: async (title, description, color, priority = 2) => {
    const user_id = getCurrentUserId()
    const position = get().projects.filter(p => p.column_id === 'not-started').length
    const { data, error } = await supabase
      .from('projects')
      .insert({ title, description, color, user_id, column_id: 'not-started', priority, position })
      .select()
      .single()
    if (error) {
      if (error.code === '42703' || error.message.toLowerCase().includes('column_id') || error.message.toLowerCase().includes('priority') || error.message.toLowerCase().includes('position')) {
        console.error('[FlowDesk] Migration required — projects table is missing board columns.\nRun in Supabase SQL editor:\n  ALTER TABLE projects ADD COLUMN IF NOT EXISTS column_id TEXT DEFAULT \'not-started\' CHECK (column_id IN (\'not-started\', \'in-progress\', \'completed\', \'on-hold\'));\n  ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 2 CHECK (priority IN (1, 2, 3));\n  ALTER TABLE projects ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;')
      } else {
        console.error('[FlowDesk] Failed to create project:', error.message)
      }
      return
    }
    if (data) set(s => ({ projects: [data, ...s.projects] }))
  },

  updateProject: async (id, updates) => {
    const { data } = await supabase.from('projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (data) set(s => ({ projects: s.projects.map(p => p.id === id ? data : p) }))
  },

  deleteProject: async (id) => {
    await supabase.from('projects').delete().eq('id', id)
    set(s => ({
      projects: s.projects.filter(p => p.id !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      projectCards: s.projectCards.filter(c => c.project_id !== id),
    }))
  },

  setActiveProject: (id) => set({ activeProjectId: id, projectCards: [], cardTodos: [] }),

  fetchProjectCards: async (projectId) => {
    const { data } = await supabase
      .from('project_cards')
      .select('*')
      .eq('project_id', projectId)
      .order('position')
    set({ projectCards: data ?? [] })
  },

  fetchAllProjectCards: async () => {
    const projectIds = get().projects.map(p => p.id)
    if (projectIds.length === 0) { set({ projectCards: [] }); return }
    const { data } = await supabase
      .from('project_cards')
      .select('*')
      .in('project_id', projectIds)
      .order('position')
    set({ projectCards: data ?? [] })
  },

  moveProject: async (projectId, newColumn, newPosition) => {
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId ? { ...p, column_id: newColumn, position: newPosition } : p
      ),
    }))
    await supabase
      .from('projects')
      .update({ column_id: newColumn, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', projectId)
  },

  reorderProjects: (projects) => set({ projects }),

  saveColumnOrder: async (updates) => {
    await Promise.all(
      updates.map(({ id, position }) =>
        supabase.from('projects').update({ position }).eq('id', id)
      )
    )
  },

  createCard: async (projectId, title, description, dueDate, priority, column) => {
    const cards = get().projectCards.filter(c => c.column_id === column)
    const position = cards.length
    const { data } = await supabase
      .from('project_cards')
      .insert({ project_id: projectId, title, description, due_date: dueDate, priority, column_id: column, position })
      .select()
      .single()
    if (data) set(s => ({ projectCards: [...s.projectCards, data] }))
  },

  updateCard: async (id, updates) => {
    const { data } = await supabase
      .from('project_cards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (data) set(s => ({ projectCards: s.projectCards.map(c => c.id === id ? data : c) }))
  },

  moveCard: async (cardId, newColumn, newPosition) => {
    set(s => ({
      projectCards: s.projectCards.map(c =>
        c.id === cardId ? { ...c, column_id: newColumn, position: newPosition } : c
      ),
    }))
    await supabase
      .from('project_cards')
      .update({ column_id: newColumn, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', cardId)
  },

  deleteCard: async (id) => {
    await supabase.from('project_cards').delete().eq('id', id)
    set(s => ({ projectCards: s.projectCards.filter(c => c.id !== id) }))
  },

  reorderCards: (cards) => set({ projectCards: cards }),

  fetchCardTodos: async (cardId) => {
    const { data } = await supabase.from('card_todos').select('*').eq('card_id', cardId).order('position')
    if (data) set(s => ({
      cardTodos: [...s.cardTodos.filter(t => t.card_id !== cardId), ...data],
    }))
  },

  createTodo: async (cardId, text) => {
    const todos = get().cardTodos.filter(t => t.card_id === cardId)
    const { data } = await supabase
      .from('card_todos')
      .insert({ card_id: cardId, text, position: todos.length })
      .select()
      .single()
    if (data) set(s => ({ cardTodos: [...s.cardTodos, data] }))
  },

  toggleTodo: async (id, completed) => {
    await supabase.from('card_todos').update({ completed }).eq('id', id)
    set(s => ({ cardTodos: s.cardTodos.map(t => t.id === id ? { ...t, completed } : t) }))
  },

  deleteTodo: async (id) => {
    await supabase.from('card_todos').delete().eq('id', id)
    set(s => ({ cardTodos: s.cardTodos.filter(t => t.id !== id) }))
  },

  // ── Daily Planner ──────────────────────────────
  dailyTasks: [],
  allDailyTasks: [],
  loadingTasks: false,

  fetchDailyTasks: async (date) => {
    set({ loadingTasks: true })
    const userId = getCurrentUserId()
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('task_date', date)
      .eq('user_id', userId)
      .order('created_at')
    set({ dailyTasks: data ?? [], loadingTasks: false })
  },

  fetchAllDailyTasks: async () => {
    const userId = getCurrentUserId()
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('task_date')
    set({ allDailyTasks: data ?? [] })
  },

  rolloverIncompleteTasks: async () => {
    const userId = getCurrentUserId()
    const today = format(new Date(), 'yyyy-MM-dd')
    // Move all incomplete past tasks to today
    await supabase
      .from('daily_tasks')
      .update({ task_date: today })
      .eq('user_id', userId)
      .eq('completed', false)
      .lt('task_date', today)
  },

  createDailyTask: async (text, date) => {
    const user_id = getCurrentUserId()
    let { data, error } = await supabase
      .from('daily_tasks')
      .insert({ text, task_date: date, completed_date: null, user_id })
      .select()
      .single()
    if (error) {
      if (error.code === '42703' || error.message.toLowerCase().includes('completed_date')) {
        // completed_date column doesn't exist yet — retry without it
        const result = await supabase
          .from('daily_tasks')
          .insert({ text, task_date: date, user_id })
          .select()
          .single()
        data = result.data
        error = result.error
      }
      if (error) {
        console.error('[FlowDesk] Failed to create task:', error.message)
        return
      }
    }
    if (data) set(s => ({ dailyTasks: [...s.dailyTasks, data!], allDailyTasks: [...s.allDailyTasks, data!] }))
  },

  toggleDailyTask: async (id, completed) => {
    const completed_date = completed ? format(new Date(), 'yyyy-MM-dd') : null
    // Optimistic update so the UI responds immediately
    const patch = (t: DailyTask) => t.id === id ? { ...t, completed, completed_date } : t
    set(s => ({
      dailyTasks: s.dailyTasks.map(patch),
      allDailyTasks: s.allDailyTasks.map(patch),
    }))
    const { error } = await supabase.from('daily_tasks').update({ completed, completed_date }).eq('id', id)
    if (error) {
      if (error.code === '42703' || error.message.toLowerCase().includes('completed_date')) {
        // completed_date column doesn't exist yet — retry with just the completed flag
        const { error: error2 } = await supabase.from('daily_tasks').update({ completed }).eq('id', id)
        if (error2) {
          console.error('[FlowDesk] Failed to toggle task:', error2.message)
          // Revert optimistic update
          const revert = (t: DailyTask) => t.id === id ? { ...t, completed: !completed, completed_date: null } : t
          set(s => ({ dailyTasks: s.dailyTasks.map(revert), allDailyTasks: s.allDailyTasks.map(revert) }))
        }
      } else {
        console.error('[FlowDesk] Failed to toggle task:', error.message)
        // Revert optimistic update
        const revert = (t: DailyTask) => t.id === id ? { ...t, completed: !completed, completed_date: null } : t
        set(s => ({ dailyTasks: s.dailyTasks.map(revert), allDailyTasks: s.allDailyTasks.map(revert) }))
      }
    }
  },

  deleteDailyTask: async (id) => {
    await supabase.from('daily_tasks').delete().eq('id', id)
    set(s => ({
      dailyTasks: s.dailyTasks.filter(t => t.id !== id),
      allDailyTasks: s.allDailyTasks.filter(t => t.id !== id),
    }))
  },

  // ── Calendar ───────────────────────────────────
  calendarEvents: [],

  fetchCalendarEvents: async () => {
    const userId = getCurrentUserId()
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date')
    set({ calendarEvents: data ?? [] })
  },

  createCalendarEvent: async (eventData) => {
    const user_id = getCurrentUserId()
    const { data } = await supabase.from('calendar_events').insert({ ...eventData, user_id }).select().single()
    if (data) set(s => ({ calendarEvents: [...s.calendarEvents, data] }))
  },

  updateCalendarEvent: async (id, updates) => {
    const { data } = await supabase.from('calendar_events').update(updates).eq('id', id).select().single()
    if (data) set(s => ({ calendarEvents: s.calendarEvents.map(e => e.id === id ? data : e) }))
  },

  deleteCalendarEvent: async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    set(s => ({ calendarEvents: s.calendarEvents.filter(e => e.id !== id) }))
  },

  // ── Notes ──────────────────────────────────────
  notes: [],
  activeNoteId: null,
  loadingNotes: false,

  fetchNotes: async () => {
    set({ loadingNotes: true })
    const userId = getCurrentUserId()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    set({ notes: data ?? [], loadingNotes: false })
  },

  createNote: async () => {
    const user_id = getCurrentUserId()
    const { data } = await supabase
      .from('notes')
      .insert({ title: 'Untitled Note', content: '', user_id })
      .select()
      .single()
    if (data) {
      set(s => ({ notes: [data, ...s.notes], activeNoteId: data.id }))
    }
  },

  updateNote: async (id, updates) => {
    const payload = { ...updates, updated_at: new Date().toISOString() }
    await supabase.from('notes').update(payload).eq('id', id)
    set(s => ({
      notes: s.notes
        .map(n => n.id === id ? { ...n, ...payload } : n)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    }))
  },

  deleteNote: async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    set(s => ({
      notes: s.notes.filter(n => n.id !== id),
      activeNoteId: s.activeNoteId === id ? (s.notes.find(n => n.id !== id)?.id ?? null) : s.activeNoteId,
    }))
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  // ── Auth helpers ───────────────────────────────
  clearData: () => set({
    projects: [], projectCards: [], cardTodos: [],
    dailyTasks: [], allDailyTasks: [], calendarEvents: [], notes: [],
    activeProjectId: null, activeNoteId: null,
  }),
}))
