# Sprint 2 — landing utilizável e captação

## Implementação concluída localmente

- Demo pública com cenários predefinidos, sem conta e sem envio de texto pessoal.
- Formulário localizado com validação, estados de envio, sucesso e erro.
- Turnstile vinculado à ação e ao hostname esperado.
- Persistência privada no Supabase; `anon` e `authenticated` não leem a lista.
- Cadastro idempotente e reserva transacional que evita reenvios simultâneos.
- Rate limiting atômico no Supabase: cinco tentativas por hash de IP a cada 15 minutos.
- Double opt-in com tokens aleatórios armazenados somente como SHA-256.
- Falha do Resend retorna erro e libera uma nova tentativa; não há sucesso enganoso.
- Confirmação e descadastro localizados em `/[locale]/preferencias/`.
- Cabeçalhos `List-Unsubscribe` e `List-Unsubscribe-Post` para clientes compatíveis.

## Implantação concluída em 07/10/2026

1. Projeto Supabase `fdfhqmmlbxgpzfsatavm` restaurado e em estado `ACTIVE_HEALTHY`.
2. Migrações base e `202610070001_waitlist_lifecycle.sql` aplicadas; histórico reparado após a
   reinicialização automática do banco durante a restauração.
3. `WAITLIST_RATE_LIMIT_SALT` separado configurado em produção e preview.
4. Supabase, Turnstile, Resend e links públicos configurados na Vercel.
5. Diagnóstico protegido confirmou rate limit, confirmação e descadastro via RPC com HTTP 200; o
   envio Resend de teste retornou HTTP 200.

A Sprint 2 está concluída em produção. O segredo temporário usado no teste foi removido após a
validação.
