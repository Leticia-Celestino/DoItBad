# Sprint 6 — operação editorial do blog

## Entrega concluída

- Busca textual no índice de artigos, com atualização instantânea e mensagem para zero resultados.
- Filtros por categoria com estado ativo, teclado e layout responsivo nos quatro idiomas.
- Mantida a origem editorial Sanity com fallback local e URLs multilíngues existentes.
- Studio já possui categorias, capas, autoria, referências, revisão e ordenação por publicação.

## Rotina editorial

1. Criar ou revisar o artigo no Studio.
2. Publicar e conferir as quatro versões quando houver tradução.
3. Confirmar capa, alt text, autor, referências e data de revisão.
4. Disparar o deploy pelo webhook do Sanity e verificar a página publicada.

## Próximos incrementos

Newsletter editorial, RSS e métricas de leitura podem ser adicionados sem alterar o modelo atual.
