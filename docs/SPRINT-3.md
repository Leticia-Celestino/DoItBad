# Sprint 3 — conteúdo, idiomas e preparação de lançamento

## Entregue localmente

- Home, demo, FAQ, privacidade, índice editorial, artigos e 404 em português, inglês, espanhol e alemão.
- Três artigos por idioma com autoria, publicação, revisão e ação prática.
- Seletor de idioma preserva a rota equivalente.
- Canonical, `hreflang`, `x-default`, Open Graph, Twitter Cards e JSON-LD por página.
- Sitemap internacionalizado e `robots.txt`.
- Sanity Studio preparado em `apps/studio`, com schemas de autor e artigo, conteúdo por documento/idioma e chave para relacionar traduções.
- Auditoria axe em desktop e Pixel 7; correções de contraste e navegação por teclado aplicadas.

## Verificação

- `pnpm verify` cobre lint, Astro check, typecheck do beta e Studio e builds da landing e do beta.
- Playwright cobre os quatro idiomas, canonical/alternates, troca equivalente de idioma, JSON-LD, conteúdo central, Rive, demo e beta.
- O build gera 30 páginas e `sitemap-index.xml`.
- Artefatos principais da abertura: `intro.riv` com cerca de 66 KiB, runtime JavaScript Rive com cerca de 188 KiB e WebAssembly com cerca de 1,9 MiB. O runtime é descartado após a abertura; medir Core Web Vitals no preview publicado antes de liberar indexação.

## Dependências externas restantes

- Definir `SANITY_STUDIO_PROJECT_ID`, escolher o dataset e configurar usuários/CORS para iniciar e publicar o Studio.
- Migrar os artigos locais para o dataset e trocar a leitura local pela consulta GROQ publicada.
- Revisar inglês, espanhol e alemão com pessoas fluentes antes de liberar indexação.
- Confirmar o endereço `contato@doitbad.tech`, política final, domínio e projeto de hospedagem.
- Medir Lighthouse/Core Web Vitals no preview, pois o ambiente local não representa CDN, rede ou dispositivo reais.

Essas dependências mantêm a Sprint 3 em revisão; não impedem o uso e a avaliação local das páginas.
