import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, StickyNote, CheckSquare, X, Zap, Columns2, ChevronLeft, ChevronRight } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Projects' },
  { to: '/planner',  icon: CheckSquare,     label: 'Daily Planner' },
  { to: '/calendar', icon: CalendarDays,    label: 'Calendar' },
  { to: '/notes',    icon: StickyNote,      label: 'Notes' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  collapsed: boolean
  onToggleCollapse: () => void
  splitActive: boolean
  onToggleSplit: () => void
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse, splitActive, onToggleSplit }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-zinc-950
          shadow-2xl transition-all duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto lg:h-screen lg:flex-shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'w-14' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-zinc-800 h-[65px] flex-shrink-0
          ${collapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Zap className="w-5 h-5 text-zinc-300" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                  <Zap className="w-5 h-5 text-zinc-300" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">FlowDesk</span>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-1' : 'px-3'}`}>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => { if (window.innerWidth < 1024) onClose() }}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-sm font-medium transition-all duration-150 group
                ${collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}
                ${isActive
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1.5 rounded-lg transition-colors flex-shrink-0
                    ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-white/10'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {!collapsed && label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`py-4 border-t border-zinc-800 flex flex-col gap-2 ${collapsed ? 'px-1 items-center' : 'px-4'}`}>
          {!collapsed && <p className="text-zinc-500 text-xs">FlowDesk v1.0</p>}

          <div className={`flex ${collapsed ? 'flex-col gap-2 items-center' : 'items-center justify-between'}`}>
            {/* Split button */}
            <button
              onClick={onToggleSplit}
              title={splitActive ? 'Close split view' : 'Open split view'}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                splitActive
                  ? 'bg-white/20 text-white'
                  : 'text-zinc-500 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 flex-shrink-0" />
              {!collapsed && 'Split'}
            </button>

            {/* Collapse toggle — desktop only */}
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:bg-white/10 hover:text-white transition-all"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
