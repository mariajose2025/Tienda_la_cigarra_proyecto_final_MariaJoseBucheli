<script>
  import { currentUser } from '../stores/auth';
  import { changeUserPassword } from '../services/authService';
  import { update } from '../services/firestoreService';
  import { uploadProductImage } from '../services/storageService';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let name = $currentUser?.name || '';
  let phone = $currentUser?.phone || '';
  let cedula = $currentUser?.cedula || '';
  let birthDate = $currentUser?.birthDate || '';
  let sex = $currentUser?.sex || '';
  let photoURL = $currentUser?.photoURL || '';
  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let toast = { show: false, message: '', type: 'info' };
  let selectedPhotoFile = null;

  function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (file) {
      selectedPhotoFile = file;
      photoURL = URL.createObjectURL(file);
    }
  }

  function calculatedAge() {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    if (days < 0) { months--; const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); days += lastMonth.getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days };
  }

  $: ageInfo = calculatedAge();

  async function updateProfile() {
    if (!name) {
      toast = { show: true, message: 'El nombre es obligatorio', type: 'warning' };
      return;
    }

    loading = true;
    try {
      let finalPhotoURL = photoURL;

      if (selectedPhotoFile) {
        try {
          toast = { show: true, message: 'Subiendo foto...', type: 'info' };
          finalPhotoURL = await uploadProductImage(selectedPhotoFile, $currentUser.uid);
        } catch (e) {
          console.warn('Storage no disponible, usando preview local');
        }
      }

      const age = ageInfo ? ageInfo.years : 0;

      await update('users', $currentUser.uid, {
        name, phone, cedula, birthDate, sex, age, photoURL: finalPhotoURL
      });
      toast = { show: true, message: 'Perfil actualizado exitosamente', type: 'success' };
    } catch (e) {
      toast = { show: true, message: 'Error al actualizar perfil', type: 'error' };
    }
    loading = false;
  }

  async function changePassword() {
    if (!newPassword) {
      toast = { show: true, message: 'Ingresa la nueva contraseña', type: 'warning' };
      return;
    }
    if (newPassword !== confirmPassword) {
      toast = { show: true, message: 'Las contraseñas no coinciden', type: 'error' };
      return;
    }
    if (newPassword.length < 6) {
      toast = { show: true, message: 'Mínimo 6 caracteres', type: 'warning' };
      return;
    }

    loading = true;
    const result = await changeUserPassword(newPassword);
    loading = false;

    if (result.success) {
      toast = { show: true, message: 'Contraseña actualizada', type: 'success' };
      newPassword = '';
      confirmPassword = '';
    } else {
      toast = { show: true, message: result.error, type: 'error' };
    }
  }
</script>

<div class="profile-container">
  <div class="profile-card">
    <div class="profile-header">
      <div class="avatar-wrapper">
        {#if photoURL}
          <img src={photoURL} alt="Foto de perfil" class="avatar-img" />
        {:else}
          <div class="avatar-letter">{$currentUser?.name?.charAt(0) || 'U'}</div>
        {/if}
        <label class="btn-change-photo">
          <i class="fa-solid fa-camera"></i>
          <input type="file" accept="image/*" on:change={handlePhotoChange} style="display:none;" />
        </label>
      </div>
      <h2>{$currentUser?.name || 'Usuario'}</h2>
      <span class="role-badge">{$currentUser?.roleName || 'Sin rol'}</span>
      {#if $currentUser?.email}
        <p class="email-text"><i class="fa-solid fa-envelope"></i> {$currentUser.email}</p>
      {/if}
    </div>

    <div class="section">
      <h3><i class="fa-solid fa-user-pen"></i> Información Personal</h3>
      <div class="form-group">
        <label for="name">Nombre Completo</label>
        <input id="name" type="text" bind:value={name} />
      </div>
      <div class="form-group">
        <label for="cedula">Cédula</label>
        <input id="cedula" type="text" bind:value={cedula} placeholder="Tu cédula" />
      </div>
      <div class="form-group">
        <label for="birthDate">Fecha de Nacimiento</label>
        <input id="birthDate" type="date" bind:value={birthDate} />
      </div>
      {#if ageInfo}
        <div class="age-display">
          <i class="fa-solid fa-cake-candles"></i>
          {ageInfo.years} años, {ageInfo.months} meses, {ageInfo.days} días
        </div>
      {/if}
      <div class="form-row">
        <div class="form-group">
          <label for="sex">Sexo</label>
          <select id="sex" bind:value={sex}>
            <option value="">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div class="form-group">
          <label for="phone">Celular</label>
          <input id="phone" type="tel" bind:value={phone} placeholder="300 123 4567" />
        </div>
      </div>
      <Button on:click={updateProfile} {loading} fullWidth={true}>Guardar Cambios</Button>
    </div>

    <div class="section">
      <h3><i class="fa-solid fa-lock"></i> Cambiar Contraseña</h3>
      <div class="form-group">
        <label for="newPassword">Nueva contraseña</label>
        <input id="newPassword" type="password" bind:value={newPassword} placeholder="Mínimo 6 caracteres" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirmar contraseña</label>
        <input id="confirmPassword" type="password" bind:value={confirmPassword} placeholder="Repetir contraseña" />
      </div>
      <Button variant="secondary" on:click={changePassword} {loading} fullWidth={true}>Cambiar Contraseña</Button>
    </div>
  </div>
</div>

<Toast
  show={toast.show}
  message={toast.message}
  type={toast.type}
  on:close={() => toast.show = false}
/>

<style>
  .profile-container {
    padding: 1.25rem;
    padding-top: 5rem;
    min-height: 100vh;
    background: #f3f4f6;
  }

  .profile-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    max-width: 500px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }

  .profile-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .avatar-wrapper {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 0 auto 0.75rem;
  }

  .avatar-img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #B31A1A;
  }

  .avatar-letter {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #B31A1A;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .btn-change-photo {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #F2C12E;
    color: #110F0F;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.75rem;
    border: 2px solid white;
    transition: all 0.2s;
  }

  .btn-change-photo:hover {
    background: #D4A518;
    transform: scale(1.1);
  }

  .profile-header h2 {
    margin: 0;
    color: #1f2937;
    font-size: 1.3rem;
  }

  .role-badge {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .email-text {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }

  .section {
    margin-bottom: 1.5rem;
  }

  .section h3 {
    font-size: 1rem;
    color: #374151;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .section h3 i {
    color: #B31A1A;
  }

  .form-group {
    margin-bottom: 0.85rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
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
  }

  .age-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f3f4f6;
    border-radius: 8px;
    font-size: 0.85rem;
    color: #374151;
    margin-bottom: 0.85rem;
  }

  .age-display i {
    color: #B31A1A;
  }
</style>
