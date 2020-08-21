module.exports = {
  rootDir: ".",
  preset: "jest-puppeteer",
  testMatch: ["<rootDir>/*.spec.ts"],
  moduleFileExtensions: ["vue", "ts", "tsx", "js", "jsx"],

  cacheDirectory: "<rootDir>/.cache/unit",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^@[/](.+)": "<rootDir>/src/$1"
  }
};
