# Sprint 2 — demo interativa e preparação da captação

## Entrega desta sessão

A demonstração da home deixou de ser apenas visual. Ela apresenta três intenções predefinidas e permite que a pessoa escolha uma, veja o próximo gesto e peça uma redução adicional quando o primeiro passo ainda parecer grande.

O fluxo é deliberadamente público: não exige conta, não envia texto para uma API e deixa claro que é uma demonstração. Isso permite testar entendimento e sensação de controle antes de conectar dados reais.

Também foi incluída a seção “Quem está por trás”, com cartões preparados para foto, função, mini-bio e links externos. Os nomes, imagens e URLs atuais são placeholders de conteúdo e devem ser substituídos somente após aprovação do elenco.

## Arquivos principais

- `src/components/StepDemo.tsx` — estado local dos cenários e da redução do passo.
- `src/pages/[locale]/index.astro` — ilha React carregada com `client:load`.
- `src/styles/global.css` — layout, estados selecionados e responsividade já existentes.
- `src/components/TeamSection.astro` — seção componentizada do elenco e estrutura para fotos/links.
- `tests/landing.spec.ts` — fluxo desktop/mobile da demo e regressões de tema.

## Verificação

- `pnpm format` passou.
- `pnpm build` passou.
- `pnpm test:e2e` passou: 6/6 (desktop e Pixel 7).

## Ainda não implementado

O formulário continua desabilitado de propósito. A captação real precisa de Supabase, Resend, Turnstile, política de privacidade, domínio/remetente autorizados e estados de confirmação/descadastro. Não ativar o botão antes dessas decisões e configurações.

## Próximo passo

Criar a persistência de `waitlist_subscribers` em ambiente de teste e o endpoint de cadastro com validação, deduplicação, rate limiting e confirmação por e-mail. Depois testar falhas de banco/e-mail sem exibir sucesso enganoso.
