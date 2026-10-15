# DoItBad AI API

API autenticada que escolhe uma tarefa elegível e gera uma microação com Llama. A implantação
principal usa FastAPI/Python no Cloudflare Workers e o binding gratuito Workers AI. O servidor
Uvicorn/Docker permanece disponível como alternativa sem mudar o contrato do aplicativo.

## Publicar no Cloudflare

1. Entre na conta: `uvx --from workers-py pywrangler login`.
2. Cadastre os segredos dentro desta pasta:
   - `uvx --from workers-py pywrangler secret put SUPABASE_URL`
   - `uvx --from workers-py pywrangler secret put SUPABASE_PUBLISHABLE_KEY`
3. Publique: `uvx --from workers-py pywrangler deploy`.
4. Verifique `https://doitbad-ai.<conta>.workers.dev/health`.
5. Defina a URL retornada como `EXPO_PUBLIC_AI_API_URL` antes de gerar o APK.

Nunca coloque a service-role key do Supabase no Worker ou no aplicativo. O Worker usa o JWT de
cada sessão e todas as consultas continuam protegidas por RLS.

## Desenvolvimento convencional

Copie `.env.example` para `.env`, preencha as variáveis e execute:

```bash
uv sync --extra server
uv run uvicorn app.main:app --reload
uv run pytest
```
