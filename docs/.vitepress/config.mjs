import {defineConfig} from 'vitepress';
import {target} from './target.mjs';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Heimdall',
  description: 'Visualize and analyze your security results',

  // Every per-target difference is declared in target.mjs, selected by
  // HEIMDALL_DOCS_TARGET at build time. Nothing else in this file re-derives it.
  base: target.base,

  // Publishing is STRUCTURAL: only content under site/ builds, so a tree
  // outside it cannot be published and there is no exclude list to forget.
  // This repo already keeps working documents beside the site — docs/research/
  // and the ADRs — and the flat layout in ADR-005 §2.3.1 would have tried to
  // build them into the public site. (vulcan learned this the same way;
  // ADR-005 predates their fix, so §2.3.1 is superseded — the §2.3 SECTION MAP
  // below still governs.)
  srcDir: 'site',

  // Clean URLs without .html extension
  cleanUrls: true,

  // Last updated time (reads git timestamps — CI needs fetch-depth: 0)
  lastUpdated: true,

  // Dead links FAIL the build (VitePress default; ADR-005 §5.1 makes it a
  // standing rule). Deliberately no ignoreDeadLinks entry — if one becomes
  // necessary it must arrive with its reason.

  head: [['meta', {name: 'theme-color', content: '#005288'}]],

  themeConfig: {
    // Sections come from ADR-005 §2.3. Phase 1 ships the skeleton; Phase 3
    // migrates the 24 wiki pages into it. Section landing pages exist so the
    // structure is navigable — and so the dead-link check has something real
    // to check — while their content is explicitly Phase 3's.
    //
    // site/ carries EXTERNAL USER-FACING documentation only (Aaron,
    // 2026-08-11). Internal project records — ADRs, plans, research — live
    // beside the site under docs/ and are structurally unpublishable because
    // srcDir points at site/. There is deliberately no "decisions" section.
    nav: [
      {text: 'Guide', link: '/getting-started/'},
      {text: 'Deploy', link: '/deployment/'},
      {text: 'Converters', link: '/converters/'},
      {text: 'Developers', link: '/developers/'},
      {text: 'API', link: '/api/'}
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [{text: 'Overview', link: '/getting-started/'}]
        },
        {
          text: 'User Guide',
          items: [{text: 'Overview', link: '/user-guide/'}]
        }
      ],
      '/user-guide/': [
        {
          text: 'Getting Started',
          items: [{text: 'Overview', link: '/getting-started/'}]
        },
        {
          text: 'User Guide',
          items: [{text: 'Overview', link: '/user-guide/'}]
        }
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [{text: 'Overview', link: '/deployment/'}]
        }
      ],
      '/converters/': [
        {
          text: 'Converters',
          items: [{text: 'Overview', link: '/converters/'}]
        }
      ],
      '/developers/': [
        {
          text: 'Developers',
          items: [{text: 'Overview', link: '/developers/'}]
        }
      ],
      '/api/': [
        {text: 'API', items: [{text: 'Overview', link: '/api/'}]}
      ],
      '/security/': [
        {text: 'Security', items: [{text: 'Overview', link: '/security/'}]}
      ],
      '/release-notes/': [
        {
          text: 'Release Notes',
          items: [{text: 'Overview', link: '/release-notes/'}]
        }
      ],
      '/about/': [
        {text: 'About', items: [{text: 'Overview', link: '/about/'}]}
      ]
    },

    // Built-in local search: zero dependencies, fully offline — which is the
    // requirement for an airgapped install, and the wiki's biggest missing
    // feature (ADR-005 §2.3.3).
    search: {provider: 'local'},

    // Outbound chrome, gated by target — dead links in an airgapped deployment.
    ...(target.outboundChrome
      ? {
          socialLinks: [
            {icon: 'github', link: 'https://github.com/mitre/heimdall2'}
          ],
          editLink: {
            pattern:
              'https://github.com/mitre/heimdall2/edit/master/docs/site/:path',
            text: 'Edit this page on GitHub'
          }
        }
      : {}),

    footer: {
      message: 'Part of the MITRE Security Automation Framework (SAF)',
      copyright: 'Copyright © 2026 MITRE Corporation'
    },

    docFooter: {prev: 'Previous', next: 'Next'},

    outline: {level: [2, 3], label: 'On this page'}
  }
});
