import * as firestore from './firestoreService';
import { updateProductStock, updateProductPrice, getProductById } from './productService';

const COLLECTION = 'purchases';

export async function getAllPurchases() {
  return firestore.getAll(COLLECTION);
}

export async function getPurchaseById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createPurchase(data) {
  const purchaseId = await firestore.create(COLLECTION, data);

  for (const item of data.items) {
    const product = await getProductById(item.productId);
    if (product) {
      const newStock = product.currentStock + item.quantity;
      await updateProductStock(item.productId, newStock);
      await updateProductPrice(item.productId, item.unitPrice);
    }
  }

  return purchaseId;
}

export async function deletePurchase(id) {
  return firestore.remove(COLLECTION, id);
}
