import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProjectsPage from './pages/ProjectsPage'
import PlannerPage from './pages/PlannerPage'
import CalendarPage from './pages/CalendarPage'
import NotesPage from './pages/NotesPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="planner"  element={<PlannerPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="notes"    element={<NotesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
