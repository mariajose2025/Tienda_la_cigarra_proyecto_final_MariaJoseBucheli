<script>
  import { link, push } from 'svelte-spa-router';
  import { register, resendVerificationEmail } from '../services/authService';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let step = 1;
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let resendingVerification = false;

  let formData = {
    cedula: '', name: '', birthDate: '', phone: '', sex: '',
    email: '', password: '', confirmPassword: ''
  };

  let calculatedAge = { years: 0, months: 0, days: 0 };
  let isAdult = false;
  let registeredEmail = '';
  let emailWasSent = false;
  let emailErrorMsg = '';

  function calculateAge() {
    if (!formData.birthDate) { calculatedAge = { years: 0, months: 0, days: 0 }; isAdult = false; return; }
    const birth = new Date(formData.birthDate);
    const today = new Date();
    let y = today.getFullYear() - birth.getFullYear();
    let m = today.getMonth() - birth.getMonth();
    let d = today.getDate() - birth.getDate();
    if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    calculatedAge = { years: y, months: m, days: d };
    isAdult = y >= 17;
  }

  function goToStep2() {
    if (!formData.cedula.trim()) { toast = { show: true, message: 'La cédula es obligatoria', type: 'warning' }; return; }
    if (!formData.name.trim()) { toast = { show: true, message: 'El nombre es obligatorio', type: 'warning' }; return; }
    if (!formData.birthDate) { toast = { show: true, message: 'La fecha de nacimiento es obligatoria', type: 'warning' }; return; }
    if (!isAdult) { toast = { show: true, message: 'Debes ser mayor de 17 años', type: 'error' }; return; }
    if (!formData.phone.trim()) { toast = { show: true, message: 'El celular es obligatorio', type: 'warning' }; return; }
    if (!formData.sex) { toast = { show: true, message: 'Selecciona tu sexo', type: 'warning' }; return; }
    step = 2;
  }

  async function handleRegister() {
    if (!formData.email.trim()) { toast = { show: true, message: 'El correo es obligatorio', type: 'warning' }; return; }
    if (!formData.password || formData.password.length < 6) { toast = { show: true, message: 'Contraseña mínima 6 caracteres', type: 'warning' }; return; }
    if (formData.password !== formData.confirmPassword) { toast = { show: true, message: 'Las contraseñas no coinciden', type: 'warning' }; return; }

    loading = true;
    const result = await register(formData.email, formData.password, {
      name: formData.name, cedula: formData.cedula, phone: formData.phone,
      birthDate: formData.birthDate, sex: formData.sex, age: calculatedAge.years
    });
    loading = false;

    if (result.success) {
      registeredEmail = formData.email;
      emailWasSent = result.emailSent;
      emailErrorMsg = result.emailError || '';
      step = 3;
    } else {
      toast = { show: true, message: result.error, type: 'error' };
    }
  }

  async function handleResend() {
    resendingVerification = true;
    const result = await resendVerificationEmail(registeredEmail, formData.password);
    resendingVerification = false;
    if (result.success) {
      toast = { show: true, message: 'Correo reenviado a ' + registeredEmail, type: 'success' };
    } else {
      toast = { show: true, message: 'Error: ' + (result.error || 'No se pudo reenviar'), type: 'error' };
    }
  }
</script>

<div class="register-container">
  <div class="register-card">
    <div class="register-header">
      <img src="/logo.png" alt="Tienda La Cigarra" class="register-logo" />
      <h1 class="logo">La Cigarra</h1>
      <p class="subtitle">Crear Cuenta</p>
    </div>

    {#if step === 1}
      <form on:submit|preventDefault={goToStep2}>
        <div class="form-group">
          <label for="cedula">Cédula *</label>
          <input id="cedula" type="text" bind:value={formData.cedula} placeholder="Ej: 1234567890" />
        </div>
        <div class="form-group">
          <label for="name">Nombre Completo *</label>
          <input id="name" type="text" bind:value={formData.name} placeholder="Tu nombre completo" />
        </div>
        <div class="form-group">
          <label for="birthDate">Fecha de Nacimiento *</label>
          <input id="birthDate" type="date" bind:value={formData.birthDate} on:change={calculateAge} />
        </div>
        {#if formData.birthDate}
          <div class="age-info" class:adult={isAdult} class:not-adult={!isAdult}>
            <i class="fa-solid fa-cake-candles"></i>
            <span>{calculatedAge.years} años, {calculatedAge.months} meses, {calculatedAge.days} días</span>
            {#if !isAdult}<span class="age-warning"><i class="fa-solid fa-triangle-exclamation"></i> Debes ser mayor de 17 años</span>{/if}
          </div>
        {/if}
        <div class="form-group">
          <label for="phone">Celular *</label>
          <input id="phone" type="tel" bind:value={formData.phone} placeholder="Ej: 3001234567" />
        </div>
        <div class="form-group">
          <label for="sex">Sexo *</label>
          <select id="sex" bind:value={formData.sex}>
            <option value="">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <Button type="submit" fullWidth={true}>Siguiente <i class="fa-solid fa-arrow-right"></i></Button>
      </form>
      <p class="login-link">¿Ya tienes cuenta? <a href="/login" use:link>Inicia sesión</a></p>

    {:else if step === 2}
      <form on:submit|preventDefault={handleRegister}>
        <div class="form-group">
          <label for="email">Correo Electrónico *</label>
          <input id="email" type="email" bind:value={formData.email} placeholder="tucorreo@email.com" />
          <span class="field-hint">Se enviará un enlace de verificación</span>
        </div>
        <div class="form-group">
          <label for="password">Contraseña *</label>
          <input id="password" type="password" bind:value={formData.password} placeholder="Mínimo 6 caracteres" />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña *</label>
          <input id="confirmPassword" type="password" bind:value={formData.confirmPassword} placeholder="Repetir contraseña" />
        </div>
        <div class="step-actions">
          <Button variant="secondary" on:click={() => step = 1}><i class="fa-solid fa-arrow-left"></i> Atrás</Button>
          <Button type="submit" {loading}><i class="fa-solid fa-user-plus"></i> Crear Cuenta</Button>
        </div>
      </form>

    {:else if step === 3}
      <div class="verify-screen">
        {#if emailWasSent}
          <div class="verify-icon success"><i class="fa-solid fa-envelope-circle-check"></i></div>
          <h2>¡Cuenta Creada!</h2>
          <p class="verify-text">Se envió un correo de verificación a:<br/><strong>{registeredEmail}</strong></p>
          <div class="verify-instructions">
            <p><i class="fa-solid fa-circle-check"></i> Revisa tu bandeja de entrada</p>
            <p><i class="fa-solid fa-circle-check"></i> Haz clic en el enlace de verificación</p>
            <p><i class="fa-solid fa-circle-check"></i> Vuelve aquí e inicia sesión</p>
          </div>
        {:else}
          <div class="verify-icon error"><i class="fa-solid fa-circle-exclamation"></i></div>
          <h2>Error al enviar correo</h2>
          <p class="verify-text">La cuenta se creó pero no se pudo enviar el correo a:<br/><strong>{registeredEmail}</strong></p>
          <p class="verify-error-text">Error: {emailErrorMsg || 'No se pudo conectar con el servidor'}</p>
          <p class="verify-help-text"><i class="fa-solid fa-lightbulb"></i> Verifica en Firebase Console que el servicio de correo esté activado.</p>
        {/if}
        <div class="verify-actions">
          <Button fullWidth={true} on:click={() => push('/login')}>
            <i class="fa-solid fa-right-to-bracket"></i> Ir a Iniciar Sesión
          </Button>
          <button class="btn-resend" on:click={handleResend} disabled={resendingVerification}>
            {#if resendingVerification}<i class="fa-solid fa-spinner fa-spin"></i> Reenviando...{:else}<i class="fa-solid fa-paper-plane"></i> Reenviar correo de verificación{/if}
          </button>
        </div>
        <div class="verify-help"><p><i class="fa-solid fa-triangle-exclamation"></i> Revisa también <strong>Spam</strong> o <strong>No deseado</strong></p></div>
      </div>
    {/if}
  </div>
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .register-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #B31A1A 0%, #110F0F 100%); padding: 1.5rem; }
  .register-card { background: white; border-radius: 16px; padding: 2rem; width: 100%; max-width: 450px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
  .register-header { text-align: center; margin-bottom: 1.5rem; }
  .register-logo { max-width: 140px; height: auto; margin-bottom: 0.75rem; border-radius: 12px; }
  .logo { font-size: 1.8rem; font-weight: 800; color: #B31A1A; margin: 0; letter-spacing: 2px; }
  .subtitle { color: #6b7280; font-size: 0.9rem; margin-top: 0.35rem; }
  .form-group { margin-bottom: 1rem; }
  label { display: block; margin-bottom: 0.3rem; font-size: 0.85rem; font-weight: 600; color: #374151; }
  input, select { width: 100%; padding: 0.7rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; min-height: 42px; background: white; }
  input:focus, select:focus { outline: none; border-color: #B31A1A; box-shadow: 0 0 0 3px rgba(179,26,26,0.1); }
  .field-hint { display: block; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem; }
  .age-info { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; background: #f3f4f6; color: #374151; flex-wrap: wrap; }
  .age-info.adult { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .age-info.not-adult { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .age-warning { width: 100%; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }
  .step-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
  .step-actions :global(.btn) { flex: 1; }
  .login-link { text-align: center; margin-top: 1.25rem; font-size: 0.9rem; color: #6b7280; }
  .login-link a { color: #B31A1A; font-weight: 600; text-decoration: underline; }

  .verify-screen { text-align: center; padding: 0.5rem 0; }
  .verify-icon { font-size: 4rem; margin-bottom: 1rem; }
  .verify-icon.success { color: #22c55e; }
  .verify-icon.error { color: #ef4444; }
  .verify-screen h2 { font-size: 1.5rem; color: #110F0F; margin: 0 0 1rem; }
  .verify-text { color: #374151; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1rem; }
  .verify-text strong { color: #B31A1A; }
  .verify-error-text { color: #991b1b; font-size: 0.85rem; margin: 0 0 0.75rem; background: #fef2f2; padding: 0.5rem; border-radius: 6px; }
  .verify-help-text { color: #92400e; font-size: 0.8rem; margin: 0 0 1rem; background: #fffbeb; padding: 0.5rem; border-radius: 6px; }
  .verify-instructions { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 0.85rem; margin-bottom: 1.5rem; text-align: left; }
  .verify-instructions p { display: flex; align-items: center; gap: 0.5rem; margin: 0.4rem 0; font-size: 0.85rem; color: #166534; }
  .verify-instructions p:first-child { margin-top: 0; }
  .verify-instructions p:last-child { margin-bottom: 0; }
  .verify-instructions i { color: #22c55e; }
  .verify-actions { display: flex; flex-direction: column; gap: 0.75rem; }
  .btn-resend { background: transparent; border: 1.5px solid #d1d5db; color: #374151; padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
  .btn-resend:hover:not(:disabled) { background: #f3f4f6; border-color: #9ca3af; }
  .btn-resend:disabled { opacity: 0.5; cursor: not-allowed; }
  .verify-help { margin-top: 1.5rem; padding: 0.75rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }
  .verify-help p { margin: 0; font-size: 0.8rem; color: #92400e; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .verify-help i { color: #f59e0b; }
</style>
