import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, Check, Calendar, Flag, AlignLeft } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { useAppStore } from '../../store/useAppStore'
import type { ProjectCard } from '../../types'
import { PRIORITY_CONFIG, COLUMNS } from '../../types'

interface Props {
  card: ProjectCard | null
  onClose: () => void
}

export default function CardDetail({ card, onClose }: Props) {
  const { cardTodos, fetchCardTodos, createTodo, toggleTodo, deleteTodo, updateCard } = useAppStore()
  const [newTodo, setNewTodo] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editingMeta, setEditingMeta] = useState(false)

  useEffect(() => {
    if (card) {
      fetchCardTodos(card.id)
      setEditTitle(card.title)
      setEditDesc(card.description ?? '')
    }
  }, [card?.id])

  if (!card) return null

  const todos = cardTodos.filter(t => t.card_id === card.id)
  const completed = todos.filter(t => t.completed).length
  const pConfig = PRIORITY_CONFIG[card.priority]
  const col = COLUMNS.find(c => c.id === card.column_id)

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    await createTodo(card.id, newTodo.trim())
    setNewTodo('')
  }

  const handleSaveMeta = async () => {
    await updateCard(card.id, { title: editTitle, description: editDesc })
    setEditingMeta(false)
  }

  return (
    <Modal open={!!card} onClose={onClose} title="" size="lg">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="space-y-2">
          {editingMeta ? (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full text-xl font-bold border-b-2 border-blue-500 focus:outline-none pb-1"
              />
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add a description…"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMeta}>Save</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingMeta(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer group" onClick={() => setEditingMeta(true)}>
              <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-800 transition-colors">
                {card.title}
              </h2>
              {card.description && (
                <p className="text-sm text-gray-500 mt-1">{card.description}</p>
              )}
              {!card.description && (
                <p className="text-sm text-gray-400 mt-1 italic">Click to add a description…</p>
              )}
            </div>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className={`${pConfig.bg} ${pConfig.text}`}>
              <Flag className="w-3 h-3 mr-1" />
              {pConfig.label} — {card.priority === 1 ? 'Highest' : card.priority === 2 ? 'Medium' : 'Lowest'}
            </Badge>
            {col && (
              <Badge className="bg-gray-100 text-gray-600">
                {col.label}
              </Badge>
            )}
            {card.due_date && (
              <Badge className="bg-blue-50 text-blue-700">
                <Calendar className="w-3 h-3 mr-1" />
                Due {format(new Date(card.due_date), 'MMM d, yyyy')}
              </Badge>
            )}
          </div>
        </div>

        {/* To-do checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Checklist</h3>
              {todos.length > 0 && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {completed}/{todos.length}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {todos.length > 0 && (
            <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${todos.length > 0 ? (completed / todos.length) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="space-y-2 mb-3">
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => toggleTodo(todo.id, !todo.completed)}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${todo.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 hover:border-blue-500'
                    }`}
                >
                  {todo.completed && <Check className="w-3 h-3" />}
                </button>
                <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTodo} className="flex gap-2">
            <input
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="Add a to-do item…"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" disabled={!newTodo.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  )
}
