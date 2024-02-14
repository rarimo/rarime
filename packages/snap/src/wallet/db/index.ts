const getAll = async () => {
  const data = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
  if (!data) {
    return {};
  }
  return data;
};

const db = {
  CHAINS: 'CHAINS',

  async update(rootKey: string, key: string, value: any) {
    const data: any = await getAll();
    const state: any = data[rootKey] || {};
    state[key] = value;

    const newState = { ...data, [rootKey]: state };

    return await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState },
    });
  },

  async get(key: string) {
    const persistedData = await getAll();
    if (persistedData) {
      return persistedData[key];
    }
    return {};
  },
};

export default db;
