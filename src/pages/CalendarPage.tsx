import { useState, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, isSameDay, isSameMonth, isToday, parseISO,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAppStore } from '../store/useAppStore'
import type { CalendarEvent } from '../types'
import { PROJECT_COLORS } from '../types'

type ViewMode = 'month' | 'week' | 'day'

export default function CalendarPage() {
  const { calendarEvents, fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent } = useAppStore()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventColor, setNewEventColor] = useState(PROJECT_COLORS[0])
  const [newEventNotes, setNewEventNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCalendarEvents() }, [])

  const eventsForDate = (date: Date) =>
    calendarEvents.filter(e => isSameDay(parseISO(e.event_date), date))

  // Navigation
  const navigate = (dir: 1 | -1) => {
    if (viewMode === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1))
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setShowAddModal(true)
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
    setShowAddModal(false)
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
      key={event.id}
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
            {/* Day name headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-3 text-xs font-semibold text-gray-500 text-center uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 flex-1">
              {monthDays().map((day, i) => {
                const events = eventsForDate(day)
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
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map(ev => <EventDot key={ev.id} event={ev} />)}
                      {events.length > 3 && (
                        <p className="text-xs text-gray-400 pl-1">+{events.length - 3} more</p>
                      )}
                    </div>
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
                  <div className="space-y-1">
                    {eventsForDate(day).map(ev => <EventDot key={ev.id} event={ev} />)}
                  </div>
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
              <div className="space-y-2">
                {eventsForDate(currentDate).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No events today. Click + to add one.</p>
                ) : (
                  eventsForDate(currentDate).map(ev => (
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
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add event modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={`Add Event — ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : ''}`}>
        <form onSubmit={handleAddEvent} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              autoFocus
              value={newEventTitle}
              onChange={e => setNewEventTitle(e.target.value)}
              placeholder="e.g. Team meeting"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={newEventNotes}
              onChange={e => setNewEventNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this event…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Colour</label>
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
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !newEventTitle.trim()}>
              {saving ? 'Saving…' : 'Add Event'}
            </Button>
          </div>
        </form>
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
