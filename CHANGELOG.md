# Changelog — Portfolio OS

## Fase 0 — Fundação
- Repositório Vite + React + TypeScript + Tailwind v4 inicializado.
- Supabase: projeto `portfolio-os` criado, tabelas `portfolios` e `accounts` com RLS.
- Auth por e-mail/senha funcionando (signup, login, logout).
- Dashboard vazio (empty state) protegido por sessão.
- Estrutura de pastas do domínio criada: `financial-engine/`, `market-data/`, `portfolio-domain/`, `app/`.
- Testado e corrigido: bug de RLS em `accounts` que permitia insert cruzado entre usuários (ver DECISIONS.md ADR-005).
- Núcleo do motor financeiro adiantado da Fase 1: `computePosition()` com Decimal.js,
  cobrindo compra, venda parcial, split, grupamento, bonificação — 8 testes automatizados passando.

## Fase 4 — Proventos + encorpamento geral
- Navegação por abas: Carteira / Extrato / Proventos (antes era uma tela só).
- Extrato de operações: histórico completo de todas as transações, não só a posição final.
- Alocação por ativo: barras de peso percentual na carteira.
- Proventos: registro de DIVIDEND/JCP no formulário, resumo (mês/ano/desde o início),
  lista de eventos. Soma só o que foi efetivamente registrado — nunca mistura com estimado/anunciado.
- 15 testes automatizados passando (8 motor financeiro + 5 agregação de carteira + 2 proventos).
- Cotação de PETR4 sincronizada manualmente como demonstração (ver ADR sobre limitação de API key).

## Pendências conhecidas
- `auth_leaked_password_protection` desabilitado no Supabase (alerta INFO, não crítico) — habilitar depois.
- Sincronização de cotação ainda manual (decisão pendente de Gabriel sobre chave própria do Alpha Vantage).
- Deploy real ainda não publicado — aguardando Gabriel fazer o drag-and-drop no Netlify ou decidir pelo caminho GitHub+CI.

## Fase 5 — Performance
- XIRR implementado (Newton-Raphson), testado contra caso canônico do Excel.
- Retorno simples (sem ponderar tempo) como métrica complementar mais fácil de auditar.
- TWR deliberadamente NÃO implementado nesta fase — ver DECISIONS.md ADR-008.
- Nova aba "Performance" no dashboard.
- 23 testes automatizados passando no total.

## Fase 7 — Corporate actions na UI
- Formulário agora suporta BONUS, SPLIT, REVERSE_SPLIT (o motor já suportava desde a Fase 1).
- Campos dinâmicos: split/grupamento pedem fator, bonificação pede quantidade, nenhum pede preço.
- Explicação inline do efeito de cada tipo (ex: "quantidade × fator, PM ÷ fator").

## Fase 6 — Importação CSV
- Fluxo completo: upload → parse → preview obrigatório com validação linha a linha → confirmação
  explícita → importação em lote. Nunca importa direto (PROJECT_SPEC.md seção 50).
- Deduplicação por fingerprint (data+ticker+tipo+quantidade+preço), tanto dentro do arquivo
  quanto contra transações já existentes no banco — idempotência real, não só de nome.
- Um bug de validação de data foi encontrado e corrigido durante os testes: o regex aceitava
  "2026-13-99" como válido (checava só o formato, não se a data existe de verdade). Corrigido
  antes de qualquer importação real acontecer.
- 5 testes cobrindo: válido, 4 tipos de erro, duplicata no arquivo, duplicata no banco,
  corporate actions sem preço.
- 28 testes automatizados no total.

## Fase 9 — Exterior / câmbio
- Cadastro de ativo agora suporta bolsa (B3/NASDAQ/NYSE) com moeda automática (BRL/USD).
- Conversão de custo e valor de mercado para BRL usando taxa de câmbio em cache.
- Tabela mostra valor na moeda original + convertido (nunca só um dos dois) e avisa
  quando falta câmbio sincronizado, em vez de mostrar número incompleto sem aviso.
- Câmbio USD→BRL semeado manualmente como demonstração (5,42 — ver ADR-009 sobre a limitação
  do endpoint de câmbio do Alpha Vantage).
- 38 testes automatizados no total (3 novos cobrindo conversão multi-moeda).

## Ajustes pós-deploy
- Dark mode manual (claro/escuro/sistema) com toggle no header, persistido, sem flash.
- Correções de responsividade mobile: abas com scroll horizontal, hero com texto/gaps
  adaptados a telas estreitas, RebalancePanel com quebra de linha.

## Correção crítica pós-deploy
- Bug de fundo do body inválido (sintaxe CSS arbitrária incorreta) fazia o modo claro
  parecer quebrado (fundo preto, texto ilegível). Corrigido — ver DECISIONS.md ADR-011.
