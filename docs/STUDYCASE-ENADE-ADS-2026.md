# Primeiro estudo de caso: preparação para o Enade ADS 2026

Status: proposta para discussão, sem implementação ou publicação do template.

> Atualização após leitura dos materiais fornecidos: a especificação `../../DoItBad-Documentation/template-enade/DoItBad_Jornada_ENADE_ADS_2026_Especificacao.md` é a referência de escopo. A conciliação e o plano revisado estão em [JOURNEYS-ENADE-IMPLEMENTATION.md](JOURNEYS-ENADE-IMPLEMENTATION.md). O restante deste documento preserva a proposta inicial; código, entrada e escopo abaixo foram superados pela especificação fornecida. O código proposto correto é `ENADE-ADS26`, com ativação por código em web e app.
Base do beta: commit `0235182`. Planejamento iniciado em 16/10/2026.

## Objetivo e hipótese

Permitir que um estudante transforme um roteiro de preparação em tarefas pequenas e retomáveis. Investigar se isso facilita começar e voltar a estudar. Concluir microações não demonstra domínio de conteúdo nem permite atribuir melhora na nota ao produto.

## Entrada recomendada

Usar um link compartilhável como caminho principal, com código digitável como alternativa. Exemplo ilustrativo de código: `ENADE-ADS-2026` (ainda não existe).

Fluxo: link ou Planejar → Usar template → digitar código → prévia → entrar/criar conta, se necessário → escolher módulos, início e dias disponíveis → revisar distribuição → confirmar aplicação → Meu dia.

- Preservar a escolha do template durante o login.
- Prévia informa autoria, versão, fontes, módulos, quantidade de tarefas e carga estimada.
- Confirmar antes de criar registros; nunca instalar ao abrir o link.
- Código público identifica conteúdo, não concede acesso aos dados de uma turma. Convites privados exigem autorização própria no servidor.
- Catálogo de templates pode vir depois. Um editor visual e um marketplace não são necessários para este piloto.

## Experiência do estudante

- Um projeto de estudos aparece em Minhas tarefas; apenas o que foi agendado para o dia aparece em Meu dia e no Calendário.
- Permitir ajustar datas e períodos, pausar e retomar sem perder o progresso.
- Tarefas concluídas permanecem listadas e marcadas; ficam fora das recomendações de próximo passo.
- A microação inicial cabe em 2 minutos. A atividade completa de estudo pode durar mais e deve ter estimativa independente.
- A pessoa pode começar a microação ou guardá-la na tarefa e no calendário.
- Revisar a agenda antes de confirmar. Não preencher todo o calendário nem mover compromissos existentes automaticamente.
- O restante do roteiro deve ser acessível pelo projeto/visualização de todas as datas, mesmo sem data atribuída.

## Conteúdo e curadoria

O Inep inclui Tecnologia em Análise e Desenvolvimento de Sistemas na seleção de elaboradores/revisores de itens do Enade 2026. Isso indica preparação da área para a edição; não é a matriz de referência nem o edital de aplicação.

Fonte consultada: https://download.inep.gov.br/bni/tecnologia_em_analise_e_desenvolvimento_de_sistemas_edital_186.pdf

Portal para completar a pesquisa: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enade-bacharelado-e-superiores-de-tecnologia/enade-bacharelado-e-superiores-de-tecnologia/

Antes de publicar o conteúdo:

1. Localizar e registrar edital, diretrizes/matriz de ADS e cronograma oficial aplicáveis a 2026; validar também as orientações da instituição participante.
2. Mapear cada competência aos módulos e às atividades, com URL, data da consulta e revisão pedagógica.
3. Selecionar questões públicas e materiais autorizados, preservando fonte, edição e gabarito. Não apresentar questões geradas como oficiais.
4. Separar avaliação diagnóstica, estudo, prática e revisão. Os assuntos específicos serão definidos após o mapeamento, não como uma lista presumida de disciplinas.
5. Revisar manualmente um módulo inicial antes de expandir o roteiro.

Exemplo de atividade, ainda não conteúdo oficial: objetivo “interpretar uma consulta SQL”; primeiro gesto “abrir a questão e identificar as tabelas citadas”; continuidade “anotar o resultado esperado, resolver e conferir a explicação”. A competência e a fonte precisam ser validadas antes da publicação.

## Arquitetura proposta

A base atual já possui tarefas, projetos, passos, datas, períodos e eventos no workspace compartilhado. Reutilizar esses registros e criar uma camada de templates, sem duplicar o aplicativo para ADS.

Entidades propostas:

- `templates`: identificador estável, slug, título, descrição, visibilidade e estado de publicação.
- `template_versions`: versão imutável, conteúdo validado, fontes, autor e revisão. Conteúdo pode ser JSON com módulos, tarefas e passos com identificadores estáveis.
- `template_installations`: usuário, versão, preferências de agenda e estado da aplicação.
- Relação entre instalação, tarefa de origem e item criado no workspace, para rastrear progresso sem depender do título editável.
- Código/link resolve um template publicado. Turmas e convites privados são entidades separadas, se o piloto exigir acesso restrito.

Aplicação deve ser transacional no servidor: validar sessão e versão, criar instalação/projeto/tarefas e confirmar tudo em uma operação. O `save` atual do workspace grava um item por vez; um laço de chamadas no cliente poderia deixar uma instalação parcial.

Garantir idempotência e unicidade por usuário/versão no MVP: clique duplo, duas abas e repetição após falha retornam a mesma instalação. Novas versões não sobrescrevem tarefas editadas nem conclusões; oferecer migração explícita em fase posterior. Manter RLS por proprietário e verificar isolamento entre usuários.

## Papel da IA

A curadoria define o roteiro. A IA ajuda a reduzir a próxima tarefa a um começo concreto usando objetivo, passos, competência, material e progresso. A API atual recebe apenas o locale e seleciona uma tarefa; será necessário verificar e ampliar o contexto e a seleção para respeitar o módulo escolhido.

Manter fallback curado quando a IA falhar. A IA não deve inventar fontes, gabaritos ou datas, nem marcar atividades como concluídas. Correção automática de questões fica fora do MVP.

## Piloto e avaliação

Decidir com a organizadora instituição/turma, número de participantes, duração e responsável pedagógico. Como proposta inicial, realizar um piloto curto com um módulo revisado antes de oferecer o roteiro inteiro.

Separar uso do template de participação em pesquisa. Explicar quais dados serão analisados, finalidade, acesso e prazo de retenção; confirmar os requisitos institucionais antes de recrutar participantes ou coletar dados do estudo.

Métricas propostas: ativação (instalação até primeiro começo), retorno em dias distintos, microações iniciadas/concluídas e facilidade percebida para começar/retomar. Definir denominadores, janela e critérios antes do piloto. Usar identificadores pseudônimos e resultados agregados; evitar textos pessoais de tarefas e notas nos relatórios. Não criar ranking de produtividade.

## Etapas e critérios de aceite

1. **Curadoria e desenho:** confirmar público, fontes oficiais, um módulo e protótipo de prévia/ativação. Saída: roteiro revisado e fluxo acordado.
2. **Fundação:** contratos versionados, migração, políticas e aplicação transacional. Testar acesso indevido, instalação duplicada, falha parcial e preservação de tarefas existentes.
3. **Experiência web:** código/link, login com retorno, prévia, agenda editável e integração ao workspace. Testar códigos inválidos, versão retirada, dias indisponíveis, recarga e tarefas concluídas persistentes.
4. **IA contextual:** selecionar tarefa elegível do módulo, fornecer fontes/contexto e salvar microações sem duplicação. Testar fallback e tarefas bloqueadas/concluídas.
5. **Piloto:** revisão pedagógica final, consentimento separado, métricas mínimas e acompanhamento qualitativo. Só então publicar o template e recrutar.

Primeiro incremento recomendado: prototipar a prévia e a aplicação de um módulo curado, com link e código equivalentes. Android/iOS podem consumir as tarefas pelo workspace, mas a entrada de ativação nativa precisa de uma etapa própria de implementação e validação.

## Decisões pendentes

- Qual instituição/turma e quem revisará o conteúdo?
- O piloto será aberto ou por convite restrito?
- Já existe material de preparação e uma data-alvo confirmada pela instituição?
- O estudo será inicialmente web ou requer ativação também no Android?

Essas respostas refinam o piloto; não impedem o desenho do contrato e do fluxo de prévia.
