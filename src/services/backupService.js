import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Colecciones que forman parte del sistema completo
export const ALL_COLLECTIONS = [
  'products',
  'categories',
  'suppliers',
  'purchases',
  'sales',
  'clients',
  'credits',
  'cashSessions',
  'cashMovements',
  'expenses',
  'users',
  'roles'
];

export const COLLECTION_LABELS = {
  products: 'Productos',
  categories: 'Categorías',
  suppliers: 'Proveedores',
  purchases: 'Compras',
  sales: 'Ventas',
  clients: 'Clientes',
  credits: 'Fiados',
  cashSessions: 'Sesiones de Caja',
  cashMovements: 'Movimientos de Caja',
  expenses: 'Gastos',
  users: 'Usuarios',
  roles: 'Roles'
};

export async function readCollectionRaw(collectionName) {
  const q = collection(db, collectionName);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, data: d.data() }));
}

export async function exportAllCollections() {
  const result = {};
  for (const name of ALL_COLLECTIONS) {
    try {
      result[name] = await readCollectionRaw(name);
    } catch (e) {
      console.warn(`No se pudo leer ${name}:`, e.message);
      result[name] = [];
    }
  }
  return result;
}

export async function importAllCollections(data) {
  // data: { coleccion: [{ id, data }] }
  const names = Object.keys(data || {});
  for (const name of names) {
    const docs = data[name] || [];
    // En lotes de 400 docs por colección
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      const slice = docs.slice(i, i + 400);
      slice.forEach(({ id, data: docData }) => {
        const ref = doc(db, name, id);
        batch.set(ref, docData || {}, { merge: true });
      });
      await batch.commit();
    }
  }
  return names;
}