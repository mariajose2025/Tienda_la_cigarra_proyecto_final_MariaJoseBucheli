<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { currentUser } from '../stores/auth';
  import { isAdmin, canView } from '../utils/permissions';
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

  $: roleLabel = $currentUser?.roleName === 'Administrador' ? 'Administrador'
    : $currentUser?.roleName === 'Inspector' ? 'Inspector'
    : 'Cajero';

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
        if (!p.expiryDate) return false;
        const expiry = p.expiryDate.toDate ? p.expiryDate.toDate() : new Date(p.expiryDate);
        if (isNaN(expiry)) return false;
        const days = Math.ceil((expiry - now) / (1000*60*60*24));
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
    <div class="welcome-text">
      <h1>Bienvenido, {$currentUser?.name || 'Usuario'}</h1>
      <p>Sistema de Tienda de Barrio - La Cigarra</p>
    </div>
    <span class="role-badge"><i class="fa-solid fa-circle-check"></i> {roleLabel}</span>
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
        {#if stats.totalPending > 0}
          <span class="stat-sub">{formatCurrency(stats.totalPending)}</span>
        {/if}
      </div>
      <div class="stat-card alert">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span class="stat-number">{stats.lowStock}</span>
        <span class="stat-label">Stock Bajo</span>
        {#if stats.expiringSoon > 0}
          <span class="stat-sub">{stats.expiringSoon} vencen pronto</span>
        {/if}
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
          <span>Ver Fiados</span>
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
        {#if canView($currentUser, 'cash')}
          <a href="/admin/caja" use:link class="access-card">
            <i class="fa-solid fa-cash-register"></i>
            <span>Caja</span>
          </a>
        {/if}
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

  .welcome-section {
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem;
  }
  .welcome-section h1 { font-size: 1.4rem; color: #0A241D; margin: 0; }
  .welcome-section p { color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem; }

  .role-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: #064F3C; color: white; font-size: 0.8rem; font-weight: 600;
    padding: 0.4rem 0.85rem; border-radius: 999px;
  }
  .role-badge i { color: #F2C12E; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .loading i { color: #064F3C; }

  .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }

  .stat-card {
    background: white; border-radius: 12px; padding: 1rem;
    text-align: center; box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    border-top: 3px solid; display: flex; flex-direction: column; align-items: center; gap: 0.15rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .stat-card i { font-size: 1.2rem; margin-bottom: 0.25rem; }

  .stat-card.red { border-top-color: #064F3C; }
  .stat-card.red i { color: #064F3C; }
  .stat-card.gold { border-top-color: #F2C12E; }
  .stat-card.gold i { color: #C49A45; }
  .stat-card.olive { border-top-color: #A3A856; }
  .stat-card.olive i { color: #A3A856; }
  .stat-card.brown { border-top-color: #C49A45; }
  .stat-card.brown i { color: #C49A45; }
  .stat-card.green { border-top-color: #22c55e; }
  .stat-card.green i { color: #22c55e; }
  .stat-card.dark { border-top-color: #0A241D; }
  .stat-card.dark i { color: #0A241D; }
  .stat-card.warning { border-top-color: #F2C12E; }
  .stat-card.warning i { color: #F2C12E; }
  .stat-card.alert { border-top-color: #C2410C; }
  .stat-card.alert i { color: #C2410C; }

  .stat-number { display: block; font-size: 1.5rem; font-weight: 700; color: #0A241D; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }
  .stat-sub { font-size: 0.7rem; color: #C2410C; font-weight: 600; }

  .quick-access h2, .recent-section h2 {
    font-size: 1.1rem; color: #0A241D; margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .quick-access h2 i, .recent-section h2 i { color: #064F3C; }

  .access-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }

  .access-card {
    background: white; border-radius: 12px; padding: 1.1rem;
    text-align: center; text-decoration: none; color: #0A241D;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  }
  .access-card i {
    font-size: 1.4rem; color: #064F3C;
    width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
    background: rgba(6,79,60,0.08); border-radius: 12px;
  }
  .access-card.gold { background: #0A241D; color: #F2C12E; border-color: #0A241D; }
  .access-card.gold i { color: #F2C12E; background: rgba(242,193,46,0.12); }
  .access-card:hover {
    transform: translateY(-3px); box-shadow: var(--shadow-md);
    border-color: rgba(6,79,60,0.35);
  }

  .recent-list {
    background: white; border-radius: 12px; overflow: hidden;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
  }

  .recent-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6;
    transition: background 0.15s;
  }
  .recent-item:hover { background: #fafbfc; }
  .recent-item:last-child { border-bottom: none; }
  .recent-name { font-weight: 600; color: #0A241D; font-size: 0.9rem; }
  .recent-date { color: #9ca3af; font-size: 0.8rem; }
  .recent-amount { font-weight: 700; color: #064F3C; font-size: 0.9rem; }

  @media (min-width: 768px) {
    .dashboard { padding: 1.5rem 2rem; padding-top: 5rem; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
    .access-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
