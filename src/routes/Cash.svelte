<script>
  import { onMount } from 'svelte';
  import { getOpenSession, openCashSession, closeCashSession, getMovementsBySession, createMovement } from '../services/cashService';
  import { currentUser } from '../stores/auth';
  import { canCreate, canView } from '../utils/permissions';
  import { formatCurrency } from '../utils/iva';
  import { normalizeRows } from '../utils/exportUtils';
  import ExportButton from '../components/common/ExportButton.svelte';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';
  import Modal from '../components/common/Modal.svelte';

  let session = null;
  let movements = [];
  let loading = true;
  let openingAmount = 0;
  let closingAmount = 0;
  let closeResult = null;
  let toast = { show: false, message: '', type: 'info' };

  let showMovementModal = false;
  let showCloseModal = false;
  let moveForm = { type: 'egreso', category: 'gasto', amount: 0, description: '' };

  const CATEGORY_LABELS = {
    venta: 'Venta',
    fiado: 'Cobro de fiado',
    compra: 'Compra',
    gasto: 'Gasto',
    retiro: 'Retiro',
    base: 'Base / Apertura',
    ajuste: 'Ajuste',
    otro: 'Otro'
  };

  const TYPE_ICONS = {
    ingreso: 'fa-arrow-down',
    egreso: 'fa-arrow-up'
  };

  $: ingresoTotal = movements.filter(m => m.type === 'ingreso').reduce((s, m) => s + (m.amount || 0), 0);
  $: egresoTotal = movements.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0);
  $: esperado = session ? (session.openingAmount || 0) + ingresoTotal - egresoTotal : 0;
  $: diferencia = (Number(closingAmount) || 0) - esperado;

  onMount(loadData);

  async function loadData() {
    loading = true;
    const s = await getOpenSession();
    session = s;
    movements = s ? await getMovementsBySession(s.id) : [];
    loading = false;
  }

  async function handleOpen() {
    if (openingAmount < 0) {
      toast = { show: true, message: 'El monto de apertura no puede ser negativo', type: 'warning' };
      return;
    }
    loading = true;
    try {
      await openCashSession(openingAmount);
      await loadData();
      toast = { show: true, message: 'Caja abierta', type: 'success' };
    } catch (e) {
      toast = { show: true, message: 'Error al abrir caja', type: 'error' };
    }
    loading = false;
  }

  async function handleClose() {
    if (closingAmount < 0) {
      toast = { show: true, message: 'El conteo no puede ser negativo', type: 'warning' };
      return;
    }
    if (!confirm('¿Cerrar la caja? Verifica que el conteo de dinero sea correcto.')) return;
    loading = true;
    try {
      closeResult = await closeCashSession(session.id, closingAmount);
      showCloseModal = false;
      session = null;
      movements = [];
      toast = { show: true, message: 'Caja cerrada correctamente', type: 'success' };
    } catch (e) {
      toast = { show: true, message: 'Error al cerrar caja', type: 'error' };
    }
    loading = false;
  }

  function openMovementModal() {
    moveForm = { type: 'egreso', category: 'gasto', amount: 0, description: '' };
    showMovementModal = true;
  }

  async function saveMovement() {
    if (moveForm.amount <= 0) {
      toast = { show: true, message: 'Ingresa un monto válido', type: 'warning' };
      return;
    }
    if (!moveForm.description.trim()) {
      toast = { show: true, message: 'Describe el movimiento', type: 'warning' };
      return;
    }
    const category = moveForm.type === 'ingreso' ? 'otro' : (moveForm.category || 'gasto');
    loading = true;
    try {
      await createMovement({
        sessionId: session.id,
        type: moveForm.type,
        category,
        amount: Number(moveForm.amount),
        description: moveForm.description.trim(),
        paymentMethod: 'efectivo',
        createdAt: new Date()
      });
      showMovementModal = false;
      movements = await getMovementsBySession(session.id);
      toast = { show: true, message: 'Movimiento registrado', type: 'success' };
    } catch (e) {
      toast = { show: true, message: 'Error al registrar movimiento', type: 'error' };
    }
    loading = false;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('es-CO');
  }
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El módulo de Caja es parte de Contabilidad y solo está disponible para administradores.</p>
    </div>
  {:else}
  <div class="page-header">
    <h1><i class="fa-solid fa-cash-register"></i> Caja</h1>
    <div class="header-actions">
      <ExportButton rows={normalizeRows('cashSessions', session ? [session] : [])} filename="caja.xlsx" sheetName="Caja" label="Exportar" />
      {#if session && canCreate($currentUser, 'cash')}
        <Button on:click={openMovementModal}><i class="fa-solid fa-plus"></i> Movimiento</Button>
      {/if}
    </div>
  </div>

  {#if loading}
    <div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Cargando caja...</div>
  {:else if !session}
    <div class="open-card">
      <div class="open-icon"><i class="fa-solid fa-cash-register"></i></div>
      <h2>No hay caja abierta</h2>
      <p>Abre un turno de caja registrando el monto base (arqueo inicial) que tendrás en efectivo.</p>

      {#if canCreate($currentUser, 'cash')}
        <div class="open-form">
          <div class="form-group">
            <label for="opening">Monto de apertura ($)</label>
            <input id="opening" type="number" min="0" step="500" bind:value={openingAmount} placeholder="0.00" />
          </div>
          <Button fullWidth={true} on:click={handleOpen} {loading}>Abrir Caja</Button>
        </div>
      {:else}
        <p class="readonly-msg">No tienes permiso para abrir caja</p>
      {/if}
    </div>
  {:else}
    <div class="session-summary">
      <div class="summary-header">
        <div>
          <span class="session-badge open"><i class="fa-solid fa-circle"></i> Caja Abierta</span>
          <span class="session-date">Abierta: {formatDate(session.openedAt)}</span>
        </div>
        <button class="btn-close-session" on:click={() => { closeResult = null; closingAmount = 0; showCloseModal = true; }}>
          <i class="fa-solid fa-lock"></i> Cerrar Caja
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card base">
          <i class="fa-solid fa-coins"></i>
          <div><span class="stat-amount">{formatCurrency(session.openingAmount || 0)}</span><span class="stat-label">Base de Apertura</span></div>
        </div>
        <div class="stat-card income">
          <i class="fa-solid fa-arrow-down"></i>
          <div><span class="stat-amount">{formatCurrency(ingresoTotal)}</span><span class="stat-label">Ingresos</span></div>
        </div>
        <div class="stat-card expense">
          <i class="fa-solid fa-arrow-up"></i>
          <div><span class="stat-amount">{formatCurrency(egresoTotal)}</span><span class="stat-label">Egresos</span></div>
        </div>
        <div class="stat-card expected">
          <i class="fa-solid fa-calculator"></i>
          <div><span class="stat-amount">{formatCurrency(esperado)}</span><span class="stat-label">Esperado en Caja</span></div>
        </div>
      </div>
    </div>

    <h2 class="section-title"><i class="fa-solid fa-list"></i> Movimientos del Turno</h2>
    {#if movements.length === 0}
      <p class="empty"><i class="fa-solid fa-inbox"></i> Sin movimientos aún. Registra ventas en efectivo, cobra fiados o agrega movimientos manuales.</p>
    {:else}
      <div class="movements-list">
        {#each movements as mov}
          <div class="movement-item">
            <div class="movement-icon {mov.type}">
              <i class="fa-solid {TYPE_ICONS[mov.type] || 'fa-circle'}"></i>
            </div>
            <div class="movement-info">
              <span class="movement-name">{CATEGORY_LABELS[mov.category] || mov.category}</span>
              <span class="movement-desc">{mov.description || 'Movimiento de caja'}</span>
              <span class="movement-date">{formatDate(mov.createdAt)}</span>
            </div>
            <span class="movement-amount {mov.type}">
              {mov.type === 'ingreso' ? '+' : '-'}{formatCurrency(mov.amount)}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  {#if showCloseModal}
    <Modal show={true} title="Cerrar Caja" on:close={() => showCloseModal = false}>
      <p class="close-desc">Digita el conteo real de dinero en caja. La diferencia se calculará automáticamente.</p>
      <div class="form-group">
        <label for="closing">Conteo real de caja ($) *</label>
        <input id="closing" type="number" min="0" step="100" bind:value={closingAmount} placeholder="0.00" />
      </div>
      <div class="close-preview">
        <span>Esperado: <strong>{formatCurrency(esperado)}</strong></span>
        <span class="diff-preview {diferencia === 0 ? 'ok' : (diferencia > 0 ? 'surplus' : 'missing')}">
          Diferencia: {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
        </span>
      </div>
      <svelte:fragment slot="footer">
        <Button variant="secondary" on:click={() => showCloseModal = false}>Cancelar</Button>
        <Button variant="danger" on:click={handleClose} {loading}>Cerrar y Cuadrar</Button>
      </svelte:fragment>
    </Modal>
  {/if}

  {#if closeResult}
    <Modal show={true} title="Cierre de Caja" on:close={() => closeResult = null}>
      <div class="close-result">
        <div class="result-row"><span>Esperado</span><span>{formatCurrency(closeResult.expectedAmount)}</span></div>
        <div class="result-row"><span>Conteo real</span><span>{formatCurrency(Number(closingAmount) || 0)}</span></div>
        <div class="result-row result-diff {closeResult.difference === 0 ? 'ok' : (closeResult.difference > 0 ? 'surplus' : 'missing')}">
          <span>Diferencia</span>
          <span>{closeResult.difference >= 0 ? '+' : ''}{formatCurrency(closeResult.difference)}</span>
        </div>
        {#if closeResult.difference !== 0}
          <p class="diff-hint">
            {closeResult.difference > 0 ? 'Sobrante: revisa si hay cobros sin registrar.' : 'Faltante: revisa si falta registrar algún gasto o venta.'}
          </p>
        {:else}
          <p class="diff-hint ok">Caja cuadrada. Felicitaciones.</p>
        {/if}
      </div>
      <svelte:fragment slot="footer">
        <Button on:click={() => closeResult = null}>Aceptar</Button>
      </svelte:fragment>
    </Modal>
  {/if}

  <Modal show={showMovementModal} title="Nuevo Movimiento" on:close={() => showMovementModal = false}>
    <div class="form-group">
      <label for="mtype">Tipo de Movimiento *</label>
      <select id="mtype" bind:value={moveForm.type}>
        <option value="egreso">Egreso (sale dinero)</option>
        <option value="ingreso">Ingreso (entra dinero)</option>
      </select>
    </div>

    <div class="form-group" class:invisible={moveForm.type === 'ingreso'}>
      <label for="mcat">Categoría *</label>
      <select id="mcat" bind:value={moveForm.category}>
        <option value="gasto">Gasto operativo</option>
        <option value="retiro">Retiro de caja</option>
        <option value="ajuste">Ajuste</option>
      </select>
    </div>

    <div class="form-group">
      <label for="mamount">Monto ($) *</label>
      <input id="mamount" type="number" min="0.01" step="100" bind:value={moveForm.amount} placeholder="0.00" />
    </div>

    <div class="form-group">
      <label for="mdesc">Descripción *</label>
      <input id="mdesc" type="text" bind:value={moveForm.description} placeholder="Ej: Compra de bolsas, pago de servicios..." />
    </div>

    <svelte:fragment slot="footer">
      <Button variant="secondary" on:click={() => showMovementModal = false}>Cancelar</Button>
      <Button on:click={saveMovement} {loading}>Guardar Movimiento</Button>
    </svelte:fragment>
  </Modal>

  <Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />
  {/if}
</div>

<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .no-access {
    text-align: center; color: #6b7280; padding: 3rem 1rem;
  }
  .no-access i { font-size: 2.5rem; color: #9ca3af; margin-bottom: 1rem; }
  .no-access h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.5rem; }
  .no-access p { font-size: 0.9rem; margin: 0; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }
  .header-actions { display: flex; align-items: center; gap: 0.5rem; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

  .open-card {
    background: white; border-radius: 16px; padding: 2rem 1.25rem;
    text-align: center; max-width: 420px; margin: 1.5rem auto;
    box-shadow: var(--shadow-sm);
  }
  .open-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: #064F3C; color: #F2C12E; display: flex;
    align-items: center; justify-content: center; font-size: 1.6rem;
    margin: 0 auto 1rem;
  }
  .open-card h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.4rem; }
  .open-card p { color: #6b7280; font-size: 0.9rem; margin: 0 0 1.25rem; }
  .open-form { text-align: left; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #0A241D; }
  input, select {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; background: white;
  }
  input:focus, select:focus {
    outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }
  .invisible { display: none; }

  .session-summary { margin-bottom: 1rem; }
  .summary-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;
  }
  .session-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700;
  }
  .session-badge.open { background: #DCFCE7; color: #166534; }
  .session-badge i { font-size: 0.6rem; }
  .session-date { color: #6b7280; font-size: 0.8rem; margin-left: 0.75rem; }
  .btn-close-session {
    background: #0A241D; color: #F2C12E; border: none;
    padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;
  }
  .btn-close-session:hover { background: #064F3C; }

  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .stat-card {
    background: white; border-radius: 12px; padding: 1rem;
    display: flex; align-items: center; gap: 0.75rem;
    box-shadow: var(--shadow-sm);
  }
  .stat-card i { font-size: 1.4rem; }
  .stat-card.base { border-left: 4px solid #F2C12E; }
  .stat-card.base i { color: #F2C12E; }
  .stat-card.income { border-left: 4px solid #22c55e; }
  .stat-card.income i { color: #22c55e; }
  .stat-card.expense { border-left: 4px solid #EA580C; }
  .stat-card.expense i { color: #EA580C; }
  .stat-card.expected { border-left: 4px solid #064F3C; }
  .stat-card.expected i { color: #064F3C; }
  .stat-amount { display: block; font-weight: 700; font-size: 1.1rem; color: #0A241D; }
  .stat-label { font-size: 0.75rem; color: #6b7280; }

  .section-title {
    font-size: 1.1rem; color: #0A241D; margin: 1.25rem 0 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .section-title i { color: #064F3C; }

  .empty {
    text-align: center; color: #9ca3af; padding: 2.5rem;
    background: #fff; border: 1px dashed var(--border); border-radius: var(--radius);
  }

  .movements-list {
    background: white; border-radius: 12px; overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .movement-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.85rem 1rem; border-bottom: 1px solid #f3f4f6;
  }
  .movement-item:last-child { border-bottom: none; }

  .movement-icon {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; flex-shrink: 0;
  }
  .movement-icon.ingreso { background: #DCFCE7; color: #16a34a; }
  .movement-icon.egreso { background: #FEE2E2; color: #EA580C; }

  .movement-info { flex: 1; min-width: 0; }
  .movement-name { font-weight: 600; color: #0A241D; font-size: 0.9rem; display: block; }
  .movement-desc { color: #6b7280; font-size: 0.8rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .movement-date { color: #9ca3af; font-size: 0.7rem; }

  .movement-amount { font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
  .movement-amount.ingreso { color: #16a34a; }
  .movement-amount.egreso { color: #EA580C; }

  .readonly-msg {
    text-align: center; color: #6b7280; padding: 1rem;
    font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  }

  .close-desc { font-size: 0.9rem; color: #6b7280; margin: 0 0 1rem; }
  .close-preview {
    display: flex; flex-direction: column; gap: 0.4rem;
    background: #f3f4f6; padding: 0.75rem 1rem; border-radius: 10px;
    font-size: 0.9rem; color: #374151;
  }
  .diff-preview.ok { color: #16a34a; }
  .diff-preview.surplus { color: #EA580C; }
  .diff-preview.missing { color: #EA580C; }

  .close-result { padding: 0.5rem 0; }
  .result-row {
    display: flex; justify-content: space-between; padding: 0.5rem 0;
    font-size: 0.95rem; color: #374151;
  }
  .result-diff {
    border-top: 1px solid #e5e7eb; margin-top: 0.4rem;
    font-weight: 700; font-size: 1.05rem;
  }
  .result-diff.ok { color: #16a34a; }
  .result-diff.surplus { color: #EA580C; }
  .result-diff.missing { color: #EA580C; }
  .diff-hint { font-size: 0.85rem; color: #6b7280; margin: 0.6rem 0 0; }
  .diff-hint.ok { color: #16a34a; font-weight: 600; }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>