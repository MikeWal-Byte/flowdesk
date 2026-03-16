import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, StickyNote, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Projects' },
  { to: '/planner',  icon: CheckSquare,     label: 'Planner' },
  { to: '/calendar', icon: CalendarDays,    label: 'Calendar' },
  { to: '/notes',    icon: StickyNote,      label: 'Notes' },
]

export default function BottomNav() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10">
      {/* Pull-tab */}
      <div className="flex justify-center">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="bg-white border border-gray-200 border-b-0 rounded-t-lg px-4 py-1 text-gray-400 hover:text-blue-700 transition-colors shadow-sm"
          aria-label={collapsed ? 'Show navigation' : 'Hide navigation'}
        >
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav bar */}
      <nav
        className={`bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 ease-in-out
          ${collapsed ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="flex">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors
                ${isActive ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`p-1 rounded-lg mb-0.5 transition-colors ${isActive ? 'bg-blue-100' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
