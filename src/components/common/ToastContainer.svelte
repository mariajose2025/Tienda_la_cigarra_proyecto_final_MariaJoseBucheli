<script>
  import { toasts, dismiss } from '../../stores/toast';

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };
</script>

<div class="toast-container" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div class="toast toast-{toast.type}">
      <i class="fa-solid {icons[toast.type] || icons.info}"></i>
      <span class="toast-message">{toast.message}</span>
      <button class="toast-close" on:click={() => dismiss(toast.id)} title="Cerrar">&times;</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 4.5rem;
    right: 1rem;
    left: 1rem;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.95rem 1.1rem;
    border-radius: 10px;
    border: 1px solid;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .toast.success { background: #dcfce7; color: #166534; border-color: #86efac; }
  .toast.error { background: #FFF7ED; color: #B45309; border-color: #FDBA74; }
  .toast.warning { background: #fef9c3; color: #854d0e; border-color: #fde047; }
  .toast.info { background: #e0f2fe; color: #075985; border-color: #7dd3fc; }

  .toast-message { flex: 1; }
  .toast-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.6;
    padding: 0;
    margin-left: 0.25rem;
    line-height: 1;
  }
  .toast-close:hover { opacity: 1; }

  @keyframes slideIn {
    from { transform: translateY(-1rem); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (min-width: 768px) {
    .toast-container {
      left: auto;
      right: 1.5rem;
      max-width: 380px;
      width: 380px;
    }
  }
</style>