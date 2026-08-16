import { writable, derived } from 'svelte/store';

function createAppStore() {
  const { subscribe, set, update } = writable({
    settings: {
      store: {
        name: 'La Cigarra',
        address: 'Calle Principal #1-23',
        phone: '300 000 0000',
        nit: '000000000-0'
      },
      alertThresholds: {
        stockYellow: 10,
        stockRed: 5,
        expiryYellow: 30,
        expiryRed: 7
      },
      ivaPercentage: 19
    },
    loading: false
  });

  return {
    subscribe,
    setSettings: (settings) => update(state => ({ ...state, settings, loading: false })),
    setLoading: (loading) => update(state => ({ ...state, loading }))
  };
}

export const app = createAppStore();

export const alertThresholds = derived(app, $app => $app.settings.alertThresholds);
export const ivaPercentage = derived(app, $app => $app.settings.ivaPercentage);
export const storeInfo = derived(app, $app => $app.settings.store);
