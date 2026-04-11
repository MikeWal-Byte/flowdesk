import { useState, useEffect, useRef } from 'react'
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { Plus, Trash2, Check, CheckSquare, Sun, Calendar, Search, X, Mic, MicOff } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'

export default function PlannerPage() {
  const {
    dailyTasks, loadingTasks, allDailyTasks,
    fetchDailyTasks, fetchAllDailyTasks, createDailyTask, toggleDailyTask, deleteDailyTask,
  } = useAppStore()

  const [today, setToday] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newTask, setNewTask] = useState('')
  const [taskDate, setTaskDate] = useState(today)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setNewTask(prev => prev ? `${prev} ${transcript}` : transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  const todayRef = useRef(today)
  todayRef.current = today

  // Fetch tasks for the current day whenever `today` changes (initial load + midnight)
  useEffect(() => {
    fetchDailyTasks(today)
  }, [today])

  // Ensure allDailyTasks is populated (Layout also fetches this, but guard here too)
  useEffect(() => {
    fetchAllDailyTasks()
  }, [])

  // Detect midnight date change
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = format(new Date(), 'yyyy-MM-dd')
      if (newDate !== todayRef.current) setToday(newDate)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Keep taskDate in sync if user hasn't changed it
  useEffect(() => {
    setTaskDate(today)
  }, [today])

  const displayDate = format(parseISO(today), 'EEEE, MMMM d, yyyy')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    await createDailyTask(newTask.trim(), taskDate)
    setNewTask('')
    setTaskDate(today)
    setShowDatePicker(false)
  }

  const completedCount = dailyTasks.filter(t => t.completed).length
  const totalCount = dailyTasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // ── Search ──────────────────────────────────────────
  const isSearching = searchQuery.trim().length > 0
  const todayStart = startOfDay(new Date())

  const searchResults = isSearching
    ? allDailyTasks.filter(t =>
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const pastCompleted = searchResults.filter(
    t => t.completed && t.task_date < today
  ).sort((a, b) => (b.completed_date ?? b.task_date).localeCompare(a.completed_date ?? a.task_date))

  const todayResults = searchResults.filter(t => t.task_date === today)

  const upcoming = searchResults.filter(
    t => !t.completed && t.task_date > today
  ).sort((a, b) => a.task_date.localeCompare(b.task_date))

  // Also include completed tasks that were completed today but scheduled in past
  const completedToday = searchResults.filter(
    t => t.completed && t.task_date === today
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-300">
            <Sun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Planner</h1>
            <p className="text-sm text-gray-500">{displayDate}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search all tasks — past, today, future…"
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
          />
          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search results ── */}
      {isSearching ? (
        <div className="space-y-5">
          {searchResults.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tasks found</p>
              <p className="text-gray-400 text-sm">Try a different search term</p>
            </div>
          ) : (
            <>
              {/* Past completed */}
              {pastCompleted.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Past — Completed</p>
                  <div className="space-y-1.5">
                    {pastCompleted.map(task => (
                      <div key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                        <Check className="flex-shrink-0 w-4 h-4 text-emerald-500" />
                        <span className="flex-1 text-sm text-gray-500 line-through">{task.text}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                          {task.completed_date
                            ? format(parseISO(task.completed_date), 'MMM d, yyyy')
                            : format(parseISO(task.task_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today */}
              {todayResults.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Today</p>
                  <div className="space-y-1.5">
                    {todayResults.map(task => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border group transition-all
                          ${task.completed
                            ? 'bg-gray-50 border-gray-100 opacity-75'
                            : 'bg-white border-gray-100 shadow-sm hover:border-blue-200'
                          }`}
                      >
                        <button
                          onClick={() => toggleDailyTask(task.id, !task.completed)}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors p-2 box-content
                            ${task.completed
                              ? 'border-emerald-400 bg-emerald-400 text-white hover:bg-emerald-500'
                              : 'border-gray-300 hover:border-blue-600'
                            }`}
                        >
                          {task.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.text}
                        </span>
                        <span className="text-xs text-blue-600 font-medium flex-shrink-0">Today</span>
                        <button
                          onClick={() => deleteDailyTask(task.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">Upcoming</p>
                  <div className="space-y-1.5">
                    {upcoming.map(task => (
                      <div key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm group hover:border-blue-200 transition-all">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-200" />
                        <span className="flex-1 text-sm text-gray-700">{task.text}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                          {format(parseISO(task.task_date), 'MMM d, yyyy')}
                        </span>
                        <button
                          onClick={() => deleteDailyTask(task.id)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          {/* Progress card */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-4 lg:p-5 mb-5 lg:mb-6 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Today's Progress</span>
              <span className="text-blue-200 text-sm">{completedCount}/{totalCount} tasks</span>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {progress === 100 && totalCount > 0 && (
              <p className="text-sm mt-2 text-blue-100">🎉 All done for today!</p>
            )}
          </div>

          {/* Add task */}
          <div className="mb-6">
            <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Add a task for today…"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
              />
              <div className="flex gap-2 sm:contents">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(v => !v)}
                  className={`flex-1 sm:flex-none px-3 py-3 border rounded-xl text-sm transition-all shadow-sm ${
                    showDatePicker || taskDate !== today
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-400 hover:text-blue-700 hover:border-blue-400'
                  }`}
                  title="Pick a date"
                >
                  <Calendar className="w-4 h-4 mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                  className={`flex-1 sm:flex-none px-3 py-3 border rounded-xl text-sm transition-all shadow-sm ${
                    isListening
                      ? 'border-red-400 bg-red-50 text-red-600 animate-pulse'
                      : 'border-gray-200 bg-white text-gray-400 hover:text-blue-700 hover:border-blue-400'
                  }`}
                >
                  <span className="flex justify-center">
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </span>
                </button>
                <Button type="submit" disabled={!newTask.trim()} size="lg" className="flex-1 sm:flex-none justify-center">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
            {showDatePicker && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={taskDate}
                  min={today}
                  onChange={e => setTaskDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
                />
              </div>
            )}
            {taskDate !== today && (
              <p className="mt-1.5 text-xs text-blue-700 px-1">
                Adding to {format(parseISO(taskDate), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Task list */}
          {loadingTasks ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-blue-700 border-t-transparent rounded-full" />
            </div>
          ) : dailyTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No tasks yet</p>
              <p className="text-gray-400 text-sm">Add something to get started</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {/* Incomplete tasks */}
              {dailyTasks.filter(t => !t.completed).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 bg-white px-4 py-3.5 rounded-xl border border-gray-100 shadow-sm group hover:border-blue-200 transition-all"
                >
                  <button
                    onClick={() => toggleDailyTask(task.id, true)}
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-600 transition-colors p-2 box-content"
                  />
                  <span className="flex-1 text-sm text-gray-800">{task.text}</span>
                  <button
                    onClick={() => deleteDailyTask(task.id)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Completed tasks */}
              {dailyTasks.filter(t => t.completed).length > 0 && (
                <div className="pt-3">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-1 mb-2">Completed</p>
                  {dailyTasks.filter(t => t.completed).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 group mb-2 opacity-75"
                    >
                      <button
                        onClick={() => toggleDailyTask(task.id, false)}
                        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-400 flex items-center justify-center text-white transition-colors hover:bg-emerald-500 p-2 box-content"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-sm text-gray-400 line-through">{task.text}</span>
                      <button
                        onClick={() => deleteDailyTask(task.id)}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
