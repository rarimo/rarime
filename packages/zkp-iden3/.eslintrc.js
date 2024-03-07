module.exports = {
  extends: ['../../.eslintrc.js'],

  ignorePatterns: [
    '!.eslintrc.js',
    'dist/',
    '**/*.js',
    '**/scripts/**/*.js',
    '**/src/**/*.test.ts',
    '**/src/**/types/**/contracts/**/*.ts',
    '**/src/**/types/**/graphql/**/*.ts',
  ],
};
