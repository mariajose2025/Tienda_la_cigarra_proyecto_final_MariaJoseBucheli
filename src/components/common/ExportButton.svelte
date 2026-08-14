<script>
  import { exportDataToExcel } from '../../utils/exportUtils';

  export let rows = [];
  export let filename = 'export.xlsx';
  export let sheetName = 'Datos';
  export let label = 'Exportar';
</script>

<button
  class="btn-export"
  type="button"
  disabled={!rows || rows.length === 0}
  on:click={() => exportDataToExcel(rows, filename, sheetName)}
>
  <i class="fa-solid fa-file-excel"></i> {label}
</button>

<style>
  .btn-export {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: white; color: #0A241D; border: 1.5px solid #064F3C;
    padding: 0.55rem 1rem; border-radius: 10px; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .btn-export i { color: #16a34a; }
  .btn-export:hover:not(:disabled) { background: #064F3C; color: white; }
  .btn-export:hover:not(:disabled) i { color: #F2C12E; }
  .btn-export:disabled { opacity: 0.5; cursor: not-allowed; }
</style>