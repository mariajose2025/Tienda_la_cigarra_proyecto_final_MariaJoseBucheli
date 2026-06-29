<script>
  import { onMount } from 'svelte';
  import { getAll, create } from '../services/firestoreService';
  import { updateProductStock, getProductById } from '../services/productService';
  import { ivaPercentage } from '../stores/app';
  import { calculateTotalWithIVA, formatCurrency, calculateItemSubtotal } from '../utils/iva';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let sales = [];
  let products = [];

  let items = [{ productId: '', quantity: 1, unitPrice: 0 }];
  let paymentMethod = 'efectivo';
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  $: iva = $ivaPercentage;
  $: subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item.quantity, item.unitPrice), 0);
  $: totals = calculateTotalWithIVA(subtotal, iva);

  onMount(async () => {
    [sales, products] = await Promise.all([
      getAll('sales'), getAll('products')
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

  async function saveSale() {
    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      toast = { show: true, message: 'Agrega al menos un producto', type: 'warning' };
      return;
    }

    for (const item of validItems) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.currentStock < item.quantity) {
        toast = { show: true, message: `Stock insuficiente para ${product.name}`, type: 'error' };
        return;
      }
    }

    loading = true;
    try {
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
        saleDate: new Date()
      };

      await create('sales', saleData);

      for (const item of validItems) {
        const product = await getProductById(item.productId);
        if (product) {
          await updateProductStock(item.productId, product.currentStock - Number(item.quantity));
        }
      }

      toast = { show: true, message: 'Venta registrada exitosamente', type: 'success' };
      items = [{ productId: '', quantity: 1, unitPrice: 0 }];
      paymentMethod = 'efectivo';
      products = await getAll('products');
      sales = await getAll('sales');
    } catch (e) {
      toast = { show: true, message: 'Error al registrar venta', type: 'error' };
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
  <h1>Registro de Ventas</h1>

  <div class="form-card">
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
      </select>
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
  </div>

  {#if sales.length > 0}
    <h2 class="section-title">Últimas Ventas</h2>
    <div class="history-list">
      {#each sales.slice(0, 10) as sale}
        <div class="history-item">
          <div class="history-info">
            <span class="history-name">{paymentLabels[sale.paymentMethod] || sale.paymentMethod}</span>
            <span class="history-date">{formatDate(sale.saleDate)}</span>
          </div>
          <span class="history-amount">{formatCurrency(sale.total)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  h1 { font-size: 1.3rem; color: #1f2937; margin-bottom: 1.25rem; }

  .form-card {
    background: white; border-radius: 12px; padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.3rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
  select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  select:focus { outline: none; border-color: #1e40af; }

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
  input:focus { outline: none; border-color: #1e40af; }

  .btn-remove {
    background: #fef2f2; border: none; color: #dc2626;
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .history-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6;
  }
  .history-item:last-child { border-bottom: none; }
  .history-name { font-weight: 600; color: #1f2937; font-size: 0.9rem; }
  .history-date { font-size: 0.8rem; color: #9ca3af; display: block; }
  .history-amount { font-weight: 700; color: #16a34a; font-size: 0.9rem; }
</style>
