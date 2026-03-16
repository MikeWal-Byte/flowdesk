import { X } from 'lucide-react'
import PlannerPage from '../../pages/PlannerPage'
import CalendarPage from '../../pages/CalendarPage'
import NotesPage from '../../pages/NotesPage'

type SecondaryView = 'planner' | 'calendar' | 'notes'

const TABS: { id: SecondaryView; label: string }[] = [
  { id: 'planner',  label: 'Planner' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'notes',    label: 'Notes' },
]

interface SecondaryPanelProps {
  view: SecondaryView
  onViewChange: (v: SecondaryView) => void
  onClose: () => void
  style?: React.CSSProperties
}

export default function SecondaryPanel({ view, onViewChange, onClose, style }: SecondaryPanelProps) {
  return (
    <div className="hidden lg:flex flex-col border-l border-gray-200 bg-slate-50" style={style}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              view === tab.id
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'planner'  && <PlannerPage />}
        {view === 'calendar' && <CalendarPage />}
        {view === 'notes'    && <NotesPage />}
      </div>
    </div>
  )
}
