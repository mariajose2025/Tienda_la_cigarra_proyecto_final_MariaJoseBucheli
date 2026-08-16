import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = 'config';

export async function getSettings() {
  const docRef = doc(db, 'settings', SETTINGS_DOC);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    const defaultSettings = {
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
    await setDoc(docRef, defaultSettings);
    return defaultSettings;
  }
  return docSnap.data();
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
