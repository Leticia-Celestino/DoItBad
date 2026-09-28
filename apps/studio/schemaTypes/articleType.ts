import { defineArrayMember, defineField, defineType } from 'sanity';

const languages = [
  { title: 'Português (Brasil)', value: 'pt-br' },
  { title: 'English', value: 'en' },
  { title: 'Español', value: 'es' },
  { title: 'Deutsch', value: 'de' },
];

export const articleType = defineType({
  name: 'article',
  title: 'Artigo',
  type: 'document',
  fields: [
    defineField({
      name: 'language',
      title: 'Idioma',
      type: 'string',
      options: { list: languages },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'translationKey',
      title: 'Chave de tradução',
      type: 'string',
      description: 'Use a mesma chave nas versões traduzidas.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Resumo',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: { list: ['começar', 'retomar', 'cotidiano'] },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      title: 'Capa',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Autor',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Conteúdo',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'practicalAction', title: 'Ação prática', type: 'text', rows: 2 }),
    defineField({
      name: 'references',
      title: 'Referências',
      type: 'array',
      of: [defineArrayMember({ type: 'url' })],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Publicação',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'reviewedAt', title: 'Revisão', type: 'datetime' }),
  ],
  preview: { select: { title: 'title', subtitle: 'language', media: 'cover' } },
});
