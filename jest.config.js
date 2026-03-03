/** @type {import('ts-jest').JestConfigWithTsJest}
 */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/*.test.ts"],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  transform: {
    // \.[jt]sx?$ is used for ts-jest by default
    '^.+\.tsx?$': [
      'ts-jest', {
        useESM: true,
      },
    ],
  },
};
