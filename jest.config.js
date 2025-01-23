/** @type {import("ts-jest").JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["./src/test/dbMock.ts", "./src/test/authMock.ts"],
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": ["babel-jest", { "configFile": "./babel.config.jest.js" }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!@auth)/"
  ]
};