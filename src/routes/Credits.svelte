<script>
  import { onMount } from 'svelte';
  import { getAllClients } from '../services/clientService';
  import { getAllProducts } from '../services/productService';
  import { getAllCredits, createCredit, updateCredit, deleteCredit } from '../services/creditService';
  import { formatCurrency } from '../utils/iva';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let credits = [];
  let clients = [];
  let products = [];
  let showModal = false;
  let showDetailModal = false;
  let editingCredit = null;
  let selectedCredit = null;
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let filterStatus = 'all';

  let formData = {
    clientId: '',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    notes: ''
  };

  $: filteredCredits = credits.filter(c => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return c.status === 'pending';
    if (filterStatus === 'paid') return c.status === 'paid';
    if (filterStatus === 'overdue') {
      if (c.status === 'paid') return false;
      const client = clients.find(cl => cl.id === c.clientId);
      if (!client) return false;
      const daysPassed = Math.ceil((new Date() - new Date(c.createdAt)) / (1000*60*60*24));
      return daysPassed > client.maxDaysToPay;
    }
    return true;
  });

  $: totalPending = credits.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.total || 0), 0);
  $: totalPaid = credits.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.total || 0), 0);

  onMount(async () => {
    [credits, clients, products] = await Promise.all([
      getAllCredits(), getAllClients(), getAllProducts()
    ]);
  });

  function openModal() {
    if (clients.length === 0) {
      toast = { show: true, message: 'Primero registra al menos un cliente', type: 'warning' };
      return;
    }
    editingCredit = null;
    formData = {
      clientId: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
      notes: ''
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCredit = null;
  }

  function openDetail(credit) {
    selectedCredit = credit;
    showDetailModal = true;
  }

  function addItem() {
    formData.items = [...formData.items, { productId: '', quantity: 1, unitPrice: 0 }];
  }

  function removeItem(index) {
    if (formData.items.length > 1) {
      formData.items = formData.items.filter((_, i) => i !== index);
    }
  }

  function updateItemPrice(index) {
    const product = products.find(p => p.id === formData.items[index].productId);
    if (product) {
      formData.items[index].unitPrice = product.salePrice;
      // Forzar reactividad en Svelte — copia del array para trigger
      formData.items = [...formData.items];
    }
  }

  $: creditTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  async function saveCredit() {
    if (!formData.clientId) {
      toast = { show: true, message: 'Selecciona un cliente', type: 'warning' };
      return;
    }

    const validItems = formData.items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast = { show: true, message: 'Agrega al menos un producto', type: 'warning' };
      return;
    }

    loading = true;
    try {
      const client = clients.find(c => c.id === formData.clientId);
      const creditData = {
        clientId: formData.clientId,
        clientName: client?.name || '',
        clientCedula: client?.cedula || '',
        items: validItems.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name || '',
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.quantity) * Number(item.unitPrice)
          };
        }),
        total: creditTotal,
        notes: formData.notes,
        status: 'pending',
        createdAt: new Date()
      };

      await createCredit(creditData);
      toast = { show: true, message: 'Fiado registrado exitosamente', type: 'success' };
      closeModal();
      credits = await getAllCredits();
    } catch (e) {
      toast = { show: true, message: 'Error al registrar fiado', type: 'error' };
    }
    loading = false;
  }

  async function markAsPaid(credit) {
    if (!confirm(`¿Marcar como pagado el fiado de ${credit.clientName}?`)) return;
    loading = true;
    try {
      await updateCredit(credit.id, { status: 'paid', paidAt: new Date() });
      toast = { show: true, message: 'Fiado marcado como pagado', type: 'success' };
      credits = await getAllCredits();
    } catch (e) {
      toast = { show: true, message: 'Error al actualizar', type: 'error' };
    }
    loading = false;
  }

  async function deleteCreditHandler(id) {
    if (!confirm('¿Eliminar este registro de fiado?')) return;
    loading = true;
    try {
      await deleteCredit(id);
      toast = { show: true, message: 'Fiado eliminado', type: 'success' };
      credits = await getAllCredits();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }

  function formatDate(date) {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-CO');
  }

  function getDaysSince(date) {
    const d = date.toDate ? date.toDate() : new Date(date);
    return Math.ceil((new Date() - d) / (1000*60*60*24));
  }

  function getStatusColor(credit) {
    if (credit.status === 'paid') return 'green';
    const client = clients.find(c => c.id === credit.clientId);
    if (!client) return 'red';
    const days = getDaysSince(credit.createdAt);
    if (days > client.maxDaysToPay) return 'red';
    if (days > client.maxDaysToPay - 7) return 'yellow';
    return 'pending';
  }
</script>

<div class="page">
  <div class="page-header">
    <h1><i class="fa-solid fa-file-invoice-dollar"></i> Fiados</h1>
    <Button on:click={openModal}><i class="fa-solid fa-plus"></i> Nuevo Fiado</Button>
  </div>

  <div class="stats-row">
    <div class="stat-card pending">
      <i class="fa-solid fa-clock"></i>
      <div>
        <span class="stat-amount">{formatCurrency(totalPending)}</span>
        <span class="stat-label">Por Cobrar</span>
      </div>
    </div>
    <div class="stat-card paid">
      <i class="fa-solid fa-circle-check"></i>
      <div>
        <span class="stat-amount">{formatCurrency(totalPaid)}</span>
        <span class="stat-label">Cobrado</span>
      </div>
    </div>
  </div>

  <div class="filter-bar">
    <button class="filter-btn" class:active={filterStatus === 'all'} on:click={() => filterStatus = 'all'}>Todos</button>
    <button class="filter-btn" class:active={filterStatus === 'pending'} on:click={() => filterStatus = 'pending'}>Pendientes</button>
    <button class="filter-btn" class:active={filterStatus === 'overdue'} on:click={() => filterStatus = 'overdue'}>Vencidos</button>
    <button class="filter-btn" class:active={filterStatus === 'paid'} on:click={() => filterStatus = 'paid'}>Pagados</button>
  </div>

  <div class="list">
    {#each filteredCredits as credit}
      {@const statusColor = getStatusColor(credit)}
      <div class="credit-card" on:click={() => openDetail(credit)}>
        <div class="credit-left">
          <div class="client-avatar" class:paid={credit.status === 'paid'}>
            <i class="fa-solid {credit.status === 'paid' ? 'fa-check' : 'fa-user'}"></i>
          </div>
          <div class="credit-info">
            <h3>{credit.clientName}</h3>
            <p class="cedula"><i class="fa-solid fa-id-card"></i> {credit.clientCedula}</p>
            <p class="date"><i class="fa-solid fa-calendar"></i> {formatDate(credit.createdAt)} — {getDaysSince(credit.createdAt)} días</p>
          </div>
        </div>
        <div class="credit-right">
          <span class="credit-total">{formatCurrency(credit.total)}</span>
          {#if credit.status === 'paid'}
            <span class="status-badge paid"><i class="fa-solid fa-check-circle"></i> Pagado</span>
          {:else if statusColor === 'red'}
            <span class="status-badge overdue"><i class="fa-solid fa-exclamation-circle"></i> Vencido</span>
          {:else}
            <span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pendiente</span>
          {/if}
          {#if credit.status === 'pending'}
            <button class="btn-pay" on:click|stopPropagation={() => markAsPaid(credit)}>
              <i class="fa-solid fa-money-bill-wave"></i> Cobrar
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <p class="empty"><i class="fa-solid fa-file-invoice"></i> No hay registros de fiados</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title="Nuevo Fiado" on:close={closeModal} size="large">
  <div class="form-group">
    <label for="client">Cliente *</label>
    <select id="client" bind:value={formData.clientId}>
      <option value="">Seleccionar cliente...</option>
      {#each clients as client}
        <option value={client.id}>{client.name} — CC: {client.cedula}</option>
      {/each}
    </select>
  </div>

  <div class="items-section">
    <div class="items-header">
      <span><i class="fa-solid fa-box-open"></i> Productos del Fiado</span>
      <Button variant="outline" on:click={addItem}><i class="fa-solid fa-plus"></i> Agregar</Button>
    </div>

    {#each formData.items as item, index}
      <div class="item-row">
        <select bind:value={item.productId} on:change={() => updateItemPrice(index)}>
          <option value="">Seleccionar producto...</option>
          {#each products as prod}
            <option value={prod.id}>{prod.name} (Stock: {prod.currentStock})</option>
          {/each}
        </select>
        <input type="number" bind:value={item.quantity} min="1" placeholder="Cant." class="qty-input" />
        <div class="price-field">
          <input type="number" bind:value={item.unitPrice} min="0" placeholder="$ Precio" class="price-input" />
          {#if item.productId}
            <span class="price-hint">Precio venta</span>
          {/if}
        </div>
        {#if formData.items.length > 1}
          <button class="btn-remove" on:click={() => removeItem(index)}><i class="fa-solid fa-xmark"></i></button>
        {/if}
      </div>
    {/each}
  </div>

  <div class="form-group">
    <label for="notes">Notas (opcional)</label>
    <input id="notes" type="text" bind:value={formData.notes} placeholder="Ej: Producto para evento" />
  </div>

  <div class="total-display">
    <span>Total a Fiado:</span>
    <span class="total-amount">{formatCurrency(creditTotal)}</span>
  </div>

  <svelte:fragment slot="footer">
    <button class="btn-cancel" on:click={closeModal}>Cancelar</button>
    <button class="btn-save" on:click={saveCredit} disabled={loading}>
      {#if loading}<i class="fa-solid fa-spinner fa-spin"></i>{/if}
      <i class="fa-solid fa-check"></i> Registrar Fiado
    </button>
  </svelte:fragment>
</Modal>

<Modal show={showDetailModal} title="Detalle del Fiado" on:close={() => showDetailModal = false}>
  {#if selectedCredit}
    <div class="detail-section">
      <p><strong>Cliente:</strong> {selectedCredit.clientName}</p>
      <p><strong>Cédula:</strong> {selectedCredit.clientCedula}</p>
      <p><strong>Fecha:</strong> {formatDate(selectedCredit.createdAt)}</p>
      <p><strong>Estado:</strong>
        <span class="status-badge {selectedCredit.status === 'paid' ? 'paid' : 'pending'}">
          {selectedCredit.status === 'paid' ? 'Pagado' : 'Pendiente'}
        </span>
      </p>
    </div>

    <div class="detail-items">
      <h4>Productos</h4>
      {#each selectedCredit.items as item}
        <div class="detail-item">
          <span>{item.productName} x{item.quantity}</span>
          <span>{formatCurrency(item.subtotal)}</span>
        </div>
      {/each}
      <div class="detail-total">
        <span>Total:</span>
        <span>{formatCurrency(selectedCredit.total)}</span>
      </div>
    </div>

    {#if selectedCredit.notes}
      <p class="notes"><strong>Notas:</strong> {selectedCredit.notes}</p>
    {/if}
  {/if}
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #110F0F; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #B31A1A; }

  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }

  .stat-card {
    background: white; border-radius: 12px; padding: 1rem;
    display: flex; align-items: center; gap: 0.75rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .stat-card i { font-size: 1.5rem; }
  .stat-card.pending { border-left: 4px solid #F2C12E; }
  .stat-card.pending i { color: #F2C12E; }
  .stat-card.paid { border-left: 4px solid #22c55e; }
  .stat-card.paid i { color: #22c55e; }
  .stat-amount { display: block; font-weight: 700; font-size: 1.1rem; color: #110F0F; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; overflow-x: auto; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #B31A1A; color: white; border-color: #B31A1A; }

  .list { display: flex; flex-direction: column; gap: 0.75rem; }

  .credit-card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; transition: transform 0.2s;
  }
  .credit-card:hover { transform: translateY(-1px); }

  .credit-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }

  .client-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: #FEF3C7; color: #C49A45; display: flex;
    align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;
  }
  .client-avatar.paid { background: #DCFCE7; color: #22c55e; }

  .credit-info h3 { margin: 0; font-size: 0.9rem; color: #110F0F; }
  .credit-info p { margin: 0.1rem 0 0; font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 0.3rem; }
  .credit-info p i { color: #C49A45; width: 12px; }
  .cedula { font-weight: 600; color: #B31A1A !important; }

  .credit-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
  .credit-total { font-weight: 700; font-size: 1rem; color: #110F0F; }

  .status-badge {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600;
  }
  .status-badge.pending { background: #FEF3C7; color: #92400e; }
  .status-badge.paid { background: #DCFCE7; color: #166534; }
  .status-badge.overdue { background: #FEE2E2; color: #991b1b; }

  .btn-pay {
    background: #22c55e; color: white; border: none; padding: 0.35rem 0.75rem;
    border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;
    display: flex; align-items: center; gap: 0.3rem;
  }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #110F0F; }
  input, select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  input:focus, select:focus { outline: none; border-color: #B31A1A; }

  .items-section { margin-bottom: 1rem; }
  .items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .items-header span { font-weight: 600; color: #110F0F; font-size: 0.9rem; display: flex; align-items: center; gap: 0.35rem; }
  .item-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
  .item-row select { flex: 2; }
  .qty-input, .price-input {
    width: 80px; padding: 0.65rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; text-align: center;
  }
  .price-input { width: 100px; }
  .price-field { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
  .price-hint {
    font-size: 0.6rem; color: #22c55e; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.4px;
  }
  .btn-remove {
    background: #FEE2E2; border: none; color: #B31A1A;
    width: 32px; height: 32px; border-radius: 6px;
    cursor: pointer; font-size: 0.9rem; flex-shrink: 0;
  }

  .total-display {
    background: #110F0F; color: #F2C12E; padding: 0.85rem 1rem;
    border-radius: 10px; display: flex; justify-content: space-between;
    font-weight: 700; font-size: 1.05rem;
  }

  .detail-section { margin-bottom: 1rem; }
  .detail-section p { margin: 0.3rem 0; font-size: 0.9rem; color: #374151; }

  .detail-items { border-top: 1px solid #e5e7eb; padding-top: 0.75rem; }
  .detail-items h4 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #110F0F; }
  .detail-item { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.85rem; }
  .detail-total {
    display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem; margin-top: 0.5rem; font-weight: 700; color: #B31A1A;
  }

  .notes { margin-top: 0.75rem; font-size: 0.85rem; color: #6b7280; font-style: italic; }

  .btn-cancel {
    background: #6b7280; color: white; border: none;
    padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem;
    font-weight: 600; cursor: pointer;
  }
  .btn-cancel:hover { background: #4b5563; }

  .btn-save {
    background: #B31A1A; color: white; border: none;
    padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.9rem;
    font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
  }
  .btn-save:hover { background: #8B1A1A; }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
