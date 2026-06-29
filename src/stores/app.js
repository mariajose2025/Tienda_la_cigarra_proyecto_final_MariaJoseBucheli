import { writable, derived } from 'svelte/store';

function createAppStore() {
  const { subscribe, set, update } = writable({
    settings: {
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
