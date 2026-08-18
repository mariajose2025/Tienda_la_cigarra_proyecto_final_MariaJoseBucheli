<script>
  import { onMount } from 'svelte';
  import { getAllExpenses, createExpense, updateExpense, deleteExpense, EXPENSE_CATEGORIES } from '../services/expenseService';
  import { notify } from '../stores/toast';
  import { formatCurrency } from '../utils/iva';
  import { currentUser } from '../stores/auth';
  import { canView, canCreate, canEdit } from '../utils/permissions';
  import { normalizeRows } from '../utils/exportUtils';
  import Button from '../components/common/Button.svelte';
  import ExportButton from '../components/common/ExportButton.svelte';
  import Modal from '../components/common/Modal.svelte';

  let expenses = [];
  let showModal = false;
  let editingExpense = null;
  let formData = { name: '', category: 'arriendo', type: 'fijo', amount: 0, expenseDate: '', notes: '' };
  let loading = false;

  let filterType = 'all';

  onMount(loadExpenses);

  async function loadExpenses() {
    try {
      expenses = await getAllExpenses();
    } catch (e) {
      notify('error', 'Error al cargar gastos');
    }
  }

  function openModal(expense = null) {
    editingExpense = expense;
    if (expense) {
      const d = expense.expenseDate ? (expense.expenseDate.toDate ? expense.expenseDate.toDate() : new Date(expense.expenseDate)) : null;
      formData = {
        name: expense.name,
        category: expense.category || 'otros',
        type: expense.type || 'fijo',
        amount: expense.amount || 0,
        expenseDate: d ? d.toISOString().slice(0, 10) : '',
        notes: expense.notes || ''
      };
    } else {
      formData = { name: '', category: 'arriendo', type: 'fijo', amount: 0, expenseDate: new Date().toISOString().slice(0, 10), notes: '' };
    }
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    editingExpense = null;
  }

  async function saveExpense() {
    if (!formData.name.trim()) {
      notify('warning', 'El nombre del gasto es obligatorio');
      return;
    }
    if (formData.amount <= 0) {
      notify('warning', 'Ingresa un monto válido');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      type: formData.type,
      amount: Number(formData.amount),
      expenseDate: formData.expenseDate ? new Date(formData.expenseDate + 'T12:00:00') : new Date(),
      notes: formData.notes.trim()
    };

    loading = true;
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        notify('success', 'Gasto actualizado');
      } else {
        await createExpense(payload);
        notify('success', 'Gasto registrado');
      }
      closeModal();
      await loadExpenses();
    } catch (e) {
      notify('error', 'Error al guardar gasto');
    }
    loading = false;
  }

  async function deleteExpenseById(id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    loading = true;
    try {
      await deleteExpense(id);
      notify('success', 'Gasto eliminado');
      await loadExpenses();
    } catch (e) {
      notify('error', 'Error al eliminar gasto');
    }
    loading = false;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('es-CO');
  }

  $: filteredExpenses = expenses
    .filter(e => filterType === 'all' ? true : e.type === filterType)
    .sort((a, b) => {
      const da = a.expenseDate || a.createdAt;
      const db = b.expenseDate || b.createdAt;
      return (db ? (db.toDate ? db.toDate() : new Date(db)) : 0) - (da ? (da.toDate ? da.toDate() : new Date(da)) : 0);
    });

  $: totalFijos = expenses.filter(e => e.type === 'fijo').reduce((s, e) => s + (e.amount || 0), 0);
  $: totalVariables = expenses.filter(e => e.type === 'variable').reduce((s, e) => s + (e.amount || 0), 0);
  $: totalGastos = totalFijos + totalVariables;
</script>

<div class="page">
  {#if !canView($currentUser, 'cash')}
    <div class="no-access">
      <i class="fa-solid fa-lock"></i>
      <h2>Acceso restringido</h2>
      <p>El módulo de Gastos es parte de Caja y Reportes y solo está disponible para administradores.</p>
    </div>
  {:else}
    <div class="page-header">
      <h1><i class="fa-solid fa-receipt"></i> Gastos</h1>
      <div class="header-actions">
        <ExportButton rows={normalizeRows('expenses', filteredExpenses)} filename="gastos.xlsx" sheetName="Gastos" label="Exportar" />
        {#if canCreate($currentUser, 'cash')}
          <Button on:click={() => openModal()}>+ Nuevo Gasto</Button>
        {/if}
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi">
        <span class="kpi-label">Gastos fijos</span>
        <span class="kpi-value">{formatCurrency(totalFijos)}</span>
      </div>
      <div class="kpi">
        <span class="kpi-label">Gastos variables</span>
        <span class="kpi-value">{formatCurrency(totalVariables)}</span>
      </div>
      <div class="kpi total">
        <span class="kpi-label">Total gastos</span>
        <span class="kpi-value">{formatCurrency(totalGastos)}</span>
      </div>
    </div>

    <div class="filter-bar">
      <button class="filter-btn" class:active={filterType === 'all'} on:click={() => filterType = 'all'}>Todos</button>
      <button class="filter-btn" class:active={filterType === 'fijo'} on:click={() => filterType = 'fijo'}>Fijos</button>
      <button class="filter-btn" class:active={filterType === 'variable'} on:click={() => filterType = 'variable'}>Variables</button>
    </div>

    {#if filteredExpenses.length === 0}
      <p class="empty"><i class="fa-solid fa-inbox"></i> No hay gastos registrados</p>
    {:else}
      <div class="list">
        {#each filteredExpenses as expense}
          <div class="card">
            <div class="card-main">
              <h3>{expense.name}</h3>
              <p class="meta">
                <span class="tag {expense.type}">{expense.type === 'fijo' ? 'Fijo' : 'Variable'}</span>
                <span class="cat">{EXPENSE_CATEGORIES[expense.category] || expense.category}</span>
                <span class="date"><i class="fa-solid fa-calendar"></i> {formatDate(expense.expenseDate)}</span>
              </p>
              {#if expense.notes}
                <p class="notes">{expense.notes}</p>
              {/if}
            </div>
            <div class="card-right">
              <span class="amount">-{formatCurrency(expense.amount)}</span>
              {#if canEdit($currentUser, 'cash')}
                <div class="card-actions">
                  <button class="btn-icon edit" on:click={() => openModal(expense)}>✏️</button>
                  <button class="btn-icon delete" on:click={() => deleteExpenseById(expense.id)}>🗑️</button>
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<Modal show={showModal} title={editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'} on:close={closeModal}>
  <div class="form-group">
    <label for="gname">Nombre / Concepto *</label>
    <input id="gname" type="text" bind:value={formData.name} placeholder="Ej: Arriendo del local, Nómina..." />
  </div>

  <div class="form-group">
    <label for="gtype">Tipo *</label>
    <select id="gtype" bind:value={formData.type}>
      <option value="fijo">Fijo (se repite cada mes)</option>
      <option value="variable">Variable (ocasional)</option>
    </select>
  </div>

  <div class="form-group">
    <label for="gcat">Categoría *</label>
    <select id="gcat" bind:value={formData.category}>
      {#each Object.entries(EXPENSE_CATEGORIES) as [value, label]}
        <option value={value}>{label}</option>
      {/each}
    </select>
  </div>

  <div class="form-group">
    <label for="gamount">Monto ($) *</label>
    <input id="gamount" type="number" min="0.01" step="1000" bind:value={formData.amount} placeholder="0.00" />
  </div>

  <div class="form-group">
    <label for="gdate">Fecha del gasto *</label>
    <input id="gdate" type="date" bind:value={formData.expenseDate} />
  </div>

  <div class="form-group">
    <label for="gnotes">Notas</label>
    <textarea id="gnotes" rows="2" bind:value={formData.notes} placeholder="Detalle opcional"></textarea>
  </div>

  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={closeModal}>Cancelar</Button>
    <Button on:click={saveExpense} {loading}>{editingExpense ? 'Actualizar' : 'Guardar'}</Button>
  </svelte:fragment>
</Modal>



<style>
  .page { padding: 1.25rem; padding-top: 5rem; }
  .no-access { text-align: center; color: #6b7280; padding: 3rem 1rem; }
  .no-access i { font-size: 2.5rem; color: #9ca3af; margin-bottom: 1rem; }
  .no-access h2 { font-size: 1.2rem; color: #0A241D; margin: 0 0 0.5rem; }
  .no-access p { font-size: 0.9rem; margin: 0; }

  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .page-header h1 { font-size: 1.3rem; color: #0A241D; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
  .header-actions { display: flex; align-items: center; gap: 0.5rem; }
  .page-header h1 i { color: #064F3C; }

  .loading { text-align: center; padding: 3rem; color: #6b7280; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .empty {
    text-align: center; color: #9ca3af; padding: 2.5rem;
    background: #fff; border: 1px dashed var(--border); border-radius: var(--radius);
  }

  .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
  .kpi {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border); border-top: 3px solid #064F3C;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .kpi.total { border-top-color: #EA580C; }
  .kpi-label { font-size: 0.75rem; color: #6b7280; }
  .kpi-value { font-size: 1.15rem; font-weight: 700; color: #0A241D; }
  .kpi.total .kpi-value { color: #EA580C; }

  .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .filter-btn {
    padding: 0.5rem 1rem; border: 1.5px solid #d1d5db; background: white;
    border-radius: 20px; font-size: 0.8rem; cursor: pointer; white-space: nowrap;
    transition: all 0.2s;
  }
  .filter-btn.active { background: #064F3C; color: white; border-color: #064F3C; }

  .list { display: flex; flex-direction: column; gap: 0.75rem; }
  .card {
    background: #fff; border-radius: var(--radius); padding: 1rem;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .card-main h3 { margin: 0 0 0.4rem; font-size: 1rem; color: #0A241D; }
  .meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0 0 0.3rem; }
  .tag { padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.72rem; font-weight: 700; }
  .tag.fijo { background: #FEF3C7; color: #92400e; }
  .tag.variable { background: #E0E7FF; color: #3730A3; }
  .cat { font-size: 0.8rem; color: #6b7280; }
  .date { font-size: 0.78rem; color: #9ca3af; display: flex; align-items: center; gap: 0.3rem; }
  .notes { font-size: 0.8rem; color: #6b7280; margin: 0; }
  .card-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
  .amount { font-weight: 700; color: #EA580C; font-size: 1rem; white-space: nowrap; }
  .card-actions { display: flex; gap: 0.35rem; }
  .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.35rem; border-radius: 6px; transition: background 0.15s; }
  .btn-icon.edit { color: #064F3C; }
  .btn-icon.edit:hover { background: rgba(6,79,60,0.1); }
  .btn-icon.delete { color: #C2410C; }
  .btn-icon.delete:hover { background: #FFF7ED; }

  .form-group { margin-bottom: 0.85rem; }
  label { display: block; margin-bottom: 0.25rem; font-size: 0.85rem; font-weight: 600; color: #0A241D; }
  input, select, textarea {
    width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db;
    border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; font-family: inherit;
  }
  input:focus, select:focus, textarea:focus {
    outline: none; border-color: #064F3C;
    box-shadow: 0 0 0 3px rgba(6,79,60,0.14);
  }

  @media (min-width: 768px) {
    .page { padding: 1.5rem 2rem; padding-top: 5rem; }
    .kpi-grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>