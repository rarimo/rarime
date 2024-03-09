module.exports = {
  root: true,

  parserOptions: {
    sourceType: 'module',
  },

  extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['*.ts', '*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/no-non-null-assertion': 0,
        'no-restricted-globals': 0,
        '@typescript-eslint/naming-convention': 0,
        '@typescript-eslint/prefer-nullish-coalescing': 0,
        'id-length': 0,
        'id-denylist': 0,
        '@typescript-eslint/restrict-template-expressions': 0,
        '@typescript-eslint/unbound-method': 0,
        '@typescript-eslint/no-unnecessary-type-assertion': 0,
        '@typescript-eslint/restrict-plus-operands': 0,
        // TEMP:
        'no-restricted-syntax': 0,
      },
    },

    {
      files: ['*.test.ts', '*.test.js'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        '@typescript-eslint/no-shadow': [
          'error',
          { allow: ['describe', 'expect', 'it'] },
        ],
      },
    },
  ],

  ignorePatterns: [
    '!.prettierrc.js',
    '**/!.eslintrc.js',
    '**/dist*/',
    '**/scripts/**/*.js',
    'jest.config.base.js',
    'jest.config.js',
    '**/*__GENERATED__*',
    '**/build',
    '**/public',
    '**/.cache',
  ],
};
