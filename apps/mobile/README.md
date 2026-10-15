# DoItBad para Android e iOS

Expo SDK 56, React Native 0.85.3, React 19.2.3 e Expo Router. As versões nativas
seguem o mapa de compatibilidade do Expo; não atualizar React Native isoladamente.

## Desenvolvimento

Na raiz do workspace, execute `pnpm install` e `pnpm --filter @doitbad/mobile dev`.
Copie `.env.example` para `.env` neste diretório e configure as chaves públicas do
mesmo Supabase usado pelo web. Não usar service-role no aplicativo.
Sem configuração, o modo de desenvolvimento salva somente neste dispositivo.

No Supabase de teste, aplicar as migrações existentes e `202610080001_workspace.sql`.
Na raiz, `scripts/apply-supabase-test.sh` usa a autenticação salva da CLI ou
`SUPABASE_ACCESS_TOKEN`, mostra o estado e executa o `db push`.
As URLs de retorno web e `doitbad://entrar` estão em `supabase/config.toml` e já
foram aplicadas ao projeto vinculado. Revise `supabase config diff` antes de mudanças.

## Verificação e builds

- `pnpm --filter @doitbad/mobile check`: TypeScript.
- `pnpm --filter @doitbad/mobile exec expo install --check`: compatibilidade do SDK.
- `pnpm --filter @doitbad/mobile export`: bundles JS/assets Android e iOS.
- `pnpm --filter @doitbad/mobile android`: build local com Android SDK configurado.
- `pnpm --filter @doitbad/mobile ios`: build local com macOS/Xcode.

Diretórios `android/` e `ios/` são gerados pelo Expo e ignorados pelo Git.
Um build local release usa a assinatura de desenvolvimento gerada pelo Expo;
não é um artefato assinado para publicação nas lojas.

Com o aplicativo instalado, `ANDROID_SERIAL=<serial> node --experimental-strip-types
scripts/verify-android-remote.mjs`, a partir da raiz, testa autenticação por link,
sincronização ao retornar ao primeiro plano e persistência após reiniciar o processo.
O teste cria uma conta temporária e a remove ao final; use um aparelho de teste.

Os bundles exportados não são APK/IPA. Builds instaláveis e distribuição precisam
das ferramentas/assinaturas das respectivas plataformas. Os identificadores iniciais
`tech.doitbad.app` devem ser conferidos antes do primeiro envio às lojas.

## Distribuição para testers

### Android imediato (arquivo APK)

O APK local fica em
`android/app/build/outputs/apk/release/app-release.apk`. Ele pode ser enviado por Drive,
e-mail ou outro canal de arquivos. O tester baixa o arquivo, permite a instalação de
aplicativos dessa fonte quando o Android solicitar e toca em **Instalar**.

Esse APK local é próprio para teste direto e usa a chave de desenvolvimento do projeto.
Ele não deve ser publicado na Play Store. Antes de compartilhar, confira a assinatura e
o checksum:

```bash
apksigner verify --verbose android/app/build/outputs/apk/release/app-release.apk
sha256sum android/app/build/outputs/apk/release/app-release.apk
```

Para gerar um link de instalação gerenciado pelo Expo, entre na conta Expo, configure o
projeto uma vez e use o perfil `preview` já presente em `eas.json`:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest env:create preview --name EXPO_PUBLIC_SUPABASE_URL --value 'URL_DO_SUPABASE' --visibility plaintext
npx eas-cli@latest env:create preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value 'CHAVE_PUBLICA_ANON' --visibility sensitive
npx eas-cli@latest env:create preview --name EXPO_PUBLIC_AI_API_URL --value 'https://doitbad-ai.doitbad-app.workers.dev' --visibility plaintext
pnpm build:preview:android
```

O resultado é outro APK, assinado pelo EAS, com URL/QR code compartilhável. Não misture
as assinaturas: para trocar do APK local para o APK do EAS, o tester pode precisar
desinstalar a versão anterior uma única vez.

### iPhone pelo TestFlight

TestFlight exige adesão ativa ao Apple Developer Program e acesso ao App Store Connect.
Com o app criado no App Store Connect usando o bundle ID `tech.doitbad.app`, configure
as mesmas três variáveis no ambiente `production` do EAS e execute:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
# Repita os três comandos `env:create` acima trocando `preview` por `production`.
pnpm build:testflight
pnpm submit:testflight
```

No App Store Connect, aguarde o processamento, preencha as informações de conformidade
solicitadas e adicione os e-mails em **TestFlight > External Testing**. O primeiro build
externo passa pela revisão beta da Apple. Testers internos do App Store Connect podem ser
adicionados separadamente.

Para poucos aparelhos iOS também existe o perfil `preview`, mas a distribuição ad hoc
exige cadastrar previamente cada UDID (`npx eas-cli@latest device:create`) e gerar um novo
build. Para pessoas externas, TestFlight costuma ser o fluxo mais simples.

### Website

O beta publicado está em `https://web-staging-2502.up.railway.app/`. Basta compartilhar
essa URL: não há instalação. Antes de cada rodada, teste a URL em uma janela anônima e
confirme login, recuperação de senha e o fluxo principal com uma conta exclusiva de teste.

Nunca envie a chave `service_role` do Supabase para builds mobile ou para o navegador.

## Comportamento dos dados

`@doitbad/core` compartilha contratos, validação, timer, métricas e repositório.
Alterações remotas usam revisão para rejeitar edições antigas. Uma resposta perdida
pode ser repetida com o mesmo ID enquanto o processo continua, evitando duplicações.
O timer usa horário de início e tempo acumulado, preservando a contagem ao reabrir.
O app sincroniza ao retornar ao primeiro plano; não há fila offline nem garantia
de atualização instantânea entre dois dispositivos abertos simultaneamente.

Tarefas e sessões do protótipo não são importadas como dados reais. Intenções existentes
continuam usando a tabela original. Áudio opcional: `packages/assets/zen.wav`, gerado
pelo script versionado `scripts/generate-zen-audio.mjs`.

Antes do lançamento: testar autenticação/deep links em build instalado, sincronização
entre contas/dispositivos, comportamento em segundo plano e VoiceOver/TalkBack.
