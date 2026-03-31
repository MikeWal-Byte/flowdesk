import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import CardDetail from './CardDetail'
import { useAppStore } from '../../store/useAppStore'
import type { ProjectCard, ColumnId } from '../../types'
import { COLUMNS } from '../../types'
import { GripVertical } from 'lucide-react'

interface Props {
  projectId: string
}

export default function KanbanBoard({ projectId }: Props) {
  const { projectCards, moveCard, reorderCards, fetchCardTodos } = useAppStore()
  const [activeCard, setActiveCard] = useState<ProjectCard | null>(null)
  const [detailCard, setDetailCard] = useState<ProjectCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const cards = projectCards.filter(c => c.project_id === projectId)

  // Pre-fetch todos for all visible cards so they render inline
  const cardIds = cards.map(c => c.id).sort().join(',')
  useEffect(() => {
    cards.forEach(card => fetchCardTodos(card.id))
  }, [cardIds])

  const getColumnCards = (colId: ColumnId) =>
    cards.filter(c => c.column_id === colId).sort((a, b) => a.position - b.position)

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeCardId = active.id as string
    const overId = over.id as string

    const activeCard = cards.find(c => c.id === activeCardId)
    if (!activeCard) return

    // Check if dropped over a column
    const overColumn = COLUMNS.find(c => c.id === overId)
    if (overColumn && activeCard.column_id !== overColumn.id) {
      const updated = projectCards.map(c =>
        c.id === activeCardId ? { ...c, column_id: overColumn.id as ColumnId } : c
      )
      reorderCards(updated)
      return
    }

    // Dropped over another card
    const overCard = cards.find(c => c.id === overId)
    if (!overCard) return

    if (activeCard.column_id !== overCard.column_id) {
      const updated = projectCards.map(c =>
        c.id === activeCardId ? { ...c, column_id: overCard.column_id } : c
      )
      reorderCards(updated)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeCardId = active.id as string
    const overId = over.id as string
    const card = projectCards.find(c => c.id === activeCardId)
    if (!card) return

    // Determine the target column
    const overColumn = COLUMNS.find(c => c.id === overId)
    const overCard = projectCards.find(c => c.id === overId)
    const targetColumn = (overColumn?.id ?? overCard?.column_id ?? card.column_id) as ColumnId

    const colCards = projectCards
      .filter(c => c.column_id === targetColumn)
      .sort((a, b) => a.position - b.position)

    const oldIndex = colCards.findIndex(c => c.id === activeCardId)
    const newIndex = overCard ? colCards.findIndex(c => c.id === overId) : colCards.length

    let reordered = colCards
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(colCards, oldIndex, newIndex)
    } else if (oldIndex === -1) {
      // Card moved from another column
      reordered = [...colCards.filter(c => c.id !== activeCardId), { ...card, column_id: targetColumn }]
      if (newIndex !== -1 && newIndex < reordered.length) {
        reordered = [
          ...reordered.slice(0, newIndex),
          { ...card, column_id: targetColumn },
          ...reordered.slice(newIndex).filter(c => c.id !== activeCardId),
        ]
      }
    }

    // Update positions
    const finalPosition = reordered.findIndex(c => c.id === activeCardId)
    await moveCard(activeCardId, targetColumn, finalPosition >= 0 ? finalPosition : 0)

    // Update all positions in the column
    const updates = reordered.map((c, i) => ({ ...c, position: i }))
    const otherCards = projectCards.filter(c => c.column_id !== targetColumn || c.id === activeCardId ? false : true)
    reorderCards([
      ...projectCards.filter(c => c.column_id !== targetColumn),
      ...updates,
    ])
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-4 overflow-x-auto h-full pb-6">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              cards={getColumnCards(col.id)}
              projectId={projectId}
              onCardClick={setDetailCard}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && (
            <div className="bg-white rounded-xl border-2 border-blue-300 shadow-2xl p-3.5 w-[264px] rotate-1 opacity-95 cursor-grabbing">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900 truncate">{activeCard.title}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />
    </>
  )
}
