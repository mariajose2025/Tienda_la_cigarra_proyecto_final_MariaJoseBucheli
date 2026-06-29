import * as firestore from './firestoreService';
import { updateProductStock, getProductById } from './productService';

const COLLECTION = 'sales';

export async function getAllSales() {
  return firestore.getAll(COLLECTION);
}

export async function getSaleById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createSale(data) {
  const saleId = await firestore.create(COLLECTION, data);

  for (const item of data.items) {
    const product = await getProductById(item.productId);
    if (product) {
      const newStock = product.currentStock - item.quantity;
      if (newStock < 0) throw new Error(`Stock insuficiente para ${item.productName}`);
      await updateProductStock(item.productId, newStock);
    }
  }

  return saleId;
}
