# Portfolio OS

Ver `PROJECT_SPEC.md` (na raiz do repositório principal) para a especificação completa.

## Rodando localmente

```bash
npm install
cp .env.example .env   # já vem preenchido com as credenciais do projeto Supabase de dev
npm run dev
```

## Testes

```bash
npx vitest run
```

## Build

```bash
npm run build
```

## Status

- ✅ Fase 0 (Fundação): concluída — auth, RLS testado e corrigido, CI pendente de configurar no GitHub.
- 🔶 Fase 1 (Motor Financeiro): núcleo já implementado (`src/financial-engine/positionEngine.ts`),
  falta a UI de cadastro de ativos/transações e o schema de `assets`/`transactions` no banco.

## Estrutura

```
src/
  financial-engine/   # puro — sem React, sem Supabase, sem rede
  market-data/         # (Fase 2)
  portfolio-domain/    # (Fase 1+)
  app/
    pages/             # AuthPage, DashboardPage
  lib/
    supabase.ts        # cliente Supabase
    useAuth.ts          # hook de sessão
```
