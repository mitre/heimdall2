import {defineConfig} from 'cypress';

// Used by .github/workflows/build-save-docker.yml to screenshot the built image.
// No supportFile: the e2e support file clears the database through /users/clear,
// which only exists in the test-mode backend and which a production image refuses.
export default defineConfig({
  screenshotsFolder: 'test/screenshots',
  video: false,
  chromeWebSecurity: false,
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    supportFile: false,
    specPattern: 'test/container/**/*.cy.ts'
  },
  defaultCommandTimeout: 60000,
  requestTimeout: 30000
});
