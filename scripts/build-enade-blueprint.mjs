import { readFileSync, writeFileSync } from 'node:fs';

const spec = readFileSync(
  new URL(
    '../../DoItBad-Documentation/template-enade/DoItBad_Jornada_ENADE_ADS_2026_Especificacao.md',
    import.meta.url,
  ),
  'utf8',
);
const rows = [...spec.matchAll(/^\| ((?:ADS|FG)-\d{2}) \| (.*?) \| (.*?) \|(?: (.*?) \|)?$/gm)];
const roman = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
];
const blueprint = {
  schemaVersion: 1,
  code: 'ENADE-ADS26',
  slug: 'enade-ads-2026',
  status: 'DRAFT',
  publishable: false,
  reviewedAt: '2026-10-16',
  examDate: null,
  sources: [
    {
      id: 'INEP-169-2026',
      scope: 'ADS',
      url: 'https://www.in.gov.br/web/dou/-/portaria-n-169-de-14-de-abril-de-2026-699920629',
      evidence: 'PDF fornecido em DoItBad-Documentation/template-enade; texto integral conferido',
      status: 'LOCAL_TEXT_CHECKED',
      subsequentAmendmentsChecked: false,
    },
    {
      id: 'INEP-154-2026',
      scope: 'FG',
      url: 'https://www.in.gov.br/en/web/dou/-/portaria-n-154-de-14-de-abril-de-2026-699921720',
      mirror:
        'https://arquivos.ufsj.edu.br/arquivos/20260681894a6b14571044b12092f6360/Matrizes_de_Referncia_ENADE_2026_Contedo_da_Formao_Geral.pdf',
      evidence:
        'Reprodução do DOU hospedada pela UFSJ; texto conferido, acesso direto ao DOU indisponível na consulta',
      status: 'INSTITUTIONAL_COPY_CHECKED',
      subsequentAmendmentsChecked: false,
    },
  ],
  assessmentStructure: {
    generalObjective: 15,
    specificObjective: 30,
    specificDiscursive: 1,
    total: 46,
    durationMinutes: 240,
    authorityLevel: 'NORMATIVE_EXACT',
    sourceIds: ['INEP-169-2026', 'INEP-154-2026'],
  },
  objects: rows.map(([, id, label, application, evidence]) => ({
    id,
    label,
    component: id.startsWith('ADS') ? 'ADS' : 'FG',
    sourceId: id.startsWith('ADS') ? 'INEP-169-2026' : 'INEP-154-2026',
    sourceLocator: `Art. 6º, ${roman[Number(id.split('-')[1]) - 1]}`,
    authorityLevel: 'NORMATIVE_EXACT',
    transcriptionNote: 'Capitalização normalizada; detalhamento pedagógico separado.',
    pedagogy: {
      authorityLevel: 'PEDAGOGICAL_INTERPRETATION',
      application,
      expectedEvidence: evidence ?? null,
      reviewStatus: 'PENDING_INDEPENDENT_REVIEW',
    },
    approvedQuestionIds: [],
    coverageStatus: 'NO_APPROVED_ITEMS',
  })),
  skills: [
    ['CI-H1', 'ADS', 'Interpretar representações de dados'],
    ['CI-H2', 'ADS', 'Compreender processo e ciclo de vida'],
    ['CI-H3', 'ADS', 'Aplicar gestão e garantia da qualidade'],
    ['CI-H4', 'ADS', 'Modelar negócio, requisitos e sistemas'],
    ['CI-H5', 'ADS', 'Aplicar fundamentos computacionais e comunicação'],
    ['CII-H1', 'ADS', 'Aplicar qualidade e segurança'],
    ['CII-H2', 'ADS', 'Implementar programas'],
    ['CII-H3', 'ADS', 'Modelar e gerenciar dados'],
    ['CII-H4', 'ADS', 'Avaliar algoritmos e estruturas'],
    ['CII-H5', 'ADS', 'Empregar arquitetura e programação'],
    ['CII-H6', 'ADS', 'Propor soluções interdisciplinares'],
    ['FG-CI-H1', 'FG', 'Analisar comunicação e construção de significados'],
    ['FG-CI-H2', 'FG', 'Avaliar diálogo e compartilhamento de saberes'],
    ['FG-CII-H1', 'FG', 'Analisar recursos para resolver problemas'],
    ['FG-CII-H2', 'FG', 'Avaliar argumentos para decidir'],
    ['FG-CII-H3', 'FG', 'Avaliar implicações sociais da atuação profissional'],
  ].map(([id, component, summary]) => ({
    id,
    component,
    summary,
    authorityLevel: 'PEDAGOGICAL_INTERPRETATION',
    sourceId: component === 'ADS' ? 'INEP-169-2026' : 'INEP-154-2026',
    sourceLocator: `Art. 5º, competência ${id.includes('CII') ? 'II' : 'I'}, habilidade ${id.at(-1)}`,
    approvedQuestionIds: [],
  })),
  releaseBlockers: [
    'Banco de questões e revisores ainda não cadastrados',
    'Calendário e retificações operacionais pendentes',
    'Contrato de API ainda não implementado',
    'Validação pedagógica e operacional do piloto pendente',
  ],
};
if (blueprint.objects.length !== 32 || new Set(blueprint.objects.map((o) => o.id)).size !== 32)
  throw new Error('Matriz incompleta ou duplicada');
if (
  blueprint.objects.filter((o) => o.component === 'ADS').length !== 20 ||
  blueprint.skills.length !== 16
)
  throw new Error('Contagens inesperadas');
const output = JSON.stringify(blueprint, null, 2) + '\n';
const path = new URL('../docs/journeys/enade-ads-2026.blueprint.json', import.meta.url);
if (process.argv.includes('--check')) {
  if (readFileSync(path, 'utf8') !== output) throw new Error('Blueprint desatualizado');
} else writeFileSync(path, output);
console.log(
  'Blueprint: 32 objetos, 16 habilidades, zero itens aprovados; rascunho não publicável.',
);
