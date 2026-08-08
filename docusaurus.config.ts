import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {themes as prismThemes} from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const organizationName = 'HanielUlises';
const projectName = 'high-performance-cpp';

// Overridable so the same tree can be served from a custom domain
// (BASE_URL=/) or from https://<user>.github.io/<repo>/ (the default).
const url = process.env.SITE_URL ?? `https://${organizationName.toLowerCase()}.github.io`;
const baseUrl = process.env.BASE_URL ?? `/${projectName}/`;

const config: Config = {
  title: 'High Performance C++',
  tagline: 'Mathematics · Abstraction · Computation',
  favicon: 'img/favicon.ico',

  url,
  baseUrl,
  organizationName,
  projectName,
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  future: {
    v4: true,
    faster: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {
      tagName: 'link',
      attributes: {rel: 'icon', type: 'image/svg+xml', href: `${baseUrl}img/favicon.svg`},
    },
    {
      tagName: 'link',
      attributes: {rel: 'apple-touch-icon', href: `${baseUrl}img/apple-touch-icon.png`},
    },
  ],

  markdown: {
    mermaid: true,
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
      crossorigin: 'anonymous',
    },
    'https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap',
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: `https://github.com/${organizationName}/${projectName}/edit/main/`,
          showLastUpdateTime: true,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          breadcrumbs: true,
        },
        blog: {
          path: 'essays',
          routeBasePath: 'essays',
          blogTitle: 'Essays and Notes',
          blogDescription:
            'Long-form notes on abstraction, generic programming and performance.',
          blogSidebarTitle: 'Recent notes',
          blogSidebarCount: 'ALL',
          postsPerPage: 10,
          showReadingTime: false,
          onUntruncatedBlogPosts: 'throw',
          editUrl: `https://github.com/${organizationName}/${projectName}/edit/main/`,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          feedOptions: {
            type: 'all',
            title: 'High Performance C++ — Essays and Notes',
            copyright: `© ${new Date().getFullYear()} ${organizationName}`,
          },
        },
        pages: {
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          lastmod: 'date',
          changefreq: null,
          priority: null,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'description',
        content:
          'A technical reference for modern C++, mathematical foundations, generic programming and performance-oriented computation.',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {hideable: true, autoCollapseCategories: false},
    },
    tableOfContents: {minHeadingLevel: 2, maxHeadingLevel: 3},
    navbar: {
      title: 'High Performance C++',
      hideOnScroll: false,
      items: [
        {type: 'docSidebar', sidebarId: 'reference', label: 'Reference', position: 'left'},
        {to: '/docs/examples', label: 'Examples', position: 'left'},
        {to: '/docs/benchmarks', label: 'Benchmarks', position: 'left'},
        {to: '/essays', label: 'Essays', position: 'left'},
        {to: '/colophon', label: 'Colophon', position: 'right'},
        {
          href: `https://github.com/${organizationName}/${projectName}`,
          label: 'Source',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Reference',
          items: [
            {label: 'Modern C++', to: '/docs/modern-cpp'},
            {label: 'Mathematics', to: '/docs/mathematics'},
            {label: 'High Performance', to: '/docs/high-performance'},
            {label: 'Scientific Computing', to: '/docs/scientific-computing'},
            {label: 'Formal C++', to: '/docs/formal-cpp'},
          ],
        },
        {
          title: 'Material',
          items: [
            {label: 'Examples', to: '/docs/examples'},
            {label: 'Benchmarks', to: '/docs/benchmarks'},
            {label: 'Essays and Notes', to: '/essays'},
          ],
        },
        {
          title: 'Meta',
          items: [
            {label: 'Colophon', to: '/colophon'},
            {label: 'Conventions', to: '/docs/conventions'},
            {label: 'Repository', href: `https://github.com/${organizationName}/${projectName}`},
          ],
        },
      ],
      copyright: `Text and code © ${new Date().getFullYear()}. Prose under CC BY 4.0; code under the MIT licence.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['cpp', 'cmake', 'bash', 'json', 'diff', 'python'],
      defaultLanguage: 'cpp',
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
      options: {fontFamily: 'IBM Plex Sans, system-ui, sans-serif'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
