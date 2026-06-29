import * as firestore from './firestoreService';

const COLLECTION = 'categories';

export async function getAllCategories() {
  return firestore.getAll(COLLECTION);
}

export async function getCategoryById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createCategory(data) {
  return firestore.create(COLLECTION, data);
}

export async function updateCategory(id, data) {
  return firestore.update(COLLECTION, id, data);
}

export async function deleteCategory(id) {
  return firestore.remove(COLLECTION, id);
}
