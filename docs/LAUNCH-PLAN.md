# Plano de lançamento e retorno

## Antes do deploy

1. Revisar as quatro traduções e os artigos; manter `PUBLIC_ALLOW_INDEXING=false` até a aprovação. (Concluído; a indexação foi ativada na promoção final.)
2. Confirmar domínio, contato, política de privacidade e responsáveis por conteúdo e operação.
3. Configurar Sanity, Supabase, Resend e Turnstile em ambientes separados de preview e produção; aplicar as migrações `202609280002_waitlist.sql` e `202610070001_waitlist_lifecycle.sql` na ordem. (Concluído.)
4. Executar `pnpm install --frozen-lockfile`, `pnpm verify` e `pnpm test:e2e` no commit candidato.
5. Publicar um preview imutável e verificar cadastro, confirmação, reenvio controlado, descadastro, links, 404, sitemap, acessibilidade e desempenho em celular e desktop. (Concluído no preview protegido.)
6. Registrar o identificador da versão atual de `doitbad.tech` e o identificador do candidato.

## Publicação

1. Promover exatamente o artefato aprovado no preview.
2. Aplicar variáveis de produção sem copiar segredos para o repositório ou cliente.
3. Validar HTTPS, canonical, `hreflang`, sitemap, publicação do Sanity e ciclo completo da lista no domínio final.
4. Ativar `PUBLIC_ALLOW_INDEXING=true` somente depois da validação final.

## Retorno

1. Promover novamente o deploy anterior pelo painel do provedor.
2. Não reverter migrações destrutivamente; desativar o recurso incompatível e preservar dados recebidos.
3. Confirmar home, artigos e formulário depois do retorno.
4. Registrar causa, período afetado e destino dos cadastros realizados durante o incidente.

O deploy de produção foi promovido pela Vercel; não houve alteração de DNS.
