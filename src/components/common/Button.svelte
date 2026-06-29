<script>
  export let type = 'button';
  export let variant = 'primary';
  export let disabled = false;
  export let fullWidth = false;
  export let loading = false;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleClick(e) {
    if (!disabled && !loading) dispatch('click', e);
  }
</script>

<button
  {type}
  class="btn btn-{variant}"
  class:full-width={fullWidth}
  class:loading
  {disabled}
  on:click={handleClick}
>
  {#if loading}
    <span class="spinner"></span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .full-width { width: 100%; }

  .btn-primary {
    background: #B31A1A;
    color: white;
  }
  .btn-primary:hover:not(:disabled) { background: #8B1A1A; }

  .btn-success {
    background: #22c55e;
    color: white;
  }
  .btn-success:hover:not(:disabled) { background: #16a34a; }

  .btn-danger {
    background: #B31A1A;
    color: white;
  }
  .btn-danger:hover:not(:disabled) { background: #8B1A1A; }

  .btn-secondary {
    background: #6b7280;
    color: white;
  }
  .btn-secondary:hover:not(:disabled) { background: #4b5563; }

  .btn-outline {
    background: transparent;
    border: 2px solid #B31A1A;
    color: #B31A1A;
  }
  .btn-outline:hover:not(:disabled) {
    background: #B31A1A;
    color: white;
  }

  .btn-warning {
    background: #F2C12E;
    color: #110F0F;
  }
  .btn-warning:hover:not(:disabled) { background: #D4A518; }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .btn {
      padding: 0.85rem 1.25rem;
      font-size: 1rem;
    }
  }
</style>
