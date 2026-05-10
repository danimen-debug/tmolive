'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/app/lib/supabase-browser'

type Team = { id: string; code: string; name: string } | null
type Decision = any

const catLabels: Record<string, string> = { sanction: 'Sanción', discipline: 'Disciplinaria', tmo: 'TMO' }
const catColors: Record<string, string> = {
  sanction: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  discipline: 'bg-red-500/10 text-red-400 border-red-500/30',
  tmo: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

function fill(template: string, vars: Record<string, any>): string {
  if (!template) return ''
  let r = template
  for (const [k, v] of Object.entries(vars)) {
    const rep = v !== null && v !== undefined && v !== '' ? String(v) : '—'
    r = r.split(`{{${k}}}`).join(rep)
  }
  return r
}

export function DecisionsTimeline({
  matchId,
  initialDecisions,
  homeTeam,
  awayTeam,
}: {
  matchId: string
  initialDecisions: Decision[]
  homeTeam: Team
  awayTeam: Team
}) {
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'decisions', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          const { data } = await supabase
            .from('decisions')
            .select(`
              id, minute, half, player_name, team_id, created_at,
              template:template_id (title_es, body_es, category),
              team:team_id (code, name),
              law:law_id (code, title_es, worldrugby_url)
            `)
            .eq('id', (payload.new as any).id)
            .single()
          if (data) {
            const decId = (data as any).id
            setDecisions((prev) => [data, ...prev])
            setNewIds((prev) => new Set(prev).add(decId))
            setTimeout(() => {
              setNewIds((prev) => {
                const next = new Set(prev)
                next.delete(decId)
                return next
              })
            }, 5000)
          }
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED')
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  return (
    <>
      <style>{`
        @keyframes slideInFromTop {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .decision-new { animation: slideInFromTop 0.5s ease-out; }
      `}</style>

      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="relative flex h-2 w-2">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        </span>
        <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
          {connected ? 'En vivo' : 'Desconectado'}
        </span>
      </div>

      {decisions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-lg p-8 text-center text-slate-500">
          <p className="mb-2">Sin decisiones cargadas todavía.</p>
          <p className="text-sm">Las decisiones aparecen acá en vivo durante el partido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d: any) => {
            const otherTeam = d.team_id === homeTeam?.id ? awayTeam?.name : d.team_id === awayTeam?.id ? homeTeam?.name : null
            const filledBody = fill(d.template?.body_es, {
              player: d.player_name,
              team: d.team?.name,
              team_against: d.team?.name,
              team_for: otherTeam,
              minute: d.minute,
              outcome: 'pendiente',
            })
            const isNew = newIds.has(d.id)
            return (
              <div
                key={d.id}
                className={`bg-slate-900 border rounded-lg p-4 ${isNew ? 'border-emerald-500 decision-new' : 'border-slate-800'}`}
              >
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-2xl font-bold text-emerald-500 tabular-nums">{d.minute}&apos;</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${catColors[d.template?.category] || ''}`}>
                    {catLabels[d.template?.category] || ''}
                  </span>
                  <span className="font-semibold">{d.template?.title_es}</span>
                  {isNew && (
                    <span className="ml-auto px-2 py-1 rounded text-xs font-bold bg-emerald-500 text-slate-950 animate-pulse">
                      NUEVA
                    </span>
                  )}
                </div>
                {d.player_name && (
                  <div className="text-sm text-slate-400 mb-2">
                    Jugador: <span className="text-white">{d.player_name}</span>
                    {d.team && <span className="text-slate-500"> ({d.team.name})</span>}
                  </div>
                )}
                <div className="text-sm text-slate-300">{filledBody}</div>
                {d.law && (
                  <a href={d.law.worldrugby_url} target="_blank" rel="noreferrer" className="inline-block mt-3 text-xs text-emerald-400 hover:text-emerald-300">
                    → Ver {d.law.code}: {d.law.title_es} en World Rugby
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}