import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Flag } from 'lucide-react'
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
  const { updateCard } = useAppStore()
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editingMeta, setEditingMeta] = useState(false)

  useEffect(() => {
    if (card) {
      setEditTitle(card.title)
      setEditDesc(card.description ?? '')
    }
  }, [card?.id])

  if (!card) return null

  const pConfig = PRIORITY_CONFIG[card.priority]
  const col = COLUMNS.find(c => c.id === card.column_id)

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
              {pConfig.label} — {card.priority === 1 ? 'High' : card.priority === 2 ? 'Medium' : 'Low'}
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
      </div>
    </Modal>
  )
}
