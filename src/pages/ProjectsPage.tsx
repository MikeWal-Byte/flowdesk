import { useEffect, useState } from 'react'
import { Plus, Trash2, LayoutDashboard, ChevronRight } from 'lucide-react'
import KanbanBoard from '../components/projects/KanbanBoard'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'

export default function ProjectsPage() {
  const {
    projects, loadingProjects, fetchProjects, fetchProjectCards,
    activeProjectId, setActiveProject, deleteProject,
  } = useAppStore()

  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  useEffect(() => {
    if (activeProjectId) fetchProjectCards(activeProjectId)
  }, [activeProjectId])

  const activeProject = projects.find(p => p.id === activeProjectId)

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Projects sidebar */}
      <div className="w-64 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-gray-700">
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-semibold text-sm">Projects</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(true)} className="!p-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => setActiveProject(project.id)}
              className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm
                ${activeProjectId === project.id
                  ? 'bg-blue-50 text-blue-800'
                  : 'hover:bg-gray-50 text-gray-600'
                }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="flex-1 truncate font-medium">{project.title}</span>
              {activeProjectId === project.id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              <button
                onClick={e => { e.stopPropagation(); deleteProject(project.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="text-center py-8 px-4">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-xs text-gray-500">No projects yet</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 text-xs text-blue-700 hover:underline"
              >
                Create your first project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Board area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {activeProject ? (
          <>
            {/* Board header */}
            <div className="flex-shrink-0">
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeProject.color }}
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900">{activeProject.title}</h1>
                  {activeProject.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{activeProject.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setDeleteConfirmId(activeProject.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {deleteConfirmId === activeProject.id && (
                <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-center gap-3">
                  <span className="flex-1 text-sm text-red-700">
                    Delete <strong>"{activeProject.title}"</strong>? This cannot be undone.
                  </span>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { deleteProject(activeProject.id); setDeleteConfirmId(null) }}
                    className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <KanbanBoard projectId={activeProject.id} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-10 h-10 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Select a project</h2>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">
              Choose a project from the sidebar, or create a new one to get started.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </div>
        )}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
