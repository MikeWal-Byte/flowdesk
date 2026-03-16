import { useEffect, useRef, useCallback, useState } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2, StickyNote, FileText } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'

export default function NotesPage() {
  const {
    notes, loadingNotes, activeNoteId,
    fetchNotes, createNote, updateNote, deleteNote, setActiveNote,
  } = useAppStore()

  const [titleValue, setTitleValue] = useState('')
  const [contentValue, setContentValue] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeNote = notes.find(n => n.id === activeNoteId)

  useEffect(() => { fetchNotes() }, [])

  useEffect(() => {
    if (activeNote) {
      setTitleValue(activeNote.title)
      setContentValue(activeNote.content)
    }
  }, [activeNoteId])

  const scheduleSave = useCallback((id: string, updates: { title?: string; content?: string }) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateNote(id, updates), 500)
  }, [updateNote])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitleValue(val)
    if (activeNoteId) scheduleSave(activeNoteId, { title: val })
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContentValue(val)
    if (activeNoteId) scheduleSave(activeNoteId, { content: val })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    await deleteNote(id)
  }

  return (
    <div className="flex h-full">
      {/* Notes list sidebar */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <StickyNote className="w-4 h-4" />
              <span className="font-semibold text-sm">Notes</span>
            </div>
            <Button size="sm" variant="ghost" onClick={createNote} className="!p-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {loadingNotes ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-xs text-gray-500">No notes yet</p>
              <button onClick={createNote} className="mt-2 text-xs text-blue-700 hover:underline">
                Create a note
              </button>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className={`group px-3 py-2.5 rounded-xl cursor-pointer transition-all
                  ${activeNoteId === note.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-sm font-medium truncate flex-1 ${activeNoteId === note.id ? 'text-blue-800' : 'text-gray-800'}`}>
                    {note.title || 'Untitled'}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(note.id) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {note.content ? note.content.slice(0, 50) : 'Empty note'}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {format(new Date(note.updated_at), 'MMM d')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Note editor */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeNote ? (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6 gap-4">
            {/* Title */}
            <input
              value={titleValue}
              onChange={handleTitleChange}
              placeholder="Note title"
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 focus:ring-0"
            />
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <FileText className="w-3.5 h-3.5" />
              Last saved {format(new Date(activeNote.updated_at), 'MMM d, yyyy • h:mm a')}
            </div>
            {/* Content */}
            <textarea
              value={contentValue}
              onChange={handleContentChange}
              placeholder="Start writing…"
              className="flex-1 text-gray-700 text-sm leading-relaxed bg-transparent border-none outline-none resize-none placeholder-gray-300 focus:ring-0 min-h-[400px]"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
              <StickyNote className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your scratchpad</h2>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">
              Create named notes that auto-save as you type. Perfect for ideas, meeting notes, and quick thoughts.
            </p>
            <Button onClick={createNote}>
              <Plus className="w-4 h-4" /> New Note
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
