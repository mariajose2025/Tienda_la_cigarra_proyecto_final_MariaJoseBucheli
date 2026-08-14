import { getAll, create, update, remove } from './firestoreService';

const COLLECTION = 'expenses';

export const EXPENSE_CATEGORIES = {
  arriendo: 'Arriendo',
  servicios: 'Servicios públicos (agua, luz, internet...)',
  nomina: 'Nómina / Salarios',
  proveedores: 'Pagos a proveedores',
  transporte: 'Transporte',
  impuestos: 'Impuestos',
  publicidad: 'Publicidad',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros'
};

export async function getAllExpenses() {
  return getAll(COLLECTION);
}

export async function createExpense(data) {
  return create(COLLECTION, data);
}

export async function updateExpense(id, data) {
  return update(COLLECTION, id, data);
}

export async function deleteExpense(id) {
  return remove(COLLECTION, id);
}