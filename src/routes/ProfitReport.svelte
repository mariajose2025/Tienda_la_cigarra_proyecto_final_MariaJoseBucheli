<script>
  import { onMount } from 'svelte';
  import { getAll } from '../services/firestoreService';
  import { notify } from '../stores/toast';
  import { getAllExpenses } from '../services/expenseService';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';

  let products = [];
  let sales = [];
  let purchases = [];
  let expenses = [];
  let loading = true;

  let presets = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'ayer', label: 'Ayer' },
    { id: '7', label: 'Últimos 7 días' },
    { id: '30', label: 'Últimos 30 días' },
    { id: '90', label: 'Últimos 90 días' },
    { id: 'todo', label: 'Todo' }
  ];

  let fromDate = '';
  let toDate = '';
  let activePreset = '30';

  function toLocalDate(dt) {
    if (!dt) return '';
    const d = dt.toDate ? dt.toDate() : new Date(dt);
    return d.toISOString().slice(0, 10);
  }

  function startOfPeriod() {
    if (activePreset === 'todo') return null;
    if (activePreset === 'hoy') return new Date(new Date().setHours(0, 0, 0, 0));
    if (activePreset === 'ayer') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setDate(d.getDate() - parseInt(activePreset, 10));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function applyPreset(id) {
    activePreset = id;
    fromDate = '';
    toDate = '';
  }

  onMount(async () => {
    try {
      const [p, s, pu, e] = await Promise.all([
        getAll('products'),
        getAll('sales'),
        getAll('purchases'),
        getAllExpenses()
      ]);
      products = p;
      sales = s;
      purchases = pu;
      expenses = e;
    } catch (err) {
      notify('error', 'Error al cargar datos para el reporte');
    }
    loading = false;
  });

  function inRange(timestamp) {
    if (!timestamp) return false;
    if (activePreset === 'todo' && !fromDate && !toDate) return true;
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
    if (toDate && d > new Date(toDate + 'T23:59:59')) return false;
    const start = startOfPeriod();
    if (start && d < start) return false;
    return true;
  }

  function toDateKey(timestamp) {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toISOString().slice(0, 10);
  }

  $: filteredSales = sales.filter(s => inRange(s.saleDate || s.createdAt));
  $: filteredPurchases = purchases.filter(p => inRange(p.purchaseDate || p.createdAt));
  $: filteredExpenses = expenses.filter(e => inRange(e.expenseDate || e.createdAt));

  $: ventasTotales = filteredSales.reduce((s, x) => s + (x.total || 0), 0);
  $: ivaVentas = filteredSales.reduce((s, x) => s + (x.iva || 0), 0);
  $: ventasNetas = ventasTotales - ivaVentas;

  $: comprasTotales = filteredPurchases.reduce((s, x) => s + (x.total || 0), 0);
  $: gastosTotales = filteredExpenses.reduce((s, x) => s + (x.amount || 0), 0);

  $: utilidadBruta = ventasNetas - comprasTotales;
  $: utilidadNeta = utilidadBruta - gastosTotales;

  $: itemsMerged = [
    ...filteredSales.flatMap(s => (s.items || []).map(i => ({ date: toDateKey(s.saleDate || s.createdAt), ...i }))),
    ...filteredPurchases.flatMap(p => (p.items || []).map(i => ({ date: toDateKey(p.purchaseDate || p.createdAt), purchase: true, ...i })))
  ];

  $: topProductos = (() => {
    const map = {};
    itemsMerged.forEach(i => {
      const name = i.productName || 'Producto';
      if (!map[name]) map[name] = { name, vendidos: 0, comprados: 0, venta: 0, compra: 0 };
      if (i.purchase) {
        map[name].comprados += i.quantity || 0;
        map[name].compra += i.subtotal || 0;
      } else {
        map[name].vendidos += i.quantity || 0;
        map[name].venta += i.subtotal || 0;
      }
    });
    return Object.values(map).sort((a, b) => b.venta - a.venta).slice(0, 8);
  })();
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El Reporte de Ganancias es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-chart-line"></i> Reporte de Ganancias</h1>
      <ExportButton rows={normalizeRows('sales', filteredSales)} filename="ganancias.xlsx" sheetName="Ventas" label="Exportar" />
    </div>

    <div class="filter-bar">
      {#each presets as preset}
        <button class="filter-btn" class:active={activePreset === preset.id && !fromDate && !toDate} on:click={() => applyPreset(preset.id)}>{preset.label}</button>
      {/each}
    </div>
    <div class="date-range">
      <label for="pr-from">Desde</label>
      <input id="pr-from" type="date" bind:value={fromDate} on:change={() => activePreset = ''} />
      <label for="pr-to">Hasta</label>
      <input id="pr-to" type="date" bind:value={toDate} on:change={() => activePreset = ''} />
    </div>

    {#if loading}
      <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Calculando...</div>
    {:else}
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Ventas brutas</span>
          <span class="kpi-value">{formatCurrency(ventasTotales)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">IVA cobrado</span>
          <span class="kpi-value">{formatCurrency(ivaVentas)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Compras (costo)</span>
          <span class="kpi-value">{formatCurrency(comprasTotales)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Gastos</span>
          <span class="kpi-value">{formatCurrency(gastosTotales)}</span>
        </div>
      </div>

      <div class="result-cards">
        <div class="result-card">
          <span>Utilidad Bruta</span>
          <strong class="{utilidadBruta >= 0 ? 'ok' : 'bad'}">{formatCurrency(utilidadBruta)}</strong>
        </div>
        <div class="result-card main">
          <span>Utilidad Neta del período</span>
          <strong class="{utilidadNeta >= 0 ? 'ok' : 'bad'}">{formatCurrency(utilidadNeta)}</strong>
        </div>
      </div>

      {#if topProductos.length > 0}
        <h2 class="section-title"><i class="fa-solid fa-trophy"></i> Top Productos por venta</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Vendidos</th>
                <th>Ventas</th>
                <th>Compras (costo)</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {#each topProductos as tp}
                <tr>
                  <td>{tp.name}</td>
                  <td>{tp.vendidos}</td>
                  <td>{formatCurrency(tp.venta)}</td>
                  <td>{formatCurrency(tp.compra)}</td>
                  <td class="pos">{formatCurrency(tp.venta - tp.compra)}</td>
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

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; overflow-x: auto; flex-wrap: wrap; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }

  .date-range { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .date-range label { font-size: 0.8rem; color: #374151; font-weight: 600; }
  .date-range input {
    padding: 0.4rem 0.6rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.85rem;
  }
  .date-range input:focus { outline: none; border-color: #064F3C; }

  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .kpi {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 3px solid #064F3C;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }

  .result-cards { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
  .result-card {
    background: #fff; border-radius: var(--radius); padding: 1rem 1.25rem;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
  }
  .result-card span { color: #374151; font-size: 0.9rem; font-weight: 600; }
  .result-card strong { font-size: 1.2rem; }
  .result-card strong.ok { color: #16a34a; }
  .result-card strong.bad { color: #EA580C; }
  .result-card.main { background: #0A241D; border-color: #0A241D; }
  .result-card.main span { color: #F2C12E; }
  .result-card.main strong { font-size: 1.4rem; }

  .section-title { font-size: 1.1rem; color: #0A241D; margin: 1.25rem 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .section-title i { color: #064F3C; }

  .table-wrap { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 1rem; text-align: left; font-size: 0.85rem; }
  th { background: #f3f4f6; color: #374151; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
  td { border-top: 1px solid #f3f4f6; color: #0A241D; }
  .pos { color: #16a34a; font-weight: 700; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>