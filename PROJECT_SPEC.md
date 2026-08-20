# PORTFOLIO OS — Especificação do Projeto

> Este é o documento de referência único do projeto. Fica no repositório.
> Os prompts de execução por fase (pasta `/prompts`) citam este arquivo em vez de repetir tudo.
> Se algo aqui mudar, atualize este arquivo — não duplique a informação em outro lugar.

---

## 1. Missão

Construir uma plataforma de acompanhamento de investimentos que centraliza a carteira do usuário e responde com precisão:

- quanto possui, quanto investiu, quanto ganhou/perdeu
- preço médio, proventos recebidos, rentabilidade
- evolução do patrimônio, distribuição da carteira
- exposição por ativo, classe, setor, país, moeda

**Não é corretora.** Não executa ordens, não promete rentabilidade, não recomenda compra/venda.
Foco: organização, cálculo, análise, auditoria.

## 2. Princípio inegociável

> **Os números devem ser confiáveis.** Um cálculo errado é bug crítico mesmo com interface perfeita.

Em qualquer conflito: precisão > velocidade | auditabilidade > conveniência | segurança > automação | clareza > complexidade.

## 3. Escopo (por fase, não tudo de uma vez)

**V1 — Brasil:** ações, FIIs, ETFs, BDRs, renda fixa, caixa.
**V2 — Exterior:** stocks, ETFs, REITs, câmbio.
**Futuro (arquitetura preparada, não implementada agora):** cripto, previdência, opções, ativos custom.

## 4. Papéis de revisão (não são "agentes" separados — são checkpoints que você e o modelo aplicam a cada entrega)

Ao entregar qualquer funcionalidade que toque o motor financeiro, passar pelas 5 lentes abaixo antes de marcar como pronta:

1. **Produto** — resolve um problema real do investidor? Está no escopo da fase atual?
2. **Financeiro/Dados** — o cálculo está matematicamente correto? Tem teste de invariante? Usa Decimal, nunca float?
3. **Segurança** — RLS ativo? Usuário A não acessa dado de usuário B? Secrets fora do frontend?
4. **UX** — fluxo claro, sem tela vazia sem explicação, erro nunca mostra "R$0" ou dado falso?
5. **QA** — tem teste automatizado que cobre o caso feliz e pelo menos 2 edge cases?

Bug financeiro grave (preço médio errado, perda de transação, acesso cruzado entre usuários) = **bloqueia release**, sem exceção.

## 5. Ledger como fonte da verdade

Nunca armazenar só o estado final da carteira. Tudo é derivado de uma sequência de eventos imutável (soft delete, nunca hard delete em dado financeiro).

**Tipos de evento (v1):** BUY, SELL, DIVIDEND, JCP, BONUS, SPLIT, REVERSE_SPLIT, FEE, TAX, CASH_DEPOSIT, CASH_WITHDRAW, TRANSFER_IN, TRANSFER_OUT.
(Adiar para v2+: SUBSCRIPTION, RIGHTS, MERGER, SPIN_OFF, FX, REDEMPTION, OTHER — deixar o enum extensível desde já.)

**Modelo de transação — campos mínimos:**
```
id, user_id, portfolio_id, account_id, asset_id, transaction_type,
trade_date, settlement_date, quantity, unit_price, gross_amount,
fees, taxes, currency, exchange_rate, source, external_id, notes,
created_at, updated_at, deleted_at
```

**Asset master (independente do ticker, ticker pode mudar):**
```
asset_id, name, ticker, isin, exchange, asset_class, currency, country, sector, status
```

## 6. Regras do motor financeiro

- **Nunca usar float binário para dinheiro.** Usar `Decimal.js` (ou equivalente) em toda a cadeia de cálculo. Arredondar só na exibição.
- **Preço médio:** `custo_acumulado / quantidade_acumulada`, recalculado a cada evento, nunca arredondado durante o cálculo intermediário.
- **Venda parcial:** mantém o preço médio da posição restante; calcula separadamente receita, custo, taxas, impostos e lucro realizado da parcela vendida.
- **Split (ex: 2:1):** quantidade ×2, PM ÷2, custo total inalterado. Testar a invariante `custo_total_antes == custo_total_depois`.
- **Grupamento (ex: 1:10):** quantidade ÷10, PM ×10.
- **Quantidade sempre deve bater:** `quantity = buys + bonuses + transfers_in - sells - transfers_out ± corporate_actions`.
- **Edição de transação antiga:** recalcula automaticamente posição, PM e performance de tudo que vem depois. Avisar o usuário antes.

## 7. Cotações e dados de mercado

- Interface abstrata `MarketDataProvider` (searchAssets, getQuote, getHistoricalPrices, getDividends, getCorporateActions) — nenhuma chamada direta a um provider específico espalhada pelo código.
- **Provider inicial:** decidir entre brapi.dev (B3, gratuito com limites), Alpha Vantage (já conectado neste ambiente, cobre EUA) ou HG Brasil. Registrar a escolha como ADR.
- Se a atualização falhar: **nunca** `price = 0`. Mostrar último valor confiável + timestamp ("Última atualização: ...").
- Detectar anomalias antes de gravar (queda >50% pode ser split não registrado, erro de API, ticker errado — não erro real).

## 8. Stack (proposta — validar antes de codar)

- TypeScript + React (Vite, mais simples que Next para começar) + Tailwind
- Supabase (Postgres + Auth + RLS) — já conectado neste ambiente
- Decimal.js para o motor financeiro
- Vitest para testes unitários + testes de invariante (property-based com fast-check, se der tempo)

Separação de pastas: `financial-engine/` (puro, sem React/Supabase), `market-data/`, `portfolio-domain/`, `app/` (UI).

## 9. Segurança e privacidade (não negociável, mesmo no MVP)

- RLS em toda tabela privada. Teste obrigatório: usuário A não acessa dado de usuário B, nem via request manual.
- Secrets (chaves de API, service role) nunca no frontend.
- Export de dados (JSON) e exclusão de conta desde o início — mesmo que simples.
- Nada de patrimônio/posição real em analytics de produto.

## 10. Definição de "pronto" para qualquer funcionalidade

Implementada + testada (incl. edge cases) + responsiva + sem erro crítico + RLS validado quando toca dado do usuário + documentação do arquivo atualizada.

## 11. Roadmap por fases (uma de cada vez — não iniciar a próxima sem fechar a anterior)

| Fase | Entrega |
|---|---|
| 0 | Fundação: repo, auth, schema base, CI, design tokens mínimos |
| 1 | Motor financeiro: ativos, contas, ledger, compra/venda, posição, preço médio — **cobertura de teste alta aqui** |
| 2 | Cotações: provider, cache, fallback |
| 3 | Dashboard: patrimônio, carteira, gráfico simples |
| 4 | Proventos: dividendos, JCP, calendário |
| 5 | Performance: XIRR, TWR, benchmarks |
| 6 | Importação CSV com preview e dedup |
| 7 | Corporate actions: split, grupamento, bonificação |
| 8 | Analytics: alocação, risco, rebalanceamento |
| 9 | Exterior: USD, câmbio |
| 10 | Tributário (só após validação jurídica — fora do escopo automático) |

## 12. MVP real (fases 0-3, o resto é depois)

Criar usuário → criar carteira/conta → cadastrar ativo → registrar compra → registrar nova compra (recalcula PM) → registrar venda (lucro realizado) → ver posição e patrimônio consolidado → sincronizar cotação → export/import básico de backup.

Nada de tempo real, fundamentos, watchlist, rebalanceamento ou tributário no MVP.

## 13. Quando pedir decisão ao usuário (Gabriel) em vez de decidir sozinho

- Escolha de provider de dados pago
- Mudança de escopo que afeta o MVP
- Qualquer coisa que possa perder dados existentes
- Decisão com implicação jurídica/fiscal

Fora isso: decidir com a melhor prática, registrar a decisão em `DECISIONS.md` com 1-2 linhas de justificativa, e seguir.
