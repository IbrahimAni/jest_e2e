// @ts-check
// Docs site for the jest-e2e framework, deployed to GitHub Pages.

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Jest E2E',
  tagline: 'Simple, reliable end-to-end testing with Jest and Puppeteer',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ibrahimani.github.io',
  baseUrl: '/jest_e2e/',

  organizationName: 'IbrahimAni',
  projectName: 'jest_e2e',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // docs-only mode: docs are the site root
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/IbrahimAni/jest_e2e/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Jest E2E',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Docs',
          },
          {
            to: '/api/device',
            position: 'left',
            label: 'API',
          },
          {
            href: 'https://www.npmjs.com/package/jest-e2e',
            label: 'npm',
            position: 'right',
          },
          {
            href: 'https://github.com/IbrahimAni/jest_e2e',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting started', to: '/' },
              { label: 'Writing tests', to: '/guide/writing-tests' },
              { label: 'API reference', to: '/api/device' },
            ],
          },
          {
            title: 'More',
            items: [
              { label: 'GitHub', href: 'https://github.com/IbrahimAni/jest_e2e' },
              { label: 'npm', href: 'https://www.npmjs.com/package/jest-e2e' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Ibrahim Anifowoshe. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json'],
      },
    }),
};

export default config;
