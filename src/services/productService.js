import * as firestore from './firestoreService';

const COLLECTION = 'products';

function generateBarcode() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const seq = (timestamp.slice(-8) + random).slice(0, 12);
  return seq;
}

export async function getAllProducts() {
  return firestore.getAll(COLLECTION);
}

export async function getProductById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createProduct(data) {
  if (!data.barcode) {
    data.barcode = generateBarcode();
  }
  return firestore.create(COLLECTION, data);
}

export async function updateProduct(id, data) {
  return firestore.update(COLLECTION, id, data);
}

export async function deleteProduct(id) {
  return firestore.remove(COLLECTION, id);
}

export async function getProductsByCategory(categoryId) {
  return firestore.getByField(COLLECTION, 'categoryId', categoryId);
}

export async function updateProductStock(id, newStock) {
  return firestore.update(COLLECTION, id, { currentStock: newStock });
}

export async function updateProductPrice(id, newPurchasePrice) {
  return firestore.update(COLLECTION, id, { purchasePrice: newPurchasePrice });
}
