import { DID as CeramicDID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { Hex } from '@iden3/js-crypto';
import { ComposeClient } from '@composedb/client';
import type { RuntimeCompositeDefinition } from '@composedb/types';
import { CERAMIC_URL } from '../config';
import { getItemFromStore } from '../rpc';
import { StorageKeys } from '../enums';
import VerifiableRuntimeComposite from '../../ceramic/composites/VerifiableCredentials-runtime.json';
// import {
// ApolloClient,
// InMemoryCache,
// Observable,
// ApolloLink,
// } from '@apollo/client/core';

export class CeramicProvider {
  private _compose = new ComposeClient({
    ceramic: CERAMIC_URL,
    definition: VerifiableRuntimeComposite as RuntimeCompositeDefinition,
  });

  async auth() {
    const identityStorage = await getItemFromStore(StorageKeys.identity);

    if (!identityStorage) {
      throw new Error('Identity not created yet');
    }

    const did = new CeramicDID({
      provider: new Ed25519Provider(
        Hex.decodeString(identityStorage.privateKeyHex),
      ),
      resolver: getResolver(),
    });

    await did.authenticate();

    this._compose.setDID(did);
  }

  // TODO: will auth affect on this properly?
  public async client() {
    await this.auth();

    // const link = Object.assign(
    //   {},
    //   new ApolloLink((operation) => {
    //     return new Observable((observer) => {
    //       this._compose.execute(operation.query, operation.variables).then(
    //         (result) => {
    //           observer.next(result);
    //           observer.complete();
    //         },
    //         (error) => {
    //           observer.error(error);
    //         },
    //       );
    //     });
    //   }),
    // );

    // Use ApolloLink instance in ApolloClient config
    // return new ApolloClient({
    //   cache: new InMemoryCache(),
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-ignore
    //   // link: { ...link },
    // });

    return this._compose;
  }

  public encrypt = async (data: unknown) => {
    const jwe = await this._compose.did?.createJWE(
      new TextEncoder().encode(JSON.stringify(data)),
      [this._compose.did.id],
    );
    return btoa(JSON.stringify(jwe));
  };

  public decrypt = async <T>(data: string): Promise<T> => {
    const jwe = JSON.parse(atob(data));
    const decrypted = await this._compose.did?.decryptJWE(jwe);
    return JSON.parse(new TextDecoder().decode(decrypted));
  };
}
