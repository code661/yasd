module.exports = {
  parser: '@typescript-eslint/parser',
  settings: {
    react: {
      version: 'detect',
    }
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'react/prop-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
  },
}
