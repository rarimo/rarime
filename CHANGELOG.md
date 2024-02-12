## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

[Unreleased]
### Added
- `@rarimo/rarime`:
  - `RemoveCredentials` credentials RPC method
  - `ExportIdentity` RPC method
  - `getIdentity` rpc method

### Changed
- `@rarimo/rarime`:
  - `CreateIdentity` - now can generate from a private key hex from params

## [2.0.3] - 2024-02-06
### Changed
- `@rarimo/rarime`:
  - Tweaked wording in the ZK proof generation prompt;

### Fixed
- `@rarimo/rarime`:
  - `CreateIdentity` - added more checks within DID.parse to handle legacy DIDs;

## [2.0.2] - 2024-02-01
### Added
- `@rarimo/rarime`:
  - Migration to a Compose DB model with increased Verifiable Credential size;
  - Compose DB model preparation script;

## [2.0.1] - 2024-01-24
### Changed
- `@rarimo/rarime-connector` - set strict snap version requirement

## [2.0.0] - 2024-01-23

### Added
- `@rarimo/rarime`:
  - Credentials storage tests
  - Add RariMe App hostnames to the whitelist
  - `CheckCredentialExistence`  request
- `@rarimo/rarime-connector`:
  - MetaMask version compatibility check
  - `CheckCredentialExistence` request

### Changed
- `@rarimo/rarime`
  - Moved credential-helpers methods to `VCManager` class:
    - Ceramic account injection;
    - Unified ceramic client;
    - Hashing and encrypting data;
  - Moved credentials to ComposeDB
  - `SaveCredentials` method will no return `type` and `issuer` did instead of whole W3CCredential

### Fixed
- Patch snap dependencies after every `yarn isntall`
- Handling re-issued credentials

## [1.0.2] - 2023-12-08
### Changed
- `@rarimo/rarime` - added new dashboard domains to the whitelist;

## [1.0.1] - 2023-11-29
### Fixed
- `@rarimo/rarime` - `identity` creation

## [1.0.0] - 2023-11-27
### Added
- `@rarimo/rarime` new dev dependencies:
  - `@metamask/snaps-sdk`
  - `@metamask/snaps-utils`

### Changed
- `@rarimo/rarime`:
  - Save credentials to ceramic instead of snap store
  - Use MetaMask File API for `MTPv2OnChain` and Auth circuits
  - Return did in bigint representation alongside the default representation```
  - Updated dependencies:
    - `@metamask/snaps-jest` to "^4.0.0"
    - `@metamask/snaps-cli` to "3.0.2"

### Removed
- `@rarimo/rarime`:
  - `create` and `recover` backup methods
  - `@metamask/snaps-types` and `@metamask/snaps-ui` dependencies
- `@rarimo/rarime-connector`:
  - `create` and `recover` backup methods

## [0.8.0] - 2023-10-23
### Changed
- `@rarimo/rarime`:
  - Return `state` and `zkp proof` details instead of `update state details`
- `@rarimo/rarime-connector`:
  - Get update state details after receive zkProof from rarime snap

## [0.7.2] - 2023-10-23
### Fixed
- `@rarimo/rarime`:
  - Reduced TSS fetching retry time

## [0.7.1] - 2023-10-23
### Fixed
- `@rarimo/rarime`:
  - Rolled back IPFS urls to fix performance issues;

## [0.7.0] - 2023-10-21
### Changed
- `@rarimo/rarime`:
  - update circuit urls

### Fixed
- `@rarimo/rarime`:
  - add `issuerDid` to filter credentials by issuer

## [0.6.0] - 2023-10-19
### Changed
- `@rarimo/rarime`:
  - expose transit state details on `createProof`
  - update `IssuerData` and `BJJSignatureProof2021` classes for compatibility with the new issuer
  - use the state at a specific block when generating the proofs to prevent possible conflicts


## [0.5.0] - 2023-10-13
### Added
- `@rarimo/rarime`: get credentials method
- Publish snap and connector to npm on git tag push

### Changed
- `@rarimo/rarime`: use `ethereum` provider instead of `window.ethereum`

### Removed
- `@rarimo/rarime`: private key from `Identity info` snap dialog
- `@rarimo/rarime-connector`: `isSnapInstalled` check from `enableSnap` method

## [0.4.0] - 2023-09-27
### Changed
- `@rarimo/rarime`: use Rarimo's beta network when user switches to a testnet in MetaMask

## [0.3.2] - 2023-09-26
### Fixed

- RariMe casing in the docs and meta-descriptions.

### Changed

- Updated the snap description.

## [0.3.1] - 2023-09-14
### Added
- `@rarimo/rarime`: preversion hook in package.json

### Changed
- `@rarimo/rarime-connector`: bumped required snap version

### Fixed
- `@rarimo/rarime`: manifest shasum on npm

## [0.3.0] - 2023-09-13
### Added
- `@rarimo/rarime`: optional parameter `blockHeight` in `loadDataFromRarimoCore` method

### Changed
- `@rarimo/rarime-connector`: `snap` version

## [0.2.0] - 2023-09-06
### Changed
- `@rarimo/rarime`: improved identity creation UX

### Removed
- `@rarimo/rarime`: removed deprecated `endowment:long-running` permission

## [0.1.0] - 2023-08-27
### Added
- Implemented `@rarimo/rarime-connector` and `@rarimo/rarime` packages

[Unreleased]: https://github.com/rarimo/rarime/compare/2.0.3...HEAD
[2.0.3]: https://github.com/rarimo/rarime/compare/2.0.2...2.0.3
[2.0.2]: https://github.com/rarimo/rarime/compare/2.0.1...2.0.2
[2.0.1]: https://github.com/rarimo/rarime/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/rarimo/rarime/compare/1.0.2...2.0.0
[1.0.2]: https://github.com/rarimo/rarime/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/rarimo/rarime/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/rarimo/rarime/compare/0.8.0...1.0.0
[0.8.0]: https://github.com/rarimo/rarime/compare/0.7.2...0.8.0
[0.7.2]: https://github.com/rarimo/rarime/compare/0.7.1...0.7.2
[0.7.1]: https://github.com/rarimo/rarime/compare/0.7.0...0.7.1
[0.7.0]: https://github.com/rarimo/rarime/compare/0.6.0...0.7.0
[0.6.0]: https://github.com/rarimo/rarime/compare/0.5.0...0.6.0
[0.5.0]: https://github.com/rarimo/rarime/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/rarimo/rarime/compare/0.3.2...0.4.0
[0.3.2]: https://github.com/rarimo/rarime/compare/0.3.1...0.3.2
[0.3.1]: https://github.com/rarimo/rarime/compare/0.3.0...0.3.1
[0.3.0]: https://github.com/rarimo/rarime/compare/0.2.0...0.3.0
[0.2.0]: https://github.com/rarimo/rarime/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/rarimo/rarime/releases/tag/0.1.0
