<script>
  export let show = false;
  export let title = '';
  export let size = 'medium';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) closeModal();
  }
</script>

{#if show}
  <div class="modal-overlay" on:click={handleBackdrop} on:keydown={handleBackdrop} role="dialog" aria-modal="true">
    <div class="modal-content" class:small={size === 'small'} class:large={size === 'large'}>
      <div class="modal-header">
        <h3>{title}</h3>
        <button class="modal-close" on:click={closeModal}>&times;</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(10,36,29,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
    animation: fadeIn 0.18s ease;
  }

  .modal-content {
    background: white;
    border-radius: 14px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: modalUp 0.22s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modalUp {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal-content.small { max-width: 350px; }
  .modal-content.large { max-width: 700px; }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1f2937;
  }

  .modal-close {
    background: #f3f4f6;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.35rem 0.6rem;
    line-height: 1;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
</style>
