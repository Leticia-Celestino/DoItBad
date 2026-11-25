import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildBrandedEmail } from '../api/confirmation-email.ts';

// The landing email is the shared visual source. Only transactional copy differs.
export const accountEmails = [
  [
    'confirmation',
    'Seu espaço está pronto',
    'Confirme seu endereço para começar a usar sua conta DoItBad.',
    'Confirmar meu e-mail',
    'Confirmar seu endereço é o primeiro passo para guardar suas tarefas.',
    'link',
  ],
  [
    'recovery',
    'Um caminho de volta',
    'Recebemos um pedido para recuperar sua conta. Abra a etapa protegida para escolher uma nova senha.',
    'Escolher nova senha',
    'Se você não pediu a recuperação, ignore este email. A solicitação sozinha não altera sua senha.',
    'link',
  ],
  [
    'invite',
    'Um convite para começar',
    'Você recebeu um convite para criar sua conta no DoItBad. Aceite quando fizer sentido para você.',
    'Aceitar convite',
    'O convite cria seu acesso ao produto. Participar de pesquisas é uma escolha separada.',
    'link',
  ],
  [
    'magic_link',
    'Seu acesso está aqui',
    'Use o link solicitado para entrar na sua conta DoItBad.',
    'Entrar no meu espaço',
    'Este link é pessoal. Não compartilhe com outras pessoas. Se não solicitou, ignore este email.',
    'link',
  ],
  [
    'email_change',
    'Confirme a mudança',
    'Recebemos uma solicitação de alteração do endereço de email da sua conta.',
    'Confirmar alteração',
    'Confirme apenas se você solicitou a troca. Dependendo da configuração, é necessário confirmar nos dois endereços.',
    'link',
  ],
  [
    'reauthentication',
    'Confirme que é você',
    'Para continuar a operação protegida, digite o código abaixo na tela que o solicitou.',
    'Voltar ao DoItBad',
    '{{ .Token }}',
    'otp',
  ],
  [
    'password_changed',
    'Sua senha foi atualizada',
    'A senha da sua conta DoItBad foi alterada.',
    'Abrir minha conta',
    'Não foi você? Abra a tela de acesso, solicite a recuperação da senha e revise a segurança da sua conta.',
    'notification',
  ],
  [
    'email_changed',
    'Seu email foi atualizado',
    'O endereço de email associado à sua conta DoItBad foi alterado.',
    'Abrir minha conta',
    'Se não reconhece esta alteração, procure o suporte pelo canal oficial do DoItBad.',
    'notification',
  ],
  [
    'phone_changed',
    'Seu telefone foi atualizado',
    'O número de telefone associado à sua conta DoItBad foi alterado.',
    'Abrir minha conta',
    'Se não reconhece esta alteração, revise a segurança da sua conta e procure o suporte pelo canal oficial.',
    'notification',
  ],
  [
    'identity_linked',
    'Uma forma de acesso foi adicionada',
    'Um método de login foi conectado à sua conta DoItBad.',
    'Revisar minha conta',
    'Se não reconhece esta alteração, revise os métodos de acesso e procure o suporte pelo canal oficial.',
    'notification',
  ],
  [
    'identity_unlinked',
    'Uma forma de acesso foi removida',
    'Um método de login foi desconectado da sua conta DoItBad.',
    'Revisar minha conta',
    'Se não reconhece esta alteração, revise os métodos de acesso e procure o suporte pelo canal oficial.',
    'notification',
  ],
  [
    'mfa_factor_enrolled',
    'Uma proteção foi adicionada',
    'Um método de verificação adicional foi cadastrado na sua conta DoItBad.',
    'Revisar minha conta',
    'Se não reconhece esta alteração, revise a segurança da sua conta e procure o suporte pelo canal oficial.',
    'notification',
  ],
  [
    'mfa_factor_unenrolled',
    'Uma proteção foi removida',
    'Um método de verificação adicional foi removido da sua conta DoItBad.',
    'Revisar minha conta',
    'Se não reconhece esta alteração, revise a segurança da sua conta e procure o suporte pelo canal oficial.',
    'notification',
  ],
];

export function renderAccountEmail(entry) {
  const [key, title, intro, button, step, kind] = entry;
  const email = buildBrandedEmail({
    name: null,
    locale: 'pt-BR',
    transactional: true,
    actionUrl: kind === 'link' ? '{{ .ConfirmationURL }}' : '{{ .SiteURL }}',
    copy: {
      subject: `${title} ✦ DoItBad`,
      preheader: intro,
      eyebrow: kind === 'notification' ? 'SUA CONTA, SEU ESPAÇO' : 'UM PEQUENO COMEÇO',
      title,
      intro,
      button,
      step,
      note:
        kind === 'otp'
          ? 'Não compartilhe este código. Se não fez a solicitação, ignore esta mensagem.'
          : 'Você recebe esta mensagem por uma ação relacionada à sua conta.',
      stepLabel: kind === 'otp' ? 'SEU CÓDIGO DE VERIFICAÇÃO' : 'VALE LEMBRAR',
      footer: 'Feito com intenção para dias reais.',
    },
  });
  return { key, kind, file: `${key.replaceAll('_', '-')}.html`, ...email };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const entry of accountEmails) {
    const email = renderAccountEmail(entry);
    const path = new URL(`../supabase/templates/${email.file}`, import.meta.url);
    if (process.argv.includes('--check')) {
      if (readFileSync(path, 'utf8') !== email.html)
        throw new Error(`Template desatualizado: ${email.file}`);
    } else writeFileSync(path, email.html);
  }
  console.log(
    `${accountEmails.length} templates ${process.argv.includes('--check') ? 'verificados' : 'gerados'}.`,
  );
}
