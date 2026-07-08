// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Guide',
      collapsed: false,
      items: [
        'guide/writing-tests',
        'guide/locating-elements',
        'guide/actions',
        'guide/assertions',
        'guide/test-data',
        'guide/debugging',
        'guide/ci',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/device',
        'api/assertions',
        'api/e2e-setup',
        'api/chrome-api',
        'api/cli',
      ],
    },
  ],
};

export default sidebars;
