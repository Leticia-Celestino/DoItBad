# Operação editorial

## Fonte de conteúdo

O build consulta o dataset público `production` do projeto Sanity `xqfqfioy`. As variáveis
`PUBLIC_SANITY_PROJECT_ID` e `PUBLIC_SANITY_DATASET` podem substituir esses padrões por ambiente.
Se a consulta não retornar artigos ou estiver indisponível, `src/content/articles.ts` preserva uma
versão publicável do site. Rascunhos não são consultados em produção.

## Identidade e traduções

Cada tradução possui seu próprio `slug`. O campo `translationKey` identifica versões equivalentes
e alimenta o seletor de idioma e `hreflang`. Nunca altere a chave ao traduzir um artigo. Slugs
publicados só devem mudar junto com um redirecionamento permanente em `vercel.json`.

## Fluxo para publicar

1. Criar ou selecionar o autor.
2. Criar um documento por idioma com a mesma `translationKey`.
3. Preencher título, slug, resumo, categoria, capa/alt, corpo, ação prática e datas.
4. Revisar referências, direitos da imagem e linguagem.
5. Abrir o preview e conferir as quatro rotas, metadados e links equivalentes.
6. Publicar somente os idiomas aprovados.
7. O webhook do Sanity solicita um novo deploy estático da Vercel.

## Configuração inicial

- Studio: `SANITY_STUDIO_PROJECT_ID` e `SANITY_STUDIO_DATASET`.
- Landing: `PUBLIC_SANITY_PROJECT_ID` e `PUBLIC_SANITY_DATASET`.
- Preview editorial: `SANITY_PREVIEW=true` e `SANITY_API_READ_TOKEN` somente no servidor de build.
- Dataset público contém somente material editorial publicado; não armazenar segredos nele.
- Restringir usuários do Studio e origens CORS aos ambientes necessários.
- Produção mantém `SANITY_PREVIEW=false`; o token de leitura de rascunhos nunca é variável pública.

## Estado da conta em 07/10/2026

- Projeto ativo: `DoItBad` (`xqfqfioy`).
- Dataset: `production`, público.
- Publicação: Letícia, papel `Administrator`.
- Studio hospedado: `https://doitbad-editorial.sanity.studio/`.
- Conteúdo editorial: um autor publicado e 12 artigos em rascunho, três para cada idioma.
- As famílias `return-after-weeks`, `preparation-delays-start` e `keep-the-thread` possuem versões
  em `pt-br`, `en`, `es` e `de`.
- CORS: `http://localhost:3333` e `http://127.0.0.1:3333`, necessários para o Studio local.
- Novos editores só serão convidados quando seus e-mails e papéis forem aprovados.

## Importação inicial

O script `scripts/build-sanity-editorial-import.ts` converte o conteúdo local em NDJSON para o
Sanity. Ele usa identificadores determinísticos e gera os artigos como rascunhos, evitando uma
publicação acidental. A importação de 07/10/2026 foi validada com 1 autor, 12 rascunhos, nenhuma
publicação e três artigos por idioma. Antes de uma nova importação, crie um backup do dataset.

## Verificação

Execute `pnpm verify` e `pnpm test:e2e`. No preview publicado, confira canonical, `hreflang`, capa
social, sitemap, layout mobile e ausência de rascunhos antes de permitir indexação.
