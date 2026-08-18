import * as firestore from './firestoreService';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

const COLLECTION = 'sales';

export async function getAllSales() {
  return firestore.getAll(COLLECTION);
}

export async function getSaleById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createSale(data) {
  const saleRef = doc(collection(db, COLLECTION));
  const saleId = saleRef.id;

  await runTransaction(db, async (tx) => {
    for (const item of data.items) {
      const prodRef = doc(db, 'products', item.productId);
      const prodSnap = await tx.get(prodRef);
      if (!prodSnap.exists()) {
        throw new Error(`Producto no encontrado: ${item.productName || item.productId}`);
      }
      const currentStock = prodSnap.data().currentStock ?? 0;
      const quantity = Number(item.quantity);
      if (currentStock < quantity) {
        throw new Error(`Stock insuficiente para ${item.productName || item.productId}`);
      }
      tx.update(prodRef, { currentStock: currentStock - quantity, updatedAt: new Date() });
    }
    tx.set(saleRef, {
      ...data,
      ownerId: auth.currentUser?.uid || '',
      createdAt: new Date()
    });
  });

  return saleId;
}