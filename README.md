# DoItBad Landing Page

Landing pública do DoItBad com blog estático, equipe, lista de novidades, proteção Turnstile, persistência no Supabase e confirmação opcional pelo Resend.

## Requisitos

- Node.js 22.12 ou superior
- pnpm 10

## Comandos

```bash
pnpm install
pnpm dev
pnpm verify
pnpm test:e2e
```

O preview fica em `http://127.0.0.1:4321/pt-br/`.

O beta web está em `apps/web`. Use `pnpm --filter @doitbad/web dev` para executá-lo em
`http://127.0.0.1:4324/atividade`. Nesta etapa, a persistência é local e identificada como ambiente de
desenvolvimento; autenticação e banco aguardam o projeto Supabase de teste.

O Studio editorial está preparado em `apps/studio`. Copie o `.env.example`, informe o projeto Sanity e use
`pnpm --filter @doitbad/studio dev`. Consulte `docs/SPRINT-3.md` e `docs/LAUNCH-PLAN.md` antes de publicar.
O fluxo atual e o caminho para integrar o Studio estão descritos em `docs/EDITORIAL.md`.

## Decisões desta fundação

- Astro gera as páginas públicas; React será usado apenas em ilhas que exigirem estado.
- Tailwind está instalado para a futura composição de componentes. A direção visual inicial usa tokens CSS explícitos para facilitar revisão.
- Quicksand é a fonte de marca/interface e Inter atende textos longos.
- O tema segue o sistema na primeira visita, pode ser alterado manualmente e fica salvo em `localStorage`.
- Português é o único idioma publicado nesta etapa. Inglês, espanhol e alemão aparecem como “em preparação” e não geram páginas com conteúdo falso.
- Previews ficam `noindex` até `PUBLIC_ALLOW_INDEXING=true` ser definido numa publicação revisada.

Consulte também `../DoItBad-Documentation/PLANO-DE-EXECUCAO.md` e `docs/SPRINT-0-1.md`.

## Deploy mais curto (Vercel)

1. No Supabase SQL Editor, execute `supabase/migrations/202609280002_waitlist.sql`.
2. Importe esta pasta na Vercel e use `pnpm build` como Build Command e `dist` como Output Directory.
3. Cadastre as variáveis abaixo tanto em Preview quanto em Production e faça um novo deploy.
4. Em produção, aponte `doitbad.tech` e `www.doitbad.tech` para o projeto seguindo os registros mostrados pela própria Vercel.

Variáveis necessárias:

- `PUBLIC_TURNSTILE_SITE_KEY`: pública e incluída no HTML.
- `TURNSTILE_SECRET_KEY`: privada, valida o desafio no servidor.
- `SUPABASE_URL`: URL do projeto.
- `SUPABASE_SERVICE_ROLE_KEY`: privada; obtenha em Supabase > Project Settings > API. Não use a publishable key aqui.
- `RESEND_API_KEY`: privada; ativa o e-mail de confirmação.
- `RESEND_FROM_EMAIL`: por exemplo `DoItBad <novidades@doitbad.tech>`; o domínio precisa estar verificado.
- `RESEND_REPLY_TO`: endereço que receberá uma resposta direta do visitante, por exemplo `contato@doitbad.tech`.
- `PUBLIC_SITE_URL`: origem pública usada no botão do e-mail de confirmação; por padrão, `https://doitbad.tech`.
- `PUBLIC_ALLOW_INDEXING`: `false` em Preview e `true` em Production, depois da revisão final.

Preview é cada URL temporária criada pela Vercel para testar uma alteração antes de publicá-la. Production é a versão ligada ao domínio oficial. O mesmo projeto Supabase pode atender a landing e o beta no MVP, com tabelas e políticas separadas; desenvolvimento/testes devem usar outro projeto para não misturar cadastros reais.
