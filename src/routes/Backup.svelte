<script>
  import { currentUser } from '../stores/auth';
  import { isAdmin } from '../utils/permissions';
  import { exportAllCollections, importAllCollections, ALL_COLLECTIONS, COLLECTION_LABELS } from '../services/backupService';
  import { normalizeRows, exportSheetsToExcel, exportDataToJson, todayStamp } from '../utils/exportUtils';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  function showToast(message, type = 'info') {
    toast = { show: true, message, type };
  }

  async function handleExportExcel() {
    loading = true;
    try {
      const data = await exportAllCollections();
      const sheets = ALL_COLLECTIONS
        .filter(name => (data[name] || []).length > 0)
        .map(name => ({
          name: COLLECTION_LABELS[name] || name,
          rows: normalizeRows(name, data[name].map(d => ({ id: d.id, ...d.data })))
        }));
      if (sheets.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
      }
      exportSheetsToExcel(sheets, `backup-completo-${todayStamp()}.xlsx`);
      showToast('Backup en Excel descargado', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar Excel', 'error');
    }
    loading = false;
  }

  async function handleExportJson() {
    loading = true;
    try {
      const data = await exportAllCollections();
      exportDataToJson(data, `backup-completo-${todayStamp()}.json`);
      showToast('Backup en JSON descargado', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar JSON', 'error');
    }
    loading = false;
  }

  function handleRestoreFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        if (!confirm('¿Restaurar la copia de seguridad?\n\nEsto sobrescribirá/agregará los datos de todas las colecciones del sistema. ¿Continuar?')) return;
        loading = true;
        const restored = await importAllCollections(data);
        showToast(`Restauración completada: ${restored.length} colecciones`, 'success');
      } catch (e) {
        console.error(e);
        showToast('Error al restaurar: el archivo no es válido', 'error');
      }
      loading = false;
    };
    reader.readAsText(file);
    event.target.value = '';
  }
</script>

<div class="page">
  {#if !isAdmin($currentUser)}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>La Copia de Seguridad solo está disponible para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-database"></i> Copia de Seguridad</h1>
    </div>

    <p class="intro">Exporta o restaura todos los datos del sistema (inventario, ventas, compras, clientes, fiados, caja, gastos, usuarios y roles). Solo el administrador puede hacerlo.</p>

    <div class="cards">
      <div class="card">
        <div class="card-icon excel"><i class="fa-solid fa-file-excel"></i></div>
        <h3>Exportar en Excel</h3>
        <p>Descarga un archivo .xlsx con una hoja por cada sección del sistema.</p>
        <Button on:click={handleExportExcel} {loading}>Exportar Excel</Button>
      </div>

      <div class="card">
        <div class="card-icon json"><i class="fa-solid fa-file-code"></i></div>
        <h3>Exportar en JSON</h3>
        <p>Descarga un archivo .json con todos los datos para respaldo técnico.</p>
        <Button on:click={handleExportJson} {loading}>Exportar JSON</Button>
      </div>

      <div class="card">
        <div class="card-icon restore"><i class="fa-solid fa-rotate-left"></i></div>
        <h3>Restaurar</h3>
        <p>Sube un archivo .json de backup para recuperar información eliminada o perdida.</p>
        <label class="file-btn">
          Seleccionar archivo .json
          <input type="file" accept=".json" on:change={handleRestoreFile} />
        </label>
      </div>
    </div>

    <div class="colections">
      <h2 class="section-title"><i class="fa-solid fa-table-list"></i> Secciones incluidas</h2>
      <div class="chip-list">
        {#each ALL_COLLECTIONS as name}
          <span class="chip">{COLLECTION_LABELS[name] || name}</span>
        {/each}
      </div>
    </div>
  {/if}
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .no-access { text-align: center; color: #6b7280; padding: 3rem 1rem; }
  .no-access i { font-size: 2.5rem; color: #9ca3af; margin-bottom: 1rem; }
  .no-access h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.5rem; }
  .no-access p { font-size: 0.9rem; margin: 0; }

  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }

  .intro { color: #6b7280; font-size: 0.9rem; margin: 0 0 1.5rem; }

  .cards { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .card {
    background: white; border-radius: 14px; padding: 1.5rem;
    box-shadow: var(--shadow-sm); text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .card-icon {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; margin-bottom: 0.75rem;
  }
  .card-icon.excel { background: #DCFCE7; color: #16a34a; }
  .card-icon.json { background: #E0E7FF; color: #3730A3; }
  .card-icon.restore { background: #FEF3C7; color: #92400e; }
  .card h3 { color: #0A241D; margin: 0 0 0.4rem; font-size: 1.05rem; }
  .card p { color: #6b7280; font-size: 0.85rem; margin: 0 0 1rem; }

  .file-btn {
    display: inline-block; background: #064F3C; color: white; font-weight: 600;
    padding: 0.7rem 1.2rem; border-radius: 10px; cursor: pointer; font-size: 0.9rem;
    transition: background 0.2s;
  }
  .file-btn:hover { background: #043B2F; }
  .file-btn input { display: none; }

  .colections { margin-top: 1.5rem; }
  .section-title { font-size: 1.1rem; color: #0A241D; margin: 0 0 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .section-title i { color: #064F3C; }
  .chip-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip {
    background: #f3f4f6; color: #374151; padding: 0.35rem 0.85rem;
    border-radius: 20px; font-size: 0.8rem; font-weight: 600;
  }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .cards { grid-template-columns: repeat(3, 1fr); }
  }
</style>