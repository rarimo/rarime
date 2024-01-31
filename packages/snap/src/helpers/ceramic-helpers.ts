import { DID as CeramicDID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';
import { Hex } from '@iden3/js-crypto';
import { ComposeClient } from '@composedb/client';
import type { RuntimeCompositeDefinition } from '@composedb/types';
import { CERAMIC_URL } from '../config';

export class CeramicProvider {
  private readonly pkHex: string;

  private readonly serverURL?: string;

  private _compose: ComposeClient;

  constructor(pkHex: string, composeClient: ComposeClient) {
    this.pkHex = pkHex;
    this._compose = composeClient;
  }

  public static create(
    pkHex: string,
    opts: { definition: object; serverURL?: string },
  ) {
    const composeClient = new ComposeClient({
      ceramic: CERAMIC_URL,
      definition: opts.definition as RuntimeCompositeDefinition,
      ...(opts.serverURL && { serverURL: opts.serverURL }),
    });

    return new CeramicProvider(pkHex, composeClient);
  }

  async auth() {
    const did = new CeramicDID({
      provider: new Ed25519Provider(Hex.decodeString(this.pkHex)),
      resolver: getResolver(),
    });

    await did.authenticate();

    this._compose.setDID(did);
  }

  public client() {
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
