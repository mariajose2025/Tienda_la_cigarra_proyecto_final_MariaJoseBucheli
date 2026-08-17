import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = 'config';

const DEFAULT_SETTINGS = {
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
};

export async function getSettings() {
  const docRef = doc(db, 'settings', SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  const data = docSnap.data();

  // Reparar campos faltantes (p. ej. "store" si el doc se guardó incompleto):
  // se rellena con los valores por defecto y se persiste una sola vez.
  const merged = {
    ...DEFAULT_SETTINGS,
    ...data,
    store: { ...DEFAULT_SETTINGS.store, ...(data.store || {}) },
    alertThresholds: { ...DEFAULT_SETTINGS.alertThresholds, ...(data.alertThresholds || {}) },
    ivaPercentage: data.ivaPercentage ?? DEFAULT_SETTINGS.ivaPercentage
  };

  if (JSON.stringify(merged) !== JSON.stringify(data)) {
    await setDoc(docRef, merged, { merge: true }).catch(() => {});
  }
  return merged;
}

export async function updateSettings(data) {
  const docRef = doc(db, 'settings', SETTINGS_DOC);
  await setDoc(docRef, data, { merge: true });
  return true;
}

export async function updateAlertThresholds(thresholds) {
  const settings = await getSettings();
  settings.alertThresholds = { ...settings.alertThresholds, ...thresholds };
  return updateSettings(settings);
}
