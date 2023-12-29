module.exports = {
  rootDir: '.',
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/*.spec.ts'],
  testPathIgnorePatterns: ['<rootDir>/src/__mocks__/*'],
  moduleFileExtensions: ['vue', 'ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/.cache/unit',
  transform: {
    '.*\\.(vue)$': [
      'vue-jest',
      {
        tsconfig: {
          allowJs: true
        }
      }
    ],
    '^.+\\.[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true
        }
      }
    ],
    '^.+\\.svg$': '<rootDir>/tests/util/svgTransform.js'
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!uuid)'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^d3$': '<rootDir>/tests/util/d3.js',
    '^@[/](.+)': '<rootDir>/src/$1',
    '^.+\\.(css)$': '<rootDir>/tests/util/cssTransform.js',
    '^csv-stringify/sync$': 'csv-stringify/dist/cjs/sync.cjs'
  }
};
