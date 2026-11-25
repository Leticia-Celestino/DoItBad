# Entrega, experiência e estudo de caso

## Decisões propostas

- Código público `ENADE-ADS26`, independente de pesquisa ou turma privada. O código identifica a jornada; não autentica ninguém.
- Mesmo usuário e mesma matrícula em web/mobile. Login preserva intenção de ativação, sem criar registros antes da confirmação.
- Uma versão publicada é imutável. Código resolve a versão disponível; matrícula já existente é apresentada primeiro, com opção futura explícita de migração. Nada sobrescreve progresso silenciosamente.
- O primeiro gesto de 2 minutos inicia uma atividade com duração própria. Registrar `entry_minutes` e `estimated_activity_minutes` separadamente; não afirmar que a atividade completa cabe em 2 minutos. Validar essa linguagem no teste de usabilidade.
- O roteiro inteiro fica navegável na jornada. Somente ações aceitas geram tarefa e data no workspace. O aluno pode concluir, reagendar ou pausar; tarefas feitas continuam listadas.

## Estados de experiência

| Situação | Comportamento | Evidência de aceite |
| --- | --- | --- |
| Código inválido/restrito | Mensagem genérica e campo editável | Não revela convites privados |
| Não autenticado | Entrar/criar conta e retornar à prévia | Código preservado, sem autoativação |
| Preview desatualizada | Pedir revisão da nova versão antes de confirmar | Não matricula em versão diferente da vista |
| Já matriculado | Abrir jornada existente | Dois cliques/abas não duplicam |
| Diagnóstico interrompido | Retomar item/rascunho | Sem reset ou nota fictícia |
| Pouca evidência | Exibir lacuna e quantidade de observações | Sem percentual de domínio arbitrário |
| Sem ação elegível | Catálogo/retomada manual e explicação | API não falha com lista vazia |
| Rede cai na resposta | Rascunho privado e fila com chave única | Reenvio não duplica tentativa |
| Atividade concluída | Manter histórico e estado marcado | Conclusão não implica acerto |
| Jornada suspensa | Histórico acessível; novas ofertas bloqueadas | Motivo e suporte disponíveis |
| Retirada da pesquisa | Encerrar coleta de pesquisa | Jornada e tarefas continuam disponíveis |
| Exclusão da conta | Aplicar política de exclusão/retensão aprovada | Sem órfãos identificáveis em relatórios |

Não oferecer notificações até existirem consentimento/preferência, deduplicação, cancelamento e horário silencioso. Emails transacionais de conta não são inscrição em marketing.

## Modelo e invariantes de dados

Proposta de tabelas (migrations ainda não criadas):

- `journey_templates`: slug/código normalizado único, visibilidade, status.
- `journey_template_versions`: template, semver, snapshot, hash, fontes, publicação/revisão. Único `(template_id, version)`.
- `journey_enrollments`: `user_id` do JWT, versão, estado, preferências e início. Único `(user_id, template_version_id)`; índice por proprietário/estado. Vínculo ativo com versão anterior tratado antes de criar nova matrícula.
- `learning_activities` e `question_versions`: conteúdo versionado e pools separados. Gabarito/rubrica privada em tabela sem SELECT para clientes. Nunca colocar resposta correta no JSON público.
- `activity_offers`: matrícula, atividade, motor/versionamento, razões, prazo e estado. Tarefa do workspace se relaciona por chave única de oferta, sem depender de título.
- `activity_attempts`: proprietário, oferta, versão de item, resposta, estado, avaliação, timestamps do servidor e revisão para concorrência. Único `(user_id, idempotency_key)` com hash do payload.
- `review_schedules`: matrícula/habilidade, próxima janela, versão da regra, estado; índice `(enrollment_id, due_at)`.
- `assessments`: matrícula, tipo, forma congelada, início, término e estado. Itens de diagnóstico/pós-teste isolados de treino, acesso item a item conforme fase.
- `research_enrollments`: protocolo/consentimento versionado, pseudônimo, alocação se aplicável, entrada/retirada; separado da conta educacional.
- `journey_events`: event_id único, versão, entidades de referência, timestamp do servidor, campos permitidos. Analytics não recebe resposta discursiva, nome ou email.

RLS por proprietário nas entidades pessoais, leitura de catálogo somente publicada/autorizada, escrita editorial somente no servidor por papel validado. API nunca confia no `user_id` enviado pelo cliente.

Ativação é uma transação: verificar versão/autorização → inserir matrícula com unicidade → preparar estado inicial → confirmar. Falha reverte tudo. Submissão verifica proprietário, estado, item/versão e hash; mesma chave e payload retorna resultado anterior, payload diferente retorna conflito. Estados: tentativa `draft → submitted → evaluated`; avaliações finalizadas são imutáveis salvo revisão auditada.

Offline: guardar somente rascunhos mínimos por usuário e versão, limpar no logout, não armazenar gabaritos. Em conflito, preservar cópia local, mostrar comparação e exigir escolha; não sobrescrever resposta final no servidor. Feature flag deve impedir anunciar offline como disponível antes desse fluxo estar testado.

## Conteúdo e regras pedagógicas

Cada item precisa de objeto, habilidade principal, justificativa do mapeamento, operação cognitiva, fonte/licença, alternativas válidas, resposta restrita, explicação de distratores, tempo estimado, acessibilidade, autor e revisor. Fluxo `draft → in_review → approved → published → archived`.

Fonte normativa delimita objetos e habilidades, não pesos nem sequência de estudo. Os seis agrupamentos de UX e os pesos do motor são decisões do produto. Blueprint registra zero itens aprovados até revisão efetiva. Critérios de promoção não podem ser satisfeitos por geração automática de questões.

Motor inicial: apenas itens aprovados/autorizados; priorizar revisão vencida e lacunas sem abandonar FG/discursiva; limitar carga ao tempo informado; registrar candidatos/razões/versão e desempate reproduzível. Trocar ação registra rejeição, não erro do aluno. Regra provisória de revisão 1/3/7/14 dias é experimento, não prescrição universal; nunca empilhar tarefas acima do teto aceito.

Painel distingue execução, acerto, evidência por habilidade e cobertura por objeto. Rótulos iniciais: sem evidência, inicial, em desenvolvimento, consistente. Definir limiares com revisão pedagógica antes de implementá-los; não inventar percentuais com amostra pequena.

Discursiva: rubrica interna explícita e revisão humana; sugestões de IA identificadas. Simulado tem 15 FG + 30 ADS objetivas + uma ADS discursiva, até 240 minutos. Não usar o timer de foco de 2 minutos como timer de avaliação. Não publicar equivalência com nota oficial.

## Protocolo de estudo — rascunho a congelar antes do recrutamento

Hipótese: reduzir barreira de início e melhorar retomada com ações contextualizadas. Aprendizagem deve ser medida separadamente por itens novos. Piloto de viabilidade primeiro; comparação aleatória somente após revisão metodológica/institucional aplicável.

Para uma comparação: grupo convencional e grupo adaptativo recebem conteúdo essencial equivalente; mesmo diagnóstico, janela, definição de oportunidade e acesso a suporte. Alocação persistida no servidor, não sorteada novamente por sessão. Mudanças posteriores têm data, motivo e versão. Não chamar uma comparação observacional de experimento causal.

Unidade de análise: participante. Definir antes da coleta uma oportunidade elegível como uma oferta diária disponível dentro do horário aceito, deduplicada por participante/dia, observada ou não; medir exposição separadamente. Não criar oportunidades extras no grupo adaptativo para alterar denominadores. A definição final precisa de revisão metodológica e deve ser congelada no protocolo.

Desfecho de execução: oportunidades elegíveis com primeira ação significativa / oportunidades elegíveis, por participante. Visualizar não conta como iniciar. Reportar separadamente taxa entre ofertas vistas. Desfechos secundários: dias com tentativa, conclusão entre inícios, retomada após intervalo predefinido, dificuldade percebida, pré/pós-teste e retenção em itens novos. Identificar abandonos e dados ausentes; não calcular resultado só entre concluintes.

Eventos mínimos: ativação, diagnóstico iniciado/concluído, oferta criada/vista/iniciada/recusada, resposta submetida, feedback disponibilizado, atividade concluída, revisão devida/concluída, retomada e avaliação submetida. Conclusão exige critério da atividade, não apenas timeout. Dicionário final deve declarar trigger, proprietário, event_id, timestamp, versão e campos autorizados.

Antes de recrutar: definir elegibilidade, tamanho e duração factíveis, plano de análise, formulários equivalentes, responsável metodológico, consentimento separado, prazo de retenção, retirada e governança de acesso. Pendências não são resolvidas com uma caixa de aceite genérica. Não fixar 60 participantes como recrutados nem atribuir vínculo institucional não confirmado.

Relatório final: fluxo de participantes, contexto, versão do produto/conteúdo, problemas técnicos, adesão, dados faltantes, incerteza dos resultados, entrevistas incluindo abandono, limitações e decisões de produto. Nota do Enade não é a única medida nem promessa de efeito.

## Plano executável e responsáveis por papel

| Entrega | Responsável | Dependência | Aceite/estado atual |
| --- | --- | --- | --- |
| Blueprint ADS/FG e fontes | Conteúdo + revisão pedagógica | Normas fornecidas e FG consultada | Inventário pronto; revisão independente e retificações pendentes |
| Contrato de ativação | Engenharia | UX/versão/autorização | Rascunho OpenAPI entregue; implementação pendente |
| Migrações/RLS/transações | Engenharia | Contrato revisado | Testar acesso cruzado, rollback e replay antes de liberar |
| Ativação web/mobile | Engenharia + UX | Matrícula funcional | Testes de retorno do login, rede e duas abas |
| Banco mínimo e diagnóstico | Autor + revisor independente | Blueprint | Zero questões publicadas até revisão |
| Tentativa/feedback/agenda | Engenharia + conteúdo | Banco mínimo | Retomada e avaliação corretas, sem vazamento de gabarito |
| Motor/revisões/painel | Engenharia + pedagogia | Evidências reais | Reproduzível, carga limitada, lacunas transparentes |
| Discursiva/simulado/pós-teste | Conteúdo + engenharia | Pools revisados | Formas e rubricas auditáveis, tempo/acessibilidade testados |
| Protocolo/consentimento | Responsável do estudo | Público definido | Revisão institucional/metodológica e retenção definidas |
| Operação e abertura | Operação + suporte | Todos os bloqueadores P0 | Restauração, carga e suporte comprovados |

## Matriz mínima de validação

- **Segurança:** RLS A/B, acesso editorial, gabaritos ausentes nos bundles e respostas pré-submit, JWT expirado, código privado não enumerável.
- **Integridade:** idempotência concorrente, payload diferente com mesma chave, rollback, item suspenso, nota revisada sem apagar histórico.
- **Experiência:** 360 px/desktop, teclado/leitor de tela, contraste, sem tempo obrigatório no estudo, texto longo/código/tabelas, retomada em outro cliente, conclusão permanece visível.
- **Pedagogia:** todo item publicado com objeto/habilidade/revisor; FG e ADS presentes; pós-teste sem contaminação por treino; explicações verificadas.
- **Operação:** medir baseline/p95/erros sob carga representativa; ensaiar restauração em ambiente isolado; rollback de app compatível com migrations; alertas e responsável de plantão definidos.
- **Emails:** HTML responsivo, links/OTP preservados, sem descadastro de marketing em email de segurança, nenhuma campanha enviada durante validação técnica.

## Liberação e rollback

Ativar por feature flag e ondas pequenas após os aceites, com matrícula para novos usuários pausável. Suspeita de vazamento ou corrupção de respostas bloqueia novas tentativas/abertura; preservar histórico e rascunhos para recuperação. Item errado é suspenso/versionado e reavaliado com auditoria. Rollback de frontend não apaga dados; migrations expansivas antes de versões consumidoras, remoções somente após compatibilidade comprovada.

Não publicar a jornada enquanto banco revisado, integridade, autorização, suporte e calendário informacional estiverem pendentes. Se o prazo não permitir o escopo completo, rotular explicitamente como piloto parcial e reduzir abrangência/amostra; não anunciar preparação integral com lacunas ocultas.
