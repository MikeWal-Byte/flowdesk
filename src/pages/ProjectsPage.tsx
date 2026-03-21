import { useEffect, useState } from 'react'
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
import { Plus, LayoutDashboard, GripVertical } from 'lucide-react'
import ProjectBoardColumn from '../components/projects/ProjectBoardColumn'
import CreateProjectModal from '../components/projects/CreateProjectModal'
import Button from '../components/ui/Button'
import { useAppStore } from '../store/useAppStore'
import type { Project, ColumnId } from '../types'
import { COLUMNS } from '../types'

export default function ProjectsPage() {
  const {
    projects, loadingProjects, fetchProjects,
    fetchAllProjectCards, moveProject, reorderProjects, saveColumnOrder,
  } = useAppStore()

  const [showCreate, setShowCreate] = useState(false)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Fetch projects, then all their cards
  useEffect(() => {
    fetchProjects().then(() => fetchAllProjectCards())
  }, [])

  // Re-fetch cards whenever the project list changes (new project added)
  const projectIds = projects.map(p => p.id).sort().join(',')
  useEffect(() => {
    if (projects.length > 0) fetchAllProjectCards()
  }, [projectIds])

  const getColumnProjects = (colId: ColumnId) =>
    projects
      .filter(p => (p.column_id ?? 'not-started') === colId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find(p => p.id === event.active.id)
    if (project) setActiveProject(project)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const dragging = projects.find(p => p.id === activeId)
    if (!dragging) return

    // Dropped over a column
    const overColumn = COLUMNS.find(c => c.id === overId)
    if (overColumn && dragging.column_id !== overColumn.id) {
      reorderProjects(projects.map(p =>
        p.id === activeId ? { ...p, column_id: overColumn.id as ColumnId } : p
      ))
      return
    }

    // Dropped over another project card
    const overProject = projects.find(p => p.id === overId)
    if (!overProject) return
    if (dragging.column_id !== overProject.column_id) {
      reorderProjects(projects.map(p =>
        p.id === activeId ? { ...p, column_id: overProject.column_id } : p
      ))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)
    if (!over) return

    // Read fresh state directly from Zustand — avoids stale closure from handleDragOver optimistic updates
    const freshProjects = useAppStore.getState().projects

    const activeId = active.id as string
    const overId = over.id as string
    const dragging = freshProjects.find(p => p.id === activeId)
    if (!dragging) return

    const overColumn = COLUMNS.find(c => c.id === overId)
    const overProject = freshProjects.find(p => p.id === overId)
    const targetColumn = (overColumn?.id ?? overProject?.column_id ?? dragging.column_id) as ColumnId

    const colProjects = freshProjects
      .filter(p => p.column_id === targetColumn)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

    const oldIndex = colProjects.findIndex(p => p.id === activeId)
    const newIndex = overProject ? colProjects.findIndex(p => p.id === overId) : colProjects.length

    let reordered = colProjects
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      reordered = arrayMove(colProjects, oldIndex, newIndex)
    } else if (oldIndex === -1) {
      // Item wasn't in target column yet (shouldn't happen after handleDragOver, but guard anyway)
      reordered = [...colProjects, { ...dragging, column_id: targetColumn }]
    }

    const finalPosition = reordered.findIndex(p => p.id === activeId)
    const withPositions = reordered.map((p, i) => ({ ...p, position: i }))

    reorderProjects([
      ...freshProjects.filter(p => p.column_id !== targetColumn),
      ...withPositions,
    ])

    // Persist column change + all positions in the target column
    await moveProject(activeId, targetColumn, finalPosition >= 0 ? finalPosition : 0)
    await saveColumnOrder(withPositions.map(p => ({ id: p.id, position: p.position })))
  }

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <LayoutDashboard className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <span className="text-sm text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <LayoutDashboard className="w-10 h-10 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No projects yet</h2>
            <p className="text-gray-500 text-sm mb-4 max-w-xs">
              Create your first project to get started. Drag it between columns as it progresses.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> New Project
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 p-4 overflow-x-auto h-full pb-6">
              {COLUMNS.map(col => (
                <ProjectBoardColumn
                  key={col.id}
                  columnId={col.id}
                  projects={getColumnProjects(col.id)}
                  onAddProject={() => setShowCreate(true)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeProject && (
                <div className="bg-white rounded-xl border border-violet-200 shadow-2xl p-3.5 w-80 rotate-2 opacity-95 cursor-grabbing">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activeProject.color }}
                    />
                    <p className="text-sm font-semibold text-gray-900 truncate">{activeProject.title}</p>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
