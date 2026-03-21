import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, isSameDay, isSameMonth, isToday, parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, Check } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAppStore } from '../store/useAppStore'
import type { CalendarEvent, DailyTask } from '../types'
import { PROJECT_COLORS } from '../types'

type ViewMode = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const {
    calendarEvents, fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent,
    allDailyTasks, fetchAllDailyTasks,
  } = useAppStore()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventColor, setNewEventColor] = useState(PROJECT_COLORS[0])
  const [newEventNotes, setNewEventNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCalendarEvents()
    fetchAllDailyTasks()
  }, [])

  const eventsForDate = (date: Date) =>
    calendarEvents.filter(e => isSameDay(parseISO(e.event_date), date))

  // Incomplete tasks show on their scheduled date; completed tasks on their completion date
  const tasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const incomplete = allDailyTasks.filter(t => !t.completed && t.task_date === dateStr)
    const completed = allDailyTasks.filter(t => t.completed && t.completed_date === dateStr)
    return { incomplete, completed }
  }

  // Navigation
  const navigate = (dir: 1 | -1) => {
    if (viewMode === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1))
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayModal(true)
    setShowAddForm(false)
    setNewEventTitle('')
    setNewEventNotes('')
    setNewEventColor(PROJECT_COLORS[0])
  }

  const handleCloseDayModal = () => {
    setShowDayModal(false)
    setShowAddForm(false)
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim() || !selectedDate) return
    setSaving(true)
    await createCalendarEvent({
      title: newEventTitle.trim(),
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      event_type: 'note',
      project_id: null,
      card_id: null,
      color: newEventColor,
      notes: newEventNotes.trim() || null,
    })
    setSaving(false)
    setNewEventTitle('')
    setNewEventNotes('')
    setNewEventColor(PROJECT_COLORS[0])
    setShowAddForm(false)
  }

  const headerLabel = () => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }

  // Month grid days
  const monthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }

  // Week days
  const weekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const EventDot = ({ event }: { event: CalendarEvent }) => (
    <div
      className="text-white text-xs px-1.5 py-0.5 rounded-md truncate font-medium flex items-center justify-between group"
      style={{ backgroundColor: event.color }}
    >
      <span className="truncate">{event.title}</span>
      <button
        onClick={e => { e.stopPropagation(); deleteCalendarEvent(event.id) }}
        className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-200 transition-opacity flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )

  const TaskDot = ({ task, completed }: { task: DailyTask; completed: boolean }) => (
    <div className={`text-xs px-1.5 py-0.5 rounded-md truncate flex items-center gap-1
      ${completed ? 'bg-gray-100' : 'bg-slate-100'}`}
    >
      {completed
        ? <Check className="w-2.5 h-2.5 flex-shrink-0 text-emerald-500" />
        : <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
      }
      <span className={`truncate ${completed ? 'text-gray-400 line-through' : 'text-slate-700'}`}>
        {task.text}
      </span>
    </div>
  )

  // Renders events + tasks for a cell, capped at maxItems total
  const CellItems = ({ date, maxItems = 3 }: { date: Date; maxItems?: number }) => {
    const events = eventsForDate(date)
    const { incomplete, completed } = tasksForDate(date)
    const allItems = [
      ...events.map(e => ({ type: 'event' as const, item: e })),
      ...incomplete.map(t => ({ type: 'task-pending' as const, item: t })),
      ...completed.map(t => ({ type: 'task-done' as const, item: t })),
    ]
    const visible = allItems.slice(0, maxItems)
    const overflow = allItems.length - visible.length
    return (
      <div className="space-y-0.5">
        {visible.map((entry) => {
          if (entry.type === 'event') return <EventDot key={entry.item.id} event={entry.item as CalendarEvent} />
          if (entry.type === 'task-pending') return <TaskDot key={entry.item.id} task={entry.item as DailyTask} completed={false} />
          return <TaskDot key={entry.item.id} task={entry.item as DailyTask} completed={true} />
        })}
        {overflow > 0 && (
          <p className="text-xs text-gray-400 pl-1">+{overflow} more</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-md shadow-slate-200">
            <CalendarDays className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['month', 'week', 'day'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                  ${viewMode === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[160px] text-center">{headerLabel()}</span>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button size="sm" onClick={() => setCurrentDate(new Date())} variant="secondary">Today</Button>
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        {/* Month view */}
        {viewMode === 'month' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1">
              {monthDays().map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentDate)
                return (
                  <div
                    key={i}
                    onClick={() => handleDayClick(day)}
                    className={`border-r border-b border-gray-50 p-1.5 cursor-pointer hover:bg-blue-50 transition-colors min-h-[90px]
                      ${!isCurrentMonth ? 'bg-gray-50/50' : ''}
                      ${isToday(day) ? 'bg-blue-50' : ''}
                    `}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm mb-1 font-medium
                      ${isToday(day) ? 'bg-blue-700 text-white' : isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>
                    <CellItems date={day} maxItems={3} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Week view */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-7">
              {weekDays().map((day, i) => (
                <div
                  key={i}
                  onClick={() => handleDayClick(day)}
                  className={`border-r border-gray-100 last:border-r-0 p-3 cursor-pointer hover:bg-blue-50 transition-colors min-h-[200px]
                    ${isToday(day) ? 'bg-blue-50' : ''}`}
                >
                  <div className="text-center mb-3">
                    <p className="text-xs font-medium text-gray-400 uppercase">{format(day, 'EEE')}</p>
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold mt-1
                      ${isToday(day) ? 'bg-blue-700 text-white' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <CellItems date={day} maxItems={10} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day view */}
        {viewMode === 'day' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {format(currentDate, 'EEEE, MMMM d')}
                  {isToday(currentDate) && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Today</span>}
                </h2>
                <Button size="sm" onClick={() => handleDayClick(currentDate)}>
                  <Plus className="w-3.5 h-3.5" /> Add event
                </Button>
              </div>

              {/* Events */}
              {eventsForDate(currentDate).length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Events</p>
                  {eventsForDate(currentDate).map(ev => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 group"
                      style={{ borderLeftColor: ev.color, borderLeftWidth: 4 }}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
                        {ev.notes && <p className="text-xs text-gray-500 mt-0.5">{ev.notes}</p>}
                      </div>
                      <button
                        onClick={() => deleteCalendarEvent(ev.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {(() => {
                const { incomplete, completed } = tasksForDate(currentDate)
                const hasTasks = incomplete.length > 0 || completed.length > 0
                if (!hasTasks) return null
                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tasks</p>
                    {incomplete.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                        <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{task.text}</span>
                      </div>
                    ))}
                    {completed.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 opacity-70">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-400 line-through">{task.text}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {eventsForDate(currentDate).length === 0 && (() => {
                const { incomplete, completed } = tasksForDate(currentDate)
                return incomplete.length === 0 && completed.length === 0
              })() && (
                <p className="text-gray-400 text-sm text-center py-8">No events or tasks. Click + to add one.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Day detail modal — shows tasks + events, with inline add-event form */}
      <Modal
        open={showDayModal}
        onClose={handleCloseDayModal}
        title={selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
      >
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {selectedDate && (() => {
            const events = eventsForDate(selectedDate)
            const { incomplete, completed } = tasksForDate(selectedDate)
            const hasAnything = events.length > 0 || incomplete.length > 0 || completed.length > 0

            return (
              <>
                {/* Calendar events */}
                {events.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Events</p>
                    <div className="space-y-2">
                      {events.map(ev => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 group"
                          style={{ borderLeftColor: ev.color, borderLeftWidth: 4 }}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{ev.title}</p>
                            {ev.notes && <p className="text-xs text-gray-500 mt-0.5">{ev.notes}</p>}
                          </div>
                          <button
                            onClick={() => deleteCalendarEvent(ev.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incomplete tasks scheduled for this day */}
                {incomplete.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Scheduled Tasks</p>
                    <div className="space-y-1.5">
                      {incomplete.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                          <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{task.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed tasks ticked off on this day */}
                {completed.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed Tasks</p>
                    <div className="space-y-1.5">
                      {completed.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 bg-emerald-50">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-gray-500 line-through">{task.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasAnything && !showAddForm && (
                  <p className="text-gray-400 text-sm text-center py-4">Nothing scheduled for this day.</p>
                )}

                {/* Add event form (toggled) */}
                {showAddForm ? (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">New Event</p>
                    <form onSubmit={handleAddEvent} className="space-y-3">
                      <input
                        autoFocus
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                        placeholder="Event title"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <textarea
                        value={newEventNotes}
                        onChange={e => setNewEventNotes(e.target.value)}
                        rows={2}
                        placeholder="Notes (optional)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {PROJECT_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewEventColor(c)}
                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newEventColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
                        <Button type="submit" disabled={saving || !newEventTitle.trim()}>
                          {saving ? 'Saving…' : 'Add Event'}
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className={hasAnything ? 'border-t border-gray-100 pt-4' : ''}>
                    <Button size="sm" onClick={() => setShowAddForm(true)}>
                      <Plus className="w-3.5 h-3.5" /> Add Event
                    </Button>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      </Modal>
    </div>
  )
}

// Inline icon to avoid import issue
function Trash2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
