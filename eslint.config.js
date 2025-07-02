// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const pluginImport = require('eslint-plugin-import');

module.exports = defineConfig([
  expoConfig,
  {
    plugins: {
      import: pluginImport,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      // Optional: you can enable import rules
      'import/no-unresolved': 'error',
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    ignores: ['dist/*'],
  },
]);
