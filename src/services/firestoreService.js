import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

function getCurrentUid() {
  return auth.currentUser?.uid || null;
}

export async function getAll(collectionName) {
  const uid = getCurrentUid();
  let snapshot;

  try {
    if (uid) {
      const q = query(collection(db, collectionName), where('ownerId', '==', uid));
      snapshot = await getDocs(q);
    } else {
      const q = query(collection(db, collectionName));
      snapshot = await getDocs(q);
    }
  } catch (e) {
    console.warn('Consulta con owner falló, cargando todos los documentos:', e.message);
    const q = query(collection(db, collectionName));
    snapshot = await getDocs(q);
  }

  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  docs.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });

  return docs;
}

export async function getById(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function create(collectionName, data) {
  const uid = getCurrentUid();
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    ownerId: uid || '',
    createdAt: new Date()
  });
  return docRef.id;
}

export async function update(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
  return true;
}

export async function remove(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return true;
}

export async function getByField(collectionName, fieldName, value) {
  try {
    const q = query(collection(db, collectionName), where(fieldName, '==', value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('getByField falló:', e.message);
    return [];
  }
}

export async function getSingleByField(collectionName, fieldName, value) {
  const results = await getByField(collectionName, fieldName, value);
  return results.length > 0 ? results[0] : null;
}

export async function getAllUnfiltered(collectionName) {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0));
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0));
    return dateB - dateA;
  });
  return docs;
}
