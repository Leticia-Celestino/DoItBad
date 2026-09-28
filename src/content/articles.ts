import type { Locale } from '../i18n/config';

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readingTime: string;
  author: string;
  publishedAt: string;
  reviewedAt: string;
  paragraphs: string[];
  action: string;
};
const meta = { author: 'Equipe DoItBad', publishedAt: '2026-09-27', reviewedAt: '2026-09-27' };
const slugs = [
  'voltar-a-um-projeto-depois-de-semanas',
  'quando-preparar-demais-adia-o-comeco',
  'guardar-o-fio-da-meada-antes-de-pausar',
] as const;

export const articlesByLocale: Record<Locale, Article[]> = {
  'pt-br': [
    {
      ...meta,
      slug: slugs[0],
      title: 'Como voltar a um projeto depois de semanas',
      summary: 'Retomar não começa reconstruindo tudo. Começa encontrando um fio visível.',
      category: 'Retomar',
      readingTime: '4 min de leitura',
      paragraphs: [
        'Quando um projeto fica parado, a primeira vontade costuma ser compensar o tempo perdido. Abrimos todas as abas, refazemos o plano e tentamos recuperar a versão de nós mesmos que estava em movimento.',
        'Um retorno mais gentil pode começar por uma pergunta menor: qual é a última coisa que ainda faz sentido aqui? Às vezes é uma frase, um arquivo ou uma dúvida anotada no canto.',
        'Escolha esse fio e deixe o próximo gesto visível. O objetivo do primeiro retorno não é terminar; é tornar possível voltar amanhã sem precisar começar do zero.',
      ],
      action: 'Anote em uma frase onde você parou e qual arquivo deve abrir.',
    },
    {
      ...meta,
      slug: slugs[1],
      title: 'Quando preparar demais adia o começo',
      summary: 'Planejar pode acolher uma tarefa. Em excesso, pode escondê-la.',
      category: 'Começar',
      readingTime: '3 min de leitura',
      paragraphs: [
        'Preparar dá uma sensação de avanço porque organiza possibilidades. Mas chega um momento em que a preparação passa a proteger a gente do primeiro contato com o trabalho real.',
        'Um teste simples é trocar “o que preciso organizar?” por “o que posso abrir?”. O arquivo, a página ou a ferramenta já são um começo — mesmo que nada esteja pronto para ser mostrado.',
        'A primeira versão não precisa provar que a ideia é boa. Ela só precisa existir o suficiente para que você possa reagir a ela.',
      ],
      action: 'Escolha uma coisa para abrir, sem se comprometer a terminá-la.',
    },
    {
      ...meta,
      slug: slugs[2],
      title: 'Como guardar o fio da meada antes de pausar',
      summary: 'Uma nota curta pode transformar uma pausa em continuidade.',
      category: 'Cotidiano',
      readingTime: '3 min de leitura',
      paragraphs: [
        'Antes de fechar tudo, experimente deixar uma frase para a sua próxima versão: “eu estava olhando para…”. Não é um relatório. É uma pequena ponte.',
        'Anote também qual seria o movimento seguinte, mesmo que pareça óbvio. O óbvio de hoje pode não estar disponível depois de uma semana cheia.',
        'Pausar com contexto não é controlar o futuro. É oferecer uma porta de entrada para quando você decidir voltar.',
      ],
      action: 'Antes de fechar, escreva “quando eu voltar, posso…” e complete a frase.',
    },
  ],
  en: [
    {
      ...meta,
      slug: slugs[0],
      title: 'How to return to a project after weeks',
      summary: 'Returning begins by finding one visible thread, rather than rebuilding everything.',
      category: 'Returning',
      readingTime: '4 min read',
      paragraphs: [
        'When a project has been still, the first impulse is often to make up for lost time. We open every tab and rebuild the plan.',
        'A gentler return begins with a smaller question: what is the last thing here that still makes sense? It may be a sentence, a file or a note.',
        'Choose that thread and leave the next move visible. The goal is to make tomorrow’s return possible without starting over.',
      ],
      action: 'Write where you stopped and which file to open.',
    },
    {
      ...meta,
      slug: slugs[1],
      title: 'When too much preparation delays the start',
      summary: 'Planning can support a task. In excess, it can hide it.',
      category: 'Starting',
      readingTime: '3 min read',
      paragraphs: [
        'Preparation feels like progress because it organizes possibilities. At some point, it can protect us from the real work.',
        'Replace “what do I need to organize?” with “what can I open?”. A file, page or tool is already a beginning.',
        'The first version only needs to exist enough for you to respond to it.',
      ],
      action: 'Choose one thing to open without committing to finish it.',
    },
    {
      ...meta,
      slug: slugs[2],
      title: 'How to keep the thread before a pause',
      summary: 'A short note can turn a pause into continuity.',
      category: 'Everyday life',
      readingTime: '3 min read',
      paragraphs: [
        'Before closing everything, leave a sentence for your future self: “I was looking at…”. It is a small bridge.',
        'Also note the next move. Today’s obvious detail may be unavailable after a busy week.',
        'Pausing with context offers an entrance for whenever you decide to return.',
      ],
      action: 'Write “when I return, I can…” and finish the sentence.',
    },
  ],
  es: [
    {
      ...meta,
      slug: slugs[0],
      title: 'Cómo volver a un proyecto después de semanas',
      summary: 'Retomar empieza encontrando un hilo visible, no reconstruyendo todo.',
      category: 'Retomar',
      readingTime: '4 min de lectura',
      paragraphs: [
        'Cuando un proyecto lleva tiempo parado, solemos intentar compensar el tiempo perdido y rehacer todo el plan.',
        'Un regreso más amable empieza con una pregunta menor: ¿qué es lo último que todavía tiene sentido aquí? Puede ser una frase, un archivo o una nota.',
        'Elige ese hilo y deja visible el próximo gesto. La meta es hacer posible volver mañana sin empezar de cero.',
      ],
      action: 'Escribe dónde paraste y qué archivo debes abrir.',
    },
    {
      ...meta,
      slug: slugs[1],
      title: 'Cuando preparar demasiado retrasa el comienzo',
      summary: 'Planificar puede sostener una tarea. En exceso, puede esconderla.',
      category: 'Empezar',
      readingTime: '3 min de lectura',
      paragraphs: [
        'Preparar parece avanzar porque organiza posibilidades. En algún momento puede protegernos del trabajo real.',
        'Cambia “¿qué necesito organizar?” por “¿qué puedo abrir?”. Un archivo, una página o una herramienta ya son un comienzo.',
        'La primera versión solo necesita existir lo suficiente para que puedas reaccionar a ella.',
      ],
      action: 'Elige una cosa para abrir sin comprometerte a terminarla.',
    },
    {
      ...meta,
      slug: slugs[2],
      title: 'Cómo guardar el hilo antes de una pausa',
      summary: 'Una nota breve puede transformar una pausa en continuidad.',
      category: 'Cotidiano',
      readingTime: '3 min de lectura',
      paragraphs: [
        'Antes de cerrar todo, deja una frase para tu yo futuro: “estaba mirando…”. Es un pequeño puente.',
        'Anota también el siguiente movimiento. Lo obvio de hoy puede no estar disponible después de una semana intensa.',
        'Pausar con contexto ofrece una puerta de entrada para cuando decidas volver.',
      ],
      action: 'Escribe “cuando vuelva, puedo…” y completa la frase.',
    },
  ],
  de: [
    {
      ...meta,
      slug: slugs[0],
      title: 'Nach Wochen zu einem Projekt zurückkehren',
      summary:
        'Zurückkehren beginnt mit einem sichtbaren Faden, nicht mit einem vollständigen Neubau.',
      category: 'Zurückkehren',
      readingTime: '4 Min. Lesezeit',
      paragraphs: [
        'Nach einer Pause wollen wir oft verlorene Zeit aufholen und den ganzen Plan neu bauen.',
        'Eine sanftere Rückkehr beginnt mit einer kleineren Frage: Was ergibt hier zuletzt noch Sinn? Vielleicht ein Satz, eine Datei oder eine Notiz.',
        'Wähle diesen Faden und mache den nächsten Schritt sichtbar. So wird die Rückkehr morgen möglich.',
      ],
      action: 'Notiere, wo du aufgehört hast und welche Datei du öffnen willst.',
    },
    {
      ...meta,
      slug: slugs[1],
      title: 'Wenn zu viel Vorbereitung den Anfang verzögert',
      summary: 'Planung kann eine Aufgabe tragen. Zu viel davon kann sie verstecken.',
      category: 'Anfangen',
      readingTime: '3 Min. Lesezeit',
      paragraphs: [
        'Vorbereitung fühlt sich wie Fortschritt an. Irgendwann kann sie uns vor der eigentlichen Arbeit schützen.',
        'Ersetze „Was muss ich organisieren?“ durch „Was kann ich öffnen?“. Datei, Seite oder Werkzeug sind bereits ein Anfang.',
        'Die erste Version muss nur genug existieren, damit du auf sie reagieren kannst.',
      ],
      action: 'Öffne eine Sache, ohne dich zum Fertigstellen zu verpflichten.',
    },
    {
      ...meta,
      slug: slugs[2],
      title: 'Vor einer Pause den Faden bewahren',
      summary: 'Eine kurze Notiz kann aus einer Pause Kontinuität machen.',
      category: 'Alltag',
      readingTime: '3 Min. Lesezeit',
      paragraphs: [
        'Hinterlasse deinem zukünftigen Ich vor dem Schließen einen Satz: „Ich war gerade bei…“. Das ist eine kleine Brücke.',
        'Notiere auch den nächsten Schritt. Nach einer vollen Woche ist das heute Offensichtliche vielleicht nicht mehr greifbar.',
        'Mit Kontext zu pausieren schafft einen Eingang für deine Rückkehr.',
      ],
      action: 'Schreibe „Wenn ich zurückkomme, kann ich…“ und ergänze den Satz.',
    },
  ],
};

export function getArticles(locale: Locale) {
  return articlesByLocale[locale];
}
