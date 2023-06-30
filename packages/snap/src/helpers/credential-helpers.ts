import { StorageKeys } from "../enums";
import { getItemFromStore, setItemInStore } from '../rpc'
import { W3CCredential } from "../types";



export async function saveCredential(key: string, value: W3CCredential, keyName = 'id' as keyof W3CCredential): Promise<void> {
    const data = await getItemFromStore(StorageKeys.credentials) as W3CCredential[];
    const items = data || [];

    const itemIndex = data?.findIndex((i) => i[keyName] === key);
    if (itemIndex === -1) {
      items.push(value);
    } else {
      items[itemIndex] = value;
    }
    await setItemInStore(StorageKeys.credentials, JSON.stringify(items));
}

export async function saveCredentials(value: W3CCredential[], keyName = 'id' as keyof W3CCredential): Promise<void> {
  for (const credential of value) {
    await saveCredential(credential.id, credential, keyName);
  }
}
