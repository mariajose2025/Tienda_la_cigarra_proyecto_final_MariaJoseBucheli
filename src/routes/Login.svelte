<script>
  import { link, push } from 'svelte-spa-router';
  import { login, loginWithGoogle, resendVerificationEmail } from '../services/authService';
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
        toast = { show: true, message: 'Correo no verificado. Se envió un enlace de verificación a tu correo.', type: 'warning' };
      } else {
        toast = { show: true, message: 'Inicio de sesión exitoso', type: 'success' };
        setTimeout(() => push('/admin'), 500);
      }
    } else {
      toast = { show: true, message: result.error, type: 'error' };
    }
  }

  async function handleGoogleLogin() {
    loading = true;
    const result = await loginWithGoogle();
    loading = false;

    if (result.success) {
      toast = { show: true, message: 'Inicio de sesión con Google exitoso', type: 'success' };
      setTimeout(() => push('/admin'), 500);
    } else {
      toast = { show: true, message: result.error, type: 'error' };
    }
  }

  async function handleResendVerification() {
    resendingVerification = true;
    const result = await resendVerificationEmail();
    resendingVerification = false;

    if (result.success) {
      toast = { show: true, message: 'Correo de verificación reenviado a ' + email, type: 'success' };
    } else {
      toast = { show: true, message: result.error || 'Error al reenviar verificación', type: 'error' };
    }
  }

  function handleGoToLogin() {
    emailNotVerified = false;
  }

  function goToRegister() {
    push('/registro');
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
        <h2>Verifica tu correo</h2>
        <p>Se envió un enlace de verificación a <strong>{email}</strong>. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.</p>
        <div class="verify-actions">
          <Button fullWidth={true} on:click={handleResendVerification} loading={resendingVerification}>
            <i class="fa-solid fa-paper-plane"></i> Reenviar Correo de Verificación
          </Button>
          <button class="btn-back" on:click={handleGoToLogin}>
            <i class="fa-solid fa-arrow-left"></i> Volver al inicio de sesión
          </button>
        </div>
      </div>
    {:else}
      <form on:submit|preventDefault={handleLogin}>
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="tucorreo@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" {loading} fullWidth={true}>
          Iniciar Sesión
        </Button>
      </form>

      <div class="divider">
        <span>o</span>
      </div>

      <button class="btn-google" on:click={handleGoogleLogin} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continuar con Google
      </button>

      <p class="register-link">
        ¿No tienes cuenta? <a href="/registro" use:link>Crea una aquí</a>
      </p>
    {/if}
  </div>
</div>

<Toast
  show={toast.show}
  message={toast.message}
  type={toast.type}
  on:close={() => toast.show = false}
/>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #B31A1A 0%, #110F0F 100%);
    padding: 1.5rem;
  }

  .login-card {
    background: white;
    border-radius: 16px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-logo {
    max-width: 180px;
    height: auto;
    margin-bottom: 1rem;
    border-radius: 12px;
  }

  .logo {
    font-size: 2rem;
    font-weight: 800;
    color: #B31A1A;
    margin: 0;
    letter-spacing: 2px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    min-height: 44px;
  }

  input:focus {
    outline: none;
    border-color: #B31A1A;
    box-shadow: 0 0 0 3px rgba(179,26,26,0.1);
  }

  .divider {
    display: flex;
    align-items: center;
    margin: 1.25rem 0;
    gap: 0.75rem;
  }

  .divider::before, .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  .divider span {
    color: #9ca3af;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .btn-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.75rem;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    background: white;
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 44px;
  }

  .btn-google:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .btn-google:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .register-link {
    text-align: center;
    margin-top: 1.25rem;
    font-size: 0.9rem;
    color: #6b7280;
  }

  .register-link a {
    color: #B31A1A;
    font-weight: 600;
    text-decoration: underline;
  }

  .verify-container {
    text-align: center;
  }

  .verify-icon {
    font-size: 3rem;
    color: #F2C12E;
    margin-bottom: 1rem;
  }

  .verify-container h2 {
    font-size: 1.3rem;
    color: #110F0F;
    margin: 0 0 0.75rem;
  }

  .verify-container p {
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }

  .verify-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-back {
    background: none;
    border: none;
    color: #6b7280;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .btn-back:hover {
    color: #B31A1A;
  }
</style>
