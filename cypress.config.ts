import { defineConfig } from 'cypress';
import installLogsPrinter from 'cypress-terminal-report/src/installLogsPrinter';

export default defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 10_000,
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    setupNodeEvents(on) {
      installLogsPrinter(on);
    },
    specPattern: 'test/e2e/**/*.cy.ts',
    supportFile: 'test/support/e2e.ts',
  },
  fixturesFolder: false,
  requestTimeout: 30_000,
  // Forces failed tests to retry up to 3 times
  retries: { runMode: 3 },
  screenshotsFolder: 'test/screenshots',
  video: true,
  videosFolder: 'test/videos',
  viewportHeight: 900,
  viewportWidth: 1440,
});
