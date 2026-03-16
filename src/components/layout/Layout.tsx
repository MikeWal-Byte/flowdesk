import { useState, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import SecondaryPanel from './SecondaryPanel'

type SecondaryView = 'planner' | 'calendar' | 'notes'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [secondaryView, setSecondaryView] = useState<SecondaryView | null>(null)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleToggleSplit() {
    setSecondaryView(v => {
      if (v === null) {
        setSplitRatio(0.5)
        return 'planner'
      }
      return null
    })
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newRatio = (e.clientX - rect.left) / rect.width
    setSplitRatio(Math.min(0.8, Math.max(0.2, newRatio)))
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        splitActive={secondaryView !== null}
        onToggleSplit={handleToggleSplit}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">FlowDesk</span>
          </div>
        </header>

        {/* Page content + optional secondary panel */}
        <div
          ref={containerRef}
          className={`flex-1 flex overflow-hidden ${isDragging ? 'select-none cursor-col-resize' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <main
            className="overflow-y-auto pb-16 lg:pb-0"
            style={{ width: secondaryView !== null ? `${splitRatio * 100}%` : '100%' }}
          >
            <Outlet />
          </main>
          {secondaryView !== null && (
            <>
              <div
                onMouseDown={() => setIsDragging(true)}
                className={`w-1 flex-shrink-0 flex items-center justify-center cursor-col-resize group transition-colors
                  ${isDragging ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-400'}`}
              >
                <div className="flex flex-col gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gray-400 group-hover:bg-blue-600" />
                  ))}
                </div>
              </div>
              <SecondaryPanel
                view={secondaryView}
                onViewChange={setSecondaryView}
                onClose={() => setSecondaryView(null)}
                style={{ width: `${(1 - splitRatio) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
