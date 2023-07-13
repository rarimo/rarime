# TypeScript Example Snap

MetaMask Snap(extension) that implements an SSI wallet for Rarimo Identity System and facilitates the generation of zero-knowledge proofs.

## Methods
### Create an identity
To create an identity you need to call this method:

    await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'snapId',
          request: { method: 'create_identity' },
        },
      });

### Save Verifiable Credentials
To save Verifiable Credentials you need to call this method with params:

    await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'snapId',
          request: {
            method: 'save_credentials',
            params: {
              body: {
                credentials: [
                  {
                    description: 'Natural Person',
                    id: '86531650-023c-4c6c-a437-a82e137ead68',
                  },
                ],
                url: 'http://127.0.0.1:8000/integrations/issuer/v1/public/claims/offers/callback',
              },
              from: 'did:iden3:tJnRoZ1KqUPbsfVGrk8io51iqoRc5dGhj5LLMHSrD',
              id: '026035f6-42f6-4a2d-b516-0b11d2674850',
              thid: '348b7198-7cb1-46f4-bc0a-98a358f65539',
              to: 'did:iden3:tTxif8ahrSqRWavS8Qatrp4ZEJvPdu3ELSMgqTEQN',
              typ: 'application/iden3comm-plain-json',
              type: 'https://iden3-communication.io/credentials/1.0/offer',
            },
          },
        },
      });

### Create a proof
To create a proof you need to call this method with params:

    await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'snapId',
          request: {
            method: 'create_proof',
            params: {
              circuitId: 'credentialAtomicQuerySigV2OnChain',
              challenge: '1251760352881625298994789945427452069454957821390', // BigInt string (optional)
              slotIndex: 0, // optional
              query: {
                allowedIssuers: ['*'],
                context:
                  'https://raw.githubusercontent.com/omegatymbjiep/schemas/main/json-ld/NaturalPerson.json-ld',
                credentialSubject: {
                  isNatural: {
                    $eq: 1,
                  },
                },
                type: 'NaturalPerson',
              },
            },
          },
        },
      });

## Testing

The snap comes with some basic tests, to demonstrate how to write tests for
snaps. To test the snap, run `yarn test` in this directory. This will use
[`@metamask/snaps-jest`](https://github.com/MetaMask/snaps/tree/main/packages/snaps-jest)
to run the tests in `src/index.test.ts`.

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with
  the CLI, `transpilationMode` must be set to `localOnly` (default) or
  `localAndDeps`.
