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
  let q;
  if (uid) {
    q = query(collection(db, collectionName), where('ownerId', '==', uid), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
    ownerId: uid,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function update(collectionName, id, data) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
  return true;
}

export async function remove(collectionName, id) {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
  return true;
}

export async function getByField(collectionName, fieldName, value) {
  const uid = getCurrentUid();
  let q;
  if (uid) {
    q = query(collection(db, collectionName), where(fieldName, '==', value), where('ownerId', '==', uid));
  } else {
    q = query(collection(db, collectionName), where(fieldName, '==', value));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSingleByField(collectionName, fieldName, value) {
  const results = await getByField(collectionName, fieldName, value);
  return results.length > 0 ? results[0] : null;
}
