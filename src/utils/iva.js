const DEFAULT_IVA = 19;

export function roundMoney(value) {
  const num = Number(value) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateIVA(subtotal, ivaPercentage = DEFAULT_IVA) {
  return roundMoney(subtotal * (ivaPercentage / 100));
}

export function calculateTotalWithIVA(subtotal, ivaPercentage = DEFAULT_IVA) {
  const subtotalR = roundMoney(subtotal);
  const iva = calculateIVA(subtotalR, ivaPercentage);
  return {
    subtotal: subtotalR,
    iva,
    total: roundMoney(subtotalR + iva)
  };
}

export function calculateItemSubtotal(quantity, unitPrice) {
  return roundMoney(quantity * unitPrice);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(roundMoney(amount));
}