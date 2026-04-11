import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar, Flag, GripVertical, Check, Plus, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import Badge from '../ui/Badge'
import type { ProjectCard as IProjectCard } from '../../types'
import { PRIORITY_CONFIG } from '../../types'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  card: IProjectCard
  onClick: () => void
}

export default function ProjectCard({ card, onClick }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const { cardTodos, toggleTodo, deleteTodo, createTodo, deleteCard } = useAppStore()
  const [newTodo, setNewTodo] = useState('')
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const pConfig = PRIORITY_CONFIG[card.priority] ?? PRIORITY_CONFIG[2]
  const todos = cardTodos.filter(t => t.card_id === card.id)
  const completedCount = todos.filter(t => t.completed).length

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    await createTodo(card.id, newTodo.trim())
    setNewTodo('')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-shadow duration-150 group
        ${isDragging ? 'opacity-30' : ''}
      `}
    >
      {/* Priority bar */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: pConfig.color }}
      />

      <div className="p-3.5">
        {/* Delete confirmation overlay */}
        {confirmDelete && (
          <div className="mb-2 px-2 py-1.5 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-red-700 mb-1.5">Delete this card?</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => deleteCard(card.id)}
                className="px-2 py-0.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-xs bg-white text-gray-600 rounded-md hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Title row with drag handle */}
        <div className="flex items-start gap-2 mb-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              onClick={onClick}
              className="text-sm font-semibold text-gray-900 leading-tight mb-1 truncate cursor-pointer hover:text-blue-700 transition-colors"
            >
              {card.title}
            </p>
            {card.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{card.description}</p>
            )}
          </div>
          {/* Card delete button */}
          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="mt-0.5 flex-shrink-0 p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="Delete card"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge className={`${pConfig.bg} ${pConfig.text}`}>
            <Flag className="w-2.5 h-2.5 mr-0.5" />
            {pConfig.label}
          </Badge>
          {card.due_date && (
            <Badge className="bg-blue-50 text-blue-600">
              <Calendar className="w-2.5 h-2.5 mr-0.5" />
              {format(new Date(card.due_date), 'MMM d')}
            </Badge>
          )}
        </div>

        {/* Checklist section */}
        <div className="border-t border-gray-50 pt-2.5">
          <button
            onClick={() => setChecklistOpen(o => !o)}
            className="flex items-center gap-1.5 w-full text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1.5"
          >
            {checklistOpen
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            }
            Checklist
            {todos.length > 0 && (
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full
                ${completedCount === todos.length && todos.length > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
                }`}
              >
                {completedCount}/{todos.length}
              </span>
            )}
          </button>

          {checklistOpen && (
            <>
              {/* Progress bar */}
              {todos.length > 0 && (
                <div className="w-full h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(completedCount / todos.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Todo items */}
              <div className="space-y-1.5 mb-2">
                {todos.map(todo => (
                  <div key={todo.id} className="flex items-center gap-2 group/todo">
                    <button
                      onClick={() => toggleTodo(todo.id, !todo.completed)}
                      className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                        ${todo.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                        }`}
                    >
                      {todo.completed && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <span className={`text-xs flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="opacity-0 group-hover/todo:opacity-100 p-0.5 hover:text-red-500 text-gray-400 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add todo */}
              <form onSubmit={handleAddTodo} className="flex gap-1.5">
                <input
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  placeholder="Add to-do…"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newTodo.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
