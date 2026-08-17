<script>
  import { onMount } from 'svelte';
  import { getAll, create } from '../services/firestoreService';
  import { notify } from '../stores/toast';
  import { updateProductStock, getProductById } from '../services/productService';
  import { getOpenSession, addAutomaticMovement } from '../services/cashService';
  import { getAllClients } from '../services/clientService';
  import { createCredit } from '../services/creditService';
  import { currentUser } from '../stores/auth';
  import { canCreate, canView } from '../utils/permissions';
  import { ivaPercentage } from '../stores/app';
  import { calculateTotalWithIVA, formatCurrency, calculateItemSubtotal } from '../utils/iva';
  import { normalizeRows } from '../utils/exportUtils';
  import Button from '../components/common/Button.svelte';
  import ExportButton from '../components/common/ExportButton.svelte';
  import Modal from '../components/common/Modal.svelte';
  import InvoiceModal from '../components/common/InvoiceModal.svelte';

  let sales = [];
  let products = [];
  let clients = [];

  let items = [{ productId: '', quantity: 1, unitPrice: 0 }];
  let paymentMethod = 'efectivo';
  let clientSearch = '';
  let selectedClient = null;
  let showClientList = false;
  let loading = false;

  let showInvoiceModal = false;
  let lastSale = null;
  let lastCredit = null;
  let viewingSale = null;

  $: iva = $ivaPercentage;
  $: subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item.quantity, item.unitPrice), 0);
  $: totals = calculateTotalWithIVA(subtotal, iva);
  $: isFiadoPayment = paymentMethod === 'fiado';
  $: filteredClients = clientSearch.trim()
    ? clients.filter(c =>
        (c.name || '').toLowerCase().includes(clientSearch.trim().toLowerCase()) ||
        (c.cedula || '').includes(clientSearch.trim())
      )
    : clients;

  function selectClient(client) {
    selectedClient = client;
    clientSearch = client.name;
    showClientList = false;
  }

  function clearClient() {
    selectedClient = null;
    clientSearch = '';
    showClientList = false;
  }

  function onClientSearchInput() {
    showClientList = true;
  }

  function onClientSearchBlur() {
    setTimeout(() => { showClientList = false; }, 150);
  }

  onMount(async () => {
    [sales, products, clients] = await Promise.all([
      getAll('sales'), getAll('products'), getAllClients()
    ]);
  });

  function addItem() {
    items = [...items, { productId: '', quantity: 1, unitPrice: 0 }];
  }

  function removeItem(index) {
    if (items.length > 1) {
      items = items.filter((_, i) => i !== index);
    }
  }

  function updateItemPrice(index) {
    const product = products.find(p => p.id === items[index].productId);
    if (product) {
      items[index].unitPrice = product.salePrice;
      items = items;
    }
  }

  function openInvoice(sale, credit = null) {
    lastSale = sale;
    lastCredit = credit;
    viewingSale = null;
    showInvoiceModal = true;
  }

  function closeInvoiceModal() {
    showInvoiceModal = false;
    lastSale = null;
    lastCredit = null;
    viewingSale = null;
  }

  async function saveSale() {
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      notify('warning', 'Agrega al menos un producto');
      return;
    }

    if (paymentMethod === 'fiado' && !selectedClient) {
      notify('warning', 'Selecciona el cliente para el fiado');
      return;
    }

    for (const item of validItems) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.currentStock < item.quantity) {
        notify('error', `Stock insuficiente para ${product.name}`);
        return;
      }
    }

    loading = true;
    try {
      const client = selectedClient;
      const invoiceNumber = 'FAC-' + String(Date.now()).slice(-8);

      const saleData = {
        items: validItems.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || '',
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: calculateItemSubtotal(item.quantity, item.unitPrice)
          };
        }),
        subtotal: totals.subtotal,
        iva: totals.iva,
        total: totals.total,
        paymentMethod,
        saleDate: new Date(),
        invoiceNumber,
        cashierName: $currentUser?.name || $currentUser?.email || ''
      };

      if (selectedClient) {
        saleData.clientId = selectedClient.id;
        saleData.clientName = selectedClient.name || '';
        saleData.clientCedula = selectedClient.cedula || '';
      }
      if (paymentMethod === 'fiado') {
        saleData.status = 'pending';
      }

      const saleId = await create('sales', saleData);

      if (paymentMethod === 'efectivo') {
        const openSession = await getOpenSession();
        if (openSession) {
          await addAutomaticMovement(openSession.id, 'ingreso', 'venta', totals.total, saleId || '', 'sale', `Venta en efectivo: ${validItems.length} producto(s)`);
        }
      }

      for (const item of validItems) {
        const product = await getProductById(item.productId);
        if (product) {
          await updateProductStock(item.productId, product.currentStock - Number(item.quantity));
        }
      }

      let credit = null;
      if (paymentMethod === 'fiado') {
        credit = await createCredit({
          clientId: selectedClient.id,
          clientName: selectedClient.name || '',
          clientCedula: selectedClient.cedula || '',
          saleId,
          invoiceNumber,
          items: saleData.items,
          total: totals.total,
          notes: '',
          status: 'pending',
          createdAt: new Date()
        });
        notify('success', 'Venta a fiado registrada correctamente');
      } else {
        notify('success', 'Venta registrada exitosamente');
      }

      items = [{ productId: '', quantity: 1, unitPrice: 0 }];
      paymentMethod = 'efectivo';
      selectedClient = null;
      clientSearch = '';
      products = await getAll('products');
      sales = await getAll('sales');

      openInvoice({ ...saleData, id: saleId }, credit);
    } catch (e) {
      notify('error', 'Error al registrar venta');
    }
    loading = false;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO');
  }

  const paymentLabels = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    nequi: 'Nequi',
    daviplata: 'Daviplata'
  };
</script>

<div class="page">
  <div class="page-head">
    <h1>Registro de Ventas</h1>
    {#if canView($currentUser, 'sales')}
      <ExportButton rows={normalizeRows('sales', sales)} filename="ventas.xlsx" sheetName="Ventas" label="Exportar" />
    {/if}
  </div>

  <div class="form-card">
    {#if canCreate($currentUser, 'sales')}
    <div class="items-section">
      <div class="items-header">
        <span>Productos</span>
        <Button variant="outline" on:click={addItem}>+ Agregar</Button>
      </div>

      {#each items as item, index}
        <div class="item-row">
          <select bind:value={item.productId} on:change={() => updateItemPrice(index)}>
            <option value="">Producto...</option>
            {#each products as prod}
              <option value={prod.id}>
                {prod.name} (Stock: {prod.currentStock})
              </option>
            {/each}
          </select>
          <input type="number" bind:value={item.quantity} min="1" placeholder="Cant." class="qty-input" />
          <input type="number" bind:value={item.unitPrice} min="0" placeholder="$ Precio" class="price-input" />
          {#if items.length > 1}
            <button class="btn-remove" on:click={() => removeItem(index)}>✕</button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="form-group">
      <label for="payment">Método de Pago</label>
      <select id="payment" bind:value={paymentMethod}>
        <option value="efectivo">Efectivo</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="nequi">Nequi</option>
        <option value="daviplata">Daviplata</option>
        <option value="fiado">Fiado (Crédito)</option>
      </select>
    </div>

    <div class="form-group client-search">
      <label for="clientSearch">{isFiadoPayment ? 'Cliente (obligatorio para fiado)' : 'Cliente (opcional)'}</label>
      <input
        id="clientSearch"
        type="text"
        bind:value={clientSearch}
        placeholder="Busca por nombre o cédula..."
        autocomplete="off"
        on:input={onClientSearchInput}
        on:focus={onClientSearchInput}
        on:blur={onClientSearchBlur}
      />
      {#if selectedClient}
        <p class="client-selected"><i class="fa-solid fa-user-check"></i> {selectedClient.name} — CC {selectedClient.cedula}
          <button type="button" class="btn-clear-client" on:click={clearClient} aria-label="Quitar cliente">&times;</button>
        </p>
      {/if}
      {#if showClientList && filteredClients.length > 0}
        <ul class="client-list">
          {#each filteredClients as client}
            <li on:click={() => selectClient(client)} on:keydown={(e) => { if (e.key === 'Enter') selectClient(client); }} tabindex="0" role="button">
              <span class="client-list-name">{client.name}</span>
              <span class="client-list-cedula">CC {client.cedula}</span>
            </li>
          {/each}
        </ul>
      {/if}
      {#if isFiadoPayment && clients.length === 0}
        <p class="fiado-hint"><i class="fa-solid fa-circle-info"></i> No hay clientes registrados. Regístralos primero en Clientes para poder vender a fiado.</p>
      {/if}
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>{formatCurrency(totals.subtotal)}</span>
      </div>
      <div class="total-row">
        <span>IVA ({iva}%):</span>
        <span>{formatCurrency(totals.iva)}</span>
      </div>
      <div class="total-row total-final">
        <span>Total:</span>
        <span>{formatCurrency(totals.total)}</span>
      </div>
    </div>

    <Button fullWidth={true} variant="success" on:click={saveSale} {loading}>
      Registrar Venta
    </Button>
    {:else}
      <p class="readonly-msg"><i class="fa-solid fa-eye"></i> Vista previa — No tienes permiso para registrar ventas</p>
    {/if}
  </div>

  {#if sales.length > 0}
    <h2 class="section-title">Últimas Ventas</h2>
    <div class="history-list">
      {#each sales.slice(0, 10) as sale}
        <div class="history-item">
          <div class="history-info">
            <span class="history-name">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
            {#if sale.clientName}
              <span class="history-client">{sale.clientName}</span>
            {/if}
            <span class="history-date">{formatDate(sale.saleDate)}</span>
          </div>
          <div class="history-right">
            <span class="history-amount">{formatCurrency(sale.total)}</span>
            <button class="btn-invoice" on:click={() => openInvoice(sale)} title="Ver factura">
              <i class="fa-solid fa-receipt"></i> Ver Factura
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Modal show={showInvoiceModal} title="Factura" size="large" on:close={closeInvoiceModal}>
  <InvoiceModal sale={lastSale} credit={lastCredit} />
</Modal>



<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 0.5rem; }
  .page-head h1 { margin: 0; }
  h1 { font-size: 1.3rem; color: #1f2937; }

  .form-card {
    background: white; border-radius: 12px; padding: 1.25rem;
    box-shadow: var(--shadow-sm);
  }

  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.3rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
  select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  select:focus { outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }

  .items-section { margin-bottom: 1rem; }
  .items-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0.75rem;
  }
  .items-header span { font-weight: 600; color: #374151; font-size: 0.9rem; }

  .item-row {
    display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;
  }
  .item-row select { flex: 2; }
  .qty-input, .price-input {
    width: 80px; padding: 0.65rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; text-align: center;
  }
  .price-input { width: 100px; }
  input:focus { outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }

  .btn-remove {
    background: #FFF7ED; border: none; color: #C2410C;
    width: 32px; height: 32px; border-radius: 6px;
    cursor: pointer; font-size: 0.9rem; flex-shrink: 0;
  }

  .totals { border-top: 1px solid #e5e7eb; padding-top: 0.75rem; margin-bottom: 1rem; }
  .total-row {
    display: flex; justify-content: space-between; padding: 0.3rem 0;
    font-size: 0.9rem; color: #374151;
  }
  .total-final {
    font-weight: 700; font-size: 1.1rem; color: #1f2937;
    border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 0.3rem;
  }

  .section-title { font-size: 1.1rem; color: #1f2937; margin: 1.5rem 0 0.75rem; }

  .history-list {
    background: white; border-radius: 12px; overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .history-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6;
  }
  .history-item:last-child { border-bottom: none; }
  .history-name { font-weight: 600; color: #1f2937; font-size: 0.9rem; }
  .history-date { font-size: 0.8rem; color: #9ca3af; display: block; }
  .history-right { display: flex; align-items: center; gap: 0.6rem; }
  .history-amount { font-weight: 700; color: #16a34a; font-size: 0.9rem; }

  .btn-invoice {
    background: rgba(6,79,60,0.1); border: none; color: #064F3C;
    padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer;
    font-size: 0.85rem; font-weight: 600; transition: background 0.15s;
    display: inline-flex; align-items: center; gap: 0.4rem;
  }
  .btn-invoice:hover { background: rgba(6,79,60,0.18); }

  .fiado-hint { font-size: 0.8rem; color: #854d0e; margin: 0.5rem 0 0; display: flex; align-items: center; gap: 0.4rem; }

  .client-search { position: relative; }
  .client-search input { width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
  .client-search input:focus { outline: none; border-color: #064F3C; box-shadow: 0 0 0 3px rgba(6,79,60,0.14); }

  .client-list {
    position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
    background: white; border: 1.5px solid #e5e7eb; border-radius: 10px;
    box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.12));
    max-height: 200px; overflow-y: auto; list-style: none;
    margin: 0.25rem 0 0; padding: 0.25rem;
  }
  .client-list li {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.55rem 0.7rem; border-radius: 8px; cursor: pointer;
    font-size: 0.9rem;
  }
  .client-list li:hover, .client-list li:focus { background: #f0fdf4; outline: none; }
  .client-list-name { font-weight: 600; color: #1f2937; }
  .client-list-cedula { font-size: 0.78rem; color: #9ca3af; }

  .client-selected {
    margin: 0.5rem 0 0; padding: 0.55rem 0.7rem;
    background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
    font-size: 0.9rem; font-weight: 600; color: #065f46;
    display: flex; align-items: center; gap: 0.45rem;
  }
  .client-selected i { color: #16a34a; }
  .btn-clear-client {
    margin-left: auto; background: transparent; border: none;
    color: #6b7280; font-size: 1.05rem; cursor: pointer; line-height: 1;
    padding: 0.1rem 0.4rem; border-radius: 6px;
  }
  .btn-clear-client:hover { background: #e5e7eb; color: #374151; }

  .history-client { font-size: 0.8rem; color: #065f46; font-weight: 600; display: block; }

  .readonly-msg {
    text-align: center; color: #6b7280; padding: 1.5rem;
    font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }
  .readonly-msg i { color: #9ca3af; }
</style>