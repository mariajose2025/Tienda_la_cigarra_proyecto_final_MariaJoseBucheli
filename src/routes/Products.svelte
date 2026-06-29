<script>
  import { onMount } from 'svelte';
  import { getAll, create, update, remove } from '../services/firestoreService';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import { alertThresholds } from '../stores/app';
  import { calculateStockAlert, calculateExpiryAlert, getDaysUntilExpiry } from '../utils/alerts';
  import { formatCurrency } from '../utils/iva';
  import AlertBadge from '../components/common/AlertBadge.svelte';
  import Button from '../components/common/Button.svelte';
  import Modal from '../components/common/Modal.svelte';
  import Toast from '../components/common/Toast.svelte';
  import { uploadProductImage } from '../services/storageService';
  import { createProduct } from '../services/productService';
  import JsBarcode from 'jsbarcode';

  let products = [];
  let categories = [];
  let suppliers = [];
  let showModal = false;
  let editingProduct = null;
  let formData = {
    name: '', categoryId: '', purchasePrice: 0, salePrice: 0,
    currentStock: 0, minimumStock: 0, expiryDate: '', supplierId: '', imageUrl: ''
  };
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  // Variables para la carga de imágenes
  let selectedImageFile = null;
  let imagePreviewUrl = '';
  let showIllustrationSelect = false;

  // Lista de ilustraciones prediseñadas locales
  const ILLUSTRATIONS = [
    { key: 'gaseosa_cola', path: '/default-products/gaseosa_cola.png', keywords: ['gaseosa', 'cola', 'soda', 'coca', 'pepsi', 'bebida', 'postobon'], label: 'Gaseosa Cola' },
    { key: 'jugo_naranja', path: '/default-products/jugo_naranja.png', keywords: ['jugo', 'orange', 'naranja', 'citrico', 'hit', 'tampico'], label: 'Jugo de Naranja' },
    { key: 'agua_botellon', path: '/default-products/agua_botellon.png', keywords: ['agua', 'water', 'botellon', 'botella', 'cristal', 'manantial'], label: 'Agua Botella' },
    { key: 'arroz_paquete', path: '/default-products/arroz_paquete.png', keywords: ['arroz', 'rice', 'diana', 'roam'], label: 'Paquete de Arroz' },
    { key: 'frijol_paquete', path: '/default-products/frijol_paquete.png', keywords: ['frijol', 'frijoles', 'bean', 'beans', 'lenteja', 'garbanzo'], label: 'Paquete de Frijol' },
    { key: 'chocolate_bonbonbum', path: '/default-products/chocolate_bonbonbum.png', keywords: ['chocolate', 'bonbonbum', 'bon bon bum', 'dulce', 'chupeta', 'paleta', 'bombón', 'caramelo'], label: 'Lollipop / Candy' },
    { key: 'papel_higienico', path: '/default-products/papel_higienico.png', keywords: ['papel', 'higienico', 'higiene', 'rollo', 'rollos', 'familia', 'suavegold'], label: 'Papel Higiénico' }
  ];

  $: thresholds = $alertThresholds;

  onMount(async () => {
    const [p, c, s] = await Promise.all([
      getAll('products'), getAll('categories'), getAll('suppliers')
    ]);
    products = p;
    categories = c;
    suppliers = s;
  });

  // Determinar la imagen a mostrar para un producto (personalizada, coincidencia de palabra clave o fallback)
  function getProductImage(product) {
    if (product.imageUrl) return product.imageUrl;
    
    const nameLower = (product.name || '').toLowerCase();
    for (const ill of ILLUSTRATIONS) {
      if (ill.keywords.some(keyword => nameLower.includes(keyword))) {
        return ill.path;
      }
    }
    return null;
  }

  function getCategoryIcon(catId) {
    const catName = categories.find(c => c.id === catId)?.name || '';
    switch (catName) {
      case 'Bebidas': return 'fa-bottle-water';
      case 'Paquetes': return 'fa-box';
      case 'Dulcería': return 'fa-candy-cane';
      case 'Snacks': return 'fa-cookie';
      case 'Lácteos': return 'fa-glass-water';
      case 'Abarrotes': return 'fa-basket-shopping';
      case 'Higiene': return 'fa-pump-soap';
      default: return 'fa-box-open';
    }
  }

  function getCategoryColor(catId) {
    const catName = categories.find(c => c.id === catId)?.name || '';
    switch (catName) {
      case 'Bebidas': return '#3b82f6';
      case 'Paquetes': return '#f59e0b';
      case 'Dulcería': return '#ec4899';
      case 'Snacks': return '#84cc16';
      case 'Lácteos': return '#a855f7';
      case 'Abarrotes': return '#10b981';
      case 'Higiene': return '#06b6d4';
      default: return '#9ca3af';
    }
  }

  function openModal(product = null) {
    editingProduct = product;
    selectedImageFile = null;
    showIllustrationSelect = false;

    if (product) {
      // Firestore puede devolver la fecha como Timestamp ({toDate()}) o como Date nativo
      let expiryStr = '';
      if (product.expiryDate) {
        const dateObj = product.expiryDate.toDate
          ? product.expiryDate.toDate()
          : new Date(product.expiryDate);
        // Solo formatear si es una fecha válida
        if (!isNaN(dateObj.getTime())) {
          expiryStr = dateObj.toISOString().split('T')[0];
        }
      }

      formData = {
        name: product.name,
        categoryId: product.categoryId || '',
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        expiryDate: expiryStr,
        supplierId: product.supplierId || '',
        imageUrl: product.imageUrl || ''
      };
      imagePreviewUrl = product.imageUrl || '';
    } else {
      formData = { name: '', categoryId: '', purchasePrice: 0, salePrice: 0, currentStock: 0, minimumStock: 0, expiryDate: '', supplierId: '', imageUrl: '' };
      imagePreviewUrl = '';
    }
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingProduct = null;
    selectedImageFile = null;
    imagePreviewUrl = '';
    showIllustrationSelect = false;
  }

  function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
      selectedImageFile = file;
      imagePreviewUrl = URL.createObjectURL(file);
      formData.imageUrl = ''; // Borra el path de la ilustración anterior si había
    }
  }

  function selectIllustration(path) {
    formData.imageUrl = path;
    selectedImageFile = null;
    imagePreviewUrl = path;
    showIllustrationSelect = false;
  }

  function removeSelectedImage() {
    selectedImageFile = null;
    imagePreviewUrl = '';
    formData.imageUrl = '';
  }

  // Función para comprimir una imagen local a Base64 si Firebase Storage falla
  function compressImage(file, maxWidth = 300, maxHeight = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async function saveProduct() {
    if (!formData.name.trim()) {
      toast = { show: true, message: 'El nombre es obligatorio', type: 'warning' };
      return;
    }

    loading = true;

    try {
      let finalImageUrl = formData.imageUrl;
      
      // Si hay un archivo seleccionado, intentar subirlo a Firebase Storage
      if (selectedImageFile) {
        try {
          toast = { show: true, message: 'Subiendo imagen a Firebase...', type: 'info' };
          const tempId = editingProduct ? editingProduct.id : 'new';
          finalImageUrl = await uploadProductImage(selectedImageFile, tempId);
        } catch (storageError) {
          console.warn('Firebase Storage no disponible. Guardando en Firestore como Base64...', storageError);
          toast = { show: true, message: 'Storage inaccesible. Guardando imagen comprimida localmente...', type: 'info' };
          
          try {
            // Comprimir la imagen seleccionada local a un base64 liviano (<30KB)
            finalImageUrl = await compressImage(selectedImageFile);
          } catch (compressError) {
            console.error('Error al comprimir la imagen:', compressError);
            throw new Error('No se pudo subir a Firebase ni guardar en formato local.');
          }
        }
      }

      const data = {
        ...formData,
        imageUrl: finalImageUrl,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null
      };

      if (editingProduct) {
        await update('products', editingProduct.id, data);
        toast = { show: true, message: 'Producto actualizado con éxito', type: 'success' };
      } else {
        await createProduct(data);
        toast = { show: true, message: 'Producto registrado con éxito', type: 'success' };
      }
      closeModal();
      products = await getAll('products');
    } catch (e) {
      console.error(e);
      toast = { show: true, message: e.message || 'Error al guardar el producto', type: 'error' };
    }
    loading = false;
  }

  async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    loading = true;
    try {
      await remove('products', id);
      toast = { show: true, message: 'Producto eliminado', type: 'success' };
      products = await getAll('products');
    } catch (e) {
      toast = { show: true, message: 'Error al eliminar', type: 'error' };
    }
    loading = false;
  }

  function getCategoryName(id) {
    return categories.find(c => c.id === id)?.name || '—';
  }

  function getSupplierName(id) {
    return suppliers.find(s => s.id === id)?.name || '—';
  }

  // Convierte de forma segura Firestore Timestamp o Date a string legible
  function formatExpiryDate(expiryDate) {
    if (!expiryDate) return '';
    const d = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return d.toLocaleDateString('es-CO');
  }

  function renderBarcode(element, code) {
    if (!element || !code) return;
    try {
      JsBarcode(element, code, {
        format: 'CODE128',
        width: 1.2,
        height: 30,
        displayValue: true,
        fontSize: 11,
        margin: 2,
        background: 'transparent',
        lineColor: '#1f2937'
      });
    } catch (e) {
      console.warn('Error rendering barcode:', code, e);
    }
  }

  function generateLocalBarcode() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return (timestamp.slice(-8) + random).slice(0, 12);
  }
</script>

<div class="page">
  <div class="page-header">
    <h1>Productos</h1>
    {#if isAdmin($currentUser)}
      <Button on:click={() => openModal()}>+ Nuevo</Button>
    {/if}
  </div>

  <div class="products-list">
    {#each products as product}
      {@const stockAlert = calculateStockAlert(product.currentStock, product.minimumStock)}
      {@const expiryAlert = product.expiryDate ? calculateExpiryAlert(product.expiryDate, thresholds) : 'green'}
      {@const daysLeft = product.expiryDate ? getDaysUntilExpiry(product.expiryDate) : null}

      <div class="product-card">
        <div class="product-card-body">
          <div class="product-image-container">
            {#if getProductImage(product)}
              <img src={getProductImage(product)} alt={product.name} class="product-img" />
            {:else}
              <div class="product-img-fallback" style="background-color: {getCategoryColor(product.categoryId)}">
                <i class="fa-solid {getCategoryIcon(product.categoryId)}"></i>
              </div>
            {/if}
          </div>

          <div class="product-info-container">
            <div class="product-header">
              <h3>{product.name}</h3>
              <div class="alerts">
                <AlertBadge level={stockAlert} text="Stock: {product.currentStock}" />
                {#if daysLeft !== null}
                  <AlertBadge level={expiryAlert} text="{daysLeft}d para vencer" />
                {/if}
              </div>
            </div>

            <div class="product-details">
              <div class="detail">
                <span class="detail-label">Categoría</span>
                <span class="detail-value">{getCategoryName(product.categoryId)}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Proveedor</span>
                <span class="detail-value">{getSupplierName(product.supplierId)}</span>
              </div>
              <div class="detail">
                <span class="detail-label">P. Compra</span>
                <span class="detail-value">{formatCurrency(product.purchasePrice)}</span>
              </div>
              <div class="detail">
                <span class="detail-label">P. Venta</span>
                <span class="detail-value">{formatCurrency(product.salePrice)}</span>
              </div>
              <div class="detail">
                <span class="detail-label">Stock Mín.</span>
                <span class="detail-value">{product.minimumStock}</span>
              </div>
              {#if daysLeft !== null}
                <div class="detail">
                  <span class="detail-label">Vence</span>
                  <span class="detail-value">{formatExpiryDate(product.expiryDate)}</span>
                </div>
              {/if}
            </div>

            {#if product.barcode}
              <div class="barcode-container">
                <div class="barcode-wrap" use:renderBarcode={product.barcode}></div>
              </div>
            {/if}
          </div>
        </div>

        {#if isAdmin($currentUser)}
          <div class="product-actions">
            <button class="btn-icon edit" on:click={() => openModal(product)}><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon delete" on:click={() => deleteProduct(product.id)}><i class="fa-solid fa-trash"></i></button>
          </div>
        {/if}
      </div>
    {:else}
      <p class="empty">No hay productos registrados</p>
    {/each}
  </div>
</div>

<Modal show={showModal} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} on:close={closeModal} size="large">
  <div class="form-row">
    <div class="form-group">
      <label for="name">Nombre *</label>
      <input id="name" type="text" bind:value={formData.name} placeholder="Nombre del producto" />
    </div>
    <div class="form-group">
      <label for="category">Categoría</label>
      <select id="category" bind:value={formData.categoryId}>
        <option value="">Seleccionar...</option>
        {#each categories as cat}
          <option value={cat.id}>{cat.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- SECCIÓN DE CARGA DE IMÁGENES -->
  <div class="form-row image-section-row">
    <div class="form-group full-width">
      <span class="form-label">Imagen del Producto</span>
      <div class="image-field-container">
        <div class="image-preview-box">
          {#if imagePreviewUrl}
            <img src={imagePreviewUrl} alt="Vista Previa" class="preview-img" />
            <button type="button" class="btn-clear-img" on:click={removeSelectedImage} title="Quitar imagen">
              <i class="fa-solid fa-xmark"></i>
            </button>
          {:else}
            <div class="preview-placeholder">
              <i class="fa-solid fa-image"></i>
              <span>Sin Imagen</span>
            </div>
          {/if}
        </div>
        <div class="image-actions-box">
          <p class="image-tip">Sube una foto personalizada o selecciona una de nuestras ilustraciones locales.</p>
          <div class="image-buttons">
            <label class="btn-upload-file">
              <i class="fa-solid fa-cloud-arrow-up"></i> Subir Archivo
              <input type="file" accept="image/*" on:change={handleImageChange} style="display: none;" />
            </label>
            <button type="button" class="btn-select-illustration" on:click={() => showIllustrationSelect = !showIllustrationSelect}>
              <i class="fa-solid fa-wand-magic-sparkles"></i> Ilustración
            </button>
          </div>
        </div>
      </div>

      <!-- PANEL DE SELECCIÓN DE ILUSTRACIÓN INLINE -->
      {#if showIllustrationSelect}
        <div class="illustrations-selector-panel">
          <div class="panel-header">
            <h4>Selecciona una ilustración alusiva:</h4>
            <button type="button" class="btn-close-panel" on:click={() => showIllustrationSelect = false}>&times;</button>
          </div>
          <div class="illustrations-grid">
            {#each ILLUSTRATIONS as ill}
              <button type="button" class="illustration-option-card" class:active={formData.imageUrl === ill.path} on:click={() => selectIllustration(ill.path)}>
                <img src={ill.path} alt={ill.label} class="ill-option-img" />
                <span class="ill-option-label">{ill.label}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="purchasePrice">Precio Compra *</label>
      <input id="purchasePrice" type="number" bind:value={formData.purchasePrice} min="0" />
    </div>
    <div class="form-group">
      <label for="salePrice">Precio Venta *</label>
      <input id="salePrice" type="number" bind:value={formData.salePrice} min="0" />
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="stock">Stock Actual</label>
      <input id="stock" type="number" bind:value={formData.currentStock} min="0" />
    </div>
    <div class="form-group">
      <label for="minStock">Stock Mínimo</label>
      <input id="minStock" type="number" bind:value={formData.minimumStock} min="0" />
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="expiry">Fecha de Vencimiento</label>
      <input id="expiry" type="date" bind:value={formData.expiryDate} />
    </div>
    <div class="form-group">
      <label for="supplier">Proveedor</label>
      <select id="supplier" bind:value={formData.supplierId}>
        <option value="">Seleccionar...</option>
        {#each suppliers as sup}
          <option value={sup.id}>{sup.name}</option>
        {/each}
      </select>
    </div>
  </div>

  <svelte:fragment slot="footer">
    {#if editingProduct && editingProduct.barcode}
      <div class="modal-barcode">
        <div class="barcode-wrap-modal" use:renderBarcode={editingProduct.barcode}></div>
        <span class="barcode-label">Código: {editingProduct.barcode}</span>
      </div>
    {/if}
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveProduct} {loading}>{editingProduct ? 'Actualizar' : 'Crear'}</Button>
  </svelte:fragment>
</Modal>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .page-header h1 { font-size: 1.3rem; color: #110F0F; margin: 0; display: flex; align-items: center; gap: 0.5rem; }

  .products-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .product-card {
    position: relative;
    background: white; border-radius: 12px; padding: 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .product-card-body {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }

  .product-image-container {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .product-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-img-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.8rem;
  }

  .product-info-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .product-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-right: 4rem;
  }
  .product-header h3 { margin: 0; font-size: 1rem; color: #110F0F; }

  .alerts { display: flex; gap: 0.35rem; flex-wrap: wrap; }

  .product-details {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .detail { display: flex; flex-direction: column; }
  .detail-label { font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; }
  .detail-value { font-size: 0.85rem; color: #374151; font-weight: 500; }

  .product-actions {
    position: absolute; top: 0.75rem; right: 0.75rem;
    display: flex; gap: 0.25rem;
  }

  .btn-icon {
    background: none; border: none; cursor: pointer; font-size: 0.95rem;
    padding: 0.4rem; border-radius: 6px; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
  }
  .btn-icon.edit { color: #C49A45; }
  .btn-icon.edit:hover { background: #FEF3C7; }
  .btn-icon.delete { color: #B31A1A; }
  .btn-icon.delete:hover { background: #FEE2E2; }

  .empty { text-align: center; color: #9ca3af; padding: 2rem; }

  .barcode-container {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: center;
  }

  .barcode-wrap {
    display: inline-block;
  }

  .barcode-wrap :global(svg) {
    max-width: 160px;
    height: auto;
  }

  .modal-barcode {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    flex: 1;
  }

  .barcode-wrap-modal {
    display: inline-block;
  }

  .barcode-wrap-modal :global(svg) {
    max-width: 200px;
    height: auto;
  }

  .barcode-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
  }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .form-group { margin-bottom: 0.85rem; }
  .form-group.full-width { grid-column: span 2; margin-bottom: 0.5rem; }
  
  label, .form-label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #110F0F; }
  input, select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  input:focus, select:focus { outline: none; border-color: #B31A1A; }

  /* ESTILOS DE CARGA DE IMAGEN EN MODAL */
  .image-section-row {
    grid-column: span 2;
  }
  .image-field-container {
    display: flex;
    gap: 1rem;
    align-items: center;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    padding: 0.75rem;
    background: #fff;
  }
  .image-preview-box {
    width: 70px;
    height: 70px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
    position: relative;
    background: #f3f4f6;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .btn-clear-img {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .preview-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #9ca3af;
    font-size: 0.65rem;
    gap: 0.25rem;
  }
  .preview-placeholder i {
    font-size: 1.5rem;
  }
  .image-actions-box {
    flex-grow: 1;
  }
  .image-tip {
    font-size: 0.75rem;
    color: #6b7280;
    margin: 0 0 0.5rem 0;
  }
  .image-buttons {
    display: flex;
    gap: 0.5rem;
  }
  .btn-upload-file {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s;
  }
  .btn-upload-file:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
  .btn-select-illustration {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #B31A1A;
    padding: 0.45rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s;
  }
  .btn-select-illustration:hover {
    background: #fee2e2;
  }

  /* PANEL DE SELECCIÓN DE ILUSTRACIÓN */
  .illustrations-selector-panel {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.75rem;
    background: #f9fafb;
    margin-top: 0.5rem;
  }
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  .panel-header h4 {
    margin: 0;
    font-size: 0.85rem;
    color: #4b5563;
  }
  .btn-close-panel {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #9ca3af;
  }
  .illustrations-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    max-height: 180px;
    overflow-y: auto;
    padding: 0.25rem;
  }
  .illustration-option-card {
    background: white;
    border: 1.5px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.35rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
  }
  .illustration-option-card:hover {
    border-color: #B31A1A;
    background: #fef2f2;
  }
  .illustration-option-card.active {
    border-color: #B31A1A;
    background: #fef2f2;
    box-shadow: 0 0 0 2px rgba(179,26,26,0.15);
  }
  .ill-option-img {
    width: 45px;
    height: 45px;
    object-fit: contain;
  }
  .ill-option-label {
    font-size: 0.65rem;
    color: #4b5563;
    text-align: center;
    margin-top: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  @media (min-width: 480px) {
    .product-details { grid-template-columns: repeat(3, 1fr); }
    .illustrations-grid { grid-template-columns: repeat(5, 1fr); }
  }

  @media (min-width: 768px) {
    .product-details { grid-template-columns: repeat(6, 1fr); }
    .illustrations-grid { grid-template-columns: repeat(7, 1fr); }
  }
</style>
