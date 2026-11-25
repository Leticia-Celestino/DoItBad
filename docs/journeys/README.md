# Dossiê de execução — ENADE-ADS26

Status: estrutura de produto e engenharia; jornada ainda não implementada. A especificação fornecida continua sendo a referência de escopo. Não confundir documentos concluídos com funcionalidades entregues.

## Artefatos e ordem de execução

1. `enade-ads-2026.blueprint.json`: inventário rastreável dos 32 objetos e 16 habilidades; exemplos pedagógicos separados dos nomes normativos. Gerado por `node scripts/build-enade-blueprint.mjs`, verificado com `--check`.
2. `activation.openapi.yaml`: contrato inicial de prévia e matrícula. Rotas propostas, ainda não existentes.
3. `DELIVERY-AND-STUDY.md`: UX, modelo de dados, regras de avaliação, experimento, aceite e liberação.
4. `../EMAILS.md`: emails de conta, geração, validação e publicação.

## Evidência normativa

Portaria 169: PDF local fornecido, conferido. Portaria 154: texto conferido na reprodução do DOU hospedada na UFSJ; o endereço do DOU não abriu na consulta. Os 12 objetos e cinco habilidades FG agora têm referência verificável. Não se presume ausência de retificações; conferir antes da abertura.

Fonte complementar: https://arquivos.ufsj.edu.br/arquivos/20260681894a6b14571044b12092f6360/Matrizes_de_Referncia_ENADE_2026_Contedo_da_Formao_Geral.pdf

`examDate` permanece nulo. Datas do roadmap são planejamento condicionado, não anúncio de prova.

## Definição de estrutura completa

Cada requisito tem uma regra, um responsável por papel e uma evidência de aceite. Pendências externas são bloqueadores explícitos, nunca campos preenchidos com informação inventada. Publicação exige banco revisado, contrato implementado e testes executados; um JSON com `publishable:false` não pode ativar uma jornada para estudantes.
