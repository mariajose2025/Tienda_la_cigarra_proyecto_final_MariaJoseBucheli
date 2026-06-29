<script>
  import { onMount } from 'svelte';
  import { getAllClients, createClient, updateClient, deleteClient } from '../services/clientService';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let clients = [];
  let showModal = false;
  let editingClient = null;
  let formData = {
    cedula: '', name: '', birthDate: '', address: '', phone: '', maxDaysToPay: 30
  };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let searchQuery = '';

  $: filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cedula?.includes(searchQuery) ||
    c.phone?.includes(searchQuery)
  );

  onMount(loadClients);

  async function loadClients() {
    try {
      clients = await getAllClients();
    } catch (e) {
      toast = { show: true, message: 'Error al cargar clientes', type: 'error' };
    }
  }

  function openModal(client = null) {
    editingClient = client;
    formData = client
      ? {
          cedula: client.cedula,
          name: client.name,
          birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
          address: client.address || '',
          phone: client.phone || '',
          maxDaysToPay: client.maxDaysToPay || 30
        }
      : { cedula: '', name: '', birthDate: '', address: '', phone: '', maxDaysToPay: 30 };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingClient = null;
  }

  async function saveClient() {
    if (!formData.cedula.trim() || !formData.name.trim()) {
      toast = { show: true, message: 'Cédula y nombre son obligatorios', type: 'warning' };
      return;
    }

    loading = true;
    const data = {
      ...formData,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
      maxDaysToPay: Number(formData.maxDaysToPay)
    };

    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
        toast = { show: true, message: 'Cliente actualizado', type: 'success' };
      } else {
        await createClient(data);
        toast = { show: true, message: 'Cliente registrado', type: 'success' };
      }
      closeModal();
      await loadClients();
    } catch (e) {
      toast = { show: true, message: 'Error al guardar', type: 'error' };
    }
    loading = false;
  }

  async function deleteClientHandler(id) {
    if (!confirm('¿Eliminar este cliente?')) return;
    loading = true;
    try {
      await deleteClient(id);
      toast = { show: true, message: 'Cliente eliminado', type: 'success' };
      await loadClients();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }
</script>

<div class="page">
  <div class="page-header">
    <h1><i class="fa-solid fa-users"></i> Clientes</h1>
    <Button on:click={() => openModal()}><i class="fa-solid fa-plus"></i> Nuevo</Button>
  </div>

  <div class="search-bar">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="text" bind:value={searchQuery} placeholder="Buscar por nombre, cédula o teléfono..." />
  </div>

  <div class="stats-row">
    <div class="stat-item">
      <span class="stat-num">{clients.length}</span>
      <span class="stat-text">Total Clientes</span>
    </div>
  </div>

  <div class="list">
    {#each filteredClients as client}
      <div class="card">
        <div class="card-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        <div class="card-info">
          <h3>{client.name}</h3>
          <p class="cedula"><i class="fa-solid fa-id-card"></i> {client.cedula}</p>
          {#if client.phone}
            <p><i class="fa-solid fa-phone"></i> {client.phone}</p>
          {/if}
          {#if client.address}
            <p><i class="fa-solid fa-location-dot"></i> {client.address}</p>
          {/if}
          <span class="days-badge"><i class="fa-solid fa-calendar-days"></i> Plazo: {client.maxDaysToPay} días</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon edit" on:click={() => openModal(client)}><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icon delete" on:click={() => deleteClientHandler(client.id)}><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    {:else}
      <p class="empty"><i class="fa-solid fa-users-slash"></i> No hay clientes registrados</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'} on:close={closeModal}>
  <div class="form-group">
    <label for="cedula">Cédula *</label>
    <input id="cedula" type="text" bind:value={formData.cedula} placeholder="Ej: 1234567890" />
  </div>
  <div class="form-group">
    <label for="name">Nombre Completo *</label>
    <input id="name" type="text" bind:value={formData.name} placeholder="Juan Pérez" />
  </div>
  <div class="form-row">
    <div class="form-group">
      <label for="birthDate">Fecha Nacimiento</label>
      <input id="birthDate" type="date" bind:value={formData.birthDate} />
    </div>
    <div class="form-group">
      <label for="phone">Teléfono</label>
      <input id="phone" type="tel" bind:value={formData.phone} placeholder="300 123 4567" />
    </div>
  </div>
  <div class="form-group">
    <label for="address">Dirección</label>
    <input id="address" type="text" bind:value={formData.address} placeholder="Calle 123 #45-67" />
  </div>
  <div class="form-group">
    <label for="maxDays">Plazo Máximo de Pago (días)</label>
    <input id="maxDays" type="number" bind:value={formData.maxDaysToPay} min="1" max="365" />
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveClient} {loading}>{editingClient ? 'Actualizar' : 'Crear'}</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #110F0F; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #B31A1A; }

  .search-bar {
    display: flex; align-items: center; gap: 0.5rem;
    background: white; border-radius: 10px; padding: 0.6rem 1rem;
    margin-bottom: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .search-bar i { color: #9ca3af; }
  .search-bar input { border: none; outline: none; flex: 1; font-size: 0.9rem; background: transparent; }

  .stats-row {
    display: flex; gap: 0.75rem; margin-bottom: 1rem;
  }
  .stat-item {
    background: white; border-radius: 10px; padding: 0.75rem 1rem;
    flex: 1; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    border-left: 3px solid #B31A1A;
  }
  .stat-num { display: block; font-size: 1.5rem; font-weight: 700; color: #B31A1A; }
  .stat-text { font-size: 0.75rem; color: #6b7280; }

  .list { display: flex; flex-direction: column; gap: 0.75rem; }

  .card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; align-items: center; gap: 0.75rem;
  }

  .card-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: #F2C12E; color: #110F0F; display: flex;
    align-items: center; justify-content: center;
    font-size: 1.2rem; flex-shrink: 0;
  }

  .card-info { flex: 1; min-width: 0; }
  .card-info h3 { margin: 0; font-size: 0.95rem; color: #110F0F; }
  .card-info p { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6b7280; display: flex; align-items: center; gap: 0.35rem; }
  .card-info p i { color: #C49A45; width: 14px; text-align: center; }
  .cedula { font-weight: 600; color: #B31A1A !important; }

  .days-badge {
    display: inline-block; margin-top: 0.35rem; padding: 0.15rem 0.5rem;
    background: #A3A856; color: white; border-radius: 10px;
    font-size: 0.7rem; font-weight: 600;
  }
  .days-badge i { color: white; width: auto; }

  .card-actions { display: flex; gap: 0.35rem; }
  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 1rem;
    padding: 0.4rem; border-radius: 6px;
  }
  .btn-icon.edit { color: #C49A45; }
  .btn-icon.edit:hover { background: #FEF3C7; }
  .btn-icon.delete { color: #B31A1A; }
  .btn-icon.delete:hover { background: #FEE2E2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .form-group { margin-bottom: 0.85rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #110F0F; }
  input {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
  }
  input:focus { outline: none; border-color: #B31A1A; }
</style>
