// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', '.baseline/**', '.npm-cache/**', '.browser-profile/**', '.qa/**', 'test-results/**', 'baseline-dist/**'],
  },
]);
