# Decisões técnicas — Portfolio OS

## ADR-001 — Stack da Fase 0
Vite + React + TypeScript, em vez de Next.js. Justificativa: projeto começa como SPA simples,
sem necessidade de SSR nesta fase; Vite tem setup mais rápido e menos camadas para depurar.
Pode-se revisitar Next.js se/quando houver necessidade de SSR ou rotas de API server-side.

## ADR-002 — Tailwind v4
Tailwind CSS v4 usa `@theme` dentro do CSS em vez de `tailwind.config.js` e integra via
`@tailwindcss/vite` em vez de PostCSS manual. Tokens de design (cor de marca, cores semânticas
de ganho/perda, dark mode) definidos em `src/index.css`.

## ADR-003 — Supabase (conta e projeto)
Projeto `portfolio-os` (ref `lcvdnmgqybpjjqmoejai`) criado numa conta/organização separada da
conta principal (que já estava no limite de 2 projetos gratuitos). O projeto "patrimonium" da
conta principal foi mantido intocado, por instrução explícita — não relacionado a este produto.

## ADR-004 — Decimal.js no motor financeiro
Confirmado: todo cálculo de posição usa `Decimal.js` com precisão 40 casas. Testado que
`0.1 + 0.2` não sofre o erro clássico de float binário. Arredondamento só acontece na camada
de exibição, nunca durante o cálculo intermediário (ver PROJECT_SPEC.md seção 6).

## ADR-005 — Bug de RLS encontrado e corrigido na Fase 0
Durante o teste manual de isolamento entre usuários (critério de pronto da Fase 0), foi
encontrada uma falha real: a policy de `insert`/`update` da tabela `accounts` verificava
apenas `user_id = auth.uid()`, mas não verificava que o `portfolio_id` referenciado pertencia
a esse mesmo usuário. Isso permitia que um usuário B criasse uma `account` "própria"
(com `user_id = B`) apontando para o `portfolio_id` de outro usuário A.

Corrigido adicionando `exists (select 1 from portfolios where id = portfolio_id and
user_id = auth.uid())` às policies de insert/update de `accounts`. Retestado com dois
usuários reais — confirmado bloqueio do insert cruzado e nenhum vazamento de leitura.

**Lição para as próximas fases:** sempre que uma tabela referenciar outra por FK (ex:
`transactions.account_id`, `transactions.asset_id` na Fase 1), a policy de insert/update
precisa validar a cadeia de posse completa, não só o `user_id` direto da própria linha.

## ADR-006 — Deploy manual na Fase 0/1 (limitação de ambiente, não de arquitetura)
O ambiente onde este projeto foi construído (sandbox do assistente) bloqueia por configuração
de rede o domínio `netlify-mcp.netlify.app`, usado pela CLI de deploy da Netlify
(`x-deny-reason: host_not_allowed`). Isso impede completar o deploy via linha de comando de
dentro do sandbox.

O site `portfolio-os-gabriel` e as variáveis de ambiente (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`) já foram criados/configurados via conector. Falta apenas subir
os arquivos, feito manualmente por Gabriel (drag-and-drop do `dist/` ou push para GitHub +
conectar ao Netlify). Isso é uma limitação pontual de ambiente desta sessão, não uma decisão de
arquitetura — deploys futuros (a partir de um repositório Git real) devem usar CI/CD normal via
GitHub, conforme PROJECT_SPEC.md seção 85.

## ADR-007 — Identidade visual
Paleta "papel + tinta verde-escura + latão apagado" (não o creme/terracota nem o
preto/neon genéricos de design gerado por IA). Tipografia: Fraunces (serifada,
algarismos old-style) para números grandes, Inter para UI, IBM Plex Mono para
tickers e para o elemento de assinatura do produto — a "linha de recibo": todo
número importante (patrimônio, preço médio, resultado) vem acompanhado, sempre
visível, da conta que o originou. Isso deriva diretamente do diferencial definido
no PROJECT_SPEC.md seção 93 (Explainable Portfolio), não é decoração solta.

## ADR-008 — XIRR implementado, TWR deliberadamente adiado
XIRR calculado via Newton-Raphson, validado contra o caso canônico de exemplos oficiais
do Excel/Microsoft (retorno esperado ~37,3% a.a. com fluxos irregulares) — não é fórmula
inventada, bate com implementações de referência.

TWR (time-weighted return) NÃO foi implementado nesta fase, mesmo estando na seção 40 do
PROJECT_SPEC.md, porque TWR exige o valor da carteira em pontos periódicos ao longo do
tempo (ex: fechamento diário), e hoje só temos datas de transação + cotação atual. Calcular
TWR sem esse histórico exigiria estimar/interpolar valores — ou seja, mostrar um número que
parece calculado mas na verdade é estimado. Isso viola diretamente o princípio da seção 5
("os números devem ser confiáveis"). TWR fica pendente até existir a infraestrutura de
snapshots periódicos (seção 75 do spec).

## ADR-009 — Câmbio manual (mesma limitação das cotações, motivo diferente)
Tentei usar o endpoint CURRENCY_EXCHANGE_RATE do Alpha Vantage para automatizar a conversão
USD→BRL, mas ele retornou erro de aprovação (provavelmente recurso fora do plano atual da
chave conectada — diferente do bloqueio de rede visto no deploy, este é um limite do
provedor de dados). Segui o mesmo padrão já usado para cotações: tabela `fx_rates` como
cache compartilhado, sincronização manual por enquanto. Documentado para não confundir com
a limitação de deploy (ADR-006), que é de rede do ambiente, não do provedor de dados.

## ADR-010 — Dark mode manual + correções de responsividade mobile
Tailwind v4 por padrão só segue `prefers-color-scheme` do sistema. Adicionado
`@custom-variant dark (&:where(.dark, .dark *));` para permitir toggle explícito via
classe `.dark` na `<html>`, com 3 estados (claro/escuro/sistema) persistidos em
localStorage e aplicados antes do React montar (script inline no index.html, evita flash).

Correções de overflow horizontal no mobile identificadas por revisão de código (sem
acesso a browser real neste ambiente para captura de tela):
- Barra de 5 abas: agora rola horizontalmente em vez de forçar a página a alargar.
- Hero de patrimônio: fonte reduzida em telas pequenas (text-3xl em vez de 4xl), stats
  com flex-wrap em vez de gap fixo que podia estourar em telas de 320-375px.
- RebalancePanel: linha de meta por ativo agora quebra em telas estreitas.
- Trava de segurança global: `overflow-x: hidden` em html/body.

## ADR-011 — Bug crítico de CSS corrigido: fundo do body inválido
Reportado por Gabriel com print real do app em produção: modo claro parecia quebrado
(fundo preto, texto quase ilegível fora do card de patrimônio).

Causa raiz: `bg-[--color-paper]` no CSS do `body` usa sintaxe de valor arbitrário literal
(colchetes), não de referência a variável CSS — o Tailwind v4 precisa de `bg-(--nome)` ou
`bg-[var(--nome)]` para resolver a variável. Como escrito, o valor gerado era inválido como
cor, o navegador descartava a declaração inteira, e o fundo ficava sem estilo algum — no
iPhone do Gabriel (sistema em modo escuro), isso expunha o canvas preto padrão do Safari por
trás de todo o conteúdo, disfarçando-se de "modo escuro" mesmo com "Claro" selecionado.

Corrigido: `bg-(--color-paper)` / `text-(--color-ink)` (e equivalentes dark). Também corrigido
`color-scheme` do `<html>`, que estava fixo em `light dark` (segue sempre o SO) em vez de
amarrado à classe `.dart` real — isso faria controles nativos (ex: seletor de data) ignorarem
o toggle manual também.

Verificado no CSS compilado: `background-color:var(--color-paper)` presente e válido.

**Lição:** eu revisei esse código várias vezes nas fases anteriores sem pegar o erro, porque
sintaticamente parece plausível e eu não tinha como renderizar/inspecionar visualmente neste
ambiente. Só apareceu com um print real do dispositivo. Reforça que, pra bugs de CSS
visual, feedback com screenshot real vale mais que releitura de código.
