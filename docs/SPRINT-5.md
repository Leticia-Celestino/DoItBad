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

## Limites atuais

A tela de entrada não aceita credenciais ainda. Autenticação, recuperação e logout dependem do projeto Supabase do ambiente de desenvolvimento. A migração foi criada, mas não foi aplicada remotamente. O armazenamento local será removido quando a persistência integrada estiver disponível.

## Verificação

- `pnpm verify`: lint, typecheck e builds da landing e do beta passaram.
- `pnpm test:e2e`: 16/16 testes passaram em desktop e Pixel 7.
- Os testes do beta cobrem estado vazio, salvamento, persistência após recarregar, rotas e histórico sem dados fictícios.

## Próxima entrega

Configurar o projeto Supabase de desenvolvimento, aplicar a migração, implementar login/recuperação/logout e conectar o repositório de intenções. Validar isolamento com duas contas e tornar falhas de sessão, rede e banco visíveis.
