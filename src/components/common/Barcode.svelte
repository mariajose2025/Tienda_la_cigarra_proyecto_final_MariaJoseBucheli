<script>
  import { onMount, afterUpdate } from 'svelte';
  import JsBarcode from 'jsbarcode';

  export let value = '';
  export let width = 1.5;
  export let height = 40;
  export let fontSize = 12;

  let svgEl;

  function render() {
    if (!svgEl || !value) return;
    try {
      JsBarcode(svgEl, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: true,
        fontSize,
        margin: 2,
        background: 'transparent',
        lineColor: '#1f2937'
      });
    } catch (e) {
      console.warn('JsBarcode error:', value, e.message);
    }
  }

  onMount(render);
  afterUpdate(render);
</script>

<svg bind:this={svgEl}></svg>
