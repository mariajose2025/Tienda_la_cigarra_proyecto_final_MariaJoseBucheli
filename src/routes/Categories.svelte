<script>
  import { onMount } from 'svelte';
  import { getAll, create, update, remove } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';

  let categories = [];
  let showModal = false;
  let editingCategory = null;
  let formData = { name: '', description: '' };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  onMount(loadCategories);

  async function loadCategories() {
    try {
      categories = await getAll('categories');
    } catch (e) {
      toast = { show: true, message: 'Error al cargar categorías', type: 'error' };
    }
  }

  function openModal(cat = null) {
    editingCategory = cat;
    formData = cat ? { name: cat.name, description: cat.description || '' } : { name: '', description: '' };
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingCategory = null;
    formData = { name: '', description: '' };
  }

  async function saveCategory() {
    if (!formData.name.trim()) {
      toast = { show: true, message: 'El nombre es obligatorio', type: 'warning' };
      return;
    }

    loading = true;
    try {
      if (editingCategory) {
        await update('categories', editingCategory.id, formData);
        toast = { show: true, message: 'Categoría actualizada', type: 'success' };
      } else {
        await create('categories', formData);
        toast = { show: true, message: 'Categoría creada', type: 'success' };
      }
      closeModal();
      await loadCategories();
    } catch (e) {
      toast = { show: true, message: 'Error al guardar', type: 'error' };
    }
    loading = false;
  }

  async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    loading = true;
    try {
      await remove('categories', id);
      toast = { show: true, message: 'Categoría eliminada', type: 'success' };
      await loadCategories();
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Clasificación de Productos</h1>
    {#if isAdmin($currentUser)}
      <Button on:click={() => openModal()}>+ Nueva</Button>
    {/if}
  </div>

  <div class="grid">
    {#each categories as cat}
      <div class="card">
        <div class="card-content">
          <h3>{cat.name}</h3>
          <p>{cat.description || 'Sin descripción'}</p>
        </div>
        {#if isAdmin($currentUser)}
          <div class="card-actions">
            <button class="btn-icon edit" on:click={() => openModal(cat)}>✏️</button>
            <button class="btn-icon delete" on:click={() => deleteCategory(cat.id)}>🗑️</button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No hay categorías registradas</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'} on:close={closeModal}>
  <div class="form-group">
    <label for="name">Nombre *</label>
    <input id="name" type="text" bind:value={formData.name} placeholder="Ej: Bebidas" />
  </div>
  <div class="form-group">
    <label for="desc">Descripción</label>
    <textarea id="desc" bind:value={formData.description} placeholder="Descripción opcional"></textarea>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveCategory} {loading}>{editingCategory ? 'Actualizar' : 'Crear'}</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #1f2937; margin: 0; }

  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

  .card {
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: relative;
  }

  .card-content h3 { margin: 0; font-size: 0.95rem; color: #1f2937; }
  .card-content p { margin: 0.3rem 0 0; font-size: 0.8rem; color: #6b7280; }

  .card-actions {
    position: absolute; top: 0.5rem; right: 0.5rem;
    display: flex; gap: 0.25rem;
  }

  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 0.9rem;
    padding: 0.3rem; border-radius: 4px;
  }
  .btn-icon.edit:hover { background: #dbeafe; }
  .btn-icon.delete:hover { background: #fef2f2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; grid-column: span 2; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #374151; }
  input, textarea {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
    font-family: inherit;
  }
  input:focus, textarea:focus { outline: none; border-color: #1e40af; }
  textarea { min-height: 60px; resize: vertical; }
</style>
