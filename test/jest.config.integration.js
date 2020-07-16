module.exports = {
  rootDir: ".",
  preset: "jest-puppeteer",
 // setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["<rootDir>/integration/*.spec.ts"],
  testPathIgnorePatterns: ["<rootDir>/src/__mocks__/*"],
  moduleFileExtensions: ["vue", "ts", "tsx", "js", "jsx"],

  cacheDirectory: "<rootDir>/.cache/unit",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^@[/](.+)": "<rootDir>/src/$1"
  },
  browserContext: "default"
};
