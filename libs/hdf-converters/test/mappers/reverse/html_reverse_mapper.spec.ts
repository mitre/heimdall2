import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {FileExportTypes, FromHDFToHTMLMapper} from '../../../index';
import {omitHTMLStyleTag} from '../../utils';

describe('Liquid partial templates', () => {
  it('html.liquid layout renders with child block overrides', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const childTemplate = `{% layout 'html', title: 'Test Report' %}
{% block styles %}<style>body { color: red; }</style>{% endblock %}
{% block body %}<main>content</main>{% endblock %}
{% block scripts %}<script>console.log("test")</script>{% endblock %}`;
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = await engine.parseAndRender(childTemplate, {});
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('<meta name="color-scheme" content="light dark"');
    expect(out).toContain('<meta name="generator" content="Heimdall"');
    expect(out).toContain('Test Report');
    expect(out).toContain('<main>content</main>');
    expect(out).toContain('body { color: red; }');
    expect(out).toContain('console.log("test")');
  });

  it('partials/summary.liquid renders hero layout with compliance ring, status, severity, and bar', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/summary'], {
      statistics: {passed: 10, failed: 5, notApplicable: 2, notReviewed: 1, profileError: 0, totalResults: 18, passedTests: 20, failedTests: 8, totalTests: 28},
      severity: {none: 1, low: 3, medium: 8, high: 4, critical: 2},
      compliance: {level: '55.55%', color: 'low'},
      icons: {circleCheck: '<svg>pass</svg>', circleCross: '<svg>fail</svg>', circleMinus: '<svg>na</svg>', circleAlert: '<svg>nr</svg>', triangleAlert: '<svg>err</svg>', squareEqual: '<svg>tot</svg>', circleNone: '<svg>none</svg>', circleLow: '<svg>low</svg>', circleMedium: '<svg>med</svg>', circleHigh: '<svg>high</svg>', circleCritical: '<svg>crit</svg>'}
    });
    expect(out).toContain('Passed');
    expect(out).toContain('>10<');
    expect(out).toContain('<svg>pass</svg>');
    expect(out).toContain('compliance-ring');
    expect(out).toContain('55.55%');
    expect(out).toContain('summary-hero');
    expect(out).toContain('status-bar');
    expect(out).toContain('bar-passed');
    expect(out).toContain('breakdown-grid');
  });

  it('report.liquid uses {% layout %} not {% capture body %}', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const reportSrc = templates['report'];
    expect(reportSrc).toContain('layout');
    expect(reportSrc).not.toContain('capture body');
    expect(reportSrc).not.toContain("include 'html'");
  });

  it('html.liquid has named blocks for styles, body, and scripts', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const htmlSrc = templates['html'];
    expect(htmlSrc).toContain('block styles');
    expect(htmlSrc).toContain('block body');
    expect(htmlSrc).toContain('block scripts');
  });

  it('mapper does not assemble inline_styles or inline_scripts arrays', async () => {
    const mapperSrc = fs.readFileSync(
      'src/converters-from-hdf/html/reverse-html-mapper.ts',
      {encoding: 'utf-8'}
    );
    expect(mapperSrc).not.toContain('inline_styles');
    expect(mapperSrc).not.toContain('inline_scripts');
  });

  it('SVG icons use fill="currentColor" not hardcoded rgb()', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/summary'], {
      statistics: {passed: 1, failed: 0, notApplicable: 0, notReviewed: 0, profileError: 0, totalResults: 1, passedTests: 1, failedTests: 0, totalTests: 1},
      severity: {none: 0, low: 0, medium: 1, high: 0, critical: 0},
      compliance: {level: '100.00%', color: 'high'},
      icons: {circleCheck: '<svg><path fill="currentColor"/></svg>', circleCross: '<svg><path fill="currentColor"/></svg>', circleMinus: '<svg><path fill="currentColor"/></svg>', circleAlert: '<svg><path fill="currentColor"/></svg>', triangleAlert: '<svg><path fill="currentColor"/></svg>', squareEqual: '<svg><path fill="currentColor"/></svg>', circleNone: '<svg><path fill="currentColor"/></svg>', circleLow: '<svg><path fill="currentColor"/></svg>', circleMedium: '<svg><path fill="currentColor"/></svg>', circleHigh: '<svg><path fill="currentColor"/></svg>', circleCritical: '<svg><path fill="currentColor"/></svg>'}
    });
    expect(out).not.toContain('fill="rgb(');
    expect(out).toContain('var(--st-');
  });

  it('mapper icons use currentColor fill', async () => {
    const mapperSource = fs.readFileSync(
      'src/converters-from-hdf/html/reverse-html-mapper.ts',
      {encoding: 'utf-8'}
    );
    expect(mapperSource).not.toMatch(/iconDataToSVG\([^)]+,\s*'rgb\(/);
    expect(mapperSource).toContain("'currentColor'");
  });

  it('control-card: tags NOT in summary (moved to body for scannability)', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/control-card'], {
      result: {
        resultID: 'r-1',
        resultStatus: {status: 'Failed', icon: '<svg>x</svg>'},
        resultSeverity: {severity: 'high', icon: '<svg>h</svg>'},
        hdf: {wraps: {id: 'V-1', title: 'Test'}, segments: []},
        data: {desc: ''},
        details: [],
        controlTags: ['AC-2', 'CCI-000001']
      },
      showCode: false
    });
    const summaryMatch = out.match(/<summary>[\s\S]*?<\/summary>/);
    expect(summaryMatch).not.toBeNull();
    const summaryContent = summaryMatch![0];
    expect(summaryContent).not.toContain('AC-2');
    expect(summaryContent).not.toContain('CCI-000001');
    expect(out).toContain('AC-2');
  });

  it('control-card: ID in monospace <code> element', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/control-card'], {
      result: {
        resultID: 'r-1',
        resultStatus: {status: 'Passed', icon: ''},
        resultSeverity: {severity: 'low', icon: ''},
        hdf: {wraps: {id: 'V-99999', title: 'Test'}, segments: []},
        data: {desc: ''},
        details: [],
        controlTags: []
      },
      showCode: false
    });
    expect(out).toContain('<code class="control-id">V-99999</code>');
  });

  it('control-card: title truncated with control-title class', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/control-card'], {
      result: {
        resultID: 'r-1',
        resultStatus: {status: 'Passed', icon: ''},
        resultSeverity: {severity: 'low', icon: ''},
        hdf: {wraps: {id: 'V-1', title: 'A very long title'}, segments: []},
        data: {desc: ''},
        details: [],
        controlTags: []
      },
      showCode: false
    });
    expect(out).toContain('class="control-title"');
  });

  it('control-card: status badge is pill shape, severity badge is rectangle', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const {css: bladeCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('border-radius: 9999px');
    expect(reportCss).toContain('[class*="sev--"]');
  });

  it('partials/control-card.liquid renders article with data-status and details/summary', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['partials/control-card'], {
      result: {
        resultID: 'r-1',
        resultStatus: {status: 'Failed', icon: '<svg>x</svg>'},
        resultSeverity: {severity: 'high', icon: '<svg>h</svg>'},
        hdf: {wraps: {id: 'V-12345', title: 'Test Control'}, segments: [{status: 'failed', code_desc: 'check something', message: 'it failed'}]},
        data: {desc: '<p>Description here</p>'},
        details: [{name: 'Check', value: 'check text'}],
        controlTags: ['AC-2', 'CCI-000001']
      },
      showCode: false
    });
    expect(out).toContain('data-status="Failed"');
    expect(out).toContain('data-severity="high"');
    expect(out).toContain('<details');
    expect(out).toContain('<summary');
    expect(out).toContain('V-12345');
    expect(out).toContain('Test Control');
    expect(out).toContain('AC-2');
  });
});

describe('Embedded assets pipeline', () => {
  it('exports css containing Blades/Pico CSS variables (not Tailwind)', async () => {
    const {css} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(css).toContain('--pico-');
    expect(css).not.toContain('--tw-border-opacity');
  });

  it('exports templates as a Record<string, string> map for per-partial testing', async () => {
    const assets = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(assets).toHaveProperty('templates');
    expect(typeof assets.templates).toBe('object');
    expect(assets.templates).not.toBeNull();
    expect(typeof assets.templates).not.toBe('string');
  });

  it('templates map keys are filenames without .liquid extension', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const keys = Object.keys(templates);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key).not.toContain('.liquid');
    }
  });

  it('does not export js constant', async () => {
    const assets = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(assets).not.toHaveProperty('js');
  });
});

describe('Template structure (Blades CSS)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('uses <details>/<summary> for progressive disclosure (not TW Elements accordion)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<details');
    expect(output).toContain('<summary');
    expect(output).not.toContain('data-te-collapse');
    expect(output).not.toContain('data-te-dropdown');
  });

  it('uses semantic HTML5 landmarks', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<main');
    expect(output).toContain('<nav');
    expect(output).toContain('<article');
    expect(output).toContain('<footer');
  });

  it('uses <meter> for compliance (not <progress>)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<meter');
    expect(output).not.toContain('<progress');
  });

  it('uses {{{frameworkStyles}}} not {{{tailwindStyles}}}', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('{{{tailwindStyles}}}');
    expect(output).not.toContain('{{{tailwindElements}}}');
    expect(output).toContain('--pico-');
  });

  it('has <meta name="color-scheme"> for dark mode', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<meta name="color-scheme" content="light dark"');
  });

  it('has a skip link for accessibility', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('skip-link');
    expect(output).toContain('href="#main"');
  });

  it('has no Tailwind utility classes', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('px-3 py-2');
    expect(output).not.toContain('bg-gray-100');
    expect(output).not.toContain('text-lg font-bold');
    expect(output).not.toContain('border-gray-300');
  });

  it('has no <script> block with TW Elements', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('TW Elements');
    expect(output).not.toContain('tailwindElements');
  });

  it('uses <dl> for metadata', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<dl');
    expect(output).toContain('<dt');
    expect(output).toContain('<dd');
  });

  it('wraps code in <figure>/<pre>/<code>', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<figure');
    expect(output).toContain('<pre');
    expect(output).toContain('<code');
  });
});

describe('Cloudscape toolbar + ISSO filtering (n3v.12)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('has filter chips with counts for all 5 statuses', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-filter-status="Passed"');
    expect(output).toContain('data-filter-status="Failed"');
    expect(output).toContain('data-filter-status="Not Applicable"');
    expect(output).toContain('data-filter-status="Not Reviewed"');
    expect(output).toContain('data-filter-status="Profile Error"');
  });

  it('has filter chips with counts for all 5 severities', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-filter-severity="none"');
    expect(output).toContain('data-filter-severity="critical"');
  });

  it('filter chips use chip class (not outline buttons)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('.chip');
  });

  it('has a search input', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('type="search"');
    expect(output).toContain('id="control-search"');
  });

  it('has a theme toggle and expand/collapse icon buttons', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('id="theme-toggle"');
    expect(output).toContain('id="btn-expand-all"');
    expect(output).toContain('id="btn-collapse-all"');
  });

  it('has a live count element and clear-all link', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('id="filter-count"');
    expect(output).toContain('id="btn-clear-filters"');
  });

  it('has an active-tokens container for dismissable filter tokens', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('id="active-tokens"');
  });

  it('has a NIST family multi-select checkbox dropdown', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('id="nist-family-filter"');
    expect(output).toContain('id="nist-family-list"');
    expect(output).toContain('class="dropdown');
  });

  it('hero summary bar segments have data-filter-status for cross-filtering', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/class="bar-seg bar-passed"[^>]*data-filter-status/);
    expect(output).toMatch(/class="bar-seg bar-failed"[^>]*data-filter-status/);
  });

  it('scripts contain beforeprint and afterprint handlers', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const scriptsSrc = templates['partials/scripts'];
    expect(scriptsSrc).toContain('beforeprint');
    expect(scriptsSrc).toContain('afterprint');
  });

  it('scripts contain filter logic with debounced search', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const scriptsSrc = templates['partials/scripts'];
    expect(scriptsSrc).toContain('applyFilters');
    expect(scriptsSrc).toContain('setTimeout');
  });

  it('toolbar is sticky on desktop via CSS', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('position: sticky');
  });

  it('has a mobile filter toggle button', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('id="nav-filter-toggle"');
  });

  it('Executive export has no filter controls (showResultSets=false)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Executive
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('id="control-search"');
    expect(output).not.toContain('id="filter-bar"');
    expect(output).not.toContain('class="chip"');
  });
});

describe('Custom CSS layer (P4)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('has @media print rules that force light theme', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('@media print');
    expect(output).toContain('color-scheme: light');
  });

  it('has status color tokens with Pico-idiomatic dark mode scoping', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('--st-pass-fg');
    expect(output).toContain('--st-fail-fg');
    expect(output).toContain('--st-na-fg');
    expect(output).toContain('--st-nr-fg');
    expect(output).toContain('--st-error-fg');
    expect(output).toContain('prefers-color-scheme: dark');
  });

  it('has severity color tokens', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('--sv-none-fg');
    expect(output).toContain('--sv-low-fg');
    expect(output).toContain('--sv-medium-fg');
    expect(output).toContain('--sv-high-fg');
    expect(output).toContain('--sv-critical-fg');
  });

  it('has data-status and data-severity attributes on control articles', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-status=');
    expect(output).toContain('data-severity=');
  });

  it('has print-color-adjust for status backgrounds', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('print-color-adjust');
  });
});

describe('Emphasis overlay system (Bootstrap 5.3 pattern)', () => {
  it('report.css defines --report-emphasis-rgb in :root (light = black)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('--report-emphasis-rgb: 0, 0, 0');
  });

  it('report.css flips --report-emphasis-rgb to white in dark mode', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('--report-emphasis-rgb: 255, 255, 255');
  });

  it('report.css defines the 4-factor overlay scale (cap/stripe/hover/active)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('--report-cap-bg');
    expect(reportCss).toContain('--report-stripe-bg');
    expect(reportCss).toContain('--report-hover-bg');
    expect(reportCss).toContain('--report-active-bg');
  });

  it('overlay tokens use rgba(var(--report-emphasis-rgb), <factor>) pattern', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/--report-stripe-bg:\s*rgba\(var\(--report-emphasis-rgb\)/);
    expect(reportCss).toMatch(/--report-hover-bg:\s*rgba\(var\(--report-emphasis-rgb\)/);
    expect(reportCss).toMatch(/--report-cap-bg:\s*rgba\(var\(--report-emphasis-rgb\)/);
    expect(reportCss).toMatch(/--report-active-bg:\s*rgba\(var\(--report-emphasis-rgb\)/);
  });

  it('control card zebra uses --report-stripe-bg (not hardcoded rgba)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('var(--report-stripe-bg)');
    expect(reportCss).not.toContain('--control-stripe-bg');
  });

  it('control card hover uses --report-hover-bg (not hardcoded rgba)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('var(--report-hover-bg)');
    expect(reportCss).not.toContain('--control-hover-bg');
  });

  it('summary card headers/footers use --report-cap-bg', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('var(--report-cap-bg)');
  });

  it('report.css has zero hardcoded rgb/hex outside of var() declarations and fallbacks', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const lines = reportCss.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
      if (trimmed.startsWith('--')) continue;
      const withoutVarFallbacks = trimmed.replace(/var\([^)]+\)/g, '');
      if (withoutVarFallbacks.includes('#') && !withoutVarFallbacks.includes('href')) {
        const hexMatch = withoutVarFallbacks.match(/#[0-9a-fA-F]{3,8}\b/);
        if (hexMatch) {
          expect.fail(`Found hardcoded hex "${hexMatch[0]}" in non-declaration line: ${trimmed}`);
        }
      }
    }
  });

  it('dark mode blocks in both @media and [data-theme] include emphasis-rgb flip', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const mediaMatch = reportCss.match(/@media only screen and \(prefers-color-scheme: dark\)\s*\{[^}]*\{([\s\S]*?)\}/);
    expect(mediaMatch).not.toBeNull();
    expect(mediaMatch![1]).toContain('--report-emphasis-rgb: 255, 255, 255');
    const themeMatch = reportCss.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
    expect(themeMatch).not.toBeNull();
    expect(themeMatch![1]).toContain('--report-emphasis-rgb: 255, 255, 255');
  });
});

describe('Heimdall Material palette alignment (n3v.25)', () => {
  it('--st-na-fg uses Material blue (not Primer gray #59636e)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('--st-na-fg: #59636e');
    expect(reportCss).toMatch(/--st-na-fg:\s*#0[0-9a-fA-F]{5}/);
  });

  it('status tokens use Material-derived colors (not Primer palette)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('--st-pass-fg: #1a7f37');
    expect(reportCss).not.toContain('--st-fail-fg: #b3202a');
    expect(reportCss).not.toContain('--st-error-fg: #6639ba');
  });

  it('severity tokens use Material-derived colors', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('--sv-none-fg: #59636e');
    expect(reportCss).not.toContain('--sv-low-fg: #1a5fb4');
  });

  it('compliance colors use Material green/yellow/red', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/--compliance-high:.*#4CAF50/i);
    expect(reportCss).toMatch(/--compliance-low:.*#[fFeE][0-9a-fA-F]{5}/);
  });

  it('dark mode uses Material 500 colors directly (designed for dark bg)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const darkBlock = reportCss.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);
    expect(darkBlock).not.toBeNull();
    expect(darkBlock![1]).toContain('#4CAF50');
    expect(darkBlock![1]).toContain('#F44336');
    expect(darkBlock![1]).toContain('#03A9F4');
  });
});

describe('Blades idiom polish (n3v.22)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('has data-tooltip on theme toggle button', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/id="theme-toggle"[^>]*data-tooltip=/);
  });

  it('has data-tooltip on Expand All, Collapse All, Clear Filters buttons', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/id="btn-expand-all"[^>]*data-tooltip=/);
    expect(output).toMatch(/id="btn-collapse-all"[^>]*data-tooltip=/);
    expect(output).toMatch(/id="btn-clear-filters"[^>]*data-tooltip=/);
  });

  it('has data-tooltip with data-placement on nav action buttons', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-placement="bottom"');
  });

  it('has a back-to-top link with data-jump-to after main', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-jump-to="top"');
    expect(output).toMatch(/class="[^"]*no-print[^"]*"[^>]*data-jump-to="top"/);
    expect(output).toContain('aria-label="Back to top"');
  });

  it('wraps segment status "passed" in <ins> and "failed" in <del>', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape', lenientIf: true, jsTruthy: true});
    const out = engine.parseAndRenderSync(templates['partials/control-card'], {
      result: {
        resultID: 'r-1',
        resultStatus: {status: 'Failed', icon: '<svg>x</svg>'},
        resultSeverity: {severity: 'high', icon: '<svg>h</svg>'},
        hdf: {wraps: {id: 'V-1', title: 'Test'}, segments: [
          {status: 'passed', code_desc: 'check A', message: 'ok'},
          {status: 'failed', code_desc: 'check B', message: 'not ok'}
        ]},
        data: {desc: ''},
        details: [],
        controlTags: []
      },
      showCode: false
    });
    expect(out).toContain('<ins>passed</ins>');
    expect(out).toContain('<del>failed</del>');
  });

  it('does NOT use ins/del on status badges', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const badges = output.match(/<span class="badge[^"]*">[^<]*<\/span>/g) || [];
    for (const badge of badges) {
      expect(badge).not.toContain('<ins>');
      expect(badge).not.toContain('<del>');
    }
  });

  it('does not add custom CSS for data-tooltip, ins, del, or data-jump-to', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('data-tooltip');
    expect(reportCss).not.toContain('data-jump-to');
    expect(reportCss).not.toMatch(/\bins\b\s*\{/);
    expect(reportCss).not.toMatch(/\bdel\b\s*\{/);
  });
});

describe('LiquidJS engine wiring (n3v.20)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('toHTML() renders via LiquidJS (no unresolved Mustache syntax)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<!doctype html>');
    expect(output).not.toContain('{{{');
    expect(output).not.toContain('{{#');
    expect(output).not.toContain('{{/');
  });

  it('toHTML() output uses Liquid-rendered Blades shell with color-scheme meta', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<meta name="color-scheme" content="light dark"');
    expect(output).toContain('<meta name="generator" content="Heimdall"');
  });

  it('mapper does not import mustache', async () => {
    const mapperSource = fs.readFileSync(
      'src/converters-from-hdf/html/reverse-html-mapper.ts',
      {encoding: 'utf-8'}
    );
    expect(mapperSource).not.toContain("from 'mustache'");
    expect(mapperSource).toContain("from 'liquidjs'");
  });
});

describe('Mapper interface', () => {
  it('output contains no TW Elements script content', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
      {encoding: 'utf-8'}
    );
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('TW Elements');
    expect(output).not.toContain('sourceMappingURL=tw-elements');
  });

  it('mapper has no tailwindElements or tailwindStyles properties', () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
      {encoding: 'utf-8'}
    );
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    expect(mapper.outputData).not.toHaveProperty('tailwindElements');
    expect(mapper.outputData).not.toHaveProperty('tailwindStyles');
    expect(mapper.outputData).toHaveProperty('frameworkStyles');
  });
});

describe('HTML Results Reverse Mapper', () => {
  it('Successfully converts RHEL7 HDF into HTML', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );

    const converted = await mapper.toHTML();

    fs.writeFileSync(
      'sample_jsons/html_reverse_mapper/rhel7.html',
      converted
    );

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/rhel7.html',
      'utf-8'
    );

    expect(omitHTMLStyleTag(converted)).toEqual(omitHTMLStyleTag(expected));
  });

  it('Successfully converts SonarQube HDF into HTML', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'sonarqube-hdf.json', fileID: '1'}],
      FileExportTypes.Administrator
    );

    const converted = await mapper.toHTML();

    fs.writeFileSync(
      'sample_jsons/html_reverse_mapper/sonarqube.html',
      converted
    );

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sonarqube.html',
      'utf-8'
    );

    expect(omitHTMLStyleTag(converted)).toEqual(omitHTMLStyleTag(expected));
  });

  it('Successfully converts SonarQube HDF into HTML with filtered controls', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'sonarqube-hdf.json', fileID: '1', filteredControls: ['javascript:S2819'] }],
      FileExportTypes.Administrator
    );

    const converted = await mapper.toHTML();

    fs.writeFileSync(
      'sample_jsons/html_reverse_mapper/sonarqube.html',
      converted
    );

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sonarqube.html',
      'utf-8'
    );

    expect(omitHTMLStyleTag(converted)).toEqual(omitHTMLStyleTag(expected));
  });
});
