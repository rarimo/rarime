import { Hex, PrivateKey } from '@iden3/js-crypto'
import { DID } from '@iden3/js-iden3-core'

export const initPrivateKey = (hexString?: string): string => {
  let arr
  if (hexString) {
    arr = Hex.decodeString(hexString)
  } else {
    arr = new Uint8Array(32)
    window.crypto.getRandomValues(arr)

    return initPrivateKey(new PrivateKey(arr).hex())
  }
  return new PrivateKey(arr).hex()
}

export const parseDidV2 = (did: string): DID => {
  const splitted = did.split(':')

  return DID.parse(`did:iden3:readonly:${splitted[splitted.length - 1]}`)
}

export const isDidSupported = (identityId: string): boolean => {
  try {
    const parsed = DID.parse(identityId)

    const id = DID.idFromDID(parsed)

    const parts = DID.decodePartsFromId(id)

    return !DID.isUnsupported(parts.method, parts.blockchain, parts.networkId)
  } catch (error) {
    return false
  }
}
