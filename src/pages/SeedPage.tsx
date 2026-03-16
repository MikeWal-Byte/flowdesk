// ONE-TIME SEED PAGE — DELETE THIS FILE AND ITS ROUTE IN App.tsx AFTER CREATING THE ADMIN USER
import { useState } from 'react'
import bcrypt from 'bcryptjs'
import { supabase } from '../lib/supabase'

export default function SeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSeed = async () => {
    setStatus('loading')
    setErrorMsg(null)
    try {
      const password_hash = await bcrypt.hash('Numseven7', 10)
      const { data, error } = await supabase
        .from('users')
        .insert({
          first_name: 'Mike',
          last_name: 'Walker',
          username: 'MikeW',
          password_hash,
          is_admin: true,
        })
        .select('id')
        .single()

      if (error) throw error
      setUserId(data.id)
      setStatus('done')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-zinc-900 mb-2">Seed Admin User</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Creates <strong>Mike Walker</strong> (username: <code className="bg-slate-100 px-1 rounded">MikeW</code>,
          password: <code className="bg-slate-100 px-1 rounded">Numseven7</code>) as the admin user.
          <br /><br />
          <span className="text-red-500 font-medium">Delete this page after use.</span>
        </p>

        {status === 'idle' && (
          <button
            onClick={handleSeed}
            className="w-full py-2.5 bg-zinc-950 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Create Admin User
          </button>
        )}

        {status === 'loading' && (
          <div className="text-sm text-zinc-500 text-center">Creating user…</div>
        )}

        {status === 'done' && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              Admin user created successfully!
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">User ID (save this):</p>
              <code className="text-sm text-zinc-900 break-all">{userId}</code>
            </div>
            <p className="text-xs text-zinc-500">
              Now remove <code className="bg-slate-100 px-1 rounded">SeedPage.tsx</code> and
              its route from <code className="bg-slate-100 px-1 rounded">App.tsx</code>, then
              navigate to <a href="/login" className="text-blue-600 underline">/login</a>.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errorMsg}
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-sm text-zinc-500 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
