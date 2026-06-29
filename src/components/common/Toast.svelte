<script>
  export let show = false;
  export let message = '';
  export let type = 'info';

  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();

  $: bgColor = type === 'success' ? '#dcfce7' : type === 'error' ? '#fef2f2' : type === 'warning' ? '#fef9c3' : '#dbeafe';
  $: textColor = type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : type === 'warning' ? '#854d0e' : '#1e40af';
  $: borderColor = type === 'success' ? '#86efac' : type === 'error' ? '#fca5a5' : type === 'warning' ? '#fde047' : '#93c5fd';

  onMount(() => {
    if (show && type !== 'error') {
      const timer = setTimeout(() => {
        dispatch('close');
      }, 4000);
      return () => clearTimeout(timer);
    }
  });
</script>

{#if show}
  <div class="toast" style="background-color: {bgColor}; color: {textColor}; border-color: {borderColor}">
    <span class="toast-message">{message}</span>
    <button class="toast-close" on:click={() => dispatch('close')}>&times;</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 5rem;
    right: 1rem;
    left: 1rem;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 3000;
    animation: slideIn 0.3s ease;
  }

  .toast-message {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    opacity: 0.6;
    padding: 0;
    margin-left: 0.75rem;
  }

  .toast-close:hover { opacity: 1; }

  @keyframes slideIn {
    from { transform: translateY(-1rem); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (min-width: 768px) {
    .toast {
      left: auto;
      right: 2rem;
      max-width: 400px;
    }
  }
</style>
