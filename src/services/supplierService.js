import * as firestore from './firestoreService';

const COLLECTION = 'suppliers';

export async function getAllSuppliers() {
  return firestore.getAll(COLLECTION);
}

export async function getSupplierById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createSupplier(data) {
  return firestore.create(COLLECTION, data);
}

export async function updateSupplier(id, data) {
  return firestore.update(COLLECTION, id, data);
}

export async function deleteSupplier(id) {
  return firestore.remove(COLLECTION, id);
}

export async function getSupplierByNIT(nit) {
  return firestore.getSingleByField(COLLECTION, 'nit', nit);
}
