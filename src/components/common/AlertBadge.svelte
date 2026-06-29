<script>
  export let level = 'green';
  export let text = '';
  export let showIcon = true;

  import { getAlertColor } from '../../utils/alerts';

  $: color = getAlertColor(level);
  $: label = text || (level === 'green' ? 'Normal' : level === 'yellow' ? 'Alerta' : 'Crítico');
</script>

<span class="alert-badge" style="background-color: {color}20; color: {color}; border: 1px solid {color}">
  {#if showIcon}
    <span class="alert-dot" style="background-color: {color}"></span>
  {/if}
  {label}
</span>

<style>
  .alert-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .alert-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
