import * as XLSX from 'xlsx';

function cleanValue(value) {
  if (value === null || value === undefined) return '';
  // Timestamp de Firestore
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString().slice(0, 19).replace('T', ' ');
  }
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
  // Objetos/arrays anidados (items, thresholds, etc.): se serializan
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

export function serializeRow(data) {
  const out = {};
  Object.keys(data || {}).forEach(k => {
    out[k] = cleanValue(data[k]);
  });
  return out;
}

export function normalizeRows(collection, docs) {
  return docs.map(d => {
    const base = { id: d.id, ...serializeRow(d) };
    return base;
  });
}

export function exportDataToExcel(rows, filename, sheetName = 'Datos') {
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportSheetsToExcel(sheets, filename) {
  // sheets: [{ name, rows }]
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}

export function exportDataToJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}