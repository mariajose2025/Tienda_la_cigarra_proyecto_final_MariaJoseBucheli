<script>
  import { onMount } from 'svelte';
  import { getAll, create, update, remove } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let suppliers = [];
  let showModal = false;
  let editingSupplier = null;
  let formData = { nit: '', name: '', contact: '', phone: '', address: '' };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  onMount(loadSuppliers);

  async function loadSuppliers() {
    try {
      suppliers = await getAll('suppliers');
    } catch (e) {
      toast = { show: true, message: 'Error al cargar proveedores', type: 'error' };
    }
  }

  function openModal(supplier = null) {
    editingSupplier = supplier;
    formData = supplier
      ? { nit: supplier.nit, name: supplier.name, contact: supplier.contact || '', phone: supplier.phone || '', address: supplier.address || '' }
      : { nit: '', name: '', contact: '', phone: '', address: '' };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingSupplier = null;
    formData = { nit: '', name: '', contact: '', phone: '', address: '' };
  }

  async function saveSupplier() {
    if (!formData.nit.trim() || !formData.name.trim()) {
      toast = { show: true, message: 'NIT y nombre son obligatorios', type: 'warning' };
      return;
    }

    loading = true;
    try {
      if (editingSupplier) {
        await update('suppliers', editingSupplier.id, formData);
        toast = { show: true, message: 'Proveedor actualizado', type: 'success' };
      } else {
        await create('suppliers', formData);
        toast = { show: true, message: 'Proveedor registrado', type: 'success' };
      }
      closeModal();
      await loadSuppliers();
    } catch (e) {
      toast = { show: true, message: 'Error al guardar', type: 'error' };
    }
    loading = false;
  }

  async function deleteSupplier(id) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    loading = true;
    try {
      await remove('suppliers', id);
      toast = { show: true, message: 'Proveedor eliminado', type: 'success' };
      await loadSuppliers();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Proveedores</h1>
    {#if isAdmin($currentUser)}
      <Button on:click={() => openModal()}>+ Nuevo</Button>
    {/if}
  </div>

  <div class="list">
    {#each suppliers as supplier}
      <div class="card">
        <div class="card-main">
          <h3>{supplier.name}</h3>
          <p class="nit">NIT: {supplier.nit}</p>
          {#if supplier.contact}
            <p>Contacto: {supplier.contact}</p>
          {/if}
          {#if supplier.phone}
            <p>Tel: {supplier.phone}</p>
          {/if}
          {#if supplier.address}
            <p>Dir: {supplier.address}</p>
          {/if}
        </div>
        {#if isAdmin($currentUser)}
          <div class="card-actions">
            <button class="btn-icon edit" on:click={() => openModal(supplier)}>✏️</button>
            <button class="btn-icon delete" on:click={() => deleteSupplier(supplier.id)}>🗑️</button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No hay proveedores registrados</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'} on:close={closeModal}>
  <div class="form-group">
    <label for="nit">NIT *</label>
    <input id="nit" type="text" bind:value={formData.nit} placeholder="900123456-7" />
  </div>
  <div class="form-group">
    <label for="name">Nombre *</label>
    <input id="name" type="text" bind:value={formData.name} placeholder="Distribuidora XYZ" />
  </div>
  <div class="form-group">
    <label for="contact">Persona de contacto</label>
    <input id="contact" type="text" bind:value={formData.contact} placeholder="Juan Pérez" />
  </div>
  <div class="form-group">
    <label for="phone">Teléfono</label>
    <input id="phone" type="tel" bind:value={formData.phone} placeholder="300 123 4567" />
  </div>
  <div class="form-group">
    <label for="address">Dirección</label>
    <input id="address" type="text" bind:value={formData.address} placeholder="Calle 123 #45-67" />
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveSupplier} {loading}>{editingSupplier ? 'Actualizar' : 'Crear'}</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #1f2937; margin: 0; }

  .list { display: flex; flex-direction: column; gap: 0.75rem; }

  .card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    display: flex; justify-content: space-between; align-items: flex-start;
  }

  .card-main h3 { margin: 0; font-size: 1rem; color: #1f2937; }
  .nit { font-weight: 600; color: #1e40af; font-size: 0.85rem; }
  .card-main p { margin: 0.2rem 0 0; font-size: 0.8rem; color: #6b7280; }

  .card-actions { display: flex; gap: 0.35rem; }
  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 1.1rem;
    padding: 0.35rem; border-radius: 6px;
  }
  .btn-icon.edit:hover { background: #dbeafe; }
  .btn-icon.delete:hover { background: #fef2f2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #374151; }
  input {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
  }
  input:focus { outline: none; border-color: #1e40af; }
</style>
