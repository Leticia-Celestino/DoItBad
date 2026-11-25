# DoItBad Journeys — plano conciliado com a especificação fornecida

Estado: planejamento, sem migrations, endpoints ou jornada publicados.

## Referências e precedência

- Especificação funcional/pedagógica: [versão 1.0 fornecida](../../DoItBad-Documentation/template-enade/DoItBad_Jornada_ENADE_ADS_2026_Especificacao.md), de 15/10/2026. Define o escopo pretendido; exemplos, pesos, metas e datas condicionais não são funcionalidades ou resultados existentes.
- PDF local da Portaria Inep 169/2026, na mesma pasta: lido integralmente por extração textual. Confirma a estrutura de 15 objetivas FG, 30 objetivas específicas, uma discursiva específica e quatro horas; cinco características de perfil, duas competências, onze habilidades e vinte objetos específicos. Esta conferência é do arquivo fornecido, não uma verificação online de retificações posteriores.
- O planejamento anterior fica como histórico. Adotar código `ENADE-ADS26` e slug `enade-ads-2026`.

## O que muda no desenho

1. A entrada principal será **Adicionar jornada → código → prévia → confirmar → diagnóstico → primeira ação**, em web e app. Link pode preencher o código como conveniência futura, sem substituir o fluxo especificado.
2. O produto precisa distinguir conteúdo, oferta, tentativa, resposta, revisão e conclusão. Copiar uma lista de tarefas não atende ao escopo fornecido.
3. Matrícula vincula usuário a uma versão imutável. Reativar abre a mesma jornada; não cria outra cópia.
4. O próximo passo pedagógico usa regras auditáveis no backend. A recomendação LLM atual de tarefas pessoais não é o motor de avaliação nem a fonte de gabaritos.
5. Estudo e pesquisa têm inscrições separadas. A jornada continua disponível a quem não participar da pesquisa.

## Conciliação com o produto atual

**Duração — proposta a validar:** manter o primeiro gesto de 2 minutos do beta, seguido de atividade pedagógica com duração própria. Modelar `entry_minutes` separadamente de `estimated_activity_minutes`; não alterar o contrato `estimated_minutes: 2` da recomendação atual para representar um simulado. Tempo de prova e cronômetro de estudo são conceitos diferentes; o cronômetro de estudo permanece opcional. Esta é uma conciliação proposta: a especificação chama também atividades de 8–15 minutos de microações.

**Conclusão:** uma tarefa marcada prova conclusão declarada da tarefa, não acerto. A tentativa registra resposta e avaliação separadamente; progresso pedagógico só deriva de evidências válidas. Tarefas feitas permanecem nas listas.

**Agenda:** catálogo completo pertence à jornada. Somente ofertas aceitas/agendadas geram tarefas relacionadas em Meu dia, Minhas tarefas e Calendário. Usar uma relação estável oferta→tarefa e impedir duplicação. Revisões podem ser recalculadas dentro da agenda da jornada conforme preferência; preservar compromissos pessoais e datas alteradas manualmente.

**Foco e simulado:** o foco de 2 minutos atual não suporta o fluxo de uma avaliação de quatro horas. Avaliações precisam de estado, rascunho, submissão e retomada próprios, sem reutilizar o contador de foco como limite de prova.

## Auditoria inicial e lacunas

| Base atual inspecionada | Reuso | Falta para Journeys |
| --- | --- | --- |
| React web, clientes mobile e pacote core compartilhado | Identidade visual, navegação e tipos comuns | Ativação e telas da jornada nos dois clientes |
| Supabase Auth e workspace com RLS | Identidade e tarefas privadas | Templates/versionamento, matrículas e autorização de conteúdo |
| `WorkspaceProvider.save` grava um item por operação | Edição das tarefas pessoais | Matrícula transacional/idempotente e vínculo oferta→tarefa |
| API de recomendações no serviço existente | Autenticação e infraestrutura após auditoria | Seleção pedagógica determinística, tentativas e avaliação no servidor |
| Eventos atuais de tarefas/foco/humor | Integração com histórico | Eventos pedagógicos com semântica e deduplicação próprias |

Esta auditoria é inicial de código, não comprova backups, capacidade, telemetria, sincronização offline ou políticas de produção. Conferir essas capacidades antes do piloto.

## Entregas em ordem

### 1. Blueprint normativo e contrato

Criar manifesto com fonte, artigo/inciso, texto normativo, versão, revisão e `authority_level`. Cadastrar ADS-01..20 e CI-H1..5/CII-H1..6 a partir do PDF. Manter os seis agrupamentos de UX como interpretação pedagógica. Reservar FG-01..12 e habilidades FG, pendentes de conferência na Portaria 154. Não marcar a cobertura FG como validada só porque consta da especificação.

Definir esquema validável para template, versão, matrícula, estado, atividade, oferta, tentativa, revisão e avaliação. Elaborar contrato OpenAPI usando os endpoints propostos na seção 7.3 da especificação. Resolver autenticação, códigos públicos/privados, versão suspensa, idempotency keys, unicidade, erros e política de datas antes das migrations.

### 2. Ativação vertical web e mobile

Adicionar jornada, resolver `ENADE-ADS26`, prévia de versão e fontes, confirmação e matrícula única. Persistir seleção durante login. Criar tela da jornada vazia honesta enquanto conteúdo estiver em revisão. Feature flag impede oferecer atividades ainda não aprovadas.

Aceite: duas abas/reenvios criam uma matrícula; usuário A não lê B; código inválido/restrito/suspenso tem tratamento; retorno web→app conserva a mesma matrícula e versão.

### 3. Diagnóstico e uma atividade completa

Entregar um recorte vertical com itens revisados: diagnóstico limitado com lacunas explícitas, oferta, tentativa, submissão, feedback, conclusão e integração com tarefa. Nenhum gabarito antecipado no bundle ou payload de estudante. Rascunhos e reenvios precisam de política de conflito e deduplicação. Registrar fontes e revisão humana independente antes de publicação de itens.

Aceite: falha de rede não duplica resposta/pontuação; reentrada preserva progresso; terminar tarefa não concede acerto; fallback funciona sem LLM; pós-teste não reutiliza itens treinados.

### 4. Cobertura, revisões e avaliações

Expandir conteúdo revisado para ADS e FG; regras de cobertura e revisão com teto diário; painel por objeto e habilidade com quantidade de evidências; discursiva com rubrica interna identificada; simulado de 46 questões e pós-teste com formas próprias. O recorte anterior não equivale à definição de pronto completa da especificação.

### 5. Operação e piloto

Eventos, protocolo, participação opcional, suporte, carga medida, restauração verificada e critérios go/no-go da especificação. A/B, número de participantes e janelas de outubro/novembro são propostas condicionais, não decisões executadas. Replanejar datas pelo progresso real e calendário oficial confirmado.

## Materiais ainda necessários

- Texto primário da Portaria 154 para conferir FG; a pasta tem apenas a Portaria 169 e a especificação.
- Edital operacional/calendário vigente e retificações antes de divulgar data da prova. A janela até 29/11 no roadmap não confirma essa data.
- Banco de itens, gabaritos, justificativas, licenças e revisores: a especificação contém critérios e meta de 80–120, não os itens prontos.
- Responsáveis editoriais e operacionais, público de recrutamento e protocolo. A menção à FIAP não comprova parceria, turma confirmada ou acesso a dados acadêmicos.

Próximo passo recomendado: produzir o manifesto ADS e o contrato de matrícula em rascunho, mantendo conteúdo FG pendente de conferência. Implementação vem após consolidar esse contrato; nenhum recrutamento ou alteração no beta foi feito nesta etapa.
