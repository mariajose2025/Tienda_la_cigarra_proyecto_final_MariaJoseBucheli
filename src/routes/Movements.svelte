<script>
  import { onMount } from 'svelte';
  import { getAllSessions, getAllMovements, getMovementsBySession } from '../services/cashService';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import Toast from '../components/common/Toast.svelte';
  import ExportButton from '../components/common/ExportButton.svelte';

  let sessions = [];
  let sessionsMapped = [];
  let filterType = 'all';
  let filterCategory = 'all';
  let loading = true;
  let toast = { show: false, message: '', type: 'info' };

  const CATEGORY_LABELS = {
    venta: 'Venta',
    fiado: 'Cobro de fiado',
    compra: 'Compra',
    gasto: 'Gasto',
    retiro: 'Retiro',
    base: 'Base / Apertura',
    ajuste: 'Ajuste',
    otro: 'Otro'
  };

  const CATEGORIES = ['venta', 'fiado', 'compra', 'gasto', 'retiro', 'ajuste', 'otro'];

  onMount(async () => {
    try {
      sessions = await getAllSessions();
      const allMovements = await getAllMovements();

      sessionsMapped = await Promise.all(sessions.map(async (s) => {
        let movements = allMovements.filter(m => m.sessionId === s.id);
        if (movements.length === 0 && s.status === 'open') {
          movements = await getMovementsBySession(s.id);
        }
        const income = movements.filter(m => m.type === 'ingreso').reduce((x, m) => x + (m.amount || 0), 0);
        const expense = movements.filter(m => m.type === 'egreso').reduce((x, m) => x + (m.amount || 0), 0);
        return { ...s, movements, income, expense, expected: (s.openingAmount || 0) + income - expense };
      }));
    } catch (e) {
      toast = { show: true, message: 'Error al cargar movimientos', type: 'error' };
    }
    loading = false;
  });

  $: filteredSessions = sessionsMapped.filter(s => {
    if (filterType === 'all') return true;
    if (filterType === 'open') return s.status === 'open';
    if (filterType === 'closed') return s.status === 'closed';
    return true;
  });

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CO');
  }

  function formatDateShort(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO');
  }
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El módulo de Movimientos de Caja es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
  <div class="page-header">
    <h1><i class="fa-solid fa-clock-rotate-left"></i> Movimientos de Caja</h1>
    <ExportButton rows={normalizeRows('cashSessions', filteredSessions)} filename="movimientos-caja.xlsx" sheetName="Sesiones" label="Exportar" />
  </div>

  {#if loading}
    <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando movimientos...</div>
  {:else}
    <div class="filter-bar">
      <button class="filter-btn" class:active={filterType === 'all'} on:click={() => filterType = 'all'}>Todos</button>
      <button class="filter-btn" class:active={filterType === 'open'} on:click={() => filterType = 'open'}>Abiertos</button>
      <button class="filter-btn" class:active={filterType === 'closed'} on:click={() => filterType = 'closed'}>Cerrados</button>
    </div>

    {#if filteredSessions.length === 0}
      <p class="empty"><i class="fa-solid fa-inbox"></i> No hay turnos de caja registrados</p>
    {:else}
      {#each filteredSessions as session}
        <div class="session-card">
          <div class="session-header">
            <div class="session-info">
              <span class="session-user"><i class="fa-solid fa-user"></i> {$currentUser?.name || session.userName || 'Cajero'}</span>
              <span class="session-status {session.status}">
                {session.status === 'open' ? 'Abierta' : 'Cerrada'}
              </span>
              <span class="session-dates">
                <i class="fa-solid fa-calendar"></i> {formatDateShort(session.openedAt || session.createdAt)}
              </span>
            </div>
            <div class="session-totals">
              <span class="total-label">Esperado: <strong>{formatCurrency(session.expected)}</strong></span>
              {#if session.status === 'closed'}
                <span class="total-label">Conteo: <strong>{formatCurrency(session.closingAmount || 0)}</strong></span>
                <span class="diff-badge {session.difference === 0 ? 'ok' : (session.difference > 0 ? 'surplus' : 'missing')}">
                  {session.difference >= 0 ? '+' : ''}{formatCurrency(session.difference)}
                </span>
              {/if}
            </div>
          </div>

          <div class="session-stats">
            <span class="stat-chip income">Ingresos: {formatCurrency(session.income)}</span>
            <span class="stat-chip expense">Egresos: {formatCurrency(session.expense)}</span>
            <span class="stat-chip base">Base: {formatCurrency(session.openingAmount || 0)}</span>
          </div>

          {#if session.movements.length > 0}
            <div class="session-movements">
              {#each session.movements as mov}
                <div class="movement-item">
                  <div class="movement-icon {mov.type}">
                    <i class="fa-solid {mov.type === 'ingreso' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                  </div>
                  <div class="movement-info">
                    <span class="movement-name">{CATEGORY_LABELS[mov.category] || mov.category}</span>
                    <span class="movement-desc">{mov.description || ''}</span>
                    <span class="movement-date">{formatDate(mov.createdAt)}</span>
                  </div>
                  <span class="movement-amount {mov.type}">{mov.type === 'ingreso' ? '+' : '-'}{formatCurrency(mov.amount)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
{/if}
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .no-access {
    text-align: center; color: #6b7280; padding: 3rem 1rem;
  }
  .no-access i { font-size: 2.5rem; color: #9ca3af; margin-bottom: 1rem; }
  .no-access h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.5rem; }
  .no-access p { font-size: 0.9rem; margin: 0; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; overflow-x: auto; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .session-card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 1rem;
  }
  .session-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.6rem;
  }
  .session-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .session-user { font-weight: 700; color: #0A241D; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem; }
  .session-user i { color: #064F3C; }
  .session-status {
    padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: 700;
  }
  .session-status.open { background: #DCFCE7; color: #166534; }
  .session-status.closed { background: #f3f4f6; color: #6b7280; }
  .session-dates { color: #9ca3af; font-size: 0.78rem; display: flex; align-items: center; gap: 0.3rem; }

  .session-totals { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .total-label { font-size: 0.85rem; color: #6b7280; }
  .total-label strong { color: #0A241D; font-weight: 700; }
  .diff-badge {
    padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 700;
  }
  .diff-badge.ok { background: #DCFCE7; color: #16a34a; }
  .diff-badge.surplus { background: #FEE2E2; color: #EA580C; }
  .diff-badge.missing { background: #FEE2E2; color: #EA580C; }

  .session-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
  .stat-chip {
    padding: 0.3rem 0.75rem; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
  }
  .stat-chip.income { background: #DCFCE7; color: #166534; }
  .stat-chip.expense { background: #FEE2E2; color: #B45309; }
  .stat-chip.base { background: #FEF3C7; color: #92400e; }

  .session-movements { border-top: 1px solid #f3f4f6; padding-top: 0.5rem; }
  .movement-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.6rem 0; border-bottom: 1px solid #f9fafb;
  }
  .movement-item:last-child { border-bottom: none; padding-bottom: 0; }

  .movement-icon {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; flex-shrink: 0;
  }
  .movement-icon.ingreso { background: #DCFCE7; color: #16a34a; }
  .movement-icon.egreso { background: #FEE2E2; color: #EA580C; }

  .movement-info { flex: 1; min-width: 0; }
  .movement-name { font-weight: 600; color: #0A241D; font-size: 0.85rem; display: block; }
  .movement-desc { color: #6b7280; font-size: 0.78rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .movement-date { color: #9ca3af; font-size: 0.7rem; }

  .movement-amount { font-weight: 700; font-size: 0.9rem; white-space: nowrap; }
  .movement-amount.ingreso { color: #16a34a; }
  .movement-amount.egreso { color: #EA580C; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
  }
</style>