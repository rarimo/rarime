module.exports = {
  extends: ['../../.eslintrc.js'],

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
