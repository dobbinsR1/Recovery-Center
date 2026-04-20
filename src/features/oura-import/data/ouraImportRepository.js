import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { buildDerivedMetricRows, buildDerivedTagRows } from '../lib/ouraImportTransforms'

function normalizeImportSaveError(error) {
  return error
}

export async function saveOuraImportBundle(user, importBundle) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  if (!user?.id) {
    throw new Error('A signed-in user is required before saving an Oura import.')
  }

  const derivedMetricRows = buildDerivedMetricRows(importBundle.tables, user.id)
  const derivedTagRows = buildDerivedTagRows(importBundle.tables, user.id)

  if (derivedMetricRows.length > 0) {
    const { error } = await supabase.from('oura_daily_metrics').upsert(derivedMetricRows, {
      onConflict: 'user_id,metric_date',
    })

    if (error) throw normalizeImportSaveError(error)
  }

  if (derivedTagRows.length > 0) {
    const affectedDates = [...new Set(derivedTagRows.map((row) => row.metric_date))]
    const { error: deleteError } = await supabase
      .from('daily_tags')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'oura_zip')
      .in('metric_date', affectedDates)

    if (deleteError) throw normalizeImportSaveError(deleteError)

    const { error: insertError } = await supabase.from('daily_tags').insert(derivedTagRows)
    if (insertError) throw normalizeImportSaveError(insertError)
  }

  return {
    derivedMetricCount: derivedMetricRows.length,
    derivedTagCount: derivedTagRows.length,
  }
}
