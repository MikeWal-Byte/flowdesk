import { useEffect, useState } from 'react'
import { Plus, LayoutDashboard, Trash2, Flag, ChevronRight } from 'lucide-react'
import KanbanBoard from '../components/projects/KanbanBoard'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import type { Priority } from '../types'
import { PRIORITY_CONFIG } from '../types'

export default function ProjectsPage() {
  const {
    projects, loadingProjects, fetchProjects,
    fetchProjectCards, deleteProject, updateProject,
  } = useAppStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load projects on mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Auto-select first project when list loads
  useEffect(() => {
    if (!selectedId && projects.length > 0) {
      const first = projects[0]
      setSelectedId(first.id)
      fetchProjectCards(first.id)
    }
  }, [projects.length])

  const handleSelectProject = (id: string) => {
    setSelectedId(id)
    fetchProjectCards(id)
    setDeleteConfirm(null)
  }

  const handleDelete = async (id: string) => {
    await deleteProject(id)
    setDeleteConfirm(null)
    if (selectedId === id) {
      const remaining = projects.filter(p => p.id !== id)
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id)
        fetchProjectCards(remaining[0].id)
      } else {
        setSelectedId(null)
      }
    }
  }

  const selectedProject = projects.find(p => p.id === selectedId) ?? null

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Project list sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden">
        {/* Sidebar header */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
              <LayoutDashboard className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-base font-bold text-gray-900">Projects</h1>
            <span className="text-xs text-gray-400 ml-auto">{projects.length}</span>
          </div>
          <Button className="w-full justify-center" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5" /> New Project
          </Button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto py-2">
          {projects.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-400">No projects yet.</p>
            </div>
          ) : (
            projects.map(project => {
              const pCfg = PRIORITY_CONFIG[project.priority as Priority] ?? PRIORITY_CONFIG[2]
              const isSelected = project.id === selectedId
              const isDeleting = deleteConfirm === project.id

              return (
                <div key={project.id} className="px-2">
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all group relative
                      ${isSelected
                        ? 'bg-blue-50 shadow-sm'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Priority color bar */}
                      <span
                        className="w-1 h-6 rounded-full flex-shrink-0"
                        style={{ backgroundColor: pCfg.color }}
                      />
                      {/* Project color dot */}
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className={`text-sm font-medium truncate flex-1
                        ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                        {project.title}
                      </span>
                      {isSelected && (
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}
                      {/* Delete button */}
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(project.id) }}
                        className={`flex-shrink-0 p-0.5 rounded transition-all text-gray-300 hover:text-red-500
                          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Priority label */}
                    <div className="ml-7 mt-1 flex items-center gap-1">
                      <Flag className="w-2.5 h-2.5 text-gray-400" />
                      <span className={`text-xs font-medium ${pCfg.text}`}>
                        {pCfg.label}
                      </span>
                    </div>
                  </button>

                  {/* Inline delete confirmation */}
                  {isDeleting && (
                    <div className="mx-1 mb-1 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-700 mb-2">Delete "{project.title}"?</p>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="px-2.5 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2.5 py-1 text-xs bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Project Kanban board ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {!selectedProject ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-10 h-10 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No project selected</h2>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">
              Select a project from the sidebar, or create a new one to get started.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </div>
        ) : (
          <>
            {/* Board header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <h2 className="text-lg font-bold text-gray-900 truncate">{selectedProject.title}</h2>
                {selectedProject.description && (
                  <span className="text-sm text-gray-400 truncate hidden sm:block">
                    — {selectedProject.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Priority toggle */}
                <button
                  title="Click to change priority"
                  onClick={() => {
                    const next: Priority = selectedProject.priority === 1 ? 2 : selectedProject.priority === 2 ? 3 : 1
                    updateProject(selectedProject.id, { priority: next })
                  }}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80
                    ${PRIORITY_CONFIG[selectedProject.priority as Priority].bg}
                    ${PRIORITY_CONFIG[selectedProject.priority as Priority].text}`}
                >
                  <Flag className="w-3 h-3" />
                  {PRIORITY_CONFIG[selectedProject.priority as Priority].label}
                </button>
              </div>
            </div>

            {/* Kanban board */}
            <div className="flex-1 overflow-hidden">
              <KanbanBoard projectId={selectedProject.id} />
            </div>
          </>
        )}
      </main>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
