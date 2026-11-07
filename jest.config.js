// Test suite — see docs/TESTING.md.
//   npm test               → unit + security suites
//   npm run test:unit      → app logic and components
//   npm run test:security  → security checks
//   npm run verify         → lint + tests + dependency audit + bundle build
const shared = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/tests/setup.js'],
  clearMocks: true,
};

module.exports = {
  projects: [
    { ...shared, displayName: 'unit', testMatch: ['<rootDir>/tests/unit/**/*.test.js'] },
    { ...shared, displayName: 'security', testMatch: ['<rootDir>/tests/security/**/*.test.js'] },
  ],
};
