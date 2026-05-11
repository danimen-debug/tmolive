import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase-server'
import { DecisionForm } from './DecisionForm'
import { DecisionsList } from './DecisionsList'

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/admin/match/${slug}`)
  }

  const { data: operator } = await supabase
    .from('operators')
    .select('id, role, active')
    .eq('auth_user_id', user.id)
    .single()

  if (!operator || !operator.active) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sin permisos</h1>
          <p className="text-slate-400">Tu cuenta no tiene permisos de operador.</p>
        </div>
      </main>
    )
  }

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, slug, status, score_home, score_away,
      home_team:home_team_id (id, code, name),
      away_team:away_team_id (id, code, name),
      competition:competition_id (short_name)
    `)
    .eq('slug', slug)
    .single()

  if (!match) notFound()

  const { data: templates } = await supabase
    .from('decision_templates')
    .select('id, code, category, title_es, body_es, default_law_id, variables_schema')
    .order('category')
    .order('title_es')

  const { data: decisions } = await supabase
    .from('decisions')
    .select(`
      id, minute, half, player_name, team_id, created_at,
      template:template_id (title_es, category),
      team:team_id (code, name)
    `)
    .eq('match_id', (match as any).id)
    .order('created_at', { ascending: false })

  return (
    <>
      <DecisionForm
        match={match as any}
        templates={(templates ?? []) as any}
        operatorId={operator.id}
      />
      <div className="max-w-2xl mx-auto px-8 pb-8 -mt-4 bg-slate-950 text-white">
        <h2 className="text-lg font-bold mb-3 text-slate-300">Decisiones cargadas</h2>
        <DecisionsList initialDecisions={decisions ?? []} />
      </div>
    </>
  )
}