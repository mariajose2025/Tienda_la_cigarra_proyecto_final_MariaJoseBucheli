<script>
  import { onMount } from 'svelte';
  import { getAllUnfiltered, update } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let users = [];
  let selectedUserId = '';
  let selectedRole = '';
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  const ROLES = [
    { value: 'Vendedor', label: 'Vendedor', desc: 'Puede crear, editar y eliminar productos, categorías, proveedores, ventas, compras, clientes y fiados', icon: 'fa-user-tag', color: '#16a34a' },
    { value: 'Inspector', label: 'Inspector', desc: 'Solo puede ver la información sin poder modificar nada (solo lectura)', icon: 'fa-eye', color: '#6366f1' }
  ];

  $: usersWithRole = users.filter(u => u.roleName && u.roleName !== 'Administrador');
  $: usersWithoutRole = users.filter(u => !u.roleName || u.roleName === 'Vendedor' || u.roleName === 'Inspector');
  $: selectedUser = users.find(u => u.id === selectedUserId);

  onMount(async () => {
    try {
      users = await getAllUnfiltered('users');
    } catch (e) {
      toast = { show: true, message: 'Error al cargar usuarios', type: 'error' };
    }
  });

  async function assignRole() {
    if (!selectedUserId) {
      toast = { show: true, message: 'Selecciona un usuario', type: 'warning' };
      return;
    }
    if (!selectedRole) {
      toast = { show: true, message: 'Selecciona un rol', type: 'warning' };
      return;
    }

    const user = users.find(u => u.id === selectedUserId);
    if (user?.email === 'admin@cinar.com') {
      toast = { show: true, message: 'No se puede cambiar el rol del administrador', type: 'warning' };
      return;
    }

    loading = true;
    try {
      await update('users', selectedUserId, {
        roleName: selectedRole,
        roleId: selectedRole
      });
      toast = { show: true, message: `${user?.name || user?.email} ahora es ${selectedRole}`, type: 'success' };
      selectedUserId = '';
      selectedRole = '';
      users = await getAllUnfiltered('users');
    } catch (e) {
      toast = { show: true, message: 'Error al asignar rol', type: 'error' };
    }
    loading = false;
  }

  async function removeRole(userId) {
    const user = users.find(u => u.id === userId);
    if (!confirm(`¿Quitar el rol de ${user?.name || user?.email}?`)) return;

    loading = true;
    try {
      await update('users', userId, {
        roleName: '',
        roleId: ''
      });
      toast = { show: true, message: `Rol quitado de ${user?.name || user?.email}`, type: 'success' };
      users = await getAllUnfiltered('users');
    } catch (e) {
      toast = { show: true, message: 'Error al quitar rol', type: 'error' };
    }
    loading = false;
  }

  function getRoleInfo(roleName) {
    return ROLES.find(r => r.value === roleName) || null;
  }
</script>

<div class="page">
  <div class="page-header">
    <h1><i class="fa-solid fa-user-shield"></i> Asignación de Roles</h1>
  </div>

  <p class="subtitle">Selecciona un usuario registrado y asígnale un rol. Solo existen dos roles: <strong>Vendedor</strong> (acceso completo) e <strong>Inspector</strong> (solo lectura).</p>

  <div class="assign-card">
    <h2><i class="fa-solid fa-hand-pointer"></i> Asignar Rol</h2>

    <div class="form-group">
      <label for="user-select">Seleccionar Usuario</label>
      <select id="user-select" bind:value={selectedUserId}>
        <option value="">-- Seleccionar usuario --</option>
        {#each users as user}
          {#if user.email !== 'admin@cinar.com'}
            <option value={user.id}>
              {user.name || user.email} {user.cedula ? `(CC: ${user.cedula})` : ''} — {user.email}
            </option>
          {/if}
        {/each}
      </select>
    </div>

    {#if selectedUser}
      <div class="user-preview">
        <div class="preview-avatar">{selectedUser.name?.charAt(0) || '?'}</div>
        <div class="preview-info">
          <span class="preview-name">{selectedUser.name || 'Sin nombre'}</span>
          <span class="preview-email">{selectedUser.email}</span>
          {#if selectedUser.cedula}
            <span class="preview-cedula">CC: {selectedUser.cedula}</span>
          {/if}
          <span class="preview-current">
            Rol actual: <strong>{selectedUser.roleName || 'Sin rol'}</strong>
          </span>
        </div>
      </div>
    {/if}

    <div class="role-options">
      {#each ROLES as role}
        <button
          class="role-option"
          class:selected={selectedRole === role.value}
          on:click={() => selectedRole = role.value}
          disabled={!selectedUserId}
        >
          <div class="role-icon" style="color: {role.color}">
            <i class="fa-solid {role.icon}"></i>
          </div>
          <div class="role-details">
            <span class="role-label">{role.label}</span>
            <span class="role-desc">{role.desc}</span>
          </div>
          <div class="role-check">
            {#if selectedRole === role.value}
              <i class="fa-solid fa-circle-check"></i>
            {:else}
              <i class="fa-regular fa-circle"></i>
            {/if}
          </div>
        </button>
      {/each}
    </div>

    <Button fullWidth={true} on:click={assignRole} {loading} disabled={!selectedUserId || !selectedRole}>
      <i class="fa-solid fa-check"></i> Asignar Rol
    </Button>
  </div>

  {#if usersWithRole.length > 0}
    <div class="assigned-section">
      <h2><i class="fa-solid fa-list-check"></i> Usuarios con Rol Asignado</h2>
      <div class="assigned-list">
        {#each usersWithRole as user}
          {@const roleInfo = getRoleInfo(user.roleName)}
          <div class="assigned-card">
            <div class="assigned-avatar" style="background: {roleInfo?.color || '#6b7280'}">
              {user.name?.charAt(0) || '?'}
            </div>
            <div class="assigned-info">
              <span class="assigned-name">{user.name || user.email}</span>
              <span class="assigned-email">{user.email}</span>
              {#if user.cedula}
                <span class="assigned-cedula">CC: {user.cedula}</span>
              {/if}
            </div>
            <div class="assigned-role" style="color: {roleInfo?.color || '#6b7280'}">
              <i class="fa-solid {roleInfo?.icon || 'fa-user'}"></i>
              {user.roleName}
            </div>
            {#if isAdmin($currentUser) && user.email !== 'admin@cinar.com'}
              <button class="btn-remove-role" on:click={() => removeRole(user.id)} title="Quitar rol">
                <i class="fa-solid fa-xmark"></i>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; max-width: 700px; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #110F0F; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #B31A1A; }
  .subtitle { font-size: 0.82rem; color: #6b7280; margin-bottom: 1.25rem; line-height: 1.5; }

  .assign-card {
    background: white; border-radius: 14px; padding: 1.25rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 1.5rem;
  }
  .assign-card h2 {
    font-size: 1rem; color: #110F0F; margin: 0 0 1rem;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .assign-card h2 i { color: #C49A45; }

  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.3rem; font-size: 0.85rem; font-weight: 600; color: #110F0F; }
  select {
    width: 100%; padding: 0.75rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.9rem; box-sizing: border-box; background: white;
    cursor: pointer;
  }
  select:focus { outline: none; border-color: #B31A1A; }

  .user-preview {
    display: flex; align-items: center; gap: 0.75rem;
    background: #f9fafb; border-radius: 10px; padding: 0.75rem;
    margin-bottom: 1rem; border: 1px solid #e5e7eb;
  }
  .preview-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: #B31A1A; color: white; display: flex;
    align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 700; flex-shrink: 0;
  }
  .preview-info { display: flex; flex-direction: column; gap: 0.1rem; }
  .preview-name { font-weight: 600; font-size: 0.9rem; color: #110F0F; }
  .preview-email { font-size: 0.78rem; color: #6b7280; }
  .preview-cedula { font-size: 0.78rem; color: #C49A45; font-weight: 600; }
  .preview-current { font-size: 0.78rem; color: #6b7280; margin-top: 0.2rem; }
  .preview-current strong { color: #110F0F; }

  .role-options { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
  .role-option {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.85rem 1rem; border: 2px solid #e5e7eb;
    border-radius: 10px; background: white; cursor: pointer;
    transition: all 0.2s; text-align: left;
  }
  .role-option:hover:not(:disabled) { border-color: #d1d5db; background: #f9fafb; }
  .role-option.selected { border-color: #B31A1A; background: #fef2f2; }
  .role-option:disabled { opacity: 0.5; cursor: not-allowed; }

  .role-icon { font-size: 1.3rem; width: 36px; text-align: center; flex-shrink: 0; }
  .role-details { flex: 1; }
  .role-label { display: block; font-weight: 700; font-size: 0.9rem; color: #110F0F; }
  .role-desc { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.15rem; }
  .role-check { font-size: 1.2rem; color: #B31A1A; flex-shrink: 0; }
  .role-check i { color: #d1d5db; }
  .role-option.selected .role-check i { color: #B31A1A; }

  .assigned-section { margin-top: 1rem; }
  .assigned-section h2 {
    font-size: 1rem; color: #110F0F; margin: 0 0 0.75rem;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .assigned-section h2 i { color: #C49A45; }

  .assigned-list { display: flex; flex-direction: column; gap: 0.5rem; }

  .assigned-card {
    background: white; border-radius: 10px; padding: 0.75rem 1rem;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex; align-items: center; gap: 0.6rem;
  }
  .assigned-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    color: white; display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 700; flex-shrink: 0;
  }
  .assigned-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.05rem; }
  .assigned-name { font-weight: 600; font-size: 0.85rem; color: #110F0F; }
  .assigned-email { font-size: 0.75rem; color: #6b7280; }
  .assigned-cedula { font-size: 0.75rem; color: #C49A45; font-weight: 600; }
  .assigned-role {
    display: flex; align-items: center; gap: 0.3rem;
    font-size: 0.78rem; font-weight: 700;
    padding: 0.2rem 0.6rem; border-radius: 8px;
    background: #f3f4f6; flex-shrink: 0;
  }

  .btn-remove-role {
    background: none; border: none; cursor: pointer;
    color: #9ca3af; font-size: 1rem; padding: 0.3rem;
    border-radius: 6px; flex-shrink: 0;
  }
  .btn-remove-role:hover { background: #FEE2E2; color: #B31A1A; }
</style>
