<script>
  import { onMount } from 'svelte';
  import { getAll } from '../services/firestoreService';
  import { getAllClients } from '../services/clientService';
  import { getAllCredits } from '../services/creditService';
  import { formatCurrency, roundMoney } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';

  let clients = [];
  let credits = [];
  let loading = true;

  onMount(async () => {
    try {
      const [cl, cr] = await Promise.all([getAllClients(), getAllCredits()]);
      clients = cl;
      credits = cr;
    } catch (e) {
      console.error('Error cargando cuentas por cobrar', e);
    }
    loading = false;
  });

  function daysBetween(timestamp) {
    if (!timestamp) return 0;
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getClient(id) {
    return clients.find(c => c.id === id) || null;
  }

  $: pendingCredits = credits.filter(c => c.status === 'pending');
  $: totalPendiente = roundMoney(pendingCredits.reduce((s, c) => s + (c.total || 0), 0));

  $: rows = pendingCredits.map(c => {
    const client = getClient(c.clientId);
    const days = daysBetween(c.createdAt);
    const maxDays = client?.maxDaysToPay || 30;
    const overdue = days > maxDays;
    return {
      credit: c,
      client,
      days,
      maxDays,
      overdue,
      overdueDays: overdue ? days - maxDays : 0
    };
  });

  $: rowsSorted = [...rows].sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    return b.days - a.days;
  });

  $: totalVencido = roundMoney(rows.filter(r => r.overdue).reduce((s, r) => s + (r.credit.total || 0), 0));

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('es-CO');
  }
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>Las Cuentas por Cobrar son parte de Caja y Reportes y solo están disponibles para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-file-invoice-dollar"></i> Cuentas por Cobrar</h1>
      <ExportButton rows={normalizeRows('credits', pendingCredits)} filename="cuentas-cobrar.xlsx" sheetName="Fiados" label="Exportar" />
    </div>

    {#if loading}
      <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
    {:else}
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Por cobrar (pendientes)</span>
          <span class="kpi-value">{formatCurrency(totalPendiente)}</span>
        </div>
        <div class="kpi vencido">
          <span class="kpi-label">Vencidos</span>
          <span class="kpi-value">{formatCurrency(totalVencido)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Fiados pendientes</span>
          <span class="kpi-value">{pendingCredits.length}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Clientes con deuda</span>
          <span class="kpi-value">{rows.length}</span>
        </div>
      </div>

      {#if rowsSorted.length === 0}
        <p class="empty"><i class="fa-solid fa-circle-check"></i> No hay cuentas por cobrar pendientes</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Días</th>
                <th>Plazo</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {#each rowsSorted as row}
                <tr class:overdue={row.overdue}>
                  <td>
                    <div class="client-name">{row.credit.clientName || row.client?.name || '—'}</div>
                    <div class="client-sub">{row.credit.clientCedula || row.client?.cedula || '—'}</div>
                  </td>
                  <td>{formatDate(row.credit.createdAt)}</td>
                  <td>{row.days}</td>
                  <td>{row.maxDays} días</td>
                  <td class="amount">{formatCurrency(row.credit.total)}</td>
                  <td>
                    {#if row.overdue}
                      <span class="badge overdue">Vencido ({row.overdueDays} días)</span>
                    {:else}
                      <span class="badge ontime">A tiempo</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .no-access { text-align: center; color: #6b7280; padding: 3rem 1rem; }
  .no-access i { font-size: 2.5rem; color: #9ca3af; margin-bottom: 1rem; }
  .no-access h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.5rem; }
  .no-access p { font-size: 0.9rem; margin: 0; }

  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .empty {
    text-align: center; color: #9ca3af; padding: 2.5rem;
    background: #fff; border: 1px dashed var(--border); border-radius: var(--radius);
  }

  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
  .kpi {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 3px solid #064F3C;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .kpi.vencido { border-top-color: #EA580C; }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }
  .kpi.vencido .kpi-value { color: #EA580C; }

  .table-wrap { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 1rem; text-align: left; font-size: 0.85rem; }
  th { background: #f3f4f6; color: #374151; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
  td { border-top: 1px solid #f3f4f6; color: #0A241D; }
  tr.overdue td { background: #FFF7ED; }
  .client-name { font-weight: 600; color: #0A241D; }
  .client-sub { font-size: 0.75rem; color: #9ca3af; }
  .amount { font-weight: 700; color: #064F3C; white-space: nowrap; }
  .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; }
  .badge.overdue { background: #FEE2E2; color: #EA580C; }
  .badge.ontime { background: #DCFCE7; color: #166534; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>