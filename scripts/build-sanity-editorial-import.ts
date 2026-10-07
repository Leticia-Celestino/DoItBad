import { writeFile } from 'node:fs/promises';

import { articlesByLocale } from '../src/content/articles.ts';

const output = process.argv[2];
if (!output) throw new Error('Informe o caminho do arquivo NDJSON de saída.');
const publish = process.argv.includes('--published');

const assetByCover: Record<string, string> = {
  '/editorial/retomar-projeto.webp':
    'image-9432d465ac2ad932e25fbbe323a9c7fdfced5e24-1280x853-webp',
  '/editorial/comecar-imperfeito.webp':
    'image-ae0ad1debeba4d137ca8ad1ef114844c3ec0c338-1280x853-webp',
  '/editorial/guardar-o-fio.webp':
    'image-bfb69d4810e1c03a7e32b075311477ddfa268570-1280x853-webp',
};

const categoryByTranslationKey: Record<string, string> = {
  'return-after-weeks': 'retomar',
  'preparation-delays-start': 'começar',
  'keep-the-thread': 'cotidiano',
};

const authorId = 'author-equipe-doitbad';
const documents: Record<string, unknown>[] = [
  {
    _id: authorId,
    _type: 'author',
    name: 'Equipe DoItBad',
    bio: 'Conteúdo editorial criado e revisado pela equipe DoItBad.',
  },
];

for (const [locale, articles] of Object.entries(articlesByLocale)) {
  for (const article of articles) {
    const assetId = assetByCover[article.cover.src];
    if (!assetId) throw new Error(`Capa sem asset Sanity: ${article.cover.src}`);

    documents.push({
      _id: `${publish ? '' : 'drafts.'}article-${article.translationKey}-${locale}`,
      _type: 'article',
      language: locale,
      translationKey: article.translationKey,
      title: article.title,
      slug: { _type: 'slug', current: article.slug },
      summary: article.summary,
      category: categoryByTranslationKey[article.translationKey],
      cover: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
        alt: article.cover.alt,
      },
      author: { _type: 'reference', _ref: authorId },
      body: article.paragraphs.map((paragraph, index) => ({
        _key: `paragraph-${index + 1}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _key: `span-${index + 1}`,
            _type: 'span',
            marks: [],
            text: paragraph,
          },
        ],
      })),
      practicalAction: article.action,
      references: [],
      publishedAt: `${article.publishedAt}T12:00:00.000Z`,
      reviewedAt: `${article.reviewedAt}T12:00:00.000Z`,
    });
  }
}

await writeFile(output, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`);
console.log(`Gerados ${documents.length} documentos em ${output}.`);
