// eslint-disable-next-line import/no-extraneous-dependencies
import { isMetamaskInstalled } from '@rarimo/connector';

/**
 * Detect if the wallet injecting the ethereum object is Flask.
 *
 * @returns True if the MetaMask version is Flask, false otherwise.
 */
export const isFlask = async () => {
  try {
    const isMetamask = await isMetamaskInstalled();

    return isMetamask;
  } catch (e) {
    return false;
  }
};
