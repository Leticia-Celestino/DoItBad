type ConfirmationLocale = 'pt-BR' | 'en' | 'es' | 'de';

type ConfirmationCopy = {
  subject: string;
  preheader: string;
  eyebrow: string;
  greeting: string;
  title: string;
  intro: string;
  note: string;
  stepLabel: string;
  step: string;
  button: string;
  signoff: string;
  team: string;
  footer: string;
  unsubscribe: string;
};

const COPY: Record<ConfirmationLocale, ConfirmationCopy> = {
  'pt-BR': {
    subject: 'Seu lugar está guardado ✦ DoItBad',
    preheader: 'Um começo pequeno já conta — e o seu chegou até aqui.',
    eyebrow: 'UM PEQUENO COMEÇO',
    greeting: 'Olá',
    title: 'Seu lugar está\nguardado.',
    intro:
      'Recebemos seu cadastro. Quando o DoItBad abrir novos caminhos — e quando o beta web estiver pronto para os primeiros testes — você vai saber.',
    note: 'Sem pressa, sem barulho desnecessário. Só novidades que ajudam a começar, pausar e voltar.',
    stepLabel: 'ENQUANTO ISSO',
    step: 'Escolha algo que você vem adiando e reduza até caber em dez minutos. Esse já pode ser o primeiro passo.',
    button: 'Conhecer o DoItBad',
    signoff: 'Até o próximo pequeno começo,',
    team: 'Equipe DoItBad',
    footer: 'Feito com intenção para dias reais.',
    unsubscribe: 'Para sair da lista, basta responder este e-mail com “sair”.',
  },
  en: {
    subject: 'Your place is saved ✦ DoItBad',
    preheader: 'A small start still counts — and yours made it here.',
    eyebrow: 'A SMALL BEGINNING',
    greeting: 'Hello',
    title: 'Your place is\nsaved.',
    intro:
      'We received your sign-up. When DoItBad opens new paths — and when the web beta is ready for its first tests — you will know.',
    note: 'No rush, no unnecessary noise. Just updates that help you start, pause and return.',
    stepLabel: 'IN THE MEANTIME',
    step: 'Choose something you have been postponing and make it small enough for ten minutes. That can already be the first step.',
    button: 'Discover DoItBad',
    signoff: 'Until the next small beginning,',
    team: 'The DoItBad team',
    footer: 'Made with intention for real days.',
    unsubscribe: 'To leave the list, simply reply to this email with “unsubscribe”.',
  },
  es: {
    subject: 'Tu lugar está guardado ✦ DoItBad',
    preheader: 'Un comienzo pequeño también cuenta — y el tuyo llegó hasta aquí.',
    eyebrow: 'UN PEQUEÑO COMIENZO',
    greeting: 'Hola',
    title: 'Tu lugar está\nguardado.',
    intro:
      'Recibimos tu registro. Cuando DoItBad abra nuevos caminos — y cuando la beta web esté lista para las primeras pruebas — lo sabrás.',
    note: 'Sin prisa y sin ruido innecesario. Solo novedades que ayudan a empezar, pausar y volver.',
    stepLabel: 'MIENTRAS TANTO',
    step: 'Elige algo que vienes aplazando y redúcelo hasta que quepa en diez minutos. Ese ya puede ser el primer paso.',
    button: 'Conocer DoItBad',
    signoff: 'Hasta el próximo pequeño comienzo,',
    team: 'Equipo DoItBad',
    footer: 'Hecho con intención para días reales.',
    unsubscribe: 'Para salir de la lista, responde este correo con “salir”.',
  },
  de: {
    subject: 'Dein Platz ist reserviert ✦ DoItBad',
    preheader: 'Ein kleiner Anfang zählt — und deiner ist bei uns angekommen.',
    eyebrow: 'EIN KLEINER ANFANG',
    greeting: 'Hallo',
    title: 'Dein Platz ist\nreserviert.',
    intro:
      'Deine Anmeldung ist angekommen. Wenn DoItBad neue Wege öffnet — und die Web-Beta für erste Tests bereit ist — erfährst du es.',
    note: 'Ohne Eile und ohne unnötigen Lärm. Nur Neuigkeiten, die beim Anfangen, Pausieren und Zurückkehren helfen.',
    stepLabel: 'BIS DAHIN',
    step: 'Wähle etwas, das du aufschiebst, und verkleinere es auf zehn Minuten. Das kann schon der erste Schritt sein.',
    button: 'DoItBad entdecken',
    signoff: 'Bis zum nächsten kleinen Anfang,',
    team: 'Das DoItBad-Team',
    footer: 'Mit Bedacht für echte Tage gemacht.',
    unsubscribe: 'Um die Liste zu verlassen, antworte einfach mit „abmelden“.',
  },
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
}

function siteUrl(locale: ConfirmationLocale) {
  const fallback = 'https://doitbad.tech';
  const configured = process.env.PUBLIC_SITE_URL?.trim() || fallback;
  let origin = fallback;

  try {
    const parsed = new URL(configured);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') origin = parsed.origin;
  } catch {
    // The public production URL remains a safe fallback for malformed configuration.
  }

  const path = locale === 'pt-BR' ? 'pt-br' : locale;
  return `${origin}/${path}/`;
}

export function buildConfirmationEmail(input: { name: string | null; locale: string }) {
  const locale: ConfirmationLocale = Object.prototype.hasOwnProperty.call(COPY, input.locale)
    ? (input.locale as ConfirmationLocale)
    : 'pt-BR';
  const copy = COPY[locale];
  const name = input.name ? escapeHtml(input.name) : '';
  const greeting = `${copy.greeting}${name ? `, ${name}` : ''}!`;
  const title = copy.title.replace('\n', '<br>');
  const url = siteUrl(locale);

  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${copy.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#eee4d5;color:#343e31;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${copy.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eee4d5;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#fbf6ec;border:1px solid #dcd1bf;border-radius:30px;overflow:hidden;box-shadow:0 20px 55px rgba(72,61,42,.12);">
            <tr>
              <td style="height:9px;background:#526148;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:34px 42px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:27px;font-weight:700;letter-spacing:-1.5px;color:#343e31;">DoIt<span style="color:#985033;">B</span>ad</td>
                    <td align="right" style="color:#e0b55d;font-size:22px;">✦</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 42px 6px;">
                <div style="width:42px;height:2px;margin-bottom:18px;background:#985033;"></div>
                <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#985033;">${copy.eyebrow}</div>
                <p style="margin:30px 0 12px;font-size:17px;line-height:1.6;color:#635e53;">${greeting}</p>
                <h1 style="margin:0;max-width:500px;font-family:'Trebuchet MS',Arial,sans-serif;font-size:52px;line-height:.98;letter-spacing:-2.7px;font-weight:600;color:#343e31;">${title}</h1>
                <p style="margin:28px 0 0;max-width:520px;font-size:17px;line-height:1.75;color:#635e53;">${copy.intro}</p>
                <p style="margin:18px 0 0;max-width:520px;font-size:15px;line-height:1.75;color:#635e53;">${copy.note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 42px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#dce1cd;border:1px solid #cbd2ba;border-radius:22px;">
                  <tr>
                    <td width="88" valign="top" style="padding:25px 0 25px 25px;">
                      <div style="width:52px;height:52px;border-radius:50%;background:#526148;color:#fbf6ec;font-family:'Trebuchet MS',Arial,sans-serif;font-size:15px;font-weight:700;line-height:52px;text-align:center;">01</div>
                    </td>
                    <td valign="top" style="padding:25px 25px 25px 12px;">
                      <div style="margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:1.7px;color:#526148;">${copy.stepLabel}</div>
                      <div style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:17px;font-weight:600;line-height:1.55;color:#343e31;">${copy.step}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 42px 44px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="border-radius:999px;background:#985033;">
                      <a href="${url}" style="display:inline-block;padding:15px 25px;font-family:'Trebuchet MS',Arial,sans-serif;font-size:14px;font-weight:700;color:#fffaf1;text-decoration:none;">${copy.button}&nbsp;&nbsp;↗</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:34px 0 0;font-size:14px;line-height:1.75;color:#635e53;">${copy.signoff}<br><strong style="color:#343e31;">${copy.team}</strong></p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 42px;background:#262e3d;color:#f8f0df;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="top" style="font-family:'Trebuchet MS',Arial,sans-serif;font-size:13px;font-weight:600;line-height:1.5;color:#f8f0df;">${copy.footer}</td>
                    <td align="right" valign="top" style="padding-left:18px;font-size:10px;line-height:1.55;color:#cfc8ba;">${copy.unsubscribe}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const plainName = input.name?.trim();
  const text = [
    `${copy.greeting}${plainName ? `, ${plainName}` : ''}!`,
    '',
    copy.title.replace('\n', ' '),
    '',
    copy.intro,
    '',
    copy.note,
    '',
    `${copy.stepLabel}: ${copy.step}`,
    '',
    `${copy.button}: ${url}`,
    '',
    copy.signoff,
    copy.team,
    '',
    copy.unsubscribe,
  ].join('\n');

  return { subject: copy.subject, html, text };
}
