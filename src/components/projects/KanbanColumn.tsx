import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import ProjectCard from './ProjectCard'
import CreateCardModal from './CreateCardModal'
import type { ProjectCard as IProjectCard, ColumnId } from '../../types'
import { COLUMNS } from '../../types'

interface Props {
  columnId: ColumnId
  cards: IProjectCard[]
  projectId: string
  onCardClick: (card: IProjectCard) => void
}

export default function KanbanColumn({ columnId, cards, projectId, onCardClick }: Props) {
  const [addingCard, setAddingCard] = useState(false)
  const colConfig = COLUMNS.find(c => c.id === columnId)!

  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <>
      <div
        className={`flex flex-col w-72 flex-shrink-0 rounded-2xl transition-colors duration-150
          ${isOver ? 'bg-blue-50' : 'bg-slate-100/80'}`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: colConfig.color }}
            />
            <span className="text-sm font-semibold text-gray-700">{colConfig.label}</span>
            <span className="text-xs bg-white text-gray-500 font-medium px-1.5 py-0.5 rounded-full shadow-sm">
              {cards.length}
            </span>
          </div>
          <button
            onClick={() => setAddingCard(true)}
            className="w-6 h-6 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cards */}
        <div
          ref={setNodeRef}
          className={`flex-1 px-3 pb-3 space-y-2 min-h-16 transition-colors rounded-xl
            ${isOver ? 'bg-blue-100/60' : ''}`}
        >
          <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map(card => (
              <ProjectCard
                key={card.id}
                card={card}
                onClick={() => onCardClick(card)}
              />
            ))}
          </SortableContext>

          {cards.length === 0 && !isOver && (
            <div className="flex items-center justify-center h-16 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              Drop here
            </div>
          )}
        </div>
      </div>

      <CreateCardModal
        open={addingCard}
        onClose={() => setAddingCard(false)}
        projectId={projectId}
        defaultColumn={columnId}
      />
    </>
  )
}
