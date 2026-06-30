import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTIONS_TO_CLEAR = [
  'users',
  'products',
  'categories',
  'suppliers',
  'purchases',
  'sales',
  'clients',
  'credits',
  'roles',
  'settings'
];

export async function clearAllData() {
  const results = {};

  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      let count = 0;

      for (const document of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, document.id));
        count++;
      }

      results[collectionName] = { deleted: count, success: true };
    } catch (e) {
      console.error(`Error limpiando ${collectionName}:`, e);
      results[collectionName] = { deleted: 0, success: false, error: e.message };
    }
  }

  return results;
}
