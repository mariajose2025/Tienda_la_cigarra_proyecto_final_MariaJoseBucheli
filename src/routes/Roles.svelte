<script>
  import { onMount } from 'svelte';
  import { getAll, create, update, remove } from '../services/firestoreService';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let roles = [];
  let showModal = false;
  let editingRole = null;
  let roleName = '';
  let permissions = {
    users: false,
    roles: false,
    products: false,
    categories: false,
    suppliers: false,
    purchases: false,
    sales: false,
    settings: false
  };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  onMount(loadRoles);

  async function loadRoles() {
    try {
      roles = await getAll('roles');
    } catch (e) {
      toast = { show: true, message: 'Error al cargar roles', type: 'error' };
    }
  }

  function openModal(role = null) {
    editingRole = role;
    if (role) {
      roleName = role.name;
      permissions = { ...role.permissions };
    } else {
      roleName = '';
      permissions = {
        users: false, roles: false, products: false, categories: false,
        suppliers: false, purchases: false, sales: false, settings: false
      };
    }
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingRole = null;
    roleName = '';
  }

  async function saveRole() {
    if (!roleName.trim()) {
      toast = { show: true, message: 'Ingresa el nombre del rol', type: 'warning' };
      return;
    }

    loading = true;
    try {
      if (editingRole) {
        await update('roles', editingRole.id, { name: roleName, permissions });
        toast = { show: true, message: 'Rol actualizado', type: 'success' };
      } else {
        await create('roles', { name: roleName, permissions });
        toast = { show: true, message: 'Rol creado', type: 'success' };
      }
      closeModal();
      await loadRoles();
    } catch (e) {
      toast = { show: true, message: 'Error al guardar rol', type: 'error' };
    }
    loading = false;
  }

  async function deleteRole(id) {
    if (!confirm('¿Eliminar este rol?')) return;
    loading = true;
    try {
      await remove('roles', id);
      toast = { show: true, message: 'Rol eliminado', type: 'success' };
      await loadRoles();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar rol', type: 'error' };
    }
    loading = false;
  }

  const permissionLabels = {
    users: 'Usuarios',
    roles: 'Roles',
    products: 'Productos',
    categories: 'Categorías',
    suppliers: 'Proveedores',
    purchases: 'Compras',
    sales: 'Ventas',
    settings: 'Configuración'
  };
</script>

<div class="page">
  <div class="page-header">
    <h1>Gestión de Roles</h1>
    <Button on:click={() => openModal()}>+ Nuevo Rol</Button>
  </div>

  <div class="roles-list">
    {#each roles as role}
      <div class="role-card">
        <div class="role-info">
          <h3>{role.name}</h3>
          <div class="permissions-tags">
            {#each Object.entries(role.permissions || {}) as [key, value]}
              {#if value}
                <span class="perm-tag">{permissionLabels[key]}</span>
              {/if}
            {/each}
          </div>
        </div>
        <div class="role-actions">
          <button class="btn-icon edit" on:click={() => openModal(role)}>✏️</button>
          <button class="btn-icon delete" on:click={() => deleteRole(role.id)}>🗑️</button>
        </div>
      </div>
    {:else}
      <p class="empty">No hay roles registrados</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title={editingRole ? 'Editar Rol' : 'Nuevo Rol'} on:close={closeModal}>
  <div class="form-group">
    <label for="roleName">Nombre del Rol</label>
    <input id="roleName" type="text" bind:value={roleName} placeholder="Ej: Administrador" />
  </div>

  <div class="perm-section">
    <p class="perm-title">Permisos por Módulo</p>
    <div class="perm-grid">
      {#each Object.entries(permissions) as [key, value]}
        <label class="perm-toggle">
          <input type="checkbox" bind:checked={permissions[key]} />
          <span class="perm-name">{permissionLabels[key]}</span>
        </label>
      {/each}
    </div>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveRole} {loading}>{editingRole ? 'Actualizar' : 'Crear'}</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #1f2937; margin: 0; }

  .roles-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .role-card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; justify-content: space-between; align-items: center;
  }

  .role-info h3 { margin: 0; font-size: 1rem; color: #1f2937; }

  .permissions-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.5rem; }
  .perm-tag {
    background: #dbeafe; color: #1e40af; padding: 0.15rem 0.5rem;
    border-radius: 12px; font-size: 0.7rem; font-weight: 600;
  }

  .role-actions { display: flex; gap: 0.5rem; }
  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 1.2rem;
    padding: 0.4rem; border-radius: 6px; transition: background 0.2s;
  }
  .btn-icon.edit:hover { background: #dbeafe; }
  .btn-icon.delete:hover { background: #fef2f2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.3rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
  input[type="text"] {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
  }
  input[type="text"]:focus { outline: none; border-color: #1e40af; }

  .perm-section { margin-top: 0.5rem; }
  .perm-title { margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
  .perm-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
  .perm-toggle {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;
    border-radius: 6px; cursor: pointer; transition: background 0.2s;
  }
  .perm-toggle:hover { background: #f3f4f6; }
  .perm-toggle input { width: 18px; height: 18px; accent-color: #1e40af; }
  .perm-name { font-size: 0.85rem; color: #374151; }
</style>
