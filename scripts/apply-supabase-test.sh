#!/usr/bin/env bash
set -euo pipefail

project_ref="fdfhqmmlbxgpzfsatavm"
workspace_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

export SUPABASE_TELEMETRY_DISABLED=1
cd "$workspace_dir"

pnpm exec supabase link --project-ref "$project_ref" --workdir "$workspace_dir"
pnpm exec supabase migration list --linked --workdir "$workspace_dir"
pnpm exec supabase db push --linked --workdir "$workspace_dir"
pnpm exec supabase migration list --linked --workdir "$workspace_dir"

echo "Migrações aplicadas no projeto Supabase de teste: $project_ref"
