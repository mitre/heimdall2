module.exports = {
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/unit/*.spec.ts'],
  testPathIgnorePatterns: ['<rootDir>/src/__mocks__/*'],
  moduleFileExtensions: ['vue', 'ts', 'tsx', 'js', 'jsx'],
  testEnvironment: 'jsdom',
  cacheDirectory: '<rootDir>/.cache/unit',
  transform: {
    '.*\\.(vue)$': 'vue-jest',
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.svg$': '<rootDir>/tests/util/svgTransform.js'
  },
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^@[/](.+)': '<rootDir>/src/$1',
    '^.+\\.(css)$': '<rootDir>/tests/util/cssTransform.js'
  }
};
