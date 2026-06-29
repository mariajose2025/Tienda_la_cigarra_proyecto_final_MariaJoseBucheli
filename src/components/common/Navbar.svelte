<script>
  import { link, push } from 'svelte-spa-router';
  import { currentUser } from '../../stores/auth';
  import { isAdmin } from '../../utils/permissions';
  import { logout } from '../../services/authService';

  let menuOpen = false;

  // Estado para controlar qué secciones están expandidas en el acordeón móvil
  let activeSections = {
    general: true,
    inventario: false,
    operaciones: false,
    admin: false,
    cuenta: false
  };

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function toggleSection(section) {
    activeSections[section] = !activeSections[section];
    activeSections = { ...activeSections }; // Forzar reactividad en Svelte
  }

  function closeMenu() {
    menuOpen = false;
  }

  async function handleLogout() {
    await logout();
    menuOpen = false;
    push('/');
  }
</script>

<nav class="navbar">
  <div class="navbar-brand">
    <a href="/" use:link class="navbar-logo" on:click={closeMenu}>
      <img src="/logo.png" alt="Tienda La Cigarra" class="logo-img" />
    </a>
    <button class="menu-toggle" on:click={toggleMenu} aria-label="Menú">
      <span class="hamburger" class:open={menuOpen}></span>
    </button>
  </div>

  {#if $currentUser}
    <div class="navbar-menu" class:active={menuOpen}>
      
      <!-- GENERAL -->
      <div class="nav-section">
        <button class="nav-section-title" on:click={() => toggleSection('general')} type="button">
          <span><i class="fa-solid fa-house"></i> General</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={activeSections.general}></i>
        </button>
        <div class="nav-links-list" class:expanded={activeSections.general}>
          <a href="/admin" use:link class="nav-link" on:click={closeMenu}>Inicio</a>
          <a href="/nosotros" use:link class="nav-link" on:click={closeMenu}>Nosotros</a>
        </div>
      </div>

      <!-- INVENTARIO -->
      <div class="nav-section">
        <button class="nav-section-title" on:click={() => toggleSection('inventario')} type="button">
          <span><i class="fa-solid fa-box-open"></i> Inventario</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={activeSections.inventario}></i>
        </button>
        <div class="nav-links-list" class:expanded={activeSections.inventario}>
          <a href="/admin/productos" use:link class="nav-link" on:click={closeMenu}>Productos</a>
          <a href="/admin/categorias" use:link class="nav-link" on:click={closeMenu}>Clasificación</a>
          <a href="/admin/proveedores" use:link class="nav-link" on:click={closeMenu}>Proveedores</a>
        </div>
      </div>

      <!-- OPERACIONES -->
      <div class="nav-section">
        <button class="nav-section-title" on:click={() => toggleSection('operaciones')} type="button">
          <span><i class="fa-solid fa-cart-shopping"></i> Operaciones</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={activeSections.operaciones}></i>
        </button>
        <div class="nav-links-list" class:expanded={activeSections.operaciones}>
          <a href="/admin/compras" use:link class="nav-link" on:click={closeMenu}>Compras</a>
          <a href="/admin/ventas" use:link class="nav-link" on:click={closeMenu}>Ventas</a>
          <a href="/admin/clientes" use:link class="nav-link" on:click={closeMenu}>Clientes</a>
          <a href="/admin/fiados" use:link class="nav-link" on:click={closeMenu}>Fiados</a>
        </div>
      </div>

      <!-- ADMINISTRACIÓN -->
      {#if isAdmin($currentUser)}
        <div class="nav-section">
          <button class="nav-section-title" on:click={() => toggleSection('admin')} type="button">
            <span><i class="fa-solid fa-gear"></i> Administración</span>
            <i class="fa-solid fa-chevron-down caret" class:rotated={activeSections.admin}></i>
          </button>
          <div class="nav-links-list" class:expanded={activeSections.admin}>
            <a href="/admin/usuarios" use:link class="nav-link" on:click={closeMenu}>Usuarios</a>
            <a href="/admin/roles" use:link class="nav-link" on:click={closeMenu}>Roles</a>
            <a href="/admin/configuracion" use:link class="nav-link" on:click={closeMenu}>Configuración</a>
          </div>
        </div>
      {/if}

      <!-- CUENTA -->
      <div class="nav-section">
        <button class="nav-section-title" on:click={() => toggleSection('cuenta')} type="button">
          <span><i class="fa-solid fa-user"></i> Cuenta</span>
          <i class="fa-solid fa-chevron-down caret" class:rotated={activeSections.cuenta}></i>
        </button>
        <div class="nav-links-list" class:expanded={activeSections.cuenta}>
          <a href="/perfil" use:link class="nav-link" on:click={closeMenu}>Mi Perfil</a>
          <button class="btn-logout" on:click={handleLogout}>
            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
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
    background: #B31A1A;
    color: white;
    padding: 0.75rem 1rem;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
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

  .nav-links-list.expanded {
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
      gap: 0.5rem;
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
      padding: 0.6rem 0.85rem;
      border-radius: 6px;
      text-transform: none;
      letter-spacing: normal;
      display: flex;
      gap: 0.35rem;
      align-items: center;
    }

    .nav-section-title:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-section-title i:first-child {
      display: inline-block;
      margin-right: 0.15rem;
    }

    .caret {
      margin-left: 0.25rem;
      opacity: 0.7;
    }

    /* Mostrar menú desplegable al hacer hover */
    .nav-section:hover .nav-links-list {
      display: flex !important;
    }

    .nav-links-list {
      display: none !important;
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      border-radius: 8px;
      min-width: 170px;
      padding: 0.5rem;
      z-index: 1005;
      gap: 0.1rem;
      margin-top: 0.25rem;
      border: 1px solid rgba(0,0,0,0.08);
    }

    /* Pequeño triángulo sobre el menú desplegable */
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

    .nav-link {
      color: #374151;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      gap: 0.5rem;
    }

    .nav-link:hover {
      background: #f3f4f6;
      color: #B31A1A;
    }

    .btn-logout {
      margin: 0;
      color: #b91c1c;
      border: 1px solid #fee2e2;
      background: #fef2f2;
      padding: 0.45rem 0.75rem;
      font-size: 0.85rem;
      width: 100%;
    }

    .btn-logout:hover {
      background: #fee2e2;
      color: #b91c1c;
    }
  }
</style>
