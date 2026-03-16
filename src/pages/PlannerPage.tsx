import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { Plus, Trash2, Check, CheckSquare, Sun, Calendar } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'

export default function PlannerPage() {
  const { dailyTasks, loadingTasks, fetchDailyTasks, createDailyTask, toggleDailyTask, deleteDailyTask } = useAppStore()
  const [newTask, setNewTask] = useState('')
  const today = format(new Date(), 'yyyy-MM-dd')
  const displayDate = format(new Date(), 'EEEE, MMMM d, yyyy')
  const [taskDate, setTaskDate] = useState(today)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => { fetchDailyTasks(today) }, [today])

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
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

      {/* Progress card */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-5 mb-6 text-white shadow-lg shadow-blue-200">
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
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Add a task for today…"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
          />
          <button
            type="button"
            onClick={() => setShowDatePicker(v => !v)}
            className={`px-3 py-3 border rounded-xl text-sm transition-all shadow-sm ${
              showDatePicker || taskDate !== today
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-400 hover:text-blue-700 hover:border-blue-400'
            }`}
            title="Pick a date"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <Button type="submit" disabled={!newTask.trim()} size="lg">
            <Plus className="w-4 h-4" />
          </Button>
        </form>
        {showDatePicker && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              value={taskDate}
              min={today}
              onChange={e => setTaskDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white shadow-sm"
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
        <div className="space-y-2">
          {/* Incomplete tasks */}
          {dailyTasks.filter(t => !t.completed).map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-white px-4 py-3.5 rounded-xl border border-gray-100 shadow-sm group hover:border-blue-200 transition-all"
            >
              <button
                onClick={() => toggleDailyTask(task.id, true)}
                className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-blue-600 transition-colors"
              />
              <span className="flex-1 text-sm text-gray-800">{task.text}</span>
              <button
                onClick={() => deleteDailyTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
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
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-400 flex items-center justify-center text-white transition-colors hover:bg-emerald-500"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-sm text-gray-400 line-through">{task.text}</span>
                  <button
                    onClick={() => deleteDailyTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
