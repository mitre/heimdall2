import {http, HttpResponse} from 'msw';
import {readSample} from '../../utils';

const HOST = 'http://127.0.0.1:3001';

function loadIssuesFixture(projectKey: string, suffix = ''): object {
  const fixtureMap: Record<string, string> = {
    xss: 'sonarqube_mapper/sample_input_report/sonarqube-issues-xss.json',
    libc_unix: 'sonarqube_mapper/sample_input_report/sonarqube-issues-libc.json',
  };
  const suffixedKey = `${projectKey}${suffix}`;
  const path = fixtureMap[suffixedKey] ?? fixtureMap[projectKey];
  if (path) {
    try {
      return JSON.parse(readSample(path));
    } catch {
      // fixture doesn't exist yet — return empty
    }
  }
  return {
    paging: {pageIndex: 1, pageSize: 100, total: 0},
    issues: [],
    components: [],
    rules: [],
    facets: [],
    effortTotal: 0,
  };
}

function loadRuleFixture(ruleKey: string): object {
  const ruleId = ruleKey.split(':').pop() ?? ruleKey;
  try {
    return JSON.parse(readSample(`sonarqube_mapper/sample_input_report/sonarqube-rule-${ruleId}.json`));
  } catch {
    return {
      rule: {
        key: ruleKey,
        name: ruleKey,
        htmlDesc: '',
        severity: 'MAJOR',
        status: 'READY',
        isTemplate: false,
        isExternal: false,
        tags: [],
        sysTags: [],
        type: 'VULNERABILITY',
        lang: 'js',
        langName: 'JavaScript',
      },
      actives: [],
    };
  }
}

export const sonarqubeHandlers = [
  http.get(`${HOST}/api/server/version`, () => {
    return new HttpResponse('9.9.8.100196');
  }),

  http.get(`${HOST}/api/webservices/list`, () => {
    return HttpResponse.json({
      webServices: [
        {
          path: 'api/issues',
          actions: [
            {
              key: 'search',
              params: [
                {
                  key: 'statuses',
                  possibleValues: [
                    'OPEN',
                    'CONFIRMED',
                    'REOPENED',
                    'RESOLVED',
                    'CLOSED',
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  }),

  http.get(`${HOST}/api/issues/search`, ({request}) => {
    const url = new URL(request.url);
    const componentKeys = url.searchParams.get('componentKeys') ?? 'unknown';
    const branch = url.searchParams.get('branch');
    const fixture = loadIssuesFixture(componentKeys) as Record<string, unknown>;
    if (branch && Array.isArray(fixture.components)) {
      fixture.components = (fixture.components as Record<string, unknown>[]).map(
        (c) => ({...c, branch})
      );
    }
    return HttpResponse.json(fixture);
  }),

  http.get(`${HOST}/api/components/tree`, ({request}) => {
    const url = new URL(request.url);
    const component = url.searchParams.get('component') ?? 'unknown';
    return HttpResponse.json({
      paging: {pageIndex: 1, pageSize: 100, total: 0},
      baseComponent: {
        key: component,
        description: '',
        qualifier: 'TRK',
        tags: [],
        visibility: 'public',
      },
      components: [],
    });
  }),

  http.get(`${HOST}/api/rules/show`, ({request}) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') ?? 'unknown';
    return HttpResponse.json(loadRuleFixture(key));
  }),

  http.get(`${HOST}/api/sources/raw`, ({request}) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') ?? '';
    const sourceMap: Record<string, string> = {
      'xss:packages/docs/src/service-worker.js': 'sonarqube_mapper/sample_input_report/source-service-worker.js',
      'libc_unix:dev/src/libc_unix/sumapss7.c': 'sonarqube_mapper/sample_input_report/source-sumapss7.c',
    };
    const fixturePath = sourceMap[key];
    if (fixturePath) {
      try {
        return new HttpResponse(readSample(fixturePath));
      } catch {
        // fall through
      }
    }
    return new HttpResponse(`// mock source for ${key}\n`);
  }),
];
