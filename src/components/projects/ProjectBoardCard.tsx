import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Flag, Check, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'
import type { Project } from '../../types'
import { PRIORITY_CONFIG } from '../../types'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  project: Project
}

export default function ProjectBoardCard({ project }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const { projectCards, deleteProject, updateCard, createCard } = useAppStore()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [newTask, setNewTask] = useState('')

  const style = { transform: CSS.Transform.toString(transform), transition }

  const pConfig = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG[2]

  // project_cards for this project are the checklist items
  const cards = projectCards.filter(c => c.project_id === project.id)
  const completedCards = cards.filter(c => c.column_id === 'completed')

  const handleToggleCard = (cardId: string, isCompleted: boolean) => {
    updateCard(cardId, { column_id: isCompleted ? 'not-started' : 'completed' })
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    await createCard(project.id, newTask.trim(), '', null, 2, 'not-started')
    setNewTask('')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-150 group
        ${isDragging ? 'opacity-40 shadow-2xl scale-105 rotate-1' : ''}
      `}
    >
      {/* Priority top bar */}
      <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: pConfig.color }} />

      <div className="p-3.5">
        {/* Title row */}
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
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {project.title}
              </p>
            </div>
            {project.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{project.description}</p>
            )}
          </div>

          <button
            onClick={() => setDeleteConfirm(true)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="mb-2.5 p-2.5 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs text-red-700 mb-2">Delete "{project.title}"? This cannot be undone.</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => { deleteProject(project.id); setDeleteConfirm(false) }}
                className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Priority badge */}
        <div className="mb-3">
          <Badge className={`${pConfig.bg} ${pConfig.text}`}>
            <Flag className="w-2.5 h-2.5 mr-0.5" />
            {pConfig.label}
          </Badge>
        </div>

        {/* Checklist — project_cards as task items */}
        <div className="border-t border-gray-50 pt-2.5">
          <button
            onClick={() => setChecklistOpen(o => !o)}
            className="flex items-center gap-1.5 w-full text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors mb-1.5"
          >
            {checklistOpen
              ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            }
            Tasks
            {cards.length > 0 && (
              <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full
                ${completedCards.length === cards.length && cards.length > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
                }`}
              >
                {completedCards.length}/{cards.length}
              </span>
            )}
          </button>

          {checklistOpen && (
            <>
              {/* Progress bar */}
              {cards.length > 0 && (
                <div className="w-full h-1 bg-gray-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(completedCards.length / cards.length) * 100}%` }}
                  />
                </div>
              )}

              {/* Task items */}
              <div className="space-y-1.5 mb-2">
                {cards.map(card => {
                  const done = card.column_id === 'completed'
                  return (
                    <div key={card.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCard(card.id, done)}
                        className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                          ${done
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                          }`}
                      >
                        {done && <Check className="w-2.5 h-2.5" />}
                      </button>
                      <span className={`text-xs flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                        {card.title}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Add task */}
              <form onSubmit={handleAddTask} className="flex gap-1.5">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Add task…"
                  className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newTask.trim()}
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
