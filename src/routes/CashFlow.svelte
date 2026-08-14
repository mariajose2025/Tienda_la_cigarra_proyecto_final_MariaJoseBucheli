<script>
  import { onMount } from 'svelte';
  import { getAllMovements, getAllSessions } from '../services/cashService';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';

  let movements = [];
  let sessions = [];
  let loading = true;

  let presets = [
    { id: '30', label: 'Últimos 30 días' },
    { id: '90', label: 'Últimos 90 días' },
    { id: 'todo', label: 'Todo' }
  ];
  let activePreset = '30';
  let fromDate = '';
  let toDate = '';

  const CATEGORIES = ['venta', 'fiado', 'compra', 'gasto', 'retiro', 'base', 'ajuste', 'otro'];

  onMount(async () => {
    try {
      const [mv, ss] = await Promise.all([getAllMovements(), getAllSessions()]);
      movements = mv;
      sessions = ss;
    } catch (e) {
      console.error('Error cargando flujo de caja', e);
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
    if (activePreset !== 'todo' && activePreset !== '') {
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

  $: filtered = movements.filter(m => inRange(m.createdAt));
  $: ingresos = filtered.filter(m => m.type === 'ingreso').reduce((s, m) => s + (m.amount || 0), 0);
  $: egresos = filtered.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0);
  $: balance = ingresos - egresos;

  $: sessionsFiltered = sessions.filter(s => inRange(s.openedAt || s.createdAt));
  $: bases = sessionsFiltered.reduce((s, x) => s + (x.openingAmount || 0), 0);

  $: byCategory = CATEGORIES.map(cat => {
    const items = filtered.filter(m => m.category === cat);
    const ing = items.filter(m => m.type === 'ingreso').reduce((s, m) => s + (m.amount || 0), 0);
    const egr = items.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0);
    return { cat, ing, egr, net: ing - egr };
  }).filter(x => x.ing !== 0 || x.egr !== 0);

  const CATEGORY_LABELS = {
    venta: 'Ventas en efectivo',
    fiado: 'Cobro de fiados',
    compra: 'Compras a proveedores',
    gasto: 'Gastos operativos',
    retiro: 'Retiros',
    base: 'Base de apertura',
    ajuste: 'Ajustes',
    otro: 'Otros'
  };

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
      <p>El Flujo de Caja es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
<div class="page-header">
      <h1><i class="fa-solid fa-arrow-trend-up"></i> Flujo de Caja</h1>
      <ExportButton rows={normalizeRows('cashMovements', filtered)} filename="flujo-caja.xlsx" sheetName="Movimientos" label="Exportar" />
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
      <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>
    {:else}
      <div class="kpi-grid">
        <div class="kpi in">
          <span class="kpi-label">Ingresos</span>
          <span class="kpi-value">{formatCurrency(ingresos)}</span>
        </div>
        <div class="kpi out">
          <span class="kpi-label">Egresos</span>
          <span class="kpi-value">{formatCurrency(egresos)}</span>
        </div>
        <div class="kpi main">
          <span class="kpi-label">Balance neto</span>
          <span class="kpi-value">{formatCurrency(balance)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Bases de apertura</span>
          <span class="kpi-value">{formatCurrency(bases)}</span>
        </div>
      </div>

      <div class="info-box">
        <i class="fa-solid fa-circle-info"></i>
        Los movimientos se registran automáticamente con cada venta en efectivo, cobro de fiado y compra cuando hay un turno de caja abierto. También puedes revisarlos desde Caja y Movimientos.
      </div>

      {#if byCategory.length > 0}
        <h2 class="section-title"><i class="fa-solid fa-chart-pie"></i> Detalle por categoría</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Ingresos</th>
                <th>Egresos</th>
                <th>Neto</th>
              </tr>
            </thead>
            <tbody>
              {#each byCategory as row}
                <tr>
                  <td>{CATEGORY_LABELS[row.cat] || row.cat}</td>
                  <td class="in">{row.ing ? formatCurrency(row.ing) : '—'}</td>
                  <td class="out">{row.egr ? formatCurrency(row.egr) : '—'}</td>
                  <td class="net {row.net >= 0 ? 'pos' : 'neg'}">{formatCurrency(row.net)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      {#if filtered.length === 0}
        <p class="empty"><i class="fa-solid fa-inbox"></i> No hay movimientos en el período seleccionado</p>
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
  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

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
  .date-range input:focus { outline: none; border-color: #064F3C; }

  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .kpi {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-left: 4px solid #064F3C;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .kpi.in { border-left-color: #22c55e; }
  .kpi.in .kpi-value { color: #16a34a; }
  .kpi.out { border-left-color: #EA580C; }
  .kpi.out .kpi-value { color: #EA580C; }
  .kpi.main { background: #0A241D; }
  .kpi.main .kpi-label { color: #F2C12E; }
  .kpi.main .kpi-value { color: #F2C12E; }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }

  .info-box {
    background: #FFF7ED; border: 1px solid #FFEDD5; color: #9a3412;
    border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.82rem;
    display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;
  }
  .info-box i { color: #EA580C; }

  .section-title { font-size: 1.1rem; color: #0A241D; margin: 1.25rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .section-title i { color: #064F3C; }

  .table-wrap { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 1rem; text-align: left; font-size: 0.85rem; }
  th { background: #f3f4f6; color: #374151; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
  td { border-top: 1px solid #f3f4f6; color: #0A241D; }
  .in { color: #16a34a; }
  .out { color: #EA580C; }
  .net { font-weight: 700; }
  .net.pos { color: #16a34a; }
  .net.neg { color: #EA580C; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>