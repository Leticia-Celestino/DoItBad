# Intro — direção e fonte Rive

## Leitura da referência

O vídeo `References/2026-09-27 02-09-08.mp4` mostra o personagem acompanhando a borda de um painel escuro, descobrindo uma marca estacionária atrás dele. A relação entre gesto e painel dá sentido à cena. Espaço vazio, escala contida e uma pausa final tornam a marca protagonista.

A revisão anterior não cumpria esse desenho: personagem grande, corpo triangular rígido, logo em deslocamento e surgindo por opacidade, painel começando no meio da tela e falta de uma pausa clara com a marca sozinha.

## Composição implementada

- Fundo de papel uniforme, cortina verde quase preta.
- Personagem autoral com perfil irregular, túnica arredondada, traço fino e pernas articuladas no quadril e joelho.
- Figura com aproximadamente 160 unidades de altura no artboard de 900; antes, cerca de 500.
- Marca fixa ao centro, Quicksand 700 incorporada, B espelhado em terracota.
- Letras sempre presentes e opacas atrás do painel: a borda que acompanha o personagem produz a revelação da esquerda para a direita.
- Preparação do chute, extensão da perna e aceleração da cortina somente depois do contato.
- Saída do personagem e aproximadamente 0,7 s de marca isolada, seguida da transição para a página.

## Timeline

276 frames, 60 fps, 4,6 segundos:

| Frames  | Cena                              |
| ------- | --------------------------------- |
| 0–12    | Entrada, painel fechado           |
| 12–156  | Caminhada e revelação progressiva |
| 156–180 | Parada e preparação do chute      |
| 180–186 | Extensão da perna até o contato   |
| 186–214 | Cortina acelera para fora         |
| 200–232 | Personagem sai pela direita       |
| 232–276 | Apenas a marca centralizada       |

O componente encerra a camada aos 4,65 s após o carregamento, com fade de 600 ms. Carregamento malsucedido não prende a tela: existe um limite de 2,5 s para iniciar. Movimento reduzido e visitas seguintes na mesma sessão pulam a sequência.

## Fonte e enquadramento

`rive-intro/scene.rml` é a fonte atual, com os artboards `Intro` (1440 × 900) e `IntroMobile` (480 × 900), ambos com state machine `Intro`. O enquadramento retrato utiliza a composição em escala 0,62, centrada, para preservar a marca inteira em celulares. O runtime escolhe pelo aspecto da janela no carregamento.

No RML, o primeiro irmão é desenhado por cima. Ordem física: personagem, cortina, marca; o preenchimento do artboard fica atrás. Os SVGs antigos de poses são estudos, não a fonte da cena atual.

## Recompilar e revisar

```bash
rive rive-intro --verify
rive rive-intro --once
cp rive-intro/build/doitbad-intro.riv public/animations/intro.riv
pnpm verify
pnpm test:e2e
```

Use `/pt-br/?intro=1` para repetir a abertura mesmo se já foi vista na sessão. A preferência de movimento reduzido continua sendo respeitada.

A aprovação visual exige observar caminhada, preparação, contato, saída e marca isolada, em desktop e retrato. Testes de carregamento e encerramento não substituem essa revisão estética.
