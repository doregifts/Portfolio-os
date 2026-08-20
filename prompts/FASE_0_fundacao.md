# Prompt de execução — Fase 0: Fundação

Leia primeiro `PROJECT_SPEC.md` na raiz do repositório — ele é a referência única do projeto. Este prompt cobre só a Fase 0.

## Objetivo desta fase

Preparar a base técnica para que a Fase 1 (motor financeiro) possa ser construída sem retrabalho.

## Entregas

1. **Repositório:** inicializar projeto TypeScript + React + Vite + Tailwind. Estrutura de pastas conforme seção 8 do PROJECT_SPEC.md (`financial-engine/`, `market-data/`, `portfolio-domain/`, `app/`).
2. **Supabase:** criar projeto (ou usar o conectado), configurar Auth (email/senha para começar), criar schema inicial mínimo: `users`, `portfolios`, `accounts` — sem ainda criar `transactions`/`assets` (isso é Fase 1). RLS ativado em todas as tabelas desde a primeira migration.
3. **CI mínimo:** lint + typecheck + testes unitários rodando em cada push (GitHub Actions, se aplicável).
4. **Design tokens mínimos:** cores (incl. dark mode desde já), espaçamento, tipografia — não construir componentes ainda, só os tokens em Tailwind config.
5. **Documentos vivos:** criar `DECISIONS.md` e `CHANGELOG.md` vazios, prontos para receber entradas nas próximas fases.

## Critério de pronto

- `npm run dev` sobe a aplicação vazia sem erro
- Auth funciona (criar conta, login, logout)
- Teste manual: criar dois usuários, confirmar que RLS bloqueia acesso cruzado mesmo com request direto ao Supabase
- CI verde

## Fora do escopo desta fase

Não implementar ledger, ativos, transações, cotações ou qualquer UI de dashboard. Isso é Fase 1 em diante.

## Ao concluir

Registrar decisões técnicas relevantes (ex: escolha de Vite vs Next, estrutura de pastas) em `DECISIONS.md` com 1-2 linhas cada. Não avançar para a Fase 1 sem confirmar o critério de pronto acima.
