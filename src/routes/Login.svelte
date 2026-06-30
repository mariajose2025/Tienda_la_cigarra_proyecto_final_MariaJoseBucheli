<script>
  import { link, push } from 'svelte-spa-router';
  import { login, resendVerificationEmail } from '../services/authService';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let email = '';
  let password = '';
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let emailNotVerified = false;
  let resendingVerification = false;

  async function handleLogin() {
    if (!email || !password) {
      toast = { show: true, message: 'Completa todos los campos', type: 'warning' };
      return;
    }

    loading = true;
    emailNotVerified = false;
    const result = await login(email, password);
    loading = false;

    if (result.success) {
      if (result.emailNotVerified) {
        emailNotVerified = true;
        toast = { show: true, message: 'Debes verificar tu correo antes de iniciar sesión', type: 'warning' };
      } else {
        toast = { show: true, message: 'Inicio de sesión exitoso', type: 'success' };
        setTimeout(() => push('/admin'), 500);
      }
    } else {
      toast = { show: true, message: result.error, type: 'error' };
    }
  }

  async function handleResend() {
    resendingVerification = true;
    const result = await resendVerificationEmail(email, password);
    resendingVerification = false;
    if (result.success) {
      toast = { show: true, message: 'Correo de verificación reenviado a ' + email, type: 'success' };
    } else {
      toast = { show: true, message: 'Error: ' + (result.error || 'No se pudo reenviar'), type: 'error' };
    }
  }

  function goBack() {
    emailNotVerified = false;
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="login-header">
      <img src="/logo.png" alt="Tienda La Cigarra" class="login-logo" />
      <h1 class="logo">La Cigarra</h1>
      <p class="subtitle">Sistema de Tienda de Barrio</p>
    </div>

    {#if emailNotVerified}
      <div class="verify-container">
        <div class="verify-icon"><i class="fa-solid fa-envelope-circle-check"></i></div>
        <h2>Correo no verificado</h2>
        <p class="verify-email">Tu correo <strong>{email}</strong> aún no ha sido verificado.</p>

        <div class="verify-instructions">
          <p><i class="fa-solid fa-circle-check"></i> Revisa tu bandeja de entrada</p>
          <p><i class="fa-solid fa-circle-check"></i> Haz clic en el enlace de verificación</p>
          <p><i class="fa-solid fa-circle-check"></i> Vuelve aquí e inicia sesión</p>
        </div>

        <div class="verify-actions">
          <Button fullWidth={true} on:click={goBack}>
            <i class="fa-solid fa-arrow-left"></i> Volver al inicio de sesión
          </Button>
          <button class="btn-resend" on:click={handleResend} disabled={resendingVerification}>
            {#if resendingVerification}
              <i class="fa-solid fa-spinner fa-spin"></i> Reenviando...
            {:else}
              <i class="fa-solid fa-paper-plane"></i> Reenviar correo de verificación
            {/if}
          </button>
        </div>

        <div class="verify-help">
          <p><i class="fa-solid fa-triangle-exclamation"></i> Revisa también <strong>Spam</strong> o <strong>No deseado</strong></p>
        </div>
      </div>
    {:else}
      <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" bind:value={email} placeholder="tucorreo@email.com" />
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" type="password" bind:value={password} placeholder="••••••••" />
        </div>
        <Button type="submit" {loading} fullWidth={true}>Iniciar Sesión</Button>
      </form>

      <div class="divider"><span>o</span></div>

      <button class="btn-create" on:click={() => push('/registro')}>
        <i class="fa-solid fa-user-plus"></i> Crear Cuenta
      </button>

      <p class="register-link">¿No tienes cuenta? <a href="/registro" use:link>Crea una aquí</a></p>
    {/if}
  </div>
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #B31A1A 0%, #110F0F 100%); padding: 1.5rem; }
  .login-card { background: white; border-radius: 16px; padding: 2.5rem 2rem; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .login-header { text-align: center; margin-bottom: 2rem; }
  .login-logo { max-width: 180px; height: auto; margin-bottom: 1rem; border-radius: 12px; }
  .logo { font-size: 2rem; font-weight: 800; color: #B31A1A; margin: 0; letter-spacing: 2px; }
  .subtitle { color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem; }
  .form-group { margin-bottom: 1.25rem; }
  label { display: block; margin-bottom: 0.35rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
  input { width: 100%; padding: 0.75rem; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 1rem; box-sizing: border-box; min-height: 44px; }
  input:focus { outline: none; border-color: #B31A1A; box-shadow: 0 0 0 3px rgba(179,26,26,0.1); }
  .divider { display: flex; align-items: center; margin: 1.25rem 0; gap: 0.75rem; }
  .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
  .divider span { color: #9ca3af; font-size: 0.85rem; font-weight: 500; }
  .btn-create { width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.85rem; border: 2px solid #B31A1A; border-radius: 8px; background: transparent; font-size: 0.95rem; font-weight: 600; color: #B31A1A; cursor: pointer; transition: all 0.2s; min-height: 44px; }
  .btn-create:hover { background: #B31A1A; color: white; }
  .register-link { text-align: center; margin-top: 1.25rem; font-size: 0.9rem; color: #6b7280; }
  .register-link a { color: #B31A1A; font-weight: 600; text-decoration: underline; }

  .verify-container { text-align: center; }
  .verify-icon { font-size: 3.5rem; color: #F2C12E; margin-bottom: 1rem; }
  .verify-container h2 { font-size: 1.3rem; color: #110F0F; margin: 0 0 0.5rem; }
  .verify-email { color: #6b7280; font-size: 0.9rem; margin: 0 0 1.25rem; }
  .verify-email strong { color: #B31A1A; }
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
