import type { SnapConfig } from '@metamask/snaps-cli';

const config: SnapConfig = {
  bundler: 'webpack', // default: 'browserify'
  input: 'src/index.ts',
  output: {
    path: 'dist',
  },
  server: {
    port: 8081,
  },
};

export default config;
