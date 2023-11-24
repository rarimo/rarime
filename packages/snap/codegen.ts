import * as path from 'path';
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: ['http://localhost:5005/graphql'],
  documents: [path.resolve(__dirname, `./ceramic/queries/**/*.graphql`)],
  generates: {
    [`src/types/graphql/index.ts`]: {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-document-nodes',
      ],
    },
  },
};

export default config;
