import { defineConfig } from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter';

export default defineConfig({
  chromeWebSecurity: false,
  // Extends timeout counter to 60s
  defaultCommandTimeout: 60_000,
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    setupNodeEvents(on, _config) {
      installLogsPrinter(on);
    },
    specPattern: 'test/integration/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'test/support/index.ts',
  },
  fixturesFolder: false,
  requestTimeout: 30_000,
  // Forces failed tests to retry up to 3 times
  retries: { runMode: 3 },
  screenshotsFolder: 'test/screenshots',
  video: true,
  videosFolder: 'test/videos',
});
