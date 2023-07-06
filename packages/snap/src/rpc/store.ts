const getState = async () => {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
};

export const getItemFromStore = async (key: string): Promise<any> => {
  const state = await getState();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return state?.[key] ? JSON.parse(state[key]) : null;
};

export const setItemInStore = async (key: string, inputData: any) => {
  const state = (await getState()) ?? {};

  state[key] = JSON.stringify(inputData);
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
};

export const clearState = async () => {
  return await snap.request({
    method: 'snap_manageState',
    params: { operation: 'clear' },
  });
};

export const snapStorage = {
  getState,
  getItemFromStore,
  setItemInStore,
  clearState,
};
