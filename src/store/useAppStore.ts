import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type {
  Project, ProjectCard, CardTodo,
  DailyTask, CalendarEvent, Note,
  ColumnId, Priority,
} from '../types'

interface AppState {
  // ── Projects ──────────────────────────────────
  projects: Project[]
  activeProjectId: string | null
  projectCards: ProjectCard[]
  cardTodos: CardTodo[]
  loadingProjects: boolean

  fetchProjects: () => Promise<void>
  createProject: (title: string, description: string, color: string) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setActiveProject: (id: string | null) => void

  fetchProjectCards: (projectId: string) => Promise<void>
  createCard: (projectId: string, title: string, description: string, dueDate: string | null, priority: Priority, column: ColumnId) => Promise<void>
  updateCard: (id: string, updates: Partial<ProjectCard>) => Promise<void>
  moveCard: (cardId: string, newColumn: ColumnId, newPosition: number) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  reorderCards: (cards: ProjectCard[]) => void

  fetchCardTodos: (cardId: string) => Promise<void>
  createTodo: (cardId: string, text: string) => Promise<void>
  toggleTodo: (id: string, completed: boolean) => Promise<void>
  deleteTodo: (id: string) => Promise<void>

  // ── Daily Planner ──────────────────────────────
  dailyTasks: DailyTask[]
  loadingTasks: boolean

  fetchDailyTasks: (date: string) => Promise<void>
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
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    set({ projects: data ?? [], loadingProjects: false })
  },

  createProject: async (title, description, color) => {
    const { data } = await supabase.from('projects').insert({ title, description, color }).select().single()
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
    set({ cardTodos: data ?? [] })
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
  loadingTasks: false,

  fetchDailyTasks: async (date) => {
    set({ loadingTasks: true })
    const { data } = await supabase.from('daily_tasks').select('*').eq('task_date', date).order('created_at')
    set({ dailyTasks: data ?? [], loadingTasks: false })
  },

  createDailyTask: async (text, date) => {
    const { data } = await supabase.from('daily_tasks').insert({ text, task_date: date }).select().single()
    if (data) set(s => ({ dailyTasks: [...s.dailyTasks, data] }))
  },

  toggleDailyTask: async (id, completed) => {
    await supabase.from('daily_tasks').update({ completed }).eq('id', id)
    set(s => ({ dailyTasks: s.dailyTasks.map(t => t.id === id ? { ...t, completed } : t) }))
  },

  deleteDailyTask: async (id) => {
    await supabase.from('daily_tasks').delete().eq('id', id)
    set(s => ({ dailyTasks: s.dailyTasks.filter(t => t.id !== id) }))
  },

  // ── Calendar ───────────────────────────────────
  calendarEvents: [],

  fetchCalendarEvents: async () => {
    const { data } = await supabase.from('calendar_events').select('*').order('event_date')
    set({ calendarEvents: data ?? [] })
  },

  createCalendarEvent: async (eventData) => {
    const { data } = await supabase.from('calendar_events').insert(eventData).select().single()
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
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
    set({ notes: data ?? [], loadingNotes: false })
  },

  createNote: async () => {
    const { data } = await supabase
      .from('notes')
      .insert({ title: 'Untitled Note', content: '' })
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
}))
