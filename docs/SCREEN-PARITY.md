# Retomada das telas — 2026-10-09

## Pedido e referência principal

A usuária pediu recuperar o trabalho anterior e entregar **todas as telas da referência,
com os respectivos detalhes e estados**, sem considerar uma tela concluída apenas porque
existe uma rota ou uma implementação aproximada.

Referência principal: `../../Adaptar telas para design clean/`.
Referência anterior: `../../doitbad_app_design/`.
Comparação recursiva de `src` em 2026-10-09: conteúdo idêntico, incluindo as 18 telas,
componentes, contextos, estilos e imagens. A pasta mais recente passa a ser a fonte
principal mesmo enquanto ambas são iguais. Não alterar os originais de referência.

Aplicação de produção em desenvolvimento: `apps/mobile` (Expo/React Native),
`apps/web` (React/Vite) e `packages/core` (dados e regras compartilhados).
Manter a decisão registrada de desktop responsivo, amplo e sem moldura de celular;
preservar conteúdo, funcionalidades e identidade das telas ao adaptar sua composição.

## Inventário obrigatório

Esta é uma inspeção de código, não uma aprovação visual nem uma nova validação em aparelho.
“Existe” abaixo não significa que a tela esteja completa ou idêntica à referência.

| #   | Referência       | Implementação nativa atual                  | Implementação web atual                            | Trabalho a conferir/concluir                                                                                                           |
| --- | ---------------- | ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Splash.tsx`     | `src/Splash.tsx`, abertura em `_layout.tsx` | `/`, `/abertura`, `SplashPage`                     | Abertura, logo, ilustração e transição implementados; captura web registrada                                                           |
| 2   | `Welcome.tsx`    | `/boas-vindas`                              | `/boas-vindas`, `WelcomePage`                      | Composição com CozyRoom, textos e destino dos dois CTAs                                                                                |
| 3   | `Login.tsx`      | `/entrar`                                   | `/entrar`, `LoginPage`                             | Formulário, logo, espaçamentos, erros e retorno de autenticação                                                                        |
| 4   | `Signup.tsx`     | `/entrar?mode=signup`                       | `/entrar?mode=signup`, modo interno de `LoginPage` | Nome e confirmação funcionais; CTA de boas-vindas abre diretamente este estado                                                         |
| 5   | `Task.tsx`       | `/tarefa`, etapa 0 de `Start`               | `/tarefa`, etapa de `StartPage`                    | Sugestões, entrada de tarefa, teclado e continuidade                                                                                   |
| 6   | `Blockers.tsx`   | Etapa 1 de `Start`                          | Etapa de `StartPage`                               | Tela própria no fluxo, seleção múltipla, voltar preservando escolhas                                                                   |
| 7   | `Step.tsx`       | Etapa 2 de `Start`                          | Etapa de `StartPage`                               | Card destacado, sugestões, outro passo, microação selecionada e início                                                                 |
| 8   | `Timer.tsx`      | `/foco?id=…`                                | `/foco/:id`                                        | Anel, pausa, extensão e conclusão automática estão funcionais; conferir fidelidade visual e retorno do segundo plano                   |
| 9   | `Done.tsx`       | `/conclusao?id=…`                           | `/conclusao/:id`                                   | Celebração, ilustração, continuar e histórico sem duplicar sessão                                                                      |
| 10  | `History.tsx`    | `/`, `/historico`, ambos usam `Dashboard`   | `/historico`, `HistoryPage`                        | Anel/meta, quatro indicadores, Semana/Mês/Ano, ações e lista alinhados; modo noturno persistente em ambas as plataformas               |
| 11  | `Tasks.tsx`      | `/tarefas`, `Tasks`                         | `/tarefas`, `TasksPage`                            | Prioridades, dependências, recorrência, projetos com cor, microações, exclusão e sugestão estão funcionais; conferir fidelidade visual |
| 12  | `Calendar.tsx`   | `/agenda` e `/calendario`, `MonthGrid`      | `/calendario`, `CalendarPage`                      | Mês/Dia e conclusão estão funcionais; conferir apresentação de projetos e recorrência contra a referência                              |
| 13  | `Map.tsx`        | `/mapa`, `Explore` e `PathMap`              | `/mapa`, `MapPage`                                 | Trilha única e próximos passos marcáveis/persistidos alinhados à referência                                                            |
| 14  | `Challenges.tsx` | `/desafios`                                 | `/desafios`, `ChallengesPage`                      | Destaque do desafio semanal, progresso e disponíveis; web não reproduz a hierarquia da referência                                      |
| 15  | `Recovery.tsx`   | `/retomada`                                 | `/retomada`, `RecoveryPage`                        | Cena noturna, convite, alternativa de adiar e retomada persistida                                                                      |
| 16  | `Intentions.tsx` | `/intencoes`, `Intentions`                  | `/intencoes`, `ActivityPage`                       | Cards com ícone e data, formulário, vazio e persistência estão funcionais; conferir composição visual                                  |
| 17  | `Stats.tsx`      | `/estatisticas`                             | `/estatisticas`, `StatsPage`                       | Gráfico emocional, indicadores e composição dos insights com dados reais                                                               |
| 18  | `Zen.tsx`        | `/zen`                                      | `/zen`, `ZenPage`                                  | Cena noturna dentro do card, sons, durações 10/25/45 e início do timer                                                                 |

## Lacunas confirmadas por código

- O tipo `Task` em `packages/core/src/index.ts` preserva compatibilidade com registros antigos
  e agora representa prioridade, dependências, recorrência e conclusão de microações.
- A escolha do próximo passo respeita prioridade, bloqueios e a primeira microação pendente.
- Projetos possuem identificador, nome e cor compartilhados; tarefas antigas continuam
  compatíveis pelo texto e tarefas novas também guardam `projectId`.
- Calendário web e nativo possuem Mês/Dia; tarefas podem ser concluídas no dia e a recorrência
  é exibida. O mapa permite marcar cada microação e sincroniza a alteração.
- O histórico de referência oferece alternância persistente de tema claro/noturno. Web e
  nativo guardam a escolha; os componentes-base, navegação, fundo e controles nativos usam
  a paleta correspondente.
- Cadastro web e nativo coletam nome; os cards de intenções exibem a data de criação.
- As etapas de bloqueios e próximo passo existem dentro do fluxo; não são arquivos
  de rota separados. A ausência de arquivos separados não significa ausência de tela.
- O roteiro antigo de teste Android procura `Seu ritmo. Seu próximo passo.`, texto
  do dashboard web. O dashboard nativo atual usa `Cada ação conta. Mesmo as pequenas.`.
  A falha antiga nesse seletor, sozinha, não comprova defeito no deep link.

## Critério de conclusão

1. Conferir cada uma das 18 telas lado a lado com a referência no mesmo tamanho de
   viewport: cores, tipografia, ilustrações, hierarquia, cards, botões e espaçamentos.
2. Conferir os estados internos: formulários abertos, tarefas expandidas, filtros,
   calendário mensal/diário, pausa, conclusão, tema, vazio, carregamento e erro.
3. Percorrer todos os acessos e retornos pela interface; não aceitar telas alcançáveis
   apenas por deep link. Garantir que teclado, rolagem e barra inferior não escondam ações.
4. Usar dados persistidos da conta; dados demonstrativos da referência não devem ser
   apresentados como progresso real. Preservar autenticação e isolamento existentes.
5. Validar alterações de tarefa e microações entre web e nativo; manter controle de
   revisões para evitar sobrescrever alterações feitas em outro dispositivo.
6. Registrar capturas e resultados reais. Build, typecheck e existência de rota não
   equivalem a aprovação visual. Não declarar Android/iOS validados por exportar bundle.

## Ponto de continuidade

As 18 telas web foram capturadas em 390×844 em `/tmp/doitbad-web-screens`; a referência
equivalente está em `/tmp/doitbad-reference-screens`. O roteiro de captura agora percorre
o fluxo completo e fica em `scripts/capture-web-screens.mjs`. O release Android foi
recompilado em 2026-10-12. O Moto G20 não apareceu em `adb devices` na tentativa final,
portanto a instalação e as capturas físicas deste APK continuam sendo o único item de
validação visual pendente; build ou inspeção de código não substituem essa evidência.
