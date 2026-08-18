<script>
  import { link, push, location } from 'svelte-spa-router';
  import { currentUser, isAuthenticated } from '../../stores/auth';
  import { isAdmin, canView } from '../../utils/permissions';
  import { logout } from '../../services/authService';

  let menuOpen = false;

  let pinned = {};
  let hovered = null;
  let isMobile = false;

  $: if (typeof window !== 'undefined') isMobile = window.innerWidth < 768;

  const SECTIONS = {
    general: ['/admin', '/nosotros'],
    inventario: ['/admin/productos', '/admin/categorias', '/admin/proveedores'],
    operaciones: ['/admin/compras', '/admin/ventas', '/admin/clientes', '/admin/fiados'],
    cajaReportes: ['/admin/ganancias', '/admin/cuentas-cobrar', '/admin/gastos', '/admin/valor-inventario', '/admin/flujo-caja', '/admin/ventas-reporte', '/admin/movimientos', '/admin/caja'],
    admin: ['/admin/usuarios', '/admin/roles', '/admin/configuracion', '/admin/backup'],
    cuenta: ['/perfil']
  };

  // $location de svelte-spa-router es un string (ej: '/admin/ventas'), no un objeto.
  $: path = $location || '/';

  // IMPORTANTE: Svelte NO rastrea dependencias a través de llamadas a funciones en el markup
  // (class:open={shouldShow(...)} se calculaba UNA sola vez y nunca se actualizaba).
  // Por eso se computan estados derivados con referencias directas a pinned/hovered/path.
  $: openMap = {
    general: pinned.general || hovered === 'general',
    inventario: pinned.inventario || hovered === 'inventario',
    operaciones: pinned.operaciones || hovered === 'operaciones',
    cajaReportes: pinned.cajaReportes || hovered === 'cajaReportes',
    admin: pinned.admin || hovered === 'admin',
    cuenta: pinned.cuenta || hovered === 'cuenta'
  };

  $: activeMap = Object.fromEntries(
    Object.entries(SECTIONS).map(([section, paths]) => [
      section,
      paths.some(p => path === p || (p !== '/' && path.startsWith(p)))
    ])
  );

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function toggleSection(section) {
    pinned[section] = !pinned[section];
    pinned = { ...pinned };
  }

  function enterSection(section) {
    if (!isMobile) hovered = section;
  }

  function leaveSection(section) {
    if (hovered === section) hovered = null;
  }

  function closeMenus() {
    pinned = {};
    hovered = null;
    menuOpen = false;
  }

  async function handleLogout() {
    await logout();
    closeMenus();
    push('/');
  }
</script>

<svelte:window on:click={closeMenus} />

<nav class="navbar" on:click|stopPropagation>
  <div class="navbar-brand">
    <a href="/" use:link class="navbar-logo" on:click={closeMenus}>
      <img src="/logo.png" alt="Tienda La Cigarra" class="logo-img" />
    </a>
    <button class="menu-toggle" on:click={toggleMenu} aria-label="Menú">
      <span class="hamburger" class:open={menuOpen}></span>
    </button>
  </div>

  {#if $isAuthenticated && $currentUser}
    <div class="navbar-menu" class:active={menuOpen}>
      <div class="nav-section" role="group" on:mouseenter={() => enterSection('general')} on:mouseleave={() => leaveSection('general')}>
        <button class="nav-section-title" class:active={activeMap.general} on:click={() => toggleSection('general')} type="button">
          <span><i class="fa-solid fa-house"></i> General</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.general}></i>
        </button>
        <div class="nav-links-list" class:open={openMap.general}>
          <a href="/admin" use:link class="nav-link" class:current={path === '/admin'} on:click={closeMenus}>Inicio</a>
          <a href="/nosotros" use:link class="nav-link" class:current={path === '/nosotros'} on:click={closeMenus}>Nosotros</a>
        </div>
      </div>

      <div class="nav-section" role="group" on:mouseenter={() => enterSection('inventario')} on:mouseleave={() => leaveSection('inventario')}>
        <button class="nav-section-title" class:active={activeMap.inventario} on:click={() => toggleSection('inventario')} type="button">
          <span><i class="fa-solid fa-box-open"></i> Inventario</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.inventario}></i>
        </button>
        <div class="nav-links-list" class:open={openMap.inventario}>
          <a href="/admin/productos" use:link class="nav-link" class:current={path === '/admin/productos'} on:click={closeMenus}>Productos</a>
          <a href="/admin/categorias" use:link class="nav-link" class:current={path === '/admin/categorias'} on:click={closeMenus}>Clasificación</a>
          <a href="/admin/proveedores" use:link class="nav-link" class:current={path === '/admin/proveedores'} on:click={closeMenus}>Proveedores</a>
        </div>
      </div>

      <div class="nav-section" role="group" on:mouseenter={() => enterSection('operaciones')} on:mouseleave={() => leaveSection('operaciones')}>
        <button class="nav-section-title" class:active={activeMap.operaciones} on:click={() => toggleSection('operaciones')} type="button">
          <span><i class="fa-solid fa-cart-shopping"></i> Operaciones</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.operaciones}></i>
        </button>
        <div class="nav-links-list" class:open={openMap.operaciones}>
          <a href="/admin/compras" use:link class="nav-link" class:current={path === '/admin/compras'} on:click={closeMenus}>Compras</a>
          <a href="/admin/ventas" use:link class="nav-link" class:current={path === '/admin/ventas'} on:click={closeMenus}>Ventas</a>
          <a href="/admin/clientes" use:link class="nav-link" class:current={path === '/admin/clientes'} on:click={closeMenus}>Clientes</a>
          <a href="/admin/fiados" use:link class="nav-link" class:current={path === '/admin/fiados'} on:click={closeMenus}>Fiados</a>
        </div>
      </div>

      {#if canView($currentUser, 'cash')}
        <div class="nav-section" role="group" on:mouseenter={() => enterSection('cajaReportes')} on:mouseleave={() => leaveSection('cajaReportes')}>
          <button class="nav-section-title" class:active={activeMap.cajaReportes} on:click={() => toggleSection('cajaReportes')} type="button">
            <span><i class="fa-solid fa-chart-column"></i> Caja y Reportes</span>
            <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.cajaReportes}></i>
          </button>
          <div class="nav-links-list" class:open={openMap.cajaReportes}>
            <a href="/admin/ganancias" use:link class="nav-link" class:current={path === '/admin/ganancias'} on:click={closeMenus}>Reporte de Ganancias</a>
            <a href="/admin/cuentas-cobrar" use:link class="nav-link" class:current={path === '/admin/cuentas-cobrar'} on:click={closeMenus}>Cuentas por Cobrar</a>
            <a href="/admin/gastos" use:link class="nav-link" class:current={path === '/admin/gastos'} on:click={closeMenus}>Gastos</a>
            <a href="/admin/valor-inventario" use:link class="nav-link" class:current={path === '/admin/valor-inventario'} on:click={closeMenus}>Valor del Inventario</a>
            <a href="/admin/flujo-caja" use:link class="nav-link" class:current={path === '/admin/flujo-caja'} on:click={closeMenus}>Flujo de Caja</a>
            <a href="/admin/ventas-reporte" use:link class="nav-link" class:current={path === '/admin/ventas-reporte'} on:click={closeMenus}>Ventas por Período</a>
            <a href="/admin/movimientos" use:link class="nav-link" class:current={path === '/admin/movimientos'} on:click={closeMenus}>Movimientos de Caja</a>
            <a href="/admin/caja" use:link class="nav-link" class:current={path === '/admin/caja'} on:click={closeMenus}>Caja (Abrir/Cerrar)</a>
          </div>
        </div>
      {/if}

      {#if isAdmin($currentUser)}
        <div class="nav-section" role="group" on:mouseenter={() => enterSection('admin')} on:mouseleave={() => leaveSection('admin')}>
          <button class="nav-section-title" class:active={activeMap.admin} on:click={() => toggleSection('admin')} type="button">
            <span><i class="fa-solid fa-gear"></i> Administración</span>
            <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.admin}></i>
          </button>
          <div class="nav-links-list" class:open={openMap.admin}>
            <a href="/admin/usuarios" use:link class="nav-link" class:current={path === '/admin/usuarios'} on:click={closeMenus}>Usuarios</a>
            <a href="/admin/roles" use:link class="nav-link" class:current={path === '/admin/roles'} on:click={closeMenus}>Asignar Roles</a>
            <a href="/admin/configuracion" use:link class="nav-link" class:current={path === '/admin/configuracion'} on:click={closeMenus}>Configuración</a>
            <a href="/admin/backup" use:link class="nav-link" class:current={path === '/admin/backup'} on:click={closeMenus}>Copia de Seguridad</a>
          </div>
        </div>
      {/if}

      <div class="nav-section" role="group" on:mouseenter={() => enterSection('cuenta')} on:mouseleave={() => leaveSection('cuenta')}>
        <button class="nav-section-title" class:active={activeMap.cuenta} on:click={() => toggleSection('cuenta')} type="button">
          <span><i class="fa-solid fa-user"></i> Cuenta</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={openMap.cuenta}></i>
        </button>
        <div class="nav-links-list" class:open={openMap.cuenta}>
          <a href="/perfil" use:link class="nav-link" class:current={path === '/perfil'} on:click={closeMenus}>Mi Perfil</a>
          <button class="btn-logout" on:click={handleLogout}>
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="navbar-menu public-menu" class:active={menuOpen}>
      <div class="nav-links-public">
        <a href="/" use:link class="nav-link" on:click={closeMenus}>Inicio</a>
        <a href="/nosotros" use:link class="nav-link" on:click={closeMenus}>Nosotros</a>
        <a href="/login" use:link class="btn-login" on:click={closeMenus}>
          <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
        </a>
        <a href="/registro" use:link class="btn-register" on:click={closeMenus}>
          <i class="fa-solid fa-user-plus"></i> Crear Cuenta
        </a>
      </div>
    </div>
  {/if}
</nav>

<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #064F3C;
    color: white;
    padding: 0.75rem 1rem;
    z-index: 1000;
    box-shadow: 0 2px 12px rgba(4,59,47,0.35);
  }

  .navbar-brand {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-logo {
    display: flex;
    align-items: center;
  }

  .logo-img {
    height: 38px;
    width: auto;
    border-radius: 6px;
  }

  .menu-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
  }

  .hamburger {
    display: block;
    width: 22px;
    height: 2px;
    background: #F2C12E;
    position: relative;
    transition: all 0.3s;
  }

  .hamburger::before,
  .hamburger::after {
    content: '';
    position: absolute;
    width: 22px;
    height: 2px;
    background: #F2C12E;
    transition: all 0.3s;
  }

  .hamburger::before { top: -7px; }
  .hamburger::after { top: 7px; }

  .hamburger.open { background: transparent; }
  .hamburger.open::before { transform: rotate(45deg); top: 0; }
  .hamburger.open::after { transform: rotate(-45deg); top: 0; }

  .navbar-menu {
    display: none;
    flex-direction: column;
    padding-top: 1rem;
    gap: 0.25rem;
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  .navbar-menu.active {
    display: flex;
  }

  .nav-section {
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .nav-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .nav-section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    color: #F2C12E;
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    text-align: left;
    border-radius: 8px;
  }

  .nav-section-title.active {
    color: #F2C12E;
    background: rgba(242,193,46,0.12);
  }

  .nav-section-title i:first-child {
    width: 16px;
    margin-right: 0.4rem;
  }

  .caret {
    font-size: 0.8rem;
    transition: transform 0.25s ease;
  }

  .caret.rotated {
    transform: rotate(180deg);
  }

  .nav-links-list {
    display: none;
    flex-direction: column;
    gap: 0.15rem;
    padding-left: 1rem;
    margin-top: 0.25rem;
  }

  .nav-links-list.open {
    display: flex;
  }

  .nav-link {
    color: rgba(255,255,255,0.9);
    text-decoration: none;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    font-size: 0.95rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .nav-link:hover {
    background: rgba(242,193,46,0.15);
    color: white;
  }

  .nav-link.current {
    background: rgba(242,193,46,0.2);
    color: #F2C12E;
    font-weight: 600;
  }

  .btn-logout {
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: calc(100% - 0.5rem);
    margin: 0.5rem 0.25rem 0.25rem;
    justify-content: center;
  }

  .btn-logout:hover {
    background: rgba(255,255,255,0.2);
  }

  /* Menú público */
  .nav-links-public {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  .nav-links-public .nav-link {
    color: rgba(255,255,255,0.9);
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 1rem;
  }

  .btn-login {
    background: transparent;
    color: white;
    border: 2px solid rgba(242,193,46,0.5);
    padding: 0.85rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 1rem;
    text-align: center;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .btn-login:hover {
    border-color: #F2C12E;
    background: rgba(242,193,46,0.1);
  }

  .btn-register {
    background: #F2C12E;
    color: #0A241D;
    padding: 0.85rem 1.5rem;
    border-radius: 10px;
    font-weight: 700;
    font-size: 1rem;
    text-align: center;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  .btn-register:hover {
    transform: translateY(-2px);
  }

  /* Vista de Escritorio */
  @media (min-width: 768px) {
    .menu-toggle { display: none; }

    .navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 2rem;
    }

    .navbar-menu {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding-top: 0;
      gap: 0.25rem;
      overflow: visible;
      max-height: none;
    }

    .nav-section {
      position: relative;
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .nav-section-title {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.9);
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      text-transform: none;
      letter-spacing: normal;
      display: flex;
      gap: 0.35rem;
      align-items: center;
      white-space: nowrap;
    }

    .nav-section-title:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-section-title.active {
      background: rgba(242,193,46,0.18);
      color: #F2C12E;
    }

    .nav-section-title i:first-child {
      display: inline-block;
      margin-right: 0.15rem;
    }

    .caret {
      margin-left: 0.25rem;
      opacity: 0.7;
    }

    .nav-links-list {
      display: none;
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      box-shadow: 0 8px 24px rgba(4,59,47,0.18);
      border-radius: 10px;
      min-width: 190px;
      padding: 0.5rem;
      z-index: 1005;
      gap: 0.1rem;
      margin-top: 0.5rem;
      border: 1px solid rgba(0,0,0,0.06);
      animation: dropIn 0.16s ease;
    }

    @keyframes dropIn {
      from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .nav-links-list::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      border-width: 0 6px 6px 6px;
      border-style: solid;
      border-color: transparent transparent white transparent;
    }

    .nav-links-list.open {
      display: flex;
    }

    .nav-link {
      color: #374151;
      font-size: 0.85rem;
      padding: 0.55rem 0.8rem;
      border-radius: 6px;
      gap: 0.5rem;
    }

    .nav-link:hover {
      background: #f3f4f6;
      color: #064F3C;
    }

    .nav-link.current {
      background: rgba(6,79,60,0.08);
      color: #064F3C;
      font-weight: 700;
    }

    .btn-logout {
      margin: 0;
      color: #C2410C;
      border: 1px solid #FFEDD5;
      background: #FFF7ED;
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
      width: 100%;
    }

    .btn-logout:hover {
      background: #FFEDD5;
      color: #C2410C;
    }

    /* Menú público escritorio */
    .public-menu {
      display: flex !important;
      flex-direction: row;
      align-items: center;
      padding-top: 0;
    }

    .nav-links-public {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
      padding: 0;
    }

    .nav-links-public .nav-link {
      padding: 0.5rem 0.85rem;
      font-size: 0.9rem;
      border-radius: 6px;
      color: rgba(255,255,255,0.9);
    }

    .nav-links-public .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .btn-login {
      padding: 0.5rem 1.25rem;
      font-size: 0.9rem;
      border-radius: 8px;
    }

    .btn-register {
      padding: 0.5rem 1.25rem;
      font-size: 0.9rem;
      border-radius: 8px;
    }
  }
</style>
