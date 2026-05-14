import { redirect, notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/app/lib/supabase-server'
import { DecisionForm } from '../../match/[slug]/DecisionForm'

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/admin/decision/${id}`)
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

  const { data: decision } = await supabase
    .from('decisions')
    .select('id, match_id, minute, half, template_id, player_name, team_id, video_url')
    .eq('id', id)
    .single()

  if (!decision) notFound()

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, slug, status, score_home, score_away,
      home_team:home_team_id (id, code, name),
      away_team:away_team_id (id, code, name),
      competition:competition_id (short_name)
    `)
    .eq('id', (decision as any).match_id)
    .single()

  if (!match) notFound()

  const { data: templates } = await supabase
    .from('decision_templates')
    .select('id, code, category, title_es, body_es, default_law_id, variables_schema')
    .order('category')
    .order('title_es')

  return (
    <DecisionForm
      match={match as any}
      templates={(templates ?? []) as any}
      operatorId={operator.id}
      existingDecision={decision as any}
    />
  )
}