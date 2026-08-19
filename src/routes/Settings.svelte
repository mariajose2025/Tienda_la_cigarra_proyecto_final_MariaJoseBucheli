<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { getSettings, updateSettings } from '../services/settingsService';
  import { notify } from '../stores/toast';
  import { clearAllData } from '../services/clearDatabase';
  import { logout } from '../services/authService';
  import { app } from '../stores/app';
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import Button from '../components/common/Button.svelte';

  let stockYellow = 10;
  let stockRed = 5;
  let expiryYellow = 30;
  let expiryRed = 7;
  let ivaPercentage = 19;
  let storeName = 'La Cigarra';
  let storeAddress = '';
  let storePhone = '';
  let storeNit = '';
  let loading = false;
  let clearing = false;

  onMount(async () => {
    try {
      const settings = await getSettings();
      stockYellow = settings.alertThresholds?.stockYellow || 10;
      stockRed = settings.alertThresholds?.stockRed || 5;
      expiryYellow = settings.alertThresholds?.expiryYellow || 30;
      expiryRed = settings.alertThresholds?.expiryRed || 7;
      ivaPercentage = settings.ivaPercentage || 19;
      storeName = settings.store?.name || 'La Cigarra';
      storeAddress = settings.store?.address || '';
      storePhone = settings.store?.phone || '';
      storeNit = settings.store?.nit || '';
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  });

  async function saveSettings() {
    if (stockRed >= stockYellow) {
      notify('warning', 'El umbral rojo debe ser menor al amarillo');
      return;
    }
    if (expiryRed >= expiryYellow) {
      notify('warning', 'El umbral rojo debe ser menor al amarillo (vencimiento)');
      return;
    }

    loading = true;
    try {
      const settings = {
        store: {
          name: storeName.trim() || 'La Cigarra',
          address: storeAddress.trim(),
          phone: storePhone.trim(),
          nit: storeNit.trim()
        },
        alertThresholds: { stockYellow, stockRed, expiryYellow, expiryRed },
        ivaPercentage: Number(ivaPercentage)
      };
      await updateSettings(settings);
      app.setSettings(settings);
      notify('success', 'Configuración guardada');
    } catch (e) {
      notify('error', 'Error al guardar');
    }
    loading = false;
  }

  async function handleClearDatabase() {
    if (!confirm('¿Estás seguro de que quieres BORRAR TODOS los datos? Esta acción no se puede deshacer.')) return;
    if (!confirm('ÚLTIMA ADVERTENCIA: Se eliminarán todos los usuarios, productos, categorías, proveedores, compras, ventas, clientes y fiados. ¿Continuar?')) return;

    clearing = true;
    notify('info', 'Limpiando base de datos...');

    try {
      const results = await clearAllData();
      const summary = Object.entries(results)
        .map(([name, r]) => `${name}: ${r.deleted} eliminados`)
        .join('\n');

      notify('success', `Base de datos limpiada. ${summary}`);

      setTimeout(async () => {
        await logout();
        push('/setup');
      }, 2000);
    } catch (e) {
      notify('error', 'Error al limpiar: ' + e.message);
    }
    clearing = false;
  }
</script>

<div class="page">
  <h1>Configuración del Sistema</h1>

  {#if isAdmin($currentUser)}
  <div class="settings-card">
    <h2>Datos de la Tienda</h2>
    <p class="section-desc">Estos datos aparecen en el pedido que se genera al registrar una venta.</p>

    <div class="form-group">
      <label for="storeName">Nombre del negocio</label>
      <input id="storeName" type="text" bind:value={storeName} />
    </div>
    <div class="form-group">
      <label for="storeAddress">Dirección</label>
      <input id="storeAddress" type="text" bind:value={storeAddress} />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="storePhone">Teléfono</label>
        <input id="storePhone" type="text" bind:value={storePhone} />
      </div>
      <div class="form-group">
        <label for="storeNit">NIT</label>
        <input id="storeNit" type="text" bind:value={storeNit} />
      </div>
    </div>
  </div>

  <div class="settings-card">
    <h2>Umbrales de Alerta de Stock</h2>
    <p class="section-desc">Define los niveles para activar el semáforo de alertas en el inventario.</p>

    <div class="form-row">
      <div class="form-group">
        <label for="stockYellow">🟡 Stock Amarillo (igual a)</label>
        <input id="stockYellow" type="number" bind:value={stockYellow} min="0" />
        <span class="hint">Stock actual = este valor</span>
      </div>
      <div class="form-group">
        <label for="stockRed">🔴 Stock Rojo (menor a)</label>
        <input id="stockRed" type="number" bind:value={stockRed} min="0" />
        <span class="hint">Stock actual &lt; este valor</span>
      </div>
    </div>
  </div>

  <div class="settings-card">
    <h2>Umbrales de Alerta de Vencimiento</h2>
    <p class="section-desc">Configura los días para activar las alertas de productos por vencer.</p>

    <div class="form-row">
      <div class="form-group">
        <label for="expiryYellow">🟡 Vencimiento Amarillo (días)</label>
        <input id="expiryYellow" type="number" bind:value={expiryYellow} min="0" />
        <span class="hint">Menos de estos días</span>
      </div>
      <div class="form-group">
        <label for="expiryRed">🔴 Vencimiento Rojo (días)</label>
        <input id="expiryRed" type="number" bind:value={expiryRed} min="0" />
        <span class="hint">Menos de estos días</span>
      </div>
    </div>
  </div>

  <div class="settings-card">
    <h2>Impuesto IVA</h2>
    <div class="form-group">
      <label for="iva">Porcentaje de IVA (%)</label>
      <input id="iva" type="number" bind:value={ivaPercentage} min="0" max="100" />
    </div>
  </div>

  <Button fullWidth={true} on:click={saveSettings} {loading}>
    Guardar Configuración
  </Button>

  <div class="danger-zone">
    <h2>Zona de Peligro</h2>
    <p class="section-desc">Estas acciones son irreversibles.</p>
    <Button fullWidth={true} on:click={handleClearDatabase} loading={clearing} variant="danger">
      <i class="fa-solid fa-trash"></i> Borrar Todos los Registros
    </Button>
  </div>
  {:else}
  <div class="settings-card">
    <p style="text-align:center;color:#6b7280;padding:2rem;">Solo el administrador puede modificar la configuración del sistema.</p>
  </div>
  {/if}
</div>



<style>
  .page { padding: 1.25rem; padding-top: 5rem; max-width: 600px; }
  h1 { font-size: 1.3rem; color: #1f2937; margin-bottom: 1.25rem; }

  .settings-card {
    background: white; border-radius: 12px; padding: 1.25rem;
    box-shadow: var(--shadow-sm); margin-bottom: 1rem;
  }

  .settings-card h2 {
    font-size: 1rem; color: #1f2937; margin: 0 0 0.25rem;
  }

  .section-desc {
    font-size: 0.8rem; color: #6b7280; margin: 0 0 1rem;
  }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #374151; }
  input {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
  }
  input:focus {
    outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }
  .hint { display: block; font-size: 0.75rem; color: #9ca3af; margin-top: 0.2rem; }

  .danger-zone {
    margin-top: 2rem;
    background: #FFF7ED;
    border: 2px solid #FED7AA;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .danger-zone h2 {
    color: #B45309;
    font-size: 1rem;
    margin: 0 0 0.25rem;
  }
</style>