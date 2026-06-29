<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { getAll, create, update, remove } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let users = [];
  let roles = [];
  let showModal = false;
  let editingUser = null;
  let formData = { name: '', email: '', phone: '', roleId: '' };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  onMount(async () => {
    await Promise.all([loadUsers(), loadRoles()]);
  });

  async function loadUsers() {
    try {
      users = await getAll('users');
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

  function openModal(user = null) {
    editingUser = user;
    if (user) {
      formData = { name: user.name, email: user.email, phone: user.phone || '', roleId: user.roleId || '' };
    } else {
      push('/registro');
      return;
    }
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingUser = null;
    formData = { name: '', email: '', phone: '', roleId: '' };
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
      toast = { show: true, message: 'Usuario actualizado', type: 'success' };
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
      toast = { show: true, message: 'Error al eliminar usuario', type: 'error' };
    }
    loading = false;
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Gestión de Usuarios</h1>
    {#if isAdmin($currentUser)}
      <Button on:click={() => push('/registro')}>+ Nuevo Usuario</Button>
    {/if}
  </div>

  <div class="users-list">
    {#each users as user}
      <div class="user-card">
        <div class="user-avatar">{user.name?.charAt(0) || '?'}</div>
        <div class="user-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span class="role-tag">{user.roleName || 'Sin rol'}</span>
        </div>
        {#if isAdmin($currentUser)}
          <div class="user-actions">
            <button class="btn-icon edit" on:click={() => openModal(user)}>✏️</button>
            <button class="btn-icon delete" on:click={() => deleteUser(user.id)}>🗑️</button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No hay usuarios registrados</p>
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
    <label for="phone">Teléfono</label>
    <input id="phone" type="tel" bind:value={formData.phone} />
  </div>
  <div class="form-group">
    <label for="role">Rol</label>
    <select id="role" bind:value={formData.roleId}>
      <option value="">Seleccionar...</option>
      {#each roles as role}
        <option value={role.id}>{role.name}</option>
      {/each}
    </select>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveUser} {loading}>Guardar</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #1f2937; margin: 0; }

  .users-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .user-card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; align-items: center; gap: 0.75rem;
  }

  .user-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: #1e40af; color: white; display: flex;
    align-items: center; justify-content: center;
    font-size: 1.2rem; font-weight: 700; flex-shrink: 0;
  }

  .user-info { flex: 1; min-width: 0; }
  .user-info h3 { margin: 0; font-size: 0.95rem; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-info p { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .role-tag {
    display: inline-block; margin-top: 0.3rem; padding: 0.15rem 0.5rem;
    background: #dbeafe; color: #1e40af; border-radius: 10px;
    font-size: 0.7rem; font-weight: 600;
  }

  .user-actions { display: flex; gap: 0.35rem; }
  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 1.1rem;
    padding: 0.35rem; border-radius: 6px;
  }
  .btn-icon.edit:hover { background: #dbeafe; }
  .btn-icon.delete:hover { background: #fef2f2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #374151; }
  input, select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  input:focus, select:focus { outline: none; border-color: #1e40af; }
  input:disabled { background: #f3f4f6; }
</style>
