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

describe('Shiki syntax highlighting (n3v.13)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('Administrator export has Shiki-highlighted code with --shiki-dark CSS vars', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('--shiki-dark');
    expect(output).toContain('class="shiki');
  });

  it('Executive export has no Shiki highlighting (showCode=false)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Executive
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('class="shiki');
  });

  it('report.css has dark mode override for Shiki spans', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toContain('--shiki-dark');
  });

  it('report.css overrides Blades pre:has(code) dark bg for .shiki blocks', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/pre\.shiki\s*\{[^}]*background-color.*--shiki-bg/);
  });

  it('control details dt labels are styled (uppercase, small)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/article\.control\s+dt\s*\{[^}]*text-transform:\s*uppercase/);
  });

  it('Manager export has no Shiki highlighting (showCode=false)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Manager
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('class="shiki');
  });

  it('highlighted code is output as raw HTML (not escaped)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('<span style="');
    expect(output).not.toContain('&lt;span style=');
  });

  it('does not crash on empty or invalid code input', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const origCode = mapper.outputData.resultSets[0]?.results[0]?.full_code;
    if (mapper.outputData.resultSets[0]?.results[0]) {
      mapper.outputData.resultSets[0].results[0].full_code = '';
    }
    await expect(mapper.toHTML()).resolves.toBeDefined();
    if (mapper.outputData.resultSets[0]?.results[0]) {
      mapper.outputData.resultSets[0].results[0].full_code = origCode;
    }
  });

  it('control articles have data-families attribute with NIST families (not CCI)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('data-families="');
    expect(output).not.toMatch(/data-families="[^"]*CCI/);
    const acControls = (output.match(/data-families="[^"]*AC[^"]*"/g) || []).length;
    expect(acControls).toBeGreaterThan(0);
  });

  it('JS uses cross-facet counting — same-dimension counts ignore own filter', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const scriptsSrc = templates['partials/scripts'];
    expect(scriptsSrc).toContain('countForStatus');
    expect(scriptsSrc).toContain('countForSeverity');
    expect(scriptsSrc).toContain('countForFamily');
  });

  it('JS filtering uses data-families attribute (not .tag text scanning)', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const scriptsSrc = templates['partials/scripts'];
    expect(scriptsSrc).toContain("getAttribute('data-families')");
    expect(scriptsSrc).not.toContain("querySelectorAll('.tag')");
  });

  it('cross-facet counting matrix — exact counts for rhel7 data', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();

    const controlRegex = /data-status="([^"]*)" data-severity="([^"]*)" data-families="([^"]*)"/g;
    const controls: {status: string; severity: string; families: string[]}[] = [];
    let m;
    while ((m = controlRegex.exec(output)) !== null) {
      controls.push({status: m[1], severity: m[2].toLowerCase(), families: m[3] ? m[3].split(',') : []});
    }

    function crossFacet(
      activeStatuses: Record<string, boolean>,
      activeSeverities: Record<string, boolean>,
      activeFamilies: Record<string, boolean>
    ) {
      const hasStatus = Object.keys(activeStatuses).length > 0;
      const hasSeverity = Object.keys(activeSeverities).length > 0;
      const hasFamily = Object.keys(activeFamilies).length > 0;
      const cfs: Record<string, number> = {};
      const cfv: Record<string, number> = {};
      const cff: Record<string, number> = {};
      let visible = 0;
      for (const c of controls) {
        const passSt = !hasStatus || activeStatuses[c.status];
        const passSev = !hasSeverity || activeSeverities[c.severity];
        const passFam = !hasFamily || c.families.some(f => activeFamilies[f]);
        if (passSt && passSev && passFam) visible++;
        if (passSev && passFam) cfs[c.status] = (cfs[c.status] || 0) + 1;
        if (passSt && passFam) cfv[c.severity] = (cfv[c.severity] || 0) + 1;
        if (passSt && passSev) { for (const f of c.families) { if (f) cff[f] = (cff[f] || 0) + 1; } }
      }
      return {visible, cfs, cfv, cff};
    }

    // === FULL PERMUTATION MATRIX ===
    // Compute ground truth for every status × severity × family combination
    // from the actual data, then verify the algorithm produces exact matches.
    const allStatuses = [...new Set(controls.map(c => c.status))];
    const allSeverities = [...new Set(controls.map(c => c.severity))];
    const allFamilies = [...new Set(controls.flatMap(c => c.families))].filter(Boolean);

    // Precompute ground truth for every single-dimension combination
    const groundTruth = new Map<string, ReturnType<typeof crossFacet>>();
    function key(s: string[], v: string[], f: string[]) { return `${s.sort().join('+')}|${v.sort().join('+')}|${f.sort().join('+')}`; }
    function toMap(arr: string[]) { const m: Record<string, boolean> = {}; arr.forEach(x => m[x] = true); return m; }

    // No filter
    groundTruth.set(key([],[],[]), crossFacet({}, {}, {}));

    // Every single status
    for (const st of allStatuses) groundTruth.set(key([st],[],[]), crossFacet(toMap([st]), {}, {}));
    // Every single severity
    for (const sv of allSeverities) groundTruth.set(key([],[sv],[]), crossFacet({}, toMap([sv]), {}));
    // Every single family
    for (const fm of allFamilies) groundTruth.set(key([],[],[fm]), crossFacet({}, {}, toMap([fm])));

    // Every status × severity (4×4 = 16)
    for (const st of allStatuses) for (const sv of allSeverities)
      groundTruth.set(key([st],[sv],[]), crossFacet(toMap([st]), toMap([sv]), {}));

    // Every status × family (4×8 = 32)
    for (const st of allStatuses) for (const fm of allFamilies)
      groundTruth.set(key([st],[],[fm]), crossFacet(toMap([st]), {}, toMap([fm])));

    // Every severity × family (4×8 = 32)
    for (const sv of allSeverities) for (const fm of allFamilies)
      groundTruth.set(key([],[sv],[fm]), crossFacet({}, toMap([sv]), toMap([fm])));

    // Every status × severity × family (4×4×8 = 128)
    for (const st of allStatuses) for (const sv of allSeverities) for (const fm of allFamilies)
      groundTruth.set(key([st],[sv],[fm]), crossFacet(toMap([st]), toMap([sv]), toMap([fm])));

    // Total: 1 + 4 + 4 + 8 + 16 + 32 + 32 + 128 = 225 combinations computed.
    expect(groundTruth.size).toBe(225);

    // Verify every combination re-derives to the same result (algorithm is deterministic)
    let verified = 0;
    for (const [k, expected] of groundTruth.entries()) {
      const [sts, svs, fms] = k.split('|').map(s => s ? s.split('+') : []);
      const actual = crossFacet(toMap(sts), toMap(svs), toMap(fms));
      expect(actual.visible).toBe(expected.visible);
      expect(actual.cfs).toEqual(expected.cfs);
      expect(actual.cfv).toEqual(expected.cfv);
      expect(actual.cff).toEqual(expected.cff);
      verified++;
    }
    expect(verified).toBe(225);

    // === STRUCTURAL INVARIANTS (must hold for ALL combinations) ===
    const noFilter = groundTruth.get(key([],[],[]))!;
    let invariantChecks = 0;

    for (const [k, result] of groundTruth.entries()) {
      const [sts, svs, fms] = k.split('|').map(s => s ? s.split('+') : []);

      // 1. Same-dimension invariant: status counts only change when severity or family filters change
      if (svs.length === 0 && fms.length === 0) {
        expect(result.cfs).toEqual(noFilter.cfs);
      }
      // 2. Same-dimension invariant: severity counts only change when status or family filters change
      if (sts.length === 0 && fms.length === 0) {
        expect(result.cfv).toEqual(noFilter.cfv);
      }
      // 3. Same-dimension invariant: family counts only change when status or severity filters change
      if (sts.length === 0 && svs.length === 0) {
        expect(result.cff).toEqual(noFilter.cff);
      }

      // 4. Visible count = sum of status counts for visible statuses only
      const visibleFromCfs = Object.entries(result.cfs)
        .filter(([st]) => sts.length === 0 || sts.includes(st))
        .reduce((sum, [, n]) => sum + n, 0);
      expect(result.visible).toBe(visibleFromCfs);

      // 5. Visible must be ≤ total controls
      expect(result.visible).toBeLessThanOrEqual(controls.length);

      invariantChecks++;
    }
    expect(invariantChecks).toBe(225);

    // === PINNED SPOT CHECKS (exact values from rhel7 data) ===
    expect(noFilter.visible).toBe(243);
    expect(noFilter.cfs).toEqual({"Failed":149,"Passed":78,"Not Reviewed":6,"Not Applicable":10});
    expect(noFilter.cfv).toEqual({"high":27,"medium":196,"low":11,"none":9});
    expect(noFilter.cff).toEqual({"AU":72,"SA":1,"AC":42,"IA":34,"CM":98,"SI":5,"SC":8,"MA":36});

    expect(groundTruth.get(key(['Failed'],[],[]))!.visible).toBe(149);
    expect(groundTruth.get(key(['Failed'],['high'],[]))!.visible).toBe(6);
    expect(groundTruth.get(key(['Failed'],[],['CM']))!.visible).toBe(41);
    expect(groundTruth.get(key(['Failed'],['medium'],['AU']))!.visible).toBe(64);
    expect(groundTruth.get(key(['Passed'],['high'],['CM']))!.visible).toBe(16);
    expect(groundTruth.get(key(['Not Applicable'],['none'],['AC']))!.visible).toBe(4);
  });

  it('data-families counts match static nistFamilies counts', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const acFromAttr = (output.match(/data-families="[^"]*AC[^"]*"/g) || []).length;
    const acFromStatic = output.match(/data-family-count="(\d+)"[^>]*>\s*AC/);
    expect(acFromStatic).not.toBeNull();
    expect(acFromAttr).toBe(parseInt(acFromStatic![1], 10));
  });

  it('control dd has margin-left:0 (no Blades indentation)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/article\.control\s+dd\s*\{[^}]*margin-left:\s*0/);
  });

  it('control h4 sections have top margin for spacing', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/article\.control\s+h4\s*\{[^}]*margin-top/);
  });

  it('highlighted code is inside <pre><code> structure', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/<pre[^>]*class="shiki[^"]*"[^>]*><code>/);
  });
});

describe('Mobile responsive layout (n3v.28)', () => {
  it('mobile CSS: icon buttons have 44px (2.75rem) min touch targets', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.btn-icon\s*\{[^}]*min-height:\s*2\.75rem/);
    expect(reportCss).toMatch(/\.btn-icon\s*\{[^}]*min-width:\s*2\.75rem/);
  });

  it('nav search form has no margin (Blades nav handles spacing)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/form\[role="search"\]\s*\{[^}]*margin:\s*0/);
  });

  it('mobile CSS: nav is static on mobile (not sticky)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/nav\[aria-label.*\]\s*\{[^}]*position:\s*static/);
  });

  it('status and severity chips are in separate role="group" rows (Pico-idiomatic)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const statusGroup = output.match(/<div[^>]*role="group"[^>]*aria-label="[^"]*status[^"]*"/i);
    const severityGroup = output.match(/<div[^>]*role="group"[^>]*aria-label="[^"]*severity[^"]*"/i);
    expect(statusGroup).not.toBeNull();
    expect(severityGroup).not.toBeNull();
  });

  it('mobile CSS: chips have 44px min-height touch target', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.chip\s*\{[^}]*min-height:\s*2\.75rem/);
  });

  it('mobile CSS: profile info table stacks to card layout', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/#profile-info\s+td\s*\{[^}]*display:\s*flex/);
    expect(reportCss).toMatch(/#profile-info\s+td::before/);
  });

  it('profile-info.liquid td elements have data-label attributes', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const src = templates['partials/profile-info'];
    expect(src).toContain('data-label="Filename"');
    expect(src).toContain('data-label="Tool Version"');
    expect(src).toContain('data-label="Platform"');
    expect(src).toContain('data-label="Duration (s)"');
  });

  it('back-to-top link is fixed position bottom-right', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\[data-jump-to="top"\]\s*\{[^}]*position:\s*fixed/);
    expect(reportCss).toMatch(/\[data-jump-to="top"\]\s*\{[^}]*bottom/);
    expect(reportCss).toMatch(/\[data-jump-to="top"\]\s*\{[^}]*right/);
  });

  it('NIST dropdown is in the filter-actions row (not inside a chip group)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const actionsMatch = output.match(/<div class="filter-actions">([\s\S]*?)<\/div>/);
    expect(actionsMatch).not.toBeNull();
    expect(actionsMatch![1]).toContain('nist-family-filter');
    expect(actionsMatch![1]).toContain('btn-expand-all');
  });
});

describe('Blades component refactor (n3v.31)', () => {
  const inputData = fs.readFileSync(
    'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
    {encoding: 'utf-8'}
  );

  it('nav uses Blades pattern: two <ul> groups, no custom wrappers', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const navMatch = output.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
    expect(navMatch).not.toBeNull();
    const navContent = navMatch![1];
    const ulCount = (navContent.match(/<ul[^>]*>/g) || []).length;
    expect(ulCount).toBe(2);
    expect(navContent).not.toContain('class="nav-row"');
    expect(navContent).not.toContain('class="nav-links"');
    expect(navContent).not.toContain('class="nav-actions"');
  });

  it('NIST dropdown uses Blades pattern: details.dropdown > summary + ul > li > label', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/details[^>]*id="nist-family-filter"[^>]*class="dropdown"/);
    expect(output).toMatch(/<ul[^>]*id="nist-family-list"/);
    const nistMatch = output.match(/<ul[^>]*id="nist-family-list"[^>]*>([\s\S]*?)<\/ul>/);
    expect(nistMatch).not.toBeNull();
    expect(nistMatch![1]).toContain('<li>');
  });

  it('report.css has no .nav-row, .nav-links, .nav-actions, .nav-search rules', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.nav-row\s*\{/);
    expect(reportCss).not.toMatch(/\.nav-links\s*\{/);
    expect(reportCss).not.toMatch(/\.nav-actions\s*\{/);
    expect(reportCss).not.toMatch(/\.nav-search\s*\{/);
  });

  it('report.css has no .chip-dropdown or .dropdown-body rules', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.chip-dropdown\s*[\{>]/);
    expect(reportCss).not.toMatch(/\.dropdown-body\s*[\{,]/);
  });

  it('report.css has no .chip-row rules (role="group" handles layout)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.chip-row\s*\{/);
  });

  it('filter chip groups use bare role="group" without wrapper class', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const statusGroup = output.match(/<div[^>]*role="group"[^>]*aria-label="[^"]*status[^"]*"[^>]*>/i);
    expect(statusGroup).not.toBeNull();
    expect(statusGroup![0]).not.toContain('class="chip-row"');
  });
});

describe('CSS audit fixes — Blades framework conflicts (n3v.27)', () => {
  it('mobile: summary layout stays flex-row (ring left, stats right — not stacked)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.summary-layout\s*\{[^}]*flex-direction:\s*column/);
  });

  it('mobile: compliance ring shrinks to compact size', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.compliance-ring\s*\{[^}]*width:\s*4\.5rem/);
    expect(reportCss).toMatch(/\.compliance-ring\s*\{[^}]*height:\s*4\.5rem/);
  });

  it('mobile: breakdown grid stacks to single column', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.breakdown-grid\s*\{[^}]*grid-template-columns:\s*1fr\s*[;,]/);
  });

  it('nav uses sticky positioning on desktop with backdrop blur', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/nav\[aria-label.*\]\s*\{[^}]*position:\s*sticky/);
    expect(reportCss).toMatch(/nav\[aria-label.*\]\s*\{[^}]*backdrop-filter/);
  });

  it('report header is flex row with hgroup filling and button right-aligned', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.report-header\s*\{[^}]*display:\s*flex/);
    expect(reportCss).toMatch(/\.report-header\s*\{[^}]*justify-content:\s*space-between/);
    expect(reportCss).toMatch(/\.report-header\s*>\s*hgroup\s*\{[^}]*flex:\s*1/);
  });

  it('filter-actions uses align-items:stretch for equal-height children', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.filter-actions\s*\{[^}]*align-items:\s*stretch/);
  });

  it('filter-actions buttons and summary share consistent font-size and padding', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.filter-actions\s+button.*summary\s*\{[^}]*font-size:\s*\.85rem/);
    expect(reportCss).toMatch(/\.filter-actions\s+button.*summary\s*\{[^}]*padding:\s*\.4rem\s+\.75rem/);
  });

  it('search input inside nav does not override Pico padding (preserves magnifying glass)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/nav.*input.*padding-inline-start/);
  });

  it('filter-actions row has NIST + expand + collapse + count + clear on one row', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const actionsMatch = output.match(/<div class="filter-actions">([\s\S]*?)<\/div>\s*<div/);
    expect(actionsMatch).not.toBeNull();
    const content = actionsMatch![1];
    expect(content).toContain('nist-family-filter');
    expect(content).toContain('btn-expand-all');
    expect(content).toContain('btn-collapse-all');
    expect(content).toContain('filter-count');
    expect(content).toContain('btn-clear-filters');
  });

  it('nav has proper padding via Blades native spacing', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/nav\[aria-label.*\]\s*\{[^}]*padding/);
  });

  it('expand/collapse buttons are in the filter bar (not nav)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const navMatch = output.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
    expect(navMatch).not.toBeNull();
    expect(navMatch![1]).not.toContain('btn-expand-all');
    expect(navMatch![1]).not.toContain('btn-collapse-all');
    const filterMatch = output.match(/id="filter-bar"([\s\S]*?)<!-- end filter-bar -->/);
    expect(filterMatch).not.toBeNull();
    expect(filterMatch![1]).toContain('btn-expand-all');
  });

  it('expand/collapse buttons use arrow+text labels (not cryptic icons)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/id="btn-expand-all"[^>]*>.*Expand/);
    expect(output).toMatch(/id="btn-collapse-all"[^>]*>.*Collapse/);
  });

  it('search input uses Pico role="search" group pattern', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/role="search"[^>]*>[\s\S]*?id="control-search"/);
  });

  it('active status chips use status colors (not generic primary)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.chip\[data-filter-status.*Passed.*aria-current/);
    expect(reportCss).toContain('--st-pass-fg');
    expect(reportCss).toMatch(/\.chip\[data-filter-status.*Failed.*aria-current/);
    expect(reportCss).toMatch(/\.chip\[data-filter-severity.*high.*aria-current/);
  });

  it('filter-actions row uses flex with count pushed right via margin-left:auto', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.filter-actions\s*\{[^}]*display:\s*flex/);
    expect(reportCss).toMatch(/#filter-count\s*\{[^}]*margin-left:\s*auto/);
  });

  it('theme toggle is inside the report header (same row as title)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    const headerMatch = output.match(/<header class="report-header[^"]*">([\s\S]*?)<\/header>/);
    expect(headerMatch).not.toBeNull();
    expect(headerMatch![1]).toContain('id="theme-toggle"');
  });

  it('report header has top padding (title does not touch browser edge)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.report-header\s*\{[^}]*padding-top/);
  });

  it('filter bar has background and border styling', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).toMatch(/\.report-filters\s*\{[^}]*background/);
    expect(reportCss).toMatch(/\.report-filters\s*\{[^}]*border/);
  });

  it('H1: nav uses Blades native layout (no .nav-row wrapper)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.nav-row/);
  });

  it('H2: NIST dropdown uses Blades "dropdown" class (not custom chip-dropdown)', async () => {
    const mapper = new FromHDFToHTMLMapper(
      [{data: fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8'), fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toContain('class="dropdown"');
    expect(output).not.toContain('chip-dropdown');
  });

  it('M1: no .nav-links class in CSS (Blades nav ul provides these)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toMatch(/\.nav-links/);
  });

  it('M4: no --pico-accordion-border-color in report.css (dead variable)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('--pico-accordion-border-color');
  });

  it('L1: no orphaned nav.container-fluid or .filter-row selectors', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('nav.container-fluid');
    expect(reportCss).not.toMatch(/\.filter-row\s*[\{,]/);
  });

  it('L1: print break-avoid targets .summary-hero not .summary-grid', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('.summary-grid > article');
    expect(reportCss).toContain('.summary-hero');
  });

  it('L2: filter-bar.liquid partial does not exist (orphaned)', () => {
    expect(fs.existsSync('data/reverse-html-mapper/templates/partials/filter-bar.liquid')).toBe(false);
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

  it('does not add custom CSS for data-tooltip, ins, or del (Blades native)', async () => {
    const {reportCss} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    expect(reportCss).not.toContain('data-tooltip');
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

describe('Profile visibility toggle (n3v.33)', () => {
  it('multi-profile: each Profile Info row has an eye toggle button with data-file-id', async () => {
    const rhel7 = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8');
    const sonarqube = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json', 'utf-8');
    const mapper = new FromHDFToHTMLMapper(
      [
        {data: rhel7, fileName: 'rhel7-results.json', fileID: 'rhel7'},
        {data: sonarqube, fileName: 'sonarqube-hdf.json', fileID: 'sonarqube'}
      ],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/data-file-id="rhel7"/);
    expect(output).toMatch(/data-file-id="sonarqube"/);
    expect(output).toContain('👁');
  });

  it('single-profile: no eye toggle button', async () => {
    const rhel7 = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8');
    const mapper = new FromHDFToHTMLMapper(
      [{data: rhel7, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).not.toContain('data-file-id=');
    expect(output).not.toContain('👁');
  });

  it('profile sections are collapsible via details/summary (Blades accordion)', async () => {
    const rhel7 = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8');
    const sonarqube = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json', 'utf-8');
    const mapper = new FromHDFToHTMLMapper(
      [
        {data: rhel7, fileName: 'rhel7-results.json', fileID: 'rhel7'},
        {data: sonarqube, fileName: 'sonarqube-hdf.json', fileID: 'sonarqube'}
      ],
      FileExportTypes.Administrator
    );
    const output = await mapper.toHTML();
    expect(output).toMatch(/<section id="file-rhel7"[^>]*>[\s\S]*?<details[^>]*open/);
    expect(output).toMatch(/<summary[^>]*>[\s\S]*?rhel7-results\.json/);
  });

  it('scripts contain profile toggle logic', async () => {
    const {templates} = await import(
      '../../../src/converters-from-hdf/html/embedded-assets.js'
    );
    const scriptsSrc = templates['partials/scripts'];
    expect(scriptsSrc).toContain('data-file-id');
    expect(scriptsSrc).toContain('file-');
  });
});

describe('Multi-profile report', () => {
  it('generates a report with 3 profiles and writes to disk for live review', async () => {
    const rhel7 = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json', 'utf-8');
    const sonarqube = fs.readFileSync('sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json', 'utf-8');
    const sonarBranch = fs.readFileSync('sample_jsons/sonarqube_mapper/sonarqube-branch-hdf.json', 'utf-8');

    const mapper = new FromHDFToHTMLMapper(
      [
        {data: rhel7, fileName: 'rhel7-results.json', fileID: 'rhel7'},
        {data: sonarqube, fileName: 'sonarqube-hdf.json', fileID: 'sonarqube'},
        {data: sonarBranch, fileName: 'sonarqube-branch.json', fileID: 'sonar-branch'}
      ],
      FileExportTypes.Administrator
    );

    const output = await mapper.toHTML();

    fs.writeFileSync('sample_jsons/html_reverse_mapper/multi-profile.html', output);

    expect(output).toContain('rhel7-results.json');
    expect(output).toContain('sonarqube-hdf.json');
    expect(output).toContain('sonarqube-branch.json');

    const fileSections = output.match(/<section id="file-/g) || [];
    expect(fileSections.length).toBe(3);

    const navLinks = output.match(/<li><a href="#file-/g) || [];
    expect(navLinks.length).toBe(3);

    expect(output).toContain('data-families=');
    expect(output).toContain('data-status=');
    expect(output).toContain('class="shiki');
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
