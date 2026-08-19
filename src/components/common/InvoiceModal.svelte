<script>
  import { storeInfo } from '../../stores/app';
  import { formatCurrency } from '../../utils/iva';

  export let sale = null;
  export let credit = null;

  const paymentLabels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    fiado: 'Fiado (Crédito)'
  };

  function formatDate(value) {
    if (!value) return '—';
    const d = value.toDate ? value.toDate() : new Date(value);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const d = value.toDate ? value.toDate() : new Date(value);
    return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function invoiceNumber(sale) {
    if (sale.invoiceNumber) return sale.invoiceNumber;
    if (sale.id) return 'FAC-' + String(sale.id).slice(-6).toUpperCase();
    return 'FAC-000001';
  }

  $: items = (sale && (sale.items || [])) || (credit && (credit.items || [])) || [];
  $: isFiado = sale ? sale.paymentMethod === 'fiado' : !!credit;
  $: clientName = sale?.clientName || credit?.clientName || '';
  $: clientCedula = sale?.clientCedula || credit?.clientCedula || '';
  $: subtotal = sale ? (sale.subtotal ?? items.reduce((s, i) => s + i.subtotal, 0)) : (credit ? (credit.subtotal ?? 0) : 0);
  $: iva = sale ? (sale.iva ?? 0) : 0;
  $: total = sale ? (sale.total ?? 0) : (credit ? (credit.total ?? 0) : 0);
  $: cashierName = sale?.cashierName || credit?.cashierName || '';

  function printInvoice() {
    window.print();
  }

  async function downloadPDF() {
    const element = document.getElementById('invoice-print-area');
    if (!element) return;
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `pedido-${invoiceNumber(sale)}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] }
      }).from(element).save();
    } catch (e) {
      console.error('Error generando PDF:', e);
    }
  }
</script>

{#if sale || credit}
  <div class="invoice-modal">
    <div class="invoice-toolbar no-print">
      <button class="btn-toolbar" on:click={printInvoice}>
        <i class="fa-solid fa-print"></i> Imprimir
      </button>
      <button class="btn-toolbar" on:click={downloadPDF}>
        <i class="fa-solid fa-file-pdf"></i> Descargar PDF
      </button>
    </div>

    <div class="invoice-sheet" id="invoice-print-area">
      <div class="invoice-header">
        <div class="brand">
          <img src="/logo.png" alt="Logo" class="brand-logo" />
          <div>
            <h1>{$storeInfo.name}</h1>
            <p>{$storeInfo.address}</p>
            <p>Tel: {$storeInfo.phone}</p>
            <p>NIT: {$storeInfo.nit}</p>
          </div>
        </div>
        <div class="invoice-title">
          <h2>{isFiado ? 'RECIBO / FIADO' : 'PEDIDO'}</h2>
          <p class="inv-number">N° {invoiceNumber(sale)}</p>
        </div>
      </div>

      <div class="invoice-meta">
        <div class="meta-block">
          <span class="meta-label">Fecha:</span>
          <span>{sale ? formatDateTime(sale.saleDate || sale.createdAt) : formatDateTime(credit?.createdAt)}</span>
        </div>
        <div class="meta-block">
          <span class="meta-label">Atendido por:</span>
          <span>{cashierName || '—'}</span>
        </div>
        <div class="meta-block">
          <span class="meta-label">Método de pago:</span>
          <span>{sale ? (paymentLabels[sale.paymentMethod] || sale.paymentMethod) : 'Fiado (Crédito)'}</span>
        </div>
        {#if clientName}
          <div class="meta-block">
            <span class="meta-label">Cliente:</span>
            <span>{clientName} {clientCedula ? `(CC ${clientCedula})` : ''}</span>
          </div>
        {/if}
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Producto</th>
            <th>Precio</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item}
            <tr>
              <td>{item.quantity}</td>
              <td>{item.productName}</td>
              <td>{formatCurrency(item.unitPrice)}</td>
              <td>{formatCurrency(item.subtotal)}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {#if !isFiado}
          <div class="total-row">
            <span>IVA</span>
            <span>{formatCurrency(iva)}</span>
          </div>
        {/if}
        <div class="total-row total-grand">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {#if isFiado}
          <div class="fiado-badge">
            <i class="fa-solid fa-hourglass-half"></i> SALDO PENDIENTE POR PAGAR
          </div>
        {/if}
      </div>

      <div class="invoice-footer">
        <p>¡Gracias por su compra en {$storeInfo.name}!</p>
      </div>
    </div>
  </div>

  <style>
    .invoice-modal { padding: 1rem; }

    .invoice-toolbar {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      margin-bottom: 1rem;
    }
    .btn-toolbar {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 1.1rem; border: none; border-radius: 8px;
      background: #064F3C; color: white; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-toolbar:hover { background: #043B2F; }

    .invoice-sheet {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 1.5rem;
      max-width: 640px;
      margin: 0 auto;
      font-size: 0.9rem;
    }

    .invoice-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 2px solid #064F3C;
      padding-bottom: 1rem; margin-bottom: 1rem;
    }
    .brand { display: flex; gap: 0.75rem; align-items: center; }
    .brand-logo { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; }
    .brand h1 { margin: 0; font-size: 1.25rem; color: #064F3C; }
    .brand p { margin: 0.1rem 0; font-size: 0.75rem; color: #6b7280; }

    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 1rem; color: #0A241D; }
    .inv-number {
      margin: 0.25rem 0 0; font-size: 0.8rem; color: #064F3C; font-weight: 700;
      letter-spacing: 0.5px;
    }

    .invoice-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-bottom: 1rem; }
    .meta-block { display: flex; gap: 0.4rem; font-size: 0.85rem; }
    .meta-label { color: #6b7280; font-weight: 600; }

    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
    .invoice-table th {
      background: #f3f4f6; color: #374151; font-size: 0.8rem; text-align: left;
      padding: 0.5rem 0.6rem; border-bottom: 1px solid #e5e7eb;
    }
    .invoice-table th:first-child { width: 60px; }
    .invoice-table th:nth-child(3), .invoice-table th:nth-child(4) { text-align: right; }
    .invoice-table td {
      padding: 0.5rem 0.6rem; border-bottom: 1px solid #f3f4f6; font-size: 0.85rem;
    }
    .invoice-table td:nth-child(3), .invoice-table td:nth-child(4) { text-align: right; }

    .invoice-totals {
      max-width: 260px; margin-left: auto; margin-bottom: 1rem;
    }
    .total-row {
      display: flex; justify-content: space-between; padding: 0.25rem 0;
      font-size: 0.85rem; color: #374151;
    }
    .total-grand {
      font-weight: 800; font-size: 1.05rem; color: #0A241D;
      border-top: 2px solid #064F3C; margin-top: 0.35rem; padding-top: 0.5rem;
    }
    .fiado-badge {
      margin-top: 0.6rem; text-align: center;
      background: #fef9c3; border: 1.5px solid #fde047; color: #854d0e;
      padding: 0.5rem; border-radius: 8px; font-weight: 800; font-size: 0.8rem;
      letter-spacing: 0.5px;
    }

    .invoice-footer { text-align: center; font-size: 0.8rem; color: #6b7280; }

    @media print {
      .no-print { display: none !important; }
      body * { visibility: hidden; }
      .invoice-sheet, .invoice-sheet * { visibility: visible; }
      .invoice-sheet {
        position: absolute; left: 0; top: 0; width: 100%;
        border: none; max-width: none; padding: 0.5rem;
      }
      .invoice-modal { padding: 0; }
    }
  </style>
{/if}