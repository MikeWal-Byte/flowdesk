import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { Calendar, Flag, CheckSquare, GripVertical } from 'lucide-react'
import Badge from '../ui/Badge'
import type { ProjectCard as IProjectCard } from '../../types'
import { PRIORITY_CONFIG } from '../../types'

interface Props {
  card: IProjectCard
  onClick: () => void
  todoCount?: number
  completedTodoCount?: number
}

export default function ProjectCard({ card, onClick, todoCount = 0, completedTodoCount = 0 }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const pConfig = PRIORITY_CONFIG[card.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer group
        ${isDragging ? 'opacity-40 shadow-2xl scale-105 rotate-1' : ''}
      `}
    >
      {/* Drag handle + priority bar */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: pConfig.color }}
      />

      <div className="p-3.5">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0" onClick={onClick}>
            <p className="text-sm font-semibold text-gray-900 leading-tight mb-1 truncate">
              {card.title}
            </p>
            {card.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{card.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
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

              {todoCount > 0 && (
                <Badge className={completedTodoCount === todoCount ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}>
                  <CheckSquare className="w-2.5 h-2.5 mr-0.5" />
                  {completedTodoCount}/{todoCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
