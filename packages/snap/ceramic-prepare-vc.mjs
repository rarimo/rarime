/**
 * @name ceramic-prepare-vc
 * @description Create composite from graphql model,
 * deploy and compile json files
 *
 * https://developers.ceramic.network/docs/composedb/create-your-composite
 */

import path from 'path';
import fs from 'fs';

import { fileURLToPath } from 'url';
import npm from 'npm-commands';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// http://0.0.0.0:7007 || https://ceramic.rarimo.com
const ceramicUrl = process.env.CERAMIC_URL;
const didPK = process.env.DID_PRIVATE_KEY

// Directory path
const modelsDirPath = './ceramic/models';

// Reading directory contents
fs.readdir(modelsDirPath, async (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  for (const file of files) {
    if (fs.statSync(path.join(modelsDirPath, file)).isFile()) {
      console.log('\n\n==========================================================\n\n');
      console.log('PREPARE VC FOR:', file);

      const modelFile = path.join(
        __dirname,
        `./ceramic/models/${file}`,
      );

      const modelFileName = path.basename(`./ceramic/models/${modelFile}`, '.graphql');

      const compositeOutput = path.join(
        __dirname,
        `./ceramic/composites/${modelFileName}.json`,
      );

      const runtimeOutput = path.join(
        __dirname,
        `./ceramic/composites/${modelFileName}-runtime.json`,
      );

      await npm().arguments({
        ['ceramic-url']: ceramicUrl,
        ['output']: compositeOutput,
        ['did-private-key']: didPK,
      }).runAsync(`composedb composite:create ${modelFile}`);

      await npm().arguments({
        ['ceramic-url']: ceramicUrl,
        ['did-private-key']: didPK,
      }).runAsync(`composedb composite:deploy ${compositeOutput}`);

      await npm().arguments({
        ['ceramic-url']: ceramicUrl,
      }).runAsync(`composedb composite:compile ${compositeOutput} ${runtimeOutput}`);
    }
  }
});
