import { supabase } from '../lib/supabase'
import type { Quote } from './types'

/**
 * Provider que lê do cache de cotações (tabela `quotes`) no Supabase.
 *
 * IMPORTANTE — limitação conhecida desta fase: o app não chama a API de cotação
 * (Alpha Vantage) diretamente do navegador, porque isso exigiria expor uma chave
 * de API no frontend (proibido — ver PROJECT_SPEC.md seção 66/112). A busca de
 * cotação hoje é feita manualmente (via assistente/backend) e gravada nesta tabela.
 * Uma automação real (edge function agendada) precisa de uma API key própria do
 * Alpha Vantage configurada como secret no Supabase — isso é um passo pendente,
 * não uma limitação de arquitetura.
 */
export async function getQuoteForAsset(assetId: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('asset_id', assetId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    symbol: assetId,
    price: data.price,
    previousClose: data.price,
    changePercent: '0',
    latestTradingDay: data.fetched_at,
  }
}

export async function getQuotesForAssets(assetIds: string[]): Promise<Record<string, { price: string; fetchedAt: string }>> {
  if (assetIds.length === 0) return {}
  const { data, error } = await supabase.from('quotes').select('*').in('asset_id', assetIds)
  if (error) throw error

  const map: Record<string, { price: string; fetchedAt: string }> = {}
  for (const row of data ?? []) {
    map[row.asset_id] = { price: row.price, fetchedAt: row.fetched_at }
  }
  return map
}
