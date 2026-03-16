import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import ProjectsPage from './pages/ProjectsPage'
import PlannerPage from './pages/PlannerPage'
import CalendarPage from './pages/CalendarPage'
import NotesPage from './pages/NotesPage'
import AdminPage from './pages/AdminPage'
import SeedPage from './pages/SeedPage'  // REMOVE AFTER SEEDING

function ProtectedRoute() {
  const user = useAuthStore(s => s.user)
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return user.isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize)
  const [ready, setReady] = useState(false)
  useEffect(() => { initialize(); setReady(true) }, [])
  if (!ready) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin w-8 h-8 border-4 border-zinc-950 border-t-transparent rounded-full" />
    </div>
  )
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/seed" element={<SeedPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<ProjectsPage />} />
              <Route path="planner"  element={<PlannerPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes"    element={<NotesPage />} />
            </Route>
          </Route>
          <Route element={<AdminRoute />}>
            <Route element={<Layout />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  )
}
