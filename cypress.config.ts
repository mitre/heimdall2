import {defineConfig} from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter';

export default defineConfig({
  fixturesFolder: false,
  screenshotsFolder: 'test/screenshots',
  videosFolder: 'test/videos',
  video: true,
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {
      installLogsPrinter(on)
    },
    baseUrl: 'http://127.0.0.1:3000',
    supportFile: 'test/support/index.ts',
    specPattern: 'test/integration/**/*.cy.{js,jsx,ts,tsx}'
  },
  // Extends timeout counter to 60s
  defaultCommandTimeout: 60000,
  requestTimeout: 30000,
  // Forces failed tests to retry up to 3 times
  retries: {runMode: 3}
});
