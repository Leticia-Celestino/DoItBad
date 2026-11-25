# Roteiro de apresentação — DoItBad em 3 minutos

## Como usar

- Apresente somente os slides 1 a 7. Os slides 8 a 10 são anexos para perguntas.
- Fale em ritmo calmo, entre 125 e 140 palavras por minuto.
- Não leia os bullets. Use-os como apoio visual e mantenha contato com a pessoa entrevistadora.
- Faça uma pausa curta ao trocar de slide.
- Se houver interrupção, responda e retome pela frase de transição indicada.

Tempo total planejado: **3 minutos**.

## Slide 1 — DoItBad

**Tempo: 0:00–0:20 — 20 segundos**

> O DoItBad é um produto web e mobile criado para uma situação comum: saber o que precisa ser feito, mas sentir que começar é grande demais. A proposta é transformar essa intenção em um próximo passo pequeno, concreto e retomável.

**Transição:** “Primeiro, vou contextualizar o problema que guiou o produto.”

## Slide 2 — Problema

**Tempo: 0:20–0:45 — 25 segundos**

> O problema não é falta de lista. É a distância entre intenção e ação, causada por ambiguidade, cansaço ou perda de contexto. Em vez de adicionar cobrança, a hipótese do produto é reduzir o tamanho do próximo passo e preservar o fio da meada para a retomada.

**Transição:** “A partir dessa hipótese, desenhei um fluxo muito direto.”

## Slide 3 — Solução

**Tempo: 0:45–1:15 — 30 segundos**

> O fluxo começa com uma tarefa, identifica o bloqueio, propõe uma microação e inicia uma sessão curta. Ao terminar, guarda nota, humor e próximo passo. Assim, lista, calendário, mapa, histórico e retomada mostram o mesmo trabalho sem inventar progresso. O objetivo não é aumentar pressão, mas diminuir o custo de começar novamente.

**Transição:** “Esse fluxo precisava funcionar de forma coerente em web e aplicativo.”

## Slide 4 — Produto multiplataforma

**Tempo: 1:15–1:45 — 30 segundos**

> A solução tem 18 telas e estados equivalentes na web e no aplicativo. Eu compartilhei tipos e regras no pacote TypeScript core, mas mantive componentes próprios: no desktop há sidebar e composição horizontal; no mobile há navegação compacta, safe area e armazenamento seguro de sessão. Assim eu preservei paridade funcional sem sacrificar a experiência de cada plataforma.

**Transição:** “Essa separação também aparece claramente na arquitetura.”

## Slide 5 — Arquitetura

**Tempo: 1:45–2:15 — 30 segundos**

> A arquitetura é um monorepo. Astro atende a presença pública, SEO e quatro idiomas; React com Vite atende o workspace; Expo entrega o aplicativo; e o core TypeScript concentra domínio. Supabase fornece autenticação, PostgreSQL e RLS. A inteligência artificial fica em uma API FastAPI separada para proteger segredos, minimizar dados e validar respostas.

**Transição:** “A parte mais sensível foi garantir que dados e IA continuassem controláveis.”

## Slide 6 — Dados, segurança e IA

**Tempo: 2:15–2:40 — 25 segundos**

> Segurança entra no banco com RLS por usuário e validações SQL. A revisão otimista evita sobrescrever mudanças de outro dispositivo. Na IA, regras escolhem tarefas elegíveis, Pydantic valida o JSON e um fallback determinístico mantém o produto funcionando se o modelo falhar. A IA auxilia a decisão, mas nunca controla o domínio.

**Transição:** “Por fim, eu validei o resultado de ponta a ponta.”

## Slide 7 — Resultado

**Tempo: 2:40–3:00 — 20 segundos**

> O resultado é um produto executável: 75 testes E2E aprovados, zero falhas, 18 telas e Android validado fisicamente. O principal aprendizado foi manter produto, arquitetura e evidência coerentes. O próximo passo é validar iOS em hardware e medir com usuários o tempo até a primeira microação. Obrigada — fico à disposição para aprofundar qualquer decisão.

## Versão contínua para ensaio

> O DoItBad é um produto web e mobile criado para uma situação comum: saber o que precisa ser feito, mas sentir que começar é grande demais. A proposta é transformar essa intenção em um próximo passo pequeno, concreto e retomável.
>
> O problema não é falta de lista. É a distância entre intenção e ação, causada por ambiguidade, cansaço ou perda de contexto. Em vez de adicionar cobrança, a hipótese do produto é reduzir o tamanho do próximo passo e preservar o fio da meada para a retomada.
>
> O fluxo começa com uma tarefa, identifica o bloqueio, propõe uma microação e inicia uma sessão curta. Ao terminar, guarda nota, humor e próximo passo. Assim, lista, calendário, mapa, histórico e retomada mostram o mesmo trabalho sem inventar progresso. O objetivo não é aumentar pressão, mas diminuir o custo de começar novamente.
>
> A solução tem 18 telas e estados equivalentes na web e no aplicativo. Eu compartilhei tipos e regras no pacote TypeScript core, mas mantive componentes próprios: no desktop há sidebar e composição horizontal; no mobile há navegação compacta, safe area e armazenamento seguro de sessão. Assim eu preservei paridade funcional sem sacrificar a experiência de cada plataforma.
>
> A arquitetura é um monorepo. Astro atende a presença pública, SEO e quatro idiomas; React com Vite atende o workspace; Expo entrega o aplicativo; e o core TypeScript concentra domínio. Supabase fornece autenticação, PostgreSQL e RLS. A inteligência artificial fica em uma API FastAPI separada para proteger segredos, minimizar dados e validar respostas.
>
> Segurança entra no banco com RLS por usuário e validações SQL. A revisão otimista evita sobrescrever mudanças de outro dispositivo. Na IA, regras escolhem tarefas elegíveis, Pydantic valida o JSON e um fallback determinístico mantém o produto funcionando se o modelo falhar. A IA auxilia a decisão, mas nunca controla o domínio.
>
> O resultado é um produto executável: 75 testes E2E aprovados, zero falhas, 18 telas e Android validado fisicamente. O principal aprendizado foi manter produto, arquitetura e evidência coerentes. O próximo passo é validar iOS em hardware e medir com usuários o tempo até a primeira microação. Obrigada — fico à disposição para aprofundar qualquer decisão.

## Se pedirem detalhes depois dos 3 minutos

### “Por que separar Astro e React?”

> A landing é conteúdo público, internacionalizado e orientado a SEO; o workspace é uma aplicação autenticada e altamente interativa. Usei a ferramenta adequada para cada contexto e compartilhei somente o domínio.

### “Por que JSONB no banco?”

> Os registros compartilham proprietário, revisão e ciclo de sincronização, mas os payloads evoluem em ritmos diferentes. JSONB acelerou a evolução, e os `CHECK constraints` mantêm tipos, campos e limites válidos.

### “Como você impede a IA de inventar tarefas?”

> O código filtra as tarefas elegíveis antes da inferência, envia apenas seus IDs, valida o JSON e confirma que o ID retornado pertence ao conjunto. Qualquer falha ativa o fallback determinístico.

### “A chave pública do Supabase no cliente é segura?”

> Ela identifica o projeto, mas não autoriza acesso irrestrito. A autorização real depende do JWT e das políticas RLS. A chave `service_role` permanece exclusivamente no servidor.

### “O que os testes encontraram de verdade?”

> Além de regressões de texto, a suíte revelou que o cabeçalho mobile estava ocultando o botão da sidebar e tornando rotas secundárias inacessíveis. Corrigi a navegação e a execução final terminou com 75 aprovados, 1 ignorado e zero falhas.

## Checklist de 60 segundos antes da entrevista

- Abra o PPTX no modo apresentação e confirme a proporção 16:9.
- Oculte os slides 8 a 10 se a plataforma avançar automaticamente.
- Deixe o dossiê técnico aberto para perguntas.
- Teste o compartilhamento de tela e o tamanho do cursor.
- Tenha uma aba pronta com a captura desktop do histórico.
- Não diga que iOS foi validado fisicamente; ele continua como próximo passo.
- Termine em “fico à disposição para aprofundar qualquer decisão” e pare.
