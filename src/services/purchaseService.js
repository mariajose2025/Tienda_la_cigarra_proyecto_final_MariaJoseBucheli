import * as firestore from './firestoreService';
import { doc, collection, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { auth } from './firebase';

const COLLECTION = 'purchases';

export async function getAllPurchases() {
  return firestore.getAll(COLLECTION);
}

export async function getPurchaseById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createPurchase(data) {
  const purchaseRef = doc(collection(db, COLLECTION));
  const purchaseId = purchaseRef.id;

  await runTransaction(db, async (tx) => {
    for (const item of data.items) {
      const prodRef = doc(db, 'products', item.productId);
      const prodSnap = await tx.get(prodRef);
      if (!prodSnap.exists()) {
        throw new Error(`Producto no encontrado: ${item.productName || item.productId}`);
      }
      const currentStock = prodSnap.data().currentStock ?? 0;
      tx.update(prodRef, {
        currentStock: currentStock + Number(item.quantity),
        purchasePrice: Number(item.unitPrice),
        updatedAt: new Date()
      });
    }
    tx.set(purchaseRef, {
      ...data,
      ownerId: auth.currentUser?.uid || '',
      createdAt: new Date()
    });
  });

  return purchaseId;
}

export async function deletePurchase(id) {
  const purchaseRef = doc(db, COLLECTION, id);

  await runTransaction(db, async (tx) => {
    const purchaseSnap = await tx.get(purchaseRef);
    if (!purchaseSnap.exists()) return;

    for (const item of purchaseSnap.data().items || []) {
      const prodRef = doc(db, 'products', item.productId);
      const prodSnap = await tx.get(prodRef);
      if (prodSnap.exists()) {
        tx.update(prodRef, {
          currentStock: (prodSnap.data().currentStock ?? 0) - Number(item.quantity),
          updatedAt: new Date()
        });
      }
    }

    tx.delete(purchaseRef);
  });

  return true;
}