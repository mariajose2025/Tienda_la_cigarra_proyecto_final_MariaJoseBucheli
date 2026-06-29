export function calculateStockAlert(currentStock, minimumStock) {
  if (currentStock > minimumStock) return 'green';
  if (currentStock === minimumStock) return 'yellow';
  return 'red';
}

// Convierte de forma segura Firestore Timestamp o Date nativa a objeto Date
function toDate(value) {
  if (!value) return null;
  if (value.toDate) return value.toDate();        // Firestore Timestamp
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function calculateExpiryAlert(expiryDate, thresholds) {
  const now = new Date();
  const expiry = toDate(expiryDate);
  if (!expiry) return 'green';
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry > thresholds.expiryYellow) return 'green';
  if (daysUntilExpiry > thresholds.expiryRed) return 'yellow';
  return 'red';
}

export function getAlertColor(level) {
  const colors = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444'
  };
  return colors[level] || colors.green;
}

export function getAlertLabel(level) {
  const labels = {
    green: 'Normal',
    yellow: 'Alerta',
    red: 'Crítico'
  };
  return labels[level] || 'Normal';
}

export function getDaysUntilExpiry(expiryDate) {
  const now = new Date();
  const expiry = toDate(expiryDate);
  if (!expiry) return null;
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}
