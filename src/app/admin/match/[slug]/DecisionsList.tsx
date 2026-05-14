'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/app/lib/supabase-browser'

const catLabels: Record<string, string> = { sanction: 'Sanción', discipline: 'Disciplinaria', tmo: 'TMO' }
const catColors: Record<string, string> = {
  sanction: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  discipline: 'bg-red-500/10 text-red-400 border-red-500/30',
  tmo: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

export function DecisionsList({ initialDecisions }: { initialDecisions: any[] }) {
  const [decisions, setDecisions] = useState<any[]>(initialDecisions)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar esta decisión? No se puede deshacer.')) return
    setDeletingId(id)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.from('decisions').delete().eq('id', id)
    if (err) {
      setError(err.message)
      setDeletingId(null)
      return
    }
    setDecisions((prev) => prev.filter((d) => d.id !== id))
    setDeletingId(null)
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 border-dashed rounded-lg p-6 text-center text-slate-500 text-sm">
        Todavía no cargaste decisiones para este partido.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && <div className="bg-red-950 text-red-400 p-3 rounded text-sm">{error}</div>}
      {decisions.map((d: any) => (
        <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-xl font-bold text-emerald-500 tabular-nums">{d.minute}&apos;</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold border ${catColors[d.template?.category] || ''}`}>
              {catLabels[d.template?.category] || ''}
            </span>
            <span className="font-semibold text-sm">{d.template?.title_es}</span>
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/admin/decision/${d.id}`}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                ✏ Editar
              </Link>
              <button
                onClick={() => handleDelete(d.id)}
                disabled={deletingId === d.id}
                className="px-3 py-1 rounded bg-red-950 hover:bg-red-900 disabled:opacity-50 text-red-400 text-xs font-semibold transition"
              >
                {deletingId === d.id ? 'Borrando...' : '🗑 Borrar'}
              </button>
            </div>
          </div>
          {d.player_name && (
            <div className="text-xs text-slate-400">
              {d.player_name}
              {d.team && <span className="text-slate-500"> ({d.team.name})</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}