# Estudo de personagens — linguagem humana do DoItBad

## Intenção

Personagens podem dar ao DoItBad uma presença humana e tornar estados abstratos — começar, travar, pausar e retomar — mais fáceis de reconhecer. A referência de ilustração editorial da Davines é um ponto de partida de sensibilidade, não um modelo para copiar: não reutilizar personagens, poses, traços ou assets da marca.

## Direção recomendada

- Formas simples, orgânicas e táteis, com aparência de recorte, tecido ou argila digital.
- Rostos econômicos, sem expressões caricatas ou infantilização do usuário.
- Corpo e postura comunicam o estado; o personagem não “resolve” a vida da pessoa.
- Paleta derivada dos tokens existentes, com uma cor de destaque por estado.
- Pequenas imperfeições controladas para preservar a sensação artesanal.
- Personagens sem gênero, idade ou corpo obrigatório; usar variações sem transformar diversidade em decoração.

## Primeiro elenco narrativo

1. **A pessoa que começa** — segura uma peça pequena e descobre que ela cabe no dia.
2. **A pessoa que pausou** — reencontra um fio deixado sobre a mesa; representa continuidade, não fracasso.
3. **A pessoa que simplifica** — dobra uma tarefa grande até sobrar um gesto possível.

Eles não devem aparecer como mascotes permanentes em toda a interface. Cada aparição precisa explicar um estado, orientar uma transição ou criar acolhimento em uma tela vazia.

## Sistema de animação

- Loop curto de respiração, balanço ou olhar: 4–8 segundos, com pausa natural.
- Entrada por desenho do contorno, recorte ou deslocamento de camadas; evitar surgimento elástico excessivo.
- Interação principal: o personagem reage ao próximo passo escolhido, não a cada movimento do mouse.
- Sempre oferecer versão estática e respeitar `prefers-reduced-motion`.
- Não usar animações contínuas em todos os cards; uma cena principal por viewport é suficiente.

## Técnica a validar

1. **SVG em camadas** para ilustrações leves, acessíveis e controláveis por CSS/GSAP.
2. **Rive** somente se precisarmos de estados interativos complexos no produto; não adicionar à landing sem uma hipótese clara.
3. **Lottie** pode servir para uma abertura exportada, mas exige cuidado com peso, foco e manutenção.
4. **Three.js** fica reservado para uma cena 3D específica; não é o formato inicial recomendado para os personagens.

O primeiro protótipo deve ser um personagem SVG estático com três estados e uma animação de entrada. Medir peso, desempenho, compreensão e reação antes de criar uma família inteira.

## Primeiro protótipo implementado

`src/components/CharacterSketch.astro` introduz uma figura autoral de linhas econômicas no hero: corpo geométrico, rosto mínimo, gesto de segurar o fio e uma pequena marca de orientação. A animação é apenas um balanço vertical lento; a ilustração continua compreensível parada e é desativada com movimento reduzido.

## Onde usar

- Hero: uma aparição breve que acompanha o fio, sem competir com a promessa.
- Demo: o personagem reage quando a pessoa diminui o passo.
- Retomada: uma postura de reencontro, com movimento mínimo.
- Estados vazios e artigos: ilustrações estáticas, sem loops contínuos.

## Checklist antes de produzir assets finais

- [ ] Aprovar silhueta, paleta e nível de detalhe.
- [ ] Definir autoria, licença e arquivo-fonte editável.
- [ ] Testar contraste e legibilidade em modo claro/noturno.
- [ ] Testar com movimento reduzido, teclado e leitor de tela.
- [ ] Validar se a cena ajuda a entender o produto ou apenas enfeita.
