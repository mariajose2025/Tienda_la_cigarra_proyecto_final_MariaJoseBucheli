<script>
  import { onMount } from 'svelte';
  import { getAllClients } from '../services/clientService';
  import { notify } from '../stores/toast';
  import { getAllCredits, updateCredit, deleteCredit } from '../services/creditService';
  import { getOpenSession, addAutomaticMovement } from '../services/cashService';
  import { currentUser } from '../stores/auth';
  import { canEdit, canView } from '../utils/permissions';
  import { formatCurrency } from '../utils/iva';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';
  import Modal from '../components/common/Modal.svelte';

  let credits = [];
  let clients = [];
  let showDetailModal = false;
  let selectedCredit = null;
  let loading = false;
  let filterStatus = 'all';

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
    [credits, clients] = await Promise.all([
      getAllCredits(), getAllClients()
    ]);
  });

  function openDetail(credit) {
    selectedCredit = credit;
    showDetailModal = true;
  }

  async function markAsPaid(credit) {
    if (!confirm(`¿Marcar como pagado el fiado de ${credit.clientName}?`)) return;
    loading = true;
    try {
      await updateCredit(credit.id, { status: 'paid', paidAt: new Date() });

      const openSession = await getOpenSession();
      if (openSession) {
        await addAutomaticMovement(openSession.id, 'ingreso', 'fiado', credit.total, credit.id, 'credit', `Cobro de fiado de ${credit.clientName || 'cliente'}`);
      }

      notify('success', 'Fiado marcado como pagado');
      credits = await getAllCredits();
    } catch (e) {
      notify('error', 'Error al actualizar');
    }
    loading = false;
  }

  async function deleteCreditHandler(id) {
    if (!confirm('¿Eliminar este registro de fiado?')) return;
    loading = true;
    try {
      await deleteCredit(id);
      notify('success', 'Fiado eliminado');
      credits = await getAllCredits();
    } catch (e) {
      notify('error', 'Error al eliminar');
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
    <div class="header-actions">
      {#if canView($currentUser, 'credits')}
        <ExportButton rows={normalizeRows('credits', filteredCredits)} filename="fiados.xlsx" sheetName="Fiados" label="Exportar" />
      {/if}
    </div>
  </div>

  <div class="info-banner">
    <i class="fa-solid fa-circle-info"></i>
    <span>Los fiados se registran automáticamente al vender con el método <strong>Fiado (Crédito)</strong> desde <strong>Ventas</strong>. Aquí puedes verlos, cobrarlos y filtrarlos.</span>
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
      <div class="credit-card" role="button" tabindex="0" on:click={() => openDetail(credit)} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(credit); } }}>
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
          {#if credit.status === 'pending' && canEdit($currentUser, 'credits')}
            <button class="btn-pay" on:click|stopPropagation={() => markAsPaid(credit)}>
              <i class="fa-solid fa-money-bill-wave"></i> Cobrar
            </button>
          {/if}
        </div>
      </div>
    {:else}
      <p class="empty"><i class="fa-solid fa-file-invoice"></i> Aún no hay fiados. Se generan automáticamente al vender a fiado desde Ventas.</p>
    {/each}
  </div>
</div>

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



<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }
  .header-actions { display: flex; align-items: center; gap: 0.5rem; }

  .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; }

  .stat-card {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    display: flex; align-items: center; gap: 0.75rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
  }
  .stat-card i { font-size: 1.5rem; }
  .stat-card.pending { border-top: 3px solid #F2C12E; }
  .stat-card.pending i { color: #F2C12E; }
  .stat-card.paid { border-top: 3px solid #22c55e; }
  .stat-card.paid i { color: #22c55e; }
  .stat-amount { display: block; font-weight: 700; font-size: 1.1rem; color: #0A241D; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; overflow-x: auto; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }

  .list { display: flex; flex-direction: column; gap: 0.75rem; }

  .credit-card {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
    cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  }
  .credit-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }

  .credit-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }

  .client-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: #FEF3C7; color: #C49A45; display: flex;
    align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;
  }
  .client-avatar.paid { background: #DCFCE7; color: #22c55e; }

  .credit-info h3 { margin: 0; font-size: 0.9rem; color: #0A241D; }
  .credit-info p { margin: 0.1rem 0 0; font-size: 0.75rem; color: #6b7280; display: flex; align-items: center; gap: 0.3rem; }
  .credit-info p i { color: #C49A45; width: 12px; }
  .cedula { font-weight: 600; color: #064F3C !important; }

  .credit-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
  .credit-total { font-weight: 700; font-size: 1rem; color: #0A241D; }

  .status-badge {
    display: inline-flex; align-items: center; gap: 0.25rem;
    padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600;
  }
  .status-badge.pending { background: #FEF3C7; color: #92400e; }
  .status-badge.paid { background: #DCFCE7; color: #166534; }
  .status-badge.overdue { background: #FEE2E2; color: #B45309; }

  .btn-pay {
    background: #22c55e; color: white; border: none; padding: 0.35rem 0.75rem;
    border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;
    display: flex; align-items: center; gap: 0.3rem;
  }

  .empty {
    text-align: center; color: #9ca3af; padding: 2.5rem;
    background: #fff; border: 1px dashed var(--border); border-radius: var(--radius);
  }

  .info-banner {
    display: flex; align-items: center; gap: 0.55rem;
    background: #ecfdf5; border: 1px solid #bbf7d0; color: #065f46;
    border-radius: 10px; padding: 0.7rem 1rem; margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  .info-banner i { color: #059669; }

  .detail-section { margin-bottom: 1rem; }
  .detail-section p { margin: 0.3rem 0; font-size: 0.9rem; color: #374151; }

  .detail-items { border-top: 1px solid #e5e7eb; padding-top: 0.75rem; }
  .detail-items h4 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #0A241D; }
  .detail-item { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.85rem; }
  .detail-total {
    display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem; margin-top: 0.5rem; font-weight: 700; color: #064F3C;
  }

  .notes { margin-top: 0.75rem; font-size: 0.85rem; color: #6b7280; font-style: italic; }
</style>