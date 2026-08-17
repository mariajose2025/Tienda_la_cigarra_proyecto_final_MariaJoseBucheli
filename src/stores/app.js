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

const DEFAULT_STORE = {
  name: 'La Cigarra',
  address: 'Calle Principal #1-23',
  phone: '300 000 0000',
  nit: '000000000-0'
};

export const alertThresholds = derived(app, $app => $app.settings.alertThresholds || { stockYellow: 10, stockRed: 5, expiryYellow: 30, expiryRed: 7 });
export const ivaPercentage = derived(app, $app => $app.settings.ivaPercentage ?? 19);
// Nunca undefined: si los settings de Firestore no tienen "store" (doc viejo/incompleto),
// la factura usaba $storeInfo.name y crasheaba al abrir.
export const storeInfo = derived(app, $app => ({ ...DEFAULT_STORE, ...($app.settings.store || {}) }));
