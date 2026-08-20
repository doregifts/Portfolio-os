# Prompt de execução — Fase 1: Motor Financeiro

Leia primeiro `PROJECT_SPEC.md` — seções 5, 6 e 12 são as mais relevantes para esta fase.
Pré-requisito: Fase 0 concluída e validada.

## Objetivo desta fase

Esta é a fase mais crítica do projeto inteiro. É aqui que se decide se os números do app são confiáveis.

## Entregas

1. **Schema:** criar tabelas `assets` e `transactions` conforme os campos mínimos da seção 5/6 do PROJECT_SPEC.md. Migration com RLS.
2. **`financial-engine/` (código puro, sem React, sem Supabase, sem chamada de rede):**
   - Função que recebe uma lista ordenada de transações de um ativo e retorna: quantidade atual, preço médio, custo total.
   - Suporte a BUY, SELL (parcial e total), DIVIDEND, JCP, SPLIT, REVERSE_SPLIT, BONUS.
   - Usar Decimal.js em toda a cadeia — nenhum float binário em valor monetário ou quantidade fracionária.
3. **UI mínima:** tela de cadastrar ativo, registrar compra, registrar venda, ver posição atual (tabela simples, sem gráfico ainda).
4. **Testes (esta é a parte que não pode ser cortada):**
   - Unitário: compra → nova compra → cálculo de PM correto.
   - Unitário: venda parcial → PM da posição restante inalterado, lucro realizado calculado corretamente.
   - Unitário: split 2:1 → invariante `custo_total_antes == custo_total_depois`.
   - Pelo menos um teste de sequência longa (5+ eventos misturados) conferindo a invariante de quantidade da seção 6.

## Critério de pronto

- Todos os testes acima passam
- Fazer 3 compras + 1 venda parcial + 1 split manualmente pela UI e conferir que os números batem à mão (fazer a conta em uma calculadora/planilha à parte e comparar)
- Editar uma transação antiga e confirmar que a posição recalcula corretamente

## Fora do escopo desta fase

Cotações em tempo real, dashboard de patrimônio, gráficos, proventos consolidados, câmbio. Isso vem nas fases seguintes.

## Se encontrar um bug de cálculo

Não corrigir "visualmente". Seguir: reproduzir → escrever teste que falha → corrigir causa raiz → confirmar que o teste passa → rodar toda a suíte de novo.

## Ao concluir

Registrar em `DECISIONS.md` qualquer decisão de metodologia (ex: como splits interagem com vendas parciais no mesmo dia). Não avançar para a Fase 2 sem o critério de pronto acima.
