# Sprint 5 — base do beta web

## Arquitetura confirmada

O beta é uma aplicação separada da landing, construída com React 19, TypeScript, Vite e React Router. A landing continua em Astro. O workspace pnpm executa verificações e builds dos dois aplicativos.

## Primeira fatia entregue

- Rotas reais para entrada, atividade e histórico.
- Interface responsiva com os tokens visuais do DoItBad.
- Estado vazio real, sem intenções ou progresso demonstrativos.
- Captura de intenção com salvamento explícito e mensagens de sucesso e falha.
- Persistência local identificada na interface como exclusiva do desenvolvimento.
- Migração Supabase inicial para perfis e intenções.
- RLS que restringe leitura e escrita ao proprietário autenticado; o papel anônimo não recebe acesso às tabelas.

## Entrega concluída

- Login, criação de conta, recuperação de senha e logout via Supabase Auth.
- Rotas do beta protegidas quando as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas.
- Intenções persistidas remotamente e ordenadas por atualização; o fallback local permanece apenas para desenvolvimento sem configuração.
- RLS aplicada na migração remota: cada conta só lê e altera as próprias intenções e perfil.
- Sessão restaurada automaticamente e falhas de autenticação, rede e banco exibidas na interface.

O ambiente sem variáveis continua abrindo o modo local para testes e desenvolvimento visual.

## Verificação

- `pnpm verify`: lint, typecheck e builds da landing e do beta passaram.
- `pnpm test:e2e`: 16/16 testes passaram em desktop e Pixel 7.
- Os testes do beta cobrem estado vazio, salvamento, persistência após recarregar, rotas e histórico sem dados fictícios.

## Validação manual recomendada

Criar duas contas de teste no ambiente conectado, salvar uma intenção em cada uma e confirmar que nenhuma conta enxerga a intenção da outra. Remover as contas de teste após a validação.
