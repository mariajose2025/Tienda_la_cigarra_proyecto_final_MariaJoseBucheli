<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import { getAll } from '../services/firestoreService';

  let stats = {
    products: 0,
    suppliers: 0,
    categories: 0,
    purchases: 0,
    sales: 0,
    lowStock: 0,
    expiringSoon: 0,
    clients: 0,
    pendingCredits: 0,
    totalPending: 0
  };

  let recentPurchases = [];
  let recentSales = [];
  let loading = true;

  onMount(async () => {
    try {
      const [products, suppliers, categories, purchases, sales, clients, credits] = await Promise.all([
        getAll('products'),
        getAll('suppliers'),
        getAll('categories'),
        getAll('purchases'),
        getAll('sales'),
        getAll('clients'),
        getAll('credits')
      ]);

      stats.products = products.length;
      stats.suppliers = suppliers.length;
      stats.categories = categories.length;
      stats.purchases = purchases.length;
      stats.sales = sales.length;
      stats.clients = clients.length;
      stats.lowStock = products.filter(p => p.currentStock <= p.minimumStock).length;

      const now = new Date();
      stats.expiringSoon = products.filter(p => {
        const days = Math.ceil((new Date(p.expiryDate) - now) / (1000*60*60*24));
        return days <= 30 && days > 0;
      }).length;

      const pendingCreditsList = credits.filter(c => c.status === 'pending');
      stats.pendingCredits = pendingCreditsList.length;
      stats.totalPending = pendingCreditsList.reduce((sum, c) => sum + (c.total || 0), 0);

      recentPurchases = purchases.slice(0, 3);
      recentSales = sales.slice(0, 3);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      loading = false;
    }
  });

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO');
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
  }
</script>

<div class="dashboard">
  <div class="welcome-section">
    <h1>Bienvenido, {$currentUser?.name || 'Usuario'}</h1>
    <p>Sistema de Tienda de Barrio - La Cigarra</p>
  </div>

  {#if loading}
    <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando datos...</div>
  {:else}
    <div class="stats-grid">
      <div class="stat-card red">
        <i class="fa-solid fa-box-open"></i>
        <span class="stat-number">{stats.products}</span>
        <span class="stat-label">Productos</span>
      </div>
      <div class="stat-card gold">
        <i class="fa-solid fa-truck"></i>
        <span class="stat-number">{stats.suppliers}</span>
        <span class="stat-label">Proveedores</span>
      </div>
      <div class="stat-card olive">
        <i class="fa-solid fa-tags"></i>
        <span class="stat-number">{stats.categories}</span>
        <span class="stat-label">Categorías</span>
      </div>
      <div class="stat-card brown">
        <i class="fa-solid fa-cart-shopping"></i>
        <span class="stat-number">{stats.purchases}</span>
        <span class="stat-label">Compras</span>
      </div>
      <div class="stat-card green">
        <i class="fa-solid fa-cash-register"></i>
        <span class="stat-number">{stats.sales}</span>
        <span class="stat-label">Ventas</span>
      </div>
      <div class="stat-card dark">
        <i class="fa-solid fa-users"></i>
        <span class="stat-number">{stats.clients}</span>
        <span class="stat-label">Clientes</span>
      </div>
      <div class="stat-card warning">
        <i class="fa-solid fa-file-invoice-dollar"></i>
        <span class="stat-number">{stats.pendingCredits}</span>
        <span class="stat-label">Fiados Pendientes</span>
      </div>
      <div class="stat-card alert">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span class="stat-number">{stats.lowStock}</span>
        <span class="stat-label">Stock Bajo</span>
      </div>
    </div>

    <div class="quick-access">
      <h2><i class="fa-solid fa-bolt"></i> Accesos Rápidos</h2>
      <div class="access-grid">
        <a href="/admin/ventas" use:link class="access-card">
          <i class="fa-solid fa-cash-register"></i>
          <span>Nueva Venta</span>
        </a>
        <a href="/admin/fiados" use:link class="access-card gold">
          <i class="fa-solid fa-file-invoice-dollar"></i>
          <span>Nuevo Fiado</span>
        </a>
        <a href="/admin/productos" use:link class="access-card">
          <i class="fa-solid fa-box-open"></i>
          <span>Productos</span>
        </a>
        <a href="/admin/compras" use:link class="access-card">
          <i class="fa-solid fa-cart-shopping"></i>
          <span>Compras</span>
        </a>
        <a href="/admin/clientes" use:link class="access-card">
          <i class="fa-solid fa-users"></i>
          <span>Clientes</span>
        </a>
        {#if isAdmin($currentUser)}
          <a href="/admin/usuarios" use:link class="access-card">
            <i class="fa-solid fa-user-gear"></i>
            <span>Usuarios</span>
          </a>
        {/if}
      </div>
    </div>

    {#if recentPurchases.length > 0}
      <div class="recent-section">
        <h2><i class="fa-solid fa-clock-rotate-left"></i> Últimas Compras</h2>
        <div class="recent-list">
          {#each recentPurchases as purchase}
            <div class="recent-item">
              <span class="recent-name">{purchase.supplierName || 'Proveedor'}</span>
              <span class="recent-date">{formatDate(purchase.purchaseDate)}</span>
              <span class="recent-amount">{formatCurrency(purchase.total)}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .dashboard { padding: 1.25rem; padding-top: 5rem; }

  .welcome-section { margin-bottom: 1.5rem; }
  .welcome-section h1 { font-size: 1.4rem; color: #110F0F; margin: 0; }
  .welcome-section p { color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .loading i { color: #B31A1A; }

  .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }

  .stat-card {
    background: white; border-radius: 12px; padding: 1rem;
    text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border-left: 4px solid; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
  }
  .stat-card i { font-size: 1.2rem; margin-bottom: 0.25rem; }

  .stat-card.red { border-left-color: #B31A1A; }
  .stat-card.red i { color: #B31A1A; }
  .stat-card.gold { border-left-color: #F2C12E; }
  .stat-card.gold i { color: #C49A45; }
  .stat-card.olive { border-left-color: #A3A856; }
  .stat-card.olive i { color: #A3A856; }
  .stat-card.brown { border-left-color: #C49A45; }
  .stat-card.brown i { color: #C49A45; }
  .stat-card.green { border-left-color: #22c55e; }
  .stat-card.green i { color: #22c55e; }
  .stat-card.dark { border-left-color: #110F0F; }
  .stat-card.dark i { color: #110F0F; }
  .stat-card.warning { border-left-color: #F2C12E; }
  .stat-card.warning i { color: #F2C12E; }
  .stat-card.alert { border-left-color: #B31A1A; }
  .stat-card.alert i { color: #B31A1A; }

  .stat-number { display: block; font-size: 1.5rem; font-weight: 700; color: #110F0F; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }

  .quick-access h2, .recent-section h2 {
    font-size: 1.1rem; color: #110F0F; margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .quick-access h2 i, .recent-section h2 i { color: #B31A1A; }

  .access-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }

  .access-card {
    background: white; border-radius: 12px; padding: 1.25rem;
    text-align: center; text-decoration: none; color: #110F0F;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  }
  .access-card i { font-size: 1.5rem; color: #B31A1A; }
  .access-card.gold { background: #110F0F; color: #F2C12E; }
  .access-card.gold i { color: #F2C12E; }
  .access-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }

  .recent-list {
    background: white; border-radius: 12px; overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .recent-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6;
  }
  .recent-item:last-child { border-bottom: none; }
  .recent-name { font-weight: 600; color: #110F0F; font-size: 0.9rem; }
  .recent-date { color: #9ca3af; font-size: 0.8rem; }
  .recent-amount { font-weight: 700; color: #B31A1A; font-size: 0.9rem; }

  @media (min-width: 768px) {
    .dashboard { padding: 1.5rem 2rem; padding-top: 5rem; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
    .access-grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
