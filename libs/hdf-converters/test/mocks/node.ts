import {setupServer} from 'msw/node';
import {splunkHandlers} from './handlers/splunk';
import {sonarqubeHandlers} from './handlers/sonarqube';

export const server = setupServer(
  ...splunkHandlers,
  ...sonarqubeHandlers,
);
