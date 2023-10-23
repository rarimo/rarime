## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/rarimo/rarime/compare/0.7.2...HEAD
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
