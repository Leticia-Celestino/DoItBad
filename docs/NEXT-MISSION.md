# Próxima missão — experiência completa DoItBad

## Retomada de 2026-10-09 — todas as telas da referência

A referência principal agora é `../Adaptar telas para design clean`. Comparação
recursiva confirmou que seu `src` é idêntico ao de `../doitbad_app_design` nesta data.
A usuária reafirmou que quer todas as telas e seus detalhes; a implementação atual
não deve ser considerada completa pela simples existência das rotas.

Inventário das 18 telas, lacunas confirmadas e critérios de conclusão:
[SCREEN-PARITY.md](./SCREEN-PARITY.md). Este inventário complementa o histórico abaixo.
Prioridade, dependências, recorrência, microações, exclusão e a alternância Mês/Dia
foram concluídas nesta retomada em web e nativo. Projetos agora também possuem registro
compartilhado com nome e cor. Ainda há pendências de tema noturno nativo e fidelidade
visual. O seletor usado no teste Android antigo procura um título
do web que não corresponde ao dashboard nativo atual; revisar isso antes de atribuir
a falha exclusivamente à autenticação.

## Objetivo

Transformar a versão beta em uma experiência completa para Android, iOS e web desktop,
usando `../doitbad_app_design` como referência visual e funcional para as 18 telas.
O desktop deve ter layout próprio, responsivo e em tela cheia, sem moldura de celular.

## Direção do produto

- Mobile focado em um passo por vez, timer, intenção e retomada.
- Desktop com dashboard amplo, sidebar, histórico, mapa de execução e estatísticas.
- Mesma conta, dados e progresso sincronizados entre dispositivos via Supabase.
- Produto genérico: francês é um uso pessoal da fundadora, não um modo ou adaptação do produto.
- Preservar a identidade visual da referência e adaptar layout, navegação e interação a cada plataforma.

## Escopo autorizado

1. Consolidar tokens e componentes do design de referência.
2. Adaptar onboarding, login e fluxo de foco para desktop responsivo.
3. Conectar tarefas, intenções, timer e histórico ao Supabase.
4. Implementar todas as telas da referência com dados reais: abertura, boas-vindas,
   login, cadastro, tarefa, bloqueios, próximo passo, timer, conclusão, histórico,
   tarefas, calendário, mapa, desafios, retomada, intenções, estatísticas e modo zen.
5. Completar estados vazios, carregamento, erros, recuperação de acesso e retomada.
6. Validar a experiência em Android, iOS, tablet e web desktop, incluindo navegação
   por teclado, acessibilidade e persistência entre sessões.

## Estado e stack

- A fundadora confirmou que já validou o beta; a validação anterior não bloqueia esta missão.
- Stack web existente: React + TypeScript + Vite + React Router, com Supabase para autenticação e dados.
- Stack confirmada nesta sessão: React Native + Expo + Expo Router para Android/iOS;
  React + Vite para web; núcleo TypeScript compartilhado em `packages/core`, no workspace pnpm.
- A referência contém dados demonstrativos e valores fixos em algumas telas;
  a entrega deve usar dados persistidos e resultados calculados a partir deles.

## Implementação desta sessão

- Web com sidebar, dashboard amplo e navegação inferior em telas pequenas, sem moldura.
- Tarefas (criar, editar, concluir/reabrir), calendário, mapa e intenções.
- Fluxo tarefa → bloqueios → passo editável → timer → conclusão → anotação de retomada.
- Histórico e desafios calculados sobre sessões reais; registro opcional de humor.
- Modo zen e áudio ambiente opcional gerado localmente, sem reprodução automática.
- Aplicativo Expo com navegação nativa, fontes locais, ilustração SVG, seletor nativo de data,
  armazenamento de credenciais em SecureStore e mesmo repositório de dados do web.
- Migração `202610080001_workspace.sql` preparada com RLS, revisões por registro e
  restrição de uma sessão ativa por conta. Aplicada ao projeto remoto vinculado
  `fdfhqmmlbxgpzfsatavm` em 2026-10-08; histórico local/remoto sincronizado.
- Tarefas agora preservam prioridade, dependência, recorrência e microações concluídas;
  a ordenação evita sugerir tarefas bloqueadas. Lista, mapa e calendário permitem marcar
  microações ou tarefas, e a exclusão usa revisão para rejeitar dados desatualizados.
- Migração `202610120001_workspace_delete.sql` aplicada ao mesmo projeto em 2026-10-12.
  A integração remota confirmou exclusão pelo proprietário e bloqueio entre contas.
- Migração `202610120002_workspace_projects.sql` aplicada em 2026-10-12. Projetos são
  sincronizados como registros próprios, e tarefas novas guardam a referência sem perder
  o texto usado pelos registros antigos. A integração remota entre dois clientes passou.
- O modo noturno web e nativo é persistente. Intenções exibem data de criação em web e
  nativo, e timers em execução concluem automaticamente ao chegar a zero sem duplicar sessão.
- As 18 telas possuem rotas/estados navegáveis no web e no nativo. O web ganhou abertura,
  cadastro direto, composição compacta de boas-vindas, barra flutuante, Histórico alinhado
  à referência e um roteiro que captura o fluxo inteiro em 390×844. No nativo, a barra
  flutuante, o tema e o Mapa foram alinhados à referência.

## Etapas necessárias antes de declarar a experiência pronta para lançamento

1. Migração aplicada e isolamento SQL validado com duas identidades temporárias,
   usando o papel authenticated e claims de cada identidade, com rollback integral.
   `scripts/verify-workspace-rls.sql` cobre leitura do proprietário, isolamento de leitura
   e atualização, inserção com proprietário falsificado, sessão ativa única e bloqueio
   anônimo. A integração remota também passou com duas contas temporárias autenticadas:
   login, renovação, isolamento, leitura entre clientes e rejeição de edições antigas.
2. URLs de autenticação web/mobile configuradas em `supabase/config.toml` e aplicadas.
   Recuperação validada no navegador, com link real, formulário de senha e novo login;
   retorno `doitbad://entrar` validado via HTTP. Confirmação de cadastro validada com
   links web/mobile e bloqueio de login antes de confirmar. Entrega de e-mail ainda pendente.
3. Validar sincronização entre web e aplicativo nativo com a mesma conta e conflitos reais.
4. Gerar builds instaláveis e testar Android/iOS: teclado, áudio, acessibilidade, retorno
   do segundo plano e links de autenticação. Exportar bundles não substitui esse teste.
5. Revisar visualmente as telas nativas em aparelhos, incluindo tablet. As 18 telas web foram
   capturadas no mesmo viewport de 390×844 da referência; a instalação e a captura do release
   nativo atual ainda dependem do Moto G20 voltar a aparecer no ADB.

Nenhuma publicação ou envio às lojas foi executado. A migração de workspace foi aplicada
ao banco remoto nesta retomada. A CLI possui autenticação salva válida mesmo sem a variável
`SUPABASE_ACCESS_TOKEN`; o script `scripts/apply-supabase-test.sh` agora aceita esse fluxo.
Os testes de `@doitbad/core` e as checagens TypeScript de web e mobile passaram nesta retomada.

## Integração remota reproduzível

`node --experimental-strip-types scripts/verify-workspace-remote.mjs` usa a autenticação
salva da CLI, mantém chaves apenas em memória e cria duas contas temporárias, removidas
com seus registros ao final. Cobre também criação de tarefa pela interface web e
persistência de sessão após recarregar. Não envia e-mails.

SDK Android disponível. O Moto G20 apareceu no começo da retomada, mas desconectou antes da
instalação final e não apareceu na última consulta ao ADB.

Retomada de 2026-10-08: dez contêineres de outros projetos (EcoTrace, Ricebowl e
Alura) foram parados, sem remoção de volumes. APK release arm64 gerado e instalado
com sucesso no Moto G20 (`ZF523R6LQW`). Comando utilizado, em `apps/mobile/android`:
`ANDROID_HOME=/home/leticia/Android/Sdk NODE_ENV=production ./gradlew
:app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2
--no-parallel --no-daemon`. Log local: `/tmp/doitbad-android-build.log`.
Configuração pública Supabase disponível em `apps/mobile/.env.local`, ignorado pelo Git.

O APK release arm64 atual foi recompilado em 2026-10-12 e está em
`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`. O roteiro Android foi
atualizado para o texto real do dashboard e remove a conta temporária no bloco `finally`.
Próxima ação: instalar este APK quando o aparelho reaparecer, percorrer as 18 telas com
`scripts/review-android-screens.mjs` e comparar as capturas com a referência. iOS permanece
pendente.
