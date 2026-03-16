import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useAppStore } from '../../store/useAppStore'
import type { ColumnId, Priority } from '../../types'
import { COLUMNS, PRIORITY_CONFIG } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
  defaultColumn?: ColumnId
}

export default function CreateCardModal({ open, onClose, projectId, defaultColumn = 'not-started' }: Props) {
  const createCard = useAppStore(s => s.createCard)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>(2)
  const [column, setColumn] = useState<ColumnId>(defaultColumn)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await createCard(projectId, title.trim(), description.trim(), dueDate || null, priority, column)
    setSaving(false)
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority(2)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Card">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Card title"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
            <select
              value={column}
              onChange={e => setColumn(e.target.value as ColumnId)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {COLUMNS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <div className="flex gap-2">
            {([1, 2, 3] as Priority[]).map(p => {
              const cfg = PRIORITY_CONFIG[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                    ${priority === p ? `${cfg.bg} ${cfg.text} border-current` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {cfg.label} — {p === 1 ? 'Highest' : p === 2 ? 'Medium' : 'Lowest'}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? 'Adding…' : 'Add Card'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
