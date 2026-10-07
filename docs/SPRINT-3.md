# Sprint 3A/3B — operação editorial e acabamento do blog

## Implementação concluída localmente

- Home, índice, artigos, privacidade, preferências e 404 nos quatro idiomas.
- Studio Sanity com artigos, autores, tradução, capa, ação prática, referências e datas.
- Repositório editorial de build que lê documentos publicados do Sanity quando
  `PUBLIC_SANITY_PROJECT_ID` e `PUBLIC_SANITY_DATASET` estão definidos.
- Builds de preview podem ler rascunhos com token exclusivamente no servidor; produção usa a perspectiva publicada.
- Fallback versionado para os artigos locais quando o CMS não está configurado ou está indisponível.
- `translationKey` relaciona traduções sem obrigar a mesma URL.
- Slugs próprios em português, inglês, espanhol e alemão.
- Seletor de idioma, canonical e `hreflang` apontam para a tradução equivalente.
- Redirecionamentos permanentes preservam as URLs antigas.
- Capas por artigo em Open Graph, Twitter Card e dados estruturados.
- Datas localizadas, tempo de leitura e artigos relacionados.
- Sitemap internacionalizado e previews `noindex`.

## Ativação do Sanity — concluída em 07/10/2026

1. Projeto `xqfqfioy`, dataset público `production` e Studio hospedado configurados.
2. CORS local autorizado e identidade administrativa confirmada.
3. `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET` e `SANITY_PREVIEW=false` configurados na Vercel.
4. Um autor e 12 artigos publicados, com três versões em cada idioma e `translationKey` preservada.
5. Build real consultou o conteúdo publicado; o fallback continua disponível para indisponibilidade.
6. Capas do CDN Sanity foram incluídas na CSP e recebem transformação `auto=format`.

## Revisões externas antes da indexação

- Revisão humana de português, inglês, espanhol e alemão.
- Aprovação de autoria, capas, textos alternativos, referências e política editorial.
- Lighthouse/Core Web Vitals no preview publicado.
- Teste de rascunho, publicação, atualização, remoção e retorno de deploy.

O código de 3A/3B e a ativação do CMS estão concluídos. O Studio permanece disponível para novas
revisões e publicações editoriais.
