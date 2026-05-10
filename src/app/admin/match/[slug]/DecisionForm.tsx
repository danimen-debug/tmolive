'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/app/lib/supabase-browser'

export function DecisionForm({ match, templates, operatorId }: any) {
  const router = useRouter()
  const [category, setCategory] = useState('sanction')
  const [templateId, setTemplateId] = useState('')
  const [minute, setMinute] = useState('')
  const [half, setHalf] = useState('first')
  const [playerName, setPlayerName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = templates.filter((t: any) => t.category === category)
  const selected = templates.find((t: any) => t.id === templateId)

  async function handleSubmit(e: any) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.from('decisions').insert({
      match_id: match.id,
      minute: parseInt(minute, 10),
      half,
      template_id: selected.id,
      player_name: playerName || null,
      team_id: teamId || null,
      law_id: selected.default_law_id,
      variables: {},
      video_url: videoUrl || null,
      operator_id: operatorId,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    router.push(`/match/${match.slug}`)
    router.refresh()
  }

  const inp = 'w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white'

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-emerald-500">Cargar decisión</h1>
        <p className="text-slate-400 mb-6">{match.home_team?.name} vs {match.away_team?.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setTemplateId('') }} className={inp}>
            <option value="sanction">Sanciones</option>
            <option value="discipline">Disciplinarias</option>
            <option value="tmo">TMO</option>
          </select>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} required className={inp}>
            <option value="">Elegí una plantilla...</option>
            {filtered.map((t: any) => <option key={t.id} value={t.id}>{t.title_es}</option>)}
          </select>
          <input type="number" placeholder="Minuto" value={minute} onChange={(e) => setMinute(e.target.value)} required className={inp} />
          <select value={half} onChange={(e) => setHalf(e.target.value)} className={inp}>
            <option value="first">1er tiempo</option>
            <option value="second">2do tiempo</option>
          </select>
          <input type="text" placeholder="Jugador (opcional)" value={playerName} onChange={(e) => setPlayerName(e.target.value)} className={inp} />
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inp}>
            <option value="">Sin equipo</option>
            {match.home_team && <option value={match.home_team.id}>{match.home_team.name}</option>}
            {match.away_team && <option value={match.away_team.id}>{match.away_team.name}</option>}
          </select>
          <input type="url" placeholder="URL del clip (opcional, ej. YouTube)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inp} />
          {error && <div className="bg-red-950 text-red-400 p-3 rounded">{error}</div>}
          <button type="submit" disabled={loading || !templateId} className="w-full bg-emerald-500 disabled:opacity-50 text-slate-950 font-semibold py-3 rounded-lg">
            {loading ? 'Cargando...' : 'Cargar decisión'}
          </button>
        </form>
      </div>
    </main>
  )
}