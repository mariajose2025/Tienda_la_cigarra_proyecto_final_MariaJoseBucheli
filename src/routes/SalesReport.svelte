<script>
  import { onMount } from 'svelte';
  import { getAll } from '../services/firestoreService';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';

  let sales = [];
  let loading = true;
  let activePreset = '30';
  let fromDate = '';
  let toDate = '';

  const PAYMENT_METHODS = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'tarjeta', label: 'Tarjeta' },
    { id: 'nequi', label: 'Nequi' },
    { id: 'daviplata', label: 'Daviplata' }
  ];

  const presets = [
    { id: 'hoy', label: 'Hoy' },
    { id: '7', label: '7 días' },
    { id: '30', label: '30 días' },
    { id: '90', label: '90 días' },
    { id: 'todo', label: 'Todo' }
  ];

  onMount(async () => {
    try {
      sales = await getAll('sales');
    } catch (e) {
      console.error('Error cargando ventas', e);
    }
    loading = false;
  });

  function toDateObj(timestamp) {
    if (!timestamp) return null;
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  }

  function inRange(timestamp) {
    const d = toDateObj(timestamp);
    if (!d) return false;
    if (activePreset === 'todo' && !fromDate && !toDate) return true;
    if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
    if (toDate && d > new Date(toDate + 'T23:59:59')) return false;
    if (activePreset === 'hoy') return d.toDateString() === new Date().toDateString();
    if (activePreset && activePreset !== 'todo') {
      const start = new Date();
      start.setDate(start.getDate() - parseInt(activePreset, 10));
      if (d < start) return false;
    }
    return true;
  }

  function applyPreset(id) {
    activePreset = id;
    fromDate = '';
    toDate = '';
  }

  $: filtered = sales.filter(s => inRange(s.saleDate || s.createdAt));
  $: totalGeneral = filtered.reduce((s, x) => s + (x.total || 0), 0);
  $: count = filtered.length;
  $: ticketPromedio = count > 0 ? totalGeneral / count : 0;

  $: byMethod = PAYMENT_METHODS.map(m => {
    const items = filtered.filter(s => s.paymentMethod === m.id);
    return {
      ...m,
      total: items.reduce((s, x) => s + (x.total || 0), 0),
      count: items.length
    };
  }).filter(x => x.count > 0);

  $: byDay = (() => {
    const map = {};
    filtered.forEach(s => {
      const d = toDateObj(s.saleDate || s.createdAt);
      if (!d) return;
      const key = d.toISOString().slice(0, 10);
      if (!map[key]) map[key] = { day: d, total: 0, count: 0 };
      map[key].total += s.total || 0;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.day - a.day);
  })();

  function formatDate(timestamp) {
    const d = toDateObj(timestamp);
    return d ? d.toLocaleDateString('es-CO') : '—';
  }
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El Reporte de Ventas es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-cart-shopping"></i> Ventas por Período</h1>
      <ExportButton rows={normalizeRows('sales', filtered)} filename="ventas-periodo.xlsx" sheetName="Ventas" label="Exportar" />
    </div>

    <div class="filter-bar">
      {#each presets as preset}
        <button class="filter-btn" class:active={activePreset === preset.id && !fromDate && !toDate} on:click={() => applyPreset(preset.id)}>{preset.label}</button>
      {/each}
    </div>
    <div class="date-range">
      <label>Desde</label>
      <input type="date" bind:value={fromDate} on:change={() => activePreset = ''} />
      <label>Hasta</label>
      <input type="date" bind:value={toDate} on:change={() => activePreset = ''} />
    </div>

    {#if loading}
      <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando ventas...</div>
    {:else}
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Ventas totales</span>
          <span class="kpi-value">{formatCurrency(totalGeneral)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Número de ventas</span>
          <span class="kpi-value">{count}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Ticket promedio</span>
          <span class="kpi-value">{formatCurrency(ticketPromedio)}</span>
        </div>
      </div>

      {#if byMethod.length > 0}
        <h2 class="section-title"><i class="fa-solid fa-wallet"></i> Por método de pago</h2>
        <div class="method-grid">
          {#each byMethod as m}
            <div class="method-card">
              <span class="method-name">{m.label}</span>
              <span class="method-count">{m.count} ventas</span>
              <span class="method-total">{formatCurrency(m.total)}</span>
            </div>
          {/each}
        </div>

        <h2 class="section-title"><i class="fa-solid fa-calendar-day"></i> Ventas por día</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ventas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {#each byDay as day}
                <tr>
                  <td>{formatDate(day.day)}</td>
                  <td>{day.count}</td>
                  <td class="amount">{formatCurrency(day.total)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if filtered.length === 0}
        <p class="empty"><i class="fa-solid fa-inbox"></i> No hay ventas en el período seleccionado</p>
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

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; overflow-x: auto; flex-wrap: wrap; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }

  .date-range { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .date-range label { font-size: 0.8rem; color: #374151; font-weight: 600; }
  .date-range input { padding: 0.4rem 0.6rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.85rem; }
  .date-range input:focus {
    outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }

  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .kpi {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 3px solid #064F3C;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }

  .section-title { font-size: 1.1rem; color: #0A241D; margin: 1.25rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .section-title i { color: #064F3C; }

  .method-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .method-card {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .method-name { font-weight: 600; color: #0A241D; font-size: 0.9rem; }
  .method-count { font-size: 0.75rem; color: #6b7280; }
  .method-total { font-size: 1.1rem; font-weight: 700; color: #064F3C; }

  .table-wrap { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 1rem; text-align: left; font-size: 0.85rem; }
  th { background: #f3f4f6; color: #374151; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
  td { border-top: 1px solid #f3f4f6; color: #0A241D; }
  .amount { font-weight: 700; color: #064F3C; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    .method-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>