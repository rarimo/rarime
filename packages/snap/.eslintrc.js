module.exports = {
  extends: ['../../.eslintrc.js'],

  ignorePatterns: [
    '!.eslintrc.js',
    'dist/',
    '**/src/typia-generated/*.ts',
    '**/*.js',
    '**/scripts/**/*.js',
    '**/src/**/*.test.ts',
    '**/src/**/types/**/contracts/**/*.ts',
    '**/src/**/types/**/graphql/**/*.ts',
  ],
};
