module.exports = {
  extends: ['../../.eslintrc.js'],

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        '@typescript-eslint/no-explicit-any': 'error',
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
  ],

  ignorePatterns: [
    '!.eslintrc.js',
    'dist/',
    '**/*.js',
    '**/scripts/**/*.js',
    '**/jest.config.ts',
    '**/*.test.ts',
    '**/src/**/types/**/contracts/**/*.ts',
    '**/src/**/types/**/graphql/**/*.ts',
  ],
};
