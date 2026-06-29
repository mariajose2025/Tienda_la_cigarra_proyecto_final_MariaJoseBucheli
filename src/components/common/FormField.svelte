<script>
  export let label = '';
  export let value = '';
  export let type = 'text';
  export let required = false;
  export let disabled = false;
  export let placeholder = '';
  export let error = '';

  let inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : '';
</script>

<div class="form-group">
  {#if label}
    <label for={inputId} class="form-label">
      {label}
      {#if required}<span class="required">*</span>{/if}
    </label>
  {/if}

  {#if type === 'textarea'}
    <textarea
      id={inputId}
      class="form-input"
      class:error
      {placeholder}
      {disabled}
      {required}
      bind:value
    ></textarea>
  {:else if type === 'select'}
    <select
      id={inputId}
      class="form-input"
      class:error
      {disabled}
      {required}
      bind:value
    >
      <option value="">{placeholder || 'Seleccionar...'}</option>
      <slot />
    </select>
  {:else}
    <input
      id={inputId}
      {type}
      class="form-input"
      class:error
      {placeholder}
      {disabled}
      {required}
      bind:value
    />
  {/if}

  {#if error}
    <span class="form-error">{error}</span>
  {/if}
</div>

<style>
  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .required {
    color: #dc2626;
    margin-left: 2px;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    min-height: 44px;
    background: white;
  }

  .form-input:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30,64,175,0.1);
  }

  .form-input.error {
    border-color: #dc2626;
  }

  .form-input:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  textarea.form-input {
    min-height: 80px;
    resize: vertical;
  }

  .form-error {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #dc2626;
  }
</style>
