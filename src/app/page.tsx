import { supabase } from '@/app/lib/supabase'
import Link from 'next/link'

export default async function Home() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      slug,
      kickoff_at,
      venue,
      home_team:home_team_id (code, name),
      away_team:away_team_id (code, name),
      competition:competition_id (short_name)
    `,
    )
    .order('kickoff_at', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-500">Error: {error.message}</div>
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-emerald-500">TMO Live</h1>
        <p className="text-slate-400 mb-8">Calendario Rugby Championship 2026</p>

        <div className="space-y-3">
          {matches?.map((m: any) => (
            <Link
              key={m.id}
              href={`/match/${m.slug}`}
              className="block bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between hover:border-emerald-500 hover:bg-slate-800/50 transition"
            >
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-mono">
                  {m.competition?.short_name}
                </span>
                <span className="font-semibold">{m.home_team?.name}</span>
                <span className="text-slate-500">vs</span>
                <span className="font-semibold">{m.away_team?.name}</span>
              </div>
              <div className="text-sm text-slate-400">
                {new Date(m.kickoff_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}