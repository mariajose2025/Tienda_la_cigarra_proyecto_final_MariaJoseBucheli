<script>
  import Router, { push, replace } from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import { collection, getDocs } from 'firebase/firestore';
  import { db } from './services/firebase';
  import { initAuthListener } from './services/authService';
  import { getSettings } from './services/settingsService';
  import { app } from './stores/app';
  import { isAuthenticated, currentUser } from './stores/auth';
  import Navbar from './components/common/Navbar.svelte';
  import Footer from './components/common/Footer.svelte';

  import Home from './routes/Home.svelte';
  import Login from './routes/Login.svelte';
  import Register from './routes/Register.svelte';
  import Setup from './routes/Setup.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import Products from './routes/Products.svelte';
  import Categories from './routes/Categories.svelte';
  import Suppliers from './routes/Suppliers.svelte';
  import Purchases from './routes/Purchases.svelte';
  import Sales from './routes/Sales.svelte';
  import Clients from './routes/Clients.svelte';
  import Credits from './routes/Credits.svelte';
  import Users from './routes/Users.svelte';
  import Roles from './routes/Roles.svelte';
  import Settings from './routes/Settings.svelte';
  import Profile from './routes/Profile.svelte';
  import About from './routes/About.svelte';

  let appReady = false;
  let needsSetup = false;
  let currentPath = '';

  $: if (appReady && !$isAuthenticated) {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');
    currentPath = path;
    if (path.startsWith('/admin') || path === '/perfil') {
      push('/');
    }
  } else {
    const hash = window.location.hash || '#/';
    currentPath = hash.replace('#', '');
  }

  $: showFooter = currentPath !== '/' && currentPath !== '' && (currentPath === '/nosotros' || currentPath === '/login' || currentPath === '/registro' || currentPath === '/perfil' || currentPath.startsWith('/admin'));

  const publicOnlyRoutes = {
    '/': Home,
    '/login': Login,
    '/registro': Register,
    '/setup': Setup,
    '/nosotros': About
  };

  const authRoutes = {
    '/admin': Dashboard,
    '/admin/productos': Products,
    '/admin/categorias': Categories,
    '/admin/proveedores': Suppliers,
    '/admin/compras': Purchases,
    '/admin/ventas': Sales,
    '/admin/clientes': Clients,
    '/admin/fiados': Credits,
    '/admin/usuarios': Users,
    '/admin/roles': Roles,
    '/admin/configuracion': Settings,
    '/perfil': Profile,
    '/nosotros': About
  };

  function resolveRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '');

    if (needsSetup && path !== '/setup') {
      return { routes: { '/setup': Setup }, component: Setup };
    }

    if (path === '/' || path === '') {
      return { routes: publicOnlyRoutes, component: Home };
    }

    if (path.startsWith('/admin')) {
      if (!$isAuthenticated) {
        push('/login');
        return null;
      }
      return { routes: authRoutes, component: authRoutes[path] || Dashboard };
    }

    if (authRoutes[path] && !$isAuthenticated) {
      push('/login');
      return null;
    }

    return { routes: { ...publicOnlyRoutes, ...authRoutes }, component: null };
  }

  $: currentRoute = appReady ? resolveRoute() : null;

  onMount(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      needsSetup = usersSnapshot.empty;
    } catch (e) {
      console.error('Error checking setup:', e);
      needsSetup = false;
    }

    initAuthListener();

    try {
      const settings = await getSettings();
      app.setSettings(settings);
    } catch (e) {
      console.error('Error loading settings:', e);
    }

    setTimeout(() => { appReady = true; }, 500);
  });
</script>

<main>
  {#if $isAuthenticated}
    <Navbar />
  {/if}

  <div class="app-container" class:has-navbar={$isAuthenticated}>
    {#if appReady}
      {#if needsSetup}
        <Router routes={{'/setup': Setup}} />
      {:else if $isAuthenticated}
        <Router routes={authRoutes} />
      {:else}
        <Router routes={publicOnlyRoutes} />
      {/if}
    {:else}
      <div class="loading-screen">
        <div class="spinner"></div>
        <p>Cargando sistema...</p>
      </div>
    {/if}
  </div>

  {#if showFooter}
    <Footer />
  {/if}
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f3f4f6;
    color: #1f2937;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(a) {
    text-decoration: none;
    color: inherit;
  }

  :global(input, select, textarea, button) {
    font-family: inherit;
  }

  main {
    min-height: 100vh;
  }

  .app-container.has-navbar {
    padding-top: 3.5rem;
  }

  .loading-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #6b7280;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #B31A1A;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
