import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function fillTemplate(template: string, vars: Record<string, string | number | null | undefined>): string {
  if (!template) return ''
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    const replacement = value !== null && value !== undefined && value !== '' ? String(value) : '—'
    result = result.split(`{{${key}}}`).join(replacement)
  }
  return result
}

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
  const catLabels: Record<string, string> = { sanction: 'Sanción', discipline: 'Disciplinaria', tmo: 'TMO' }
  const catColors: Record<string, string> = {
    sanction: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    discipline: 'bg-red-500/10 text-red-400 border-red-500/30',
    tmo: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
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
          {!decisions || decisions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-lg p-8 text-center text-slate-500">
              <p className="mb-2">Sin decisiones cargadas todavía.</p>
              <p className="text-sm">Las decisiones aparecen acá en vivo durante el partido.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {decisions.map((d: any) => {
                const otherTeam = d.team_id === m.home_team?.id ? m.away_team?.name : d.team_id === m.away_team?.id ? m.home_team?.name : null
                const filledBody = fillTemplate(d.template?.body_es, {
                  player: d.player_name,
                  team: d.team?.name,
                  team_against: d.team?.name,
                  team_for: otherTeam,
                  minute: d.minute,
                  outcome: 'pendiente',
                })
                return (
                  <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-emerald-500 tabular-nums">{d.minute}&apos;</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${catColors[d.template?.category] || ''}`}>
                        {catLabels[d.template?.category] || ''}
                      </span>
                      <span className="font-semibold">{d.template?.title_es}</span>
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
        </div>
      </div>
    </main>
  )
}