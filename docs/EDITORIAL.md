# Publicação de artigos

## Como funciona hoje

Os artigos exibidos pela landing são gerados estaticamente a partir de
`src/content/articles.ts`. Cada artigo precisa ter a mesma `slug` nos quatro idiomas para que a
troca de idioma preserve a página equivalente.

Para publicar um artigo agora:

1. Salve a capa otimizada em `public/editorial/`, preferencialmente em WebP, com proporção 3:2 e
   pelo menos 1280 px de largura.
2. Adicione o artigo em cada lista de idioma dentro de `articlesByLocale`.
3. Preencha `slug`, `title`, `summary`, `category`, `readingTime`, `cover`, `paragraphs` e `action`.
4. Use a mesma `slug` nas quatro traduções e um texto alternativo localizado em `cover.alt`.
5. Execute `pnpm verify` e `pnpm test:e2e` antes de publicar a branch `main`.

O site é estático: depois do merge na `main`, a Vercel gera a listagem, a página individual, os
metadados e o sitemap novamente.

## Caminho recomendado: Sanity Studio

O formulário administrativo já está modelado em `apps/studio/schemaTypes/articleType.ts`, com
idioma, chave de tradução, título, slug, resumo, categoria, capa, autor, conteúdo, ação prática,
referências e datas.

O Studio ainda não alimenta as páginas públicas. Antes de usá-lo como fluxo editorial é preciso:

1. Criar ou escolher o projeto e o dataset no Sanity.
2. Configurar `SANITY_STUDIO_PROJECT_ID` e `SANITY_STUDIO_DATASET`.
3. Publicar o Studio com acesso restrito às pessoas editoras.
4. Adicionar ao Astro um cliente de leitura e consultas para artigos e autores.
5. Configurar webhook de publicação do Sanity para disparar um novo deploy da Vercel.
6. Manter o conteúdo local como fallback durante a migração e só removê-lo depois de validar as
   quatro traduções, previews e URLs existentes.

Com essa integração concluída, novos artigos poderão ser criados, revisados e publicados pelo
navegador, sem editar código.
