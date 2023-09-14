import {defineConfig} from 'cypress';

export default defineConfig({
  fixturesFolder: false,
  screenshotsFolder: 'test/screenshots',
  videosFolder: 'test/videos',
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://127.0.0.1:3000',
    supportFile: 'test/support/index.ts',
    specPattern: 'test/integration/**/*.cy.{js,jsx,ts,tsx}'
  },
  // Extends timeout counter to 30000 ms
  defaultCommandTimeout: 30000,
  requestTimeout: 10000,
  // Forces failed tests to retry up to 2 times
  retries: {runMode: 2}
});
