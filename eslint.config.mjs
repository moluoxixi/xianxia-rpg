import antfu from '@antfu/eslint-config';

export default antfu({
  react: true,
  stylistic: {
    semi: true,
  },
  typescript: true,
  ignores: [
    'dist',
    'node_modules',
    'package-lock.json',
  ],
}, {
  rules: {
    'antfu/consistent-list-newline': 'off',
    'antfu/if-newline': 'off',
    'jsonc/sort-keys': 'off',
    'perfectionist/sort-exports': 'off',
    'perfectionist/sort-imports': 'off',
    'perfectionist/sort-named-exports': 'off',
    'perfectionist/sort-named-imports': 'off',
    'node/prefer-global/process': 'off',
    'react/no-array-index-key': 'off',
    'react/no-forward-ref': 'off',
    'react-refresh/only-export-components': 'off',
    'style/arrow-parens': 'off',
    'style/brace-style': 'off',
    'style/quote-props': 'off',
    'ts/method-signature-style': 'off',
  },
});
