import * as firestore from './firestoreService';

const COLLECTION = 'clients';

export async function getAllClients() {
  return firestore.getAll(COLLECTION);
}

export async function getClientById(id) {
  return firestore.getById(COLLECTION, id);
}

export async function createClient(data) {
  return firestore.create(COLLECTION, data);
}

export async function updateClient(id, data) {
  return firestore.update(COLLECTION, id, data);
}

export async function deleteClient(id) {
  return firestore.remove(COLLECTION, id);
}

export async function getClientByCedula(cedula) {
  return firestore.getSingleByField(COLLECTION, 'cedula', cedula);
}
