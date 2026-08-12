import * as firestore from './firestoreService';
import { query, where, getDocs, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

const SESSIONS = 'cashSessions';
const MOVEMENTS = 'cashMovements';

export async function getAllSessions() {
  return firestore.getAll(SESSIONS);
}

export async function getOpenSession(userId = null) {
  const uid = userId || auth.currentUser?.uid || '';
  if (!uid) return null;
  try {
    const q = query(
      collection(db, SESSIONS),
      where('userId', '==', uid),
      where('status', '==', 'open')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (e) {
    console.warn('getOpenSession falló:', e.message);
    const all = await firestore.getAll(SESSIONS);
    return all.find(s => s.userId === uid && s.status === 'open') || null;
  }
}

export async function openCashSession(amount) {
  const user = auth.currentUser;
  const uid = user?.uid || '';
  const id = await firestore.create(SESSIONS, {
    userId: uid,
    userName: user?.displayName || user?.email || 'Usuario',
    openingAmount: Number(amount) || 0,
    status: 'open',
    openedAt: new Date(),
    openedBy: user?.email || ''
  });
  return id;
}

export async function closeCashSession(sessionId, realAmount) {
  const session = await firestore.getById(SESSIONS, sessionId);
  if (!session) throw new Error('Turno de caja no encontrado');

  const movements = await getMovementsBySession(sessionId);
  const income = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + (m.amount || 0), 0);
  const expense = movements.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0);
  const expectedAmount = (session.openingAmount || 0) + income - expense;
  const real = Number(realAmount) || 0;
  const difference = real - expectedAmount;

  await firestore.update(SESSIONS, sessionId, {
    status: 'closed',
    closingAmount: real,
    expectedAmount,
    difference,
    endedAt: new Date(),
    closedBy: auth.currentUser?.email || ''
  });
  return { expectedAmount, difference };
}

export async function deleteSession(id) {
  return firestore.remove(SESSIONS, id);
}

export async function getMovementsBySession(sessionId) {
  try {
    const q = query(collection(db, MOVEMENTS), where('sessionId', '==', sessionId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('getMovementsBySession falló:', e.message);
    const all = await firestore.getAllUnfiltered(MOVEMENTS);
    return all.filter(m => m.sessionId === sessionId);
  }
}

export async function getAllMovements() {
  return firestore.getAll(MOVEMENTS);
}

export async function createMovement(data) {
  return firestore.create(MOVEMENTS, data);
}

export async function addManualMovement(sessionId, type, category, amount, description = '', paymentMethod = 'efectivo') {
  return createMovement({
    sessionId,
    type,
    category,
    amount: Number(amount) || 0,
    description,
    paymentMethod,
    createdAt: new Date()
  });
}

export async function addAutomaticMovement(sessionId, type, category, amount, referenceId, referenceType = '', description = '') {
  return createMovement({
    sessionId,
    type,
    category,
    amount: Number(amount) || 0,
    description,
    referenceId,
    referenceType,
    paymentMethod: 'efectivo',
    createdAt: new Date()
  });
}

export async function deleteMovement(id) {
  return firestore.remove(MOVEMENTS, id);
}