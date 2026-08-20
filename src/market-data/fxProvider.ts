import { supabase } from '../lib/supabase'

/**
 * Câmbio via cache no Supabase — mesma limitação e mesmo motivo das cotações
 * (ver supabaseQuoteProvider.ts): não é seguro chamar a API de câmbio direto do
 * navegador. Sincronização manual nesta fase.
 */
export async function getFxRate(baseCurrency: string, quoteCurrency: string): Promise<{ rate: string; fetchedAt: string } | null> {
  if (baseCurrency === quoteCurrency) return { rate: '1', fetchedAt: new Date().toISOString() }
  const { data, error } = await supabase
    .from('fx_rates')
    .select('*')
    .eq('base_currency', baseCurrency)
    .eq('quote_currency', quoteCurrency)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return { rate: data.rate, fetchedAt: data.fetched_at }
}
