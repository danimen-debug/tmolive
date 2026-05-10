import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { DecisionsTimeline } from './DecisionsTimeline'

export default async function MatchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      id, slug, kickoff_at, venue, status, score_home, score_away, current_minute,
      home_team:home_team_id (id, code, name),
      away_team:away_team_id (id, code, name),
      competition:competition_id (short_name)
    `)
    .eq('slug', slug)
    .single()

  if (error || !match) notFound()
  const m: any = match

  const { data: decisions } = await supabase
    .from('decisions')
    .select(`
      id, minute, half, player_name, team_id, created_at,
      template:template_id (title_es, body_es, category),
      team:team_id (code, name),
      law:law_id (code, title_es, worldrugby_url)
    `)
    .eq('match_id', m.id)
    .order('created_at', { ascending: false })

  const kickoff = new Date(m.kickoff_at)
  const fmtDate = kickoff.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fmtTime = kickoff.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  const statusLabels: Record<string, string> = {
    scheduled: 'Programado', live: 'En vivo', ended: 'Finalizado', postponed: 'Pospuesto', cancelled: 'Cancelado',
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white">← Volver</Link>
          <span className="text-xs text-slate-500 font-mono">{m.competition?.short_name}</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-2xl md:text-4xl font-bold mb-2">{m.home_team?.name}</div>
              <div className="text-xs text-slate-500 font-mono">{m.home_team?.code}</div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 px-2">
              <div className="text-4xl md:text-6xl font-bold text-emerald-500 tabular-nums">{m.score_home}</div>
              <div className="text-2xl text-slate-600">-</div>
              <div className="text-4xl md:text-6xl font-bold text-emerald-500 tabular-nums">{m.score_away}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-2xl md:text-4xl font-bold mb-2">{m.away_team?.name}</div>
              <div className="text-xs text-slate-500 font-mono">{m.away_team?.code}</div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300">{statusLabels[m.status] || m.status}</span>
            {m.current_minute !== null && <span className="text-slate-400">Minuto {m.current_minute}&apos;</span>}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Fecha</div>
            <div className="font-semibold capitalize">{fmtDate}</div>
            <div className="text-sm text-slate-400">{fmtTime} hs</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Estadio</div>
            <div className="font-semibold">{m.venue || 'Por confirmar'}</div>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Decisiones del referee</h2>
          <DecisionsTimeline
            matchId={m.id}
            initialDecisions={decisions ?? []}
            homeTeam={m.home_team}
            awayTeam={m.away_team}
          />
        </div>
      </div>
    </main>
  )
}