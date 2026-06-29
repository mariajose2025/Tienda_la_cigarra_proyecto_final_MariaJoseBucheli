<script>
  import { link, push } from 'svelte-spa-router';
  import { register, loginWithGoogle, resendVerificationEmail } from '../services/authService';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let step = 1;
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };

  let formData = {
    cedula: '',
    name: '',
    birthDate: '',
    phone: '',
    sex: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  let calculatedAge = { years: 0, months: 0, days: 0 };
  let isAdult = false;

  function calculateAge() {
    if (!formData.birthDate) {
      calculatedAge = { years: 0, months: 0, days: 0 };
      isAdult = false;
      return;
    }
    const birth = new Date(formData.birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    calculatedAge = { years, months, days };
    isAdult = years >= 17;
  }

  function goToStep2() {
    if (!formData.cedula.trim()) {
      toast = { show: true, message: 'La cédula es obligatoria', type: 'warning' };
      return;
    }
    if (!formData.name.trim()) {
      toast = { show: true, message: 'El nombre completo es obligatorio', type: 'warning' };
      return;
    }
    if (!formData.birthDate) {
      toast = { show: true, message: 'La fecha de nacimiento es obligatoria', type: 'warning' };
      return;
    }
    if (!isAdult) {
      toast = { show: true, message: 'Debes ser mayor de 17 años para crear una cuenta', type: 'error' };
      return;
    }
    if (!formData.phone.trim()) {
      toast = { show: true, message: 'El número de celular es obligatorio', type: 'warning' };
      return;
    }
    if (!formData.sex) {
      toast = { show: true, message: 'Selecciona tu sexo', type: 'warning' };
      return;
    }
    step = 2;
  }

  async function handleRegister() {
    if (!formData.email.trim()) {
      toast = { show: true, message: 'El correo es obligatorio', type: 'warning' };
      return;
    }
    if (!formData.password) {
      toast = { show: true, message: 'La contraseña es obligatoria', type: 'warning' };
      return;
    }
    if (formData.password.length < 6) {
      toast = { show: true, message: 'La contraseña debe tener al menos 6 caracteres', type: 'warning' };
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast = { show: true, message: 'Las contraseñas no coinciden', type: 'warning' };
      return;
    }

    loading = true;
    const result = await register(formData.email, formData.password, {
      name: formData.name,
      cedula: formData.cedula,
      phone: formData.phone,
      birthDate: formData.birthDate,
      sex: formData.sex,
      age: calculatedAge.years
    });
    loading = false;

    if (result.success) {
      step = 3;
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

  function goToLogin() {
    push('/login');
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
          <input id="cedula" type="text" bind:value={formData.cedula} placeholder="Ej: 1234567890" required />
        </div>

        <div class="form-group">
          <label for="name">Nombre Completo *</label>
          <input id="name" type="text" bind:value={formData.name} placeholder="Tu nombre completo" required />
        </div>

        <div class="form-group">
          <label for="birthDate">Fecha de Nacimiento *</label>
          <input id="birthDate" type="date" bind:value={formData.birthDate} on:change={calculateAge} required />
        </div>

        {#if formData.birthDate}
          <div class="age-info" class:adult={isAdult} class:not-adult={!isAdult}>
            <i class="fa-solid fa-cake-candles"></i>
            <span>Edad: <strong>{calculatedAge.years} años, {calculatedAge.months} meses, {calculatedAge.days} días</strong></span>
            {#if !isAdult}
              <span class="age-warning"><i class="fa-solid fa-triangle-exclamation"></i> Debes ser mayor de 17 años</span>
            {/if}
          </div>
        {/if}

        <div class="form-group">
          <label for="phone">Número de Celular *</label>
          <input id="phone" type="tel" bind:value={formData.phone} placeholder="Ej: 3001234567" required />
        </div>

        <div class="form-group">
          <label for="sex">Sexo *</label>
          <select id="sex" bind:value={formData.sex} required>
            <option value="">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>

        <Button type="submit" fullWidth={true}>
          Siguiente <i class="fa-solid fa-arrow-right"></i>
        </Button>
      </form>

      <div class="divider">
        <span>o</span>
      </div>

      <button class="btn-google" on:click={handleGoogleLogin} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continuar con Google
      </button>

    {:else if step === 2}
      <form on:submit|preventDefault={handleRegister}>
        <div class="form-group">
          <label for="email">Correo Electrónico *</label>
          <input id="email" type="email" bind:value={formData.email} placeholder="tucorreo@email.com" required />
          <span class="field-hint">Se enviará un código de verificación a este correo</span>
        </div>

        <div class="form-group">
          <label for="password">Contraseña *</label>
          <input id="password" type="password" bind:value={formData.password} placeholder="Mínimo 6 caracteres" required />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña *</label>
          <input id="confirmPassword" type="password" bind:value={formData.confirmPassword} placeholder="Repite tu contraseña" required />
        </div>

        <div class="step-actions">
          <Button variant="secondary" on:click={() => step = 1}>
            <i class="fa-solid fa-arrow-left"></i> Atrás
          </Button>
          <Button type="submit" {loading}>
            <i class="fa-solid fa-user-plus"></i> Crear Cuenta
          </Button>
        </div>
      </form>

    {:else if step === 3}
      <div class="success-container">
        <div class="success-icon"><i class="fa-solid fa-envelope-circle-check"></i></div>
        <h2>¡Cuenta Creada!</h2>
        <p>Se envió un correo de verificación a <strong>{formData.email}</strong>. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.</p>
        <div class="success-actions">
          <Button fullWidth={true} on:click={goToLogin}>
            <i class="fa-solid fa-right-to-bracket"></i> Ir al Inicio de Sesión
          </Button>
        </div>
      </div>
    {/if}
  </div>
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .register-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #B31A1A 0%, #110F0F 100%);
    padding: 1.5rem;
  }

  .register-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    max-height: 90vh;
    overflow-y: auto;
  }

  .register-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .register-logo {
    max-width: 140px;
    height: auto;
    margin-bottom: 0.75rem;
    border-radius: 12px;
  }

  .logo {
    font-size: 1.8rem;
    font-weight: 800;
    color: #B31A1A;
    margin: 0;
    letter-spacing: 2px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 0.9rem;
    margin-top: 0.35rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #374151;
  }

  input, select {
    width: 100%;
    padding: 0.7rem;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    font-size: 0.95rem;
    box-sizing: border-box;
    min-height: 42px;
    background: white;
  }

  input:focus, select:focus {
    outline: none;
    border-color: #B31A1A;
    box-shadow: 0 0 0 3px rgba(179,26,26,0.1);
  }

  .field-hint {
    display: block;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .age-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    border-radius: 8px;
    font-size: 0.85rem;
    margin-bottom: 1rem;
    background: #f3f4f6;
    color: #374151;
  }

  .age-info i {
    font-size: 1.1rem;
  }

  .age-info.adult {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .age-info.not-adult {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    flex-wrap: wrap;
  }

  .age-warning {
    width: 100%;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.3rem;
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

  .step-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .step-actions :global(.btn) {
    flex: 1;
  }

  .success-container {
    text-align: center;
    padding: 1rem 0;
  }

  .success-icon {
    font-size: 3rem;
    color: #22c55e;
    margin-bottom: 1rem;
  }

  .success-container h2 {
    font-size: 1.3rem;
    color: #166534;
    margin: 0 0 0.75rem;
  }

  .success-container p {
    color: #6b7280;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }

  .success-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
