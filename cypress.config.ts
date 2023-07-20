import { defineConfig } from 'cypress'

export default defineConfig({
  fixturesFolder: false,
  screenshotsFolder: 'test/screenshots',
  videosFolder: 'test/videos',
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on, config) {},
    baseUrl: 'http://127.0.0.1:3000',
    supportFile: 'test/support/index.ts',
    specPattern: 'test/integration/**/*.cy.{js,jsx,ts,tsx}',
  },
  defaultCommandTimeout: 10000,
  requestTimeout: 10000
})
