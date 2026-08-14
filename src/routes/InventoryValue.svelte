<script>
  import { onMount } from 'svelte';
  import { getAll } from '../services/firestoreService';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';

  let products = [];
  let categories = [];
  let loading = true;
  let filterCategory = 'all';
  let searchTerm = '';

  onMount(async () => {
    try {
      const [p, c] = await Promise.all([getAll('products'), getAll('categories')]);
      products = p;
      categories = c;
    } catch (e) {
      console.error('Error cargando inventario', e);
    }
    loading = false;
  });

  function catName(id) {
    return categories.find(c => c.id === id)?.name || '—';
  }

  $: filteredProducts = products
    .filter(p => filterCategory === 'all' ? true : p.categoryId === filterCategory)
    .filter(p => !searchTerm.trim() || (p.name || '').toLowerCase().includes(searchTerm.trim().toLowerCase()));

  $: rows = filteredProducts.map(p => {
    const costo = (p.currentStock || 0) * (p.purchasePrice || 0);
    const venta = (p.currentStock || 0) * (p.salePrice || 0);
    const margen = venta - costo;
    return { product: p, costo, venta, margen, margenPct: venta > 0 ? (margen / venta) * 100 : 0 };
  }).sort((a, b) => b.costo - a.costo);

  $: totalCosto = rows.reduce((s, r) => s + r.costo, 0);
  $: totalVenta = rows.reduce((s, r) => s + r.venta, 0);
  $: totalMargen = totalVenta - totalCosto;
  $: unidades = filteredProducts.reduce((s, p) => s + (p.currentStock || 0), 0);
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El Valor del Inventario es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-boxes-stacked"></i> Valor del Inventario</h1>
      <ExportButton rows={normalizeRows('products', filteredProducts)} filename="valor-inventario.xlsx" sheetName="Inventario" label="Exportar" />
    </div>

    {#if loading}
      <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando inventario...</div>
    {:else}
      <div class="kpi-grid">
        <div class="kpi">
          <span class="kpi-label">Valor a costo</span>
          <span class="kpi-value">{formatCurrency(totalCosto)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Valor a precio de venta</span>
          <span class="kpi-value">{formatCurrency(totalVenta)}</span>
        </div>
        <div class="kpi main">
          <span class="kpi-label">Margen potencial</span>
          <span class="kpi-value">{formatCurrency(totalMargen)}</span>
        </div>
        <div class="kpi">
          <span class="kpi-label">Unidades en stock</span>
          <span class="kpi-value">{unidades}</span>
        </div>
      </div>

      <div class="filters">
        <div class="filter-bar">
          <button class="filter-btn" class:active={filterCategory === 'all'} on:click={() => filterCategory = 'all'}>Todas</button>
          {#each categories as cat}
            <button class="filter-btn" class:active={filterCategory === cat.id} on:click={() => filterCategory = cat.id}>{cat.name}</button>
          {/each}
        </div>
        <input class="search" type="text" bind:value={searchTerm} placeholder="Buscar producto..." />
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Costo unit.</th>
              <th>Precio venta</th>
              <th>Valor costo</th>
              <th>Valor venta</th>
              <th>Margen</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as row}
              <tr>
                <td class="name">{row.product.name}</td>
                <td>{catName(row.product.categoryId)}</td>
                <td>{row.product.currentStock}</td>
                <td>{formatCurrency(row.product.purchasePrice)}</td>
                <td>{formatCurrency(row.product.salePrice)}</td>
                <td>{formatCurrency(row.costo)}</td>
                <td>{formatCurrency(row.venta)}</td>
                <td class="pos">{formatCurrency(row.margen)} <span class="pct">({row.margenPct.toFixed(0)}%)</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if rows.length === 0}
          <p class="empty">No se encontraron productos</p>
        {/if}
      </div>
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
  .kpi.main { background: #0A241D; border-color: #0A241D; }
  .kpi.main .kpi-label { color: #F2C12E; }
  .kpi.main .kpi-value { color: #F2C12E; }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }

  .filters { margin-bottom: 1rem; }
  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 0.6rem; overflow-x: auto; }
  .filter-btn {
    padding: 0.4rem 0.9rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.78rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }
  .search {
    width: 100%; padding: 0.6rem 0.9rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;
  }
  .search:focus {
    outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }

  .table-wrap { background: #fff; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.7rem 0.8rem; text-align: left; font-size: 0.85rem; white-space: nowrap; }
  th { background: #f3f4f6; color: #374151; font-weight: 700; font-size: 0.72rem; text-transform: uppercase; }
  td { border-top: 1px solid #f3f4f6; color: #0A241D; }
  .name { font-weight: 600; }
  .pos { color: #16a34a; font-weight: 700; }
  .pct { font-size: 0.72rem; color: #9ca3af; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr); }
    .filters { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .search { width: 260px; }
  }
</style>