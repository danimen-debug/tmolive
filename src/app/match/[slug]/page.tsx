import { supabase } from '@/app/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function MatchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      slug,
      kickoff_at,
      venue,
      status,
      score_home,
      score_away,
      current_minute,
      home_team:home_team_id (code, name),
      away_team:away_team_id (code, name),
      competition:competition_id (short_name)
    `,
    )
    .eq('slug', slug)
    .single()

  if (error || !match) {
    notFound()
  }

  const kickoff = new Date(match.kickoff_at)
  const formattedDate = kickoff.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = kickoff.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusLabels: Record<string, string> = {
    scheduled: 'Programado',
    live: 'En vivo',
    ended: 'Finalizado',
    postponed: 'Pospuesto',
    cancelled: 'Cancelado',
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white transition">
            ← Volver
          </Link>
          <span className="text-xs text-slate-500 font-mono">
            {(match.competition as any)?.short_name}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="text-2xl md:text-4xl font-bold mb-2">
                {(match.home_team as any)?.name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {(match.home_team as any)?.code}
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4 px-2">
              <div className="text-4xl md:text-6xl font-bold text-emerald-500 tabular-nums">
                {match.score_home}
              </div>
              <div className="text-2xl text-slate-600">-</div>
              <div className="text-4xl md:text-6xl font-bold text-emerald-500 tabular-nums">
                {match.score_away}
              </div>
            </div>

            <div className="flex-1 text-center">
              <div className="text-2xl md:text-4xl font-bold mb-2">
                {(match.away_team as any)?.name}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {(match.away_team as any)?.code}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300">
              {statusLabels[match.status] || match.status}
            </span>
            {match.current_minute !== null && (
              <span className="text-slate-400">
                Minuto {match.current_minute}&apos;
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Fecha</div>
            <div className="font-semibold capitalize">{formattedDate}</div>
            <div className="text-sm text-slate-400">{formattedTime} hs</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Estadio</div>
            <div className="font-semibold">{match.venue || 'Por confirmar'}</div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Decisiones del referee</h2>
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-lg p-8 text-center text-slate-500">
            <p className="mb-2">Sin decisiones cargadas todavía.</p>
            <p className="text-sm">
              Las decisiones aparecen acá en vivo durante el partido.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}