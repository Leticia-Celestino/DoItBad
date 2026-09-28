# Sprint visual — primeira camada de movimento

## Por que esta entrega veio agora

A fundação já tinha a paleta, a tipografia e o conceito do caminho, mas ainda não transmitia as referências de Huyml e Suuhaa em movimento. Esta fatia antecipa parte da sprint de acabamento visual para que a identidade seja avaliada como experiência, não apenas como layout estático.

## Implementado

- Abertura curta com marca em uma cortina de cor, sem bloquear a navegação.
- Entrada suave da página depois da abertura.
- Revelação progressiva das seções quando entram no viewport.
- Movimento orgânico discreto no orbe e no sol do hero.
- Fallback completo para `prefers-reduced-motion`.
- Nenhum significado depende da animação; conteúdo permanece no HTML.

## Limites desta etapa

Ainda não foram adicionados GSAP, Three.js, modelos 3D ou cenas pesadas. A decisão é validar primeiro ritmo, acessibilidade e personalidade com CSS e APIs nativas. O 3D só deve entrar quando houver uma cena que conte algo sobre o produto e não apenas adorne a página.

## Verificação

- `pnpm format` passou.
- `pnpm verify` passou com zero erros (há apenas um hint de depreciação do TypeScript ESLint).
- `pnpm test:e2e` passou: 6/6 em desktop e Pixel 7.

## Próximo passo visual

Revisar a abertura e as transições em navegador real, ajustar duração/easing com feedback da fundadora e então estudar uma única cena 3D progressiva para o hero ou a seção de ecossistema.
