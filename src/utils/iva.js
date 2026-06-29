const DEFAULT_IVA = 19;

export function calculateIVA(subtotal, ivaPercentage = DEFAULT_IVA) {
  return subtotal * (ivaPercentage / 100);
}

export function calculateTotalWithIVA(subtotal, ivaPercentage = DEFAULT_IVA) {
  const iva = calculateIVA(subtotal, ivaPercentage);
  return {
    subtotal,
    iva,
    total: subtotal + iva
  };
}

export function calculateItemSubtotal(quantity, unitPrice) {
  return quantity * unitPrice;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
}
