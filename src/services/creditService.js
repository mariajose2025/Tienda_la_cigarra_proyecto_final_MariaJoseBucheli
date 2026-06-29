import * as firestore from './firestoreService';

const COLLECTION = 'credits';

export async function getAllCredits() {
  return firestore.getAll(COLLECTION);
}

export async function getCreditById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createCredit(data) {
  return firestore.create(COLLECTION, data);
}

export async function updateCredit(id, data) {
  return firestore.update(COLLECTION, id, data);
}

export async function deleteCredit(id) {
  return firestore.remove(COLLECTION, id);
}

export async function getCreditsByClient(clientId) {
  return firestore.getByField(COLLECTION, 'clientId', clientId);
}
