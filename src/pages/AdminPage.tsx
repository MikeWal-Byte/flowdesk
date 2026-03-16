import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, KeyRound, Check, X } from 'lucide-react'
import { useAuthStore, type UserRow } from '../store/useAuthStore'

export default function AdminPage() {
  const { fetchAllUsers, addUser, changePassword } = useAuthStore()

  const [users, setUsers] = useState<UserRow[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Add user form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [addingUser, setAddingUser] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Change password state per user
  const [changingPw, setChangingPw] = useState<Record<string, { value: string; saving: boolean }>>({})

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true)
    const data = await fetchAllUsers()
    setUsers(data)
    setLoadingUsers(false)
  }, [fetchAllUsers])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingUser(true)
    setAddError(null)
    try {
      await addUser(firstName, lastName, newUsername, newPassword)
      setFirstName('')
      setLastName('')
      setNewUsername('')
      setNewPassword('')
      setAddSuccess(true)
      setTimeout(() => setAddSuccess(false), 3000)
      await loadUsers()
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setAddingUser(false)
    }
  }

  const openChangePw = (userId: string) => {
    setChangingPw(prev => ({ ...prev, [userId]: { value: '', saving: false } }))
  }

  const cancelChangePw = (userId: string) => {
    setChangingPw(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }

  const saveChangePw = async (userId: string) => {
    const pw = changingPw[userId]?.value
    if (!pw) return
    setChangingPw(prev => ({ ...prev, [userId]: { ...prev[userId], saving: true } }))
    await changePassword(userId, pw)
    setChangingPw(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center">
          <Shield className="w-5 h-5 text-zinc-300" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">User Management</h1>
          <p className="text-sm text-zinc-500">Manage team members and their access</p>
        </div>
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-zinc-700">Team Members</h2>
        </div>

        {loadingUsers ? (
          <div className="px-6 py-8 text-sm text-zinc-400 text-center">Loading…</div>
        ) : users.length === 0 ? (
          <div className="px-6 py-8 text-sm text-zinc-400 text-center">No users yet</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {users.map(u => (
              <li key={u.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-zinc-600">
                        {u.first_name[0]}{u.last_name[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900">
                          {u.first_name} {u.last_name}
                        </span>
                        {u.is_admin && (
                          <span className="text-xs px-1.5 py-0.5 bg-zinc-950 text-white rounded font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">@{u.username}</span>
                    </div>
                  </div>

                  {!changingPw[u.id] ? (
                    <button
                      onClick={() => openChangePw(u.id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Change Password
                    </button>
                  ) : null}
                </div>

                {/* Inline change password */}
                {changingPw[u.id] && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="password"
                      value={changingPw[u.id].value}
                      onChange={e => setChangingPw(prev => ({ ...prev, [u.id]: { ...prev[u.id], value: e.target.value } }))}
                      placeholder="New password"
                      autoFocus
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent"
                    />
                    <button
                      onClick={() => saveChangePw(u.id)}
                      disabled={!changingPw[u.id].value || changingPw[u.id].saving}
                      className="p-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => cancelChangePw(u.id)}
                      className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add user form */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-zinc-700">Add New User</h2>
        </div>
        <form onSubmit={handleAddUser} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent"
                placeholder="e.g. JohnD"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">Initial Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:border-transparent"
                placeholder="Set a password"
              />
            </div>
          </div>

          {addError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {addError}
            </div>
          )}
          {addSuccess && (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600">
              User added successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={addingUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {addingUser ? 'Adding…' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  )
}
