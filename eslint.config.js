// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Test suite (see docs/TESTING.md): Jest + Node globals.
  {
    files: ['tests/**/*.js', 'jest.config.js'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    // jest.mock(...) calls intentionally sit above the imports they affect
    // (Jest hoists them); the import-order rule doesn't know that.
    rules: { 'import/first': 'off' },
  },
  // Node scripts (npm run verify / audit:deps).
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
]);
