<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { getAll, getAllUnfiltered, create, update, remove, getByField } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let users = [];
  let roles = [];
  let showModal = false;
  let editingUser = null;
  let formData = { name: '', email: '', cedula: '', phone: '', roleId: '' };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let searchQuery = '';

  $: filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.cedula?.includes(searchQuery)
  );

  onMount(async () => {
    await Promise.all([loadUsers(), loadRoles()]);
  });

  async function loadUsers() {
    try {
      users = await getAllUnfiltered('users');
    } catch (e) {
      toast = { show: true, message: 'Error al cargar usuarios', type: 'error' };
    }
  }

  async function loadRoles() {
    try {
      roles = await getAll('roles');
    } catch (e) {
      console.error('Error loading roles:', e);
    }
  }

  function openModal(user) {
    editingUser = user;
    formData = {
      name: user.name || '',
      email: user.email || '',
      cedula: user.cedula || '',
      phone: user.phone || '',
      roleId: user.roleId || ''
    };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingUser = null;
    formData = { name: '', email: '', cedula: '', phone: '', roleId: '' };
  }

  async function saveUser() {
    if (!formData.name.trim()) {
      toast = { show: true, message: 'El nombre es obligatorio', type: 'warning' };
      return;
    }

    loading = true;
    try {
      const selectedRole = roles.find(r => r.id === formData.roleId);
      await update('users', editingUser.id, {
        name: formData.name,
        phone: formData.phone,
        roleId: formData.roleId,
        roleName: selectedRole ? selectedRole.name : ''
      });
      toast = { show: true, message: 'Usuario actualizado correctamente', type: 'success' };
      closeModal();
      await loadUsers();
    } catch (e) {
      toast = { show: true, message: 'Error al actualizar usuario', type: 'error' };
    }
    loading = false;
  }

  async function deleteUser(id) {
    if (!confirm('¿Eliminar este usuario?')) return;
    loading = true;
    try {
      await remove('users', id);
      toast = { show: true, message: 'Usuario eliminado', type: 'success' };
      await loadUsers();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }

  function getRoleName(roleId) {
    const role = roles.find(r => r.id === roleId);
    return role?.name || 'Sin rol';
  }

  function getRoleColor(roleName) {
    if (roleName === 'Administrador') return 'admin';
    if (roleName === 'Vendedor') return 'seller';
    if (roleName === 'Inspector') return 'inspector';
    return 'none';
  }
</script>

<div class="page">
  <div class="page-header">
    <h1><i class="fa-solid fa-users-gear"></i> Gestión de Usuarios</h1>
    <span class="user-count">{users.length} registrados</span>
  </div>

  <div class="search-bar">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="text" bind:value={searchQuery} placeholder="Buscar por nombre, correo o cédula..." />
  </div>

  <div class="users-list">
    {#each filteredUsers as user}
      <div class="user-card">
        <div class="user-avatar" class:admin-avatar={user.email === 'admin@cinar.com'}>
          {user.name?.charAt(0) || '?'}
        </div>
        <div class="user-info">
          <h3>{user.name || 'Sin nombre'}</h3>
          <p class="user-email"><i class="fa-solid fa-envelope"></i> {user.email}</p>
          {#if user.cedula}
            <p class="user-cedula"><i class="fa-solid fa-id-card"></i> CC: {user.cedula}</p>
          {/if}
          {#if user.phone}
            <p class="user-phone"><i class="fa-solid fa-phone"></i> {user.phone}</p>
          {/if}
          <span class="role-tag {getRoleColor(user.roleName)}">
            <i class="fa-solid {user.roleName === 'Administrador' ? 'fa-crown' : user.roleName === 'Inspector' ? 'fa-eye' : 'fa-user-tag'}"></i>
            {user.roleName || 'Sin rol asignado'}
          </span>
        </div>
        {#if isAdmin($currentUser) && user.email !== 'admin@cinar.com'}
          <div class="user-actions">
            <button class="btn-icon edit" on:click={() => openModal(user)} title="Asignar rol">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn-icon delete" on:click={() => deleteUser(user.id)} title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">
        <i class="fa-solid fa-users-slash"></i>
        {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
      </p>
    {/each}
  </div>
</div>

<Modal show={showModal} title="Editar Usuario" on:close={closeModal}>
  <div class="form-group">
    <label for="name">Nombre</label>
    <input id="name" type="text" bind:value={formData.name} />
  </div>
  <div class="form-group">
    <label for="email">Correo (solo lectura)</label>
    <input id="email" type="email" value={formData.email} disabled />
  </div>
  <div class="form-group">
    <label for="cedula">Cédula (solo lectura)</label>
    <input id="cedula" type="text" value={formData.cedula} disabled />
  </div>
  <div class="form-group">
    <label for="phone">Teléfono</label>
    <input id="phone" type="tel" bind:value={formData.phone} placeholder="300 123 4567" />
  </div>
  <div class="form-group">
    <label for="role">Asignar Rol</label>
    <select id="role" bind:value={formData.roleId}>
      <option value="">Seleccionar rol...</option>
      {#each roles as role}
        <option value={role.id}>{role.name}</option>
      {/each}
    </select>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveUser} {loading}>Guardar Cambios</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #110F0F; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #B31A1A; }
  .user-count { font-size: 0.8rem; color: #6b7280; background: #f3f4f6; padding: 0.3rem 0.75rem; border-radius: 12px; }

  .search-bar {
    display: flex; align-items: center; gap: 0.5rem;
    background: white; border-radius: 10px; padding: 0.6rem 1rem;
    margin-bottom: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .search-bar i { color: #9ca3af; }
  .search-bar input { border: none; outline: none; flex: 1; font-size: 0.9rem; background: transparent; }

  .users-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .user-card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; align-items: center; gap: 0.75rem;
  }

  .user-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: #B31A1A; color: white; display: flex;
    align-items: center; justify-content: center;
    font-size: 1.2rem; font-weight: 700; flex-shrink: 0;
  }
  .user-avatar.admin-avatar { background: #F2C12E; color: #110F0F; }

  .user-info { flex: 1; min-width: 0; }
  .user-info h3 { margin: 0; font-size: 0.95rem; color: #110F0F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-info p { margin: 0.1rem 0 0; font-size: 0.78rem; color: #6b7280; display: flex; align-items: center; gap: 0.35rem; }
  .user-info p i { color: #C49A45; width: 13px; text-align: center; }

  .role-tag {
    display: inline-flex; align-items: center; gap: 0.3rem;
    margin-top: 0.35rem; padding: 0.2rem 0.6rem;
    border-radius: 10px; font-size: 0.7rem; font-weight: 600;
  }
  .role-tag.admin { background: #FEF3C7; color: #92400e; }
  .role-tag.seller { background: #DCFCE7; color: #166534; }
  .role-tag.inspector { background: #E0E7FF; color: #3730A3; }
  .role-tag.none { background: #F3F4F6; color: #6b7280; }

  .user-actions { display: flex; gap: 0.35rem; }
  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 1rem;
    padding: 0.45rem; border-radius: 6px;
  }
  .btn-icon.edit { color: #C49A45; }
  .btn-icon.edit:hover { background: #FEF3C7; }
  .btn-icon.delete { color: #B31A1A; }
  .btn-icon.delete:hover { background: #FEE2E2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }
  .empty i { font-size: 2rem; margin-bottom: 0.5rem; display: block; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #110F0F; }
  input, select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  input:focus, select:focus { outline: none; border-color: #B31A1A; }
  input:disabled { background: #f3f4f6; color: #6b7280; }
</style>
