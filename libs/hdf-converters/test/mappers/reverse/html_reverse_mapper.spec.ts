import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {FileExportTypes, FromHDFToHTMLMapper} from '../../../index';
import {omitHTMLStyleTag} from '../../utils';

describe('Liquid partial templates', () => {
  it('html.liquid renders a valid HTML5 shell with color-scheme meta', async () => {
    const {Liquid} = await import('liquidjs');
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const engine = new Liquid({templates, outputEscape: 'escape'});
    const out = engine.parseAndRenderSync(templates['html'], {
      title: 'Test Report',
      body: '<main>content</main>',
      inline_styles: ['body { color: red; }'],
      inline_scripts: ['console.log("test")']
    });
    expect(out).toContain('<!doctype html>');
    expect(out).toContain('<meta name="color-scheme" content="light dark"');
    expect(out).toContain('<meta name="generator" content="Heimdall"');
    expect(out).toContain('Test Report');
    expect(out).toContain('<main>content</main>');
    expect(out).toContain('body { color: red; }');
  });

  it('partials/summary.liquid renders status counts table with icon+text', async () => {
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
    expect(out).toContain('<meter');
    expect(out).toContain('55.55%');
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
    expect(out).toContain('var(--st-pass-fg)');
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

describe('Interactivity — filtering, search, theme toggle (P8)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('has a search input for filtering controls', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('type="search"');
  });

  it('has a theme toggle button', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('theme-toggle');
    expect(output).toContain('data-theme');
  });

  it('has filter buttons for status values', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-filter-status');
  });

  it('has a live count display element', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('filter-count');
  });

  it('has a clear filters button', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('btn-clear-filters');
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
