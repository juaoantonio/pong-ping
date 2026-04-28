import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^server-only$": "<rootDir>/test/mocks/empty.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

export default createJestConfig(config);
