<script>
  import { push } from 'svelte-spa-router';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc, collection, getDocs, getDoc } from 'firebase/firestore';
  import { auth, db } from '../services/firebase';
  import Button from '../components/common/Button.svelte';
  import Toast from '../components/common/Toast.svelte';

  let email = '';
  let password = '';
  let name = '';
  let loading = false;
  let step = 1;
  let toast = { show: false, message: '', type: 'info' };

  async function setup() {
    if (!email || !password || !name) {
      toast = { show: true, message: 'Completa todos los campos', type: 'warning' };
      return;
    }

    if (password.length < 6) {
      toast = { show: true, message: 'La contraseña debe tener al menos 6 caracteres', type: 'warning' };
      return;
    }

    loading = true;
    let uid = null;

    try {
      // Intentar crear el usuario
      toast = { show: true, message: 'Configurando usuario administrador...', type: 'info' };
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCredential.user.uid;
      } catch (authError) {
        // Si el usuario ya existe, intentar iniciar sesión para obtener el UID
        if (authError.code === 'auth/email-already-in-use') {
          toast = { show: true, message: 'Usuario existente, verificando datos...', type: 'info' };
          const loginResult = await signInWithEmailAndPassword(auth, email, password);
          uid = loginResult.user.uid;
        } else {
          throw authError;
        }
      }

      // Verificar si ya tiene datos en Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        // Crear documento del usuario en Firestore
        await setDoc(doc(db, 'users', uid), {
          name: name,
          email: email,
          phone: '',
          roleName: 'Administrador',
          createdAt: new Date()
        });
      }

      // Verificar si los roles ya existen
      const rolesSnapshot = await getDocs(collection(db, 'roles'));
      if (rolesSnapshot.empty) {
        toast = { show: true, message: 'Creando roles del sistema...', type: 'info' };
        await setDoc(doc(db, 'roles', 'admin_role'), {
          name: 'Administrador',
          permissions: {
            users: true, roles: true, products: true, categories: true,
            suppliers: true, purchases: true, sales: true, settings: true
          },
          createdAt: new Date()
        });
        await setDoc(doc(db, 'roles', 'seller_role'), {
          name: 'Vendedor',
          permissions: {
            users: false, roles: false, products: true, categories: true,
            suppliers: true, purchases: true, sales: true, settings: false
          },
          createdAt: new Date()
        });
      }

      // Verificar si la configuración ya existe
      const configDoc = await getDoc(doc(db, 'settings', 'config'));
      if (!configDoc.exists()) {
        toast = { show: true, message: 'Configurando umbrales de alerta...', type: 'info' };
        await setDoc(doc(db, 'settings', 'config'), {
          alertThresholds: { stockYellow: 10, stockRed: 5, expiryYellow: 30, expiryRed: 7 },
          ivaPercentage: 19
        });
      }

      // Verificar si las categorías ya existen
      const catSnapshot = await getDocs(collection(db, 'categories'));
      if (catSnapshot.empty) {
        toast = { show: true, message: 'Creando categorías de ejemplo...', type: 'info' };
        const uid = auth.currentUser?.uid || '';
        const categories = [
          { name: 'Bebidas', description: 'Gaseosas, jugos, aguas y bebidas en general' },
          { name: 'Paquetes', description: 'Productos en paquete y presentaciones familiares' },
          { name: 'Dulcería', description: 'Golosinas, chocolates y dulces' },
          { name: 'Snacks', description: 'Papas, galletas y aperitivos' },
          { name: 'Lácteos', description: 'Leche, queso, yogur y derivados' },
          { name: 'Abarrotes', description: 'Arroz, frijoles, aceite y productos básicos' },
          { name: 'Higiene', description: 'Productos de aseo personal y del hogar' }
        ];
        for (const cat of categories) {
          const catRef = doc(collection(db, 'categories'));
          await setDoc(catRef, { ...cat, ownerId: uid, createdAt: new Date() });
        }
      }

      // Verificar si los productos ya existen
      const prodSnapshot = await getDocs(collection(db, 'products'));
      if (prodSnapshot.empty) {
        toast = { show: true, message: 'Creando productos de ejemplo...', type: 'info' };
        const uid = auth.currentUser?.uid || '';
        const catSnap = await getDocs(collection(db, 'categories'));
        const catMap = {};
        catSnap.forEach(d => { catMap[d.data().name] = d.id; });

        const products = [
          { name: 'Gaseosa Cola 400ml', categoryId: catMap['Bebidas'], purchasePrice: 1200, salePrice: 2000, currentStock: 48, minimumStock: 10, expiryDate: new Date('2026-12-31') },
          { name: 'Jugo de Naranja 500ml', categoryId: catMap['Bebidas'], purchasePrice: 1000, salePrice: 1800, currentStock: 24, minimumStock: 10, expiryDate: new Date('2026-10-15') },
          { name: 'Agua Botellón 600ml', categoryId: catMap['Bebidas'], purchasePrice: 600, salePrice: 1200, currentStock: 36, minimumStock: 15, expiryDate: new Date('2027-06-01') },
          { name: 'Paquete Arroz 1kg', categoryId: catMap['Paquetes'], purchasePrice: 3500, salePrice: 5000, currentStock: 20, minimumStock: 8, expiryDate: new Date('2027-01-15') },
          { name: 'Paquete Frijol 1kg', categoryId: catMap['Paquetes'], purchasePrice: 4000, salePrice: 5800, currentStock: 15, minimumStock: 8, expiryDate: new Date('2027-03-20') },
          { name: 'Chocolate Bon Bon Bum', categoryId: catMap['Dulcería'], purchasePrice: 400, salePrice: 800, currentStock: 60, minimumStock: 20, expiryDate: new Date('2026-09-10') },
          { name: 'Galletas Saltin 6p', categoryId: catMap['Dulcería'], purchasePrice: 1500, salePrice: 2500, currentStock: 5, minimumStock: 10, expiryDate: new Date('2026-08-05') },
          { name: 'Papas Margarita 45g', categoryId: catMap['Snacks'], purchasePrice: 1200, salePrice: 2000, currentStock: 30, minimumStock: 12, expiryDate: new Date('2026-11-20') },
          { name: 'Leche Entera 1L', categoryId: catMap['Lácteos'], purchasePrice: 2800, salePrice: 4000, currentStock: 8, minimumStock: 10, expiryDate: new Date('2026-07-10') },
          { name: 'Aceite Vegetal 500ml', categoryId: catMap['Abarrotes'], purchasePrice: 4500, salePrice: 6500, currentStock: 12, minimumStock: 5, expiryDate: new Date('2027-05-01') },
          { name: 'Jabón en Barra', categoryId: catMap['Higiene'], purchasePrice: 1800, salePrice: 3000, currentStock: 25, minimumStock: 10, expiryDate: null },
          { name: 'Papel Higiénico 4 rollos', categoryId: catMap['Higiene'], purchasePrice: 3500, salePrice: 5500, currentStock: 4, minimumStock: 8, expiryDate: null }
        ];
        for (const prod of products) {
          const prodRef = doc(collection(db, 'products'));
          const barcode = (Date.now().toString().slice(-8) + String(products.indexOf(prod)).padStart(4, '0')).slice(0, 12);
          await setDoc(prodRef, { ...prod, barcode, ownerId: uid, createdAt: new Date() });
        }
      }

      // Cerrar sesión para que el usuario pueda iniciar sesión normalmente
      await auth.signOut();

      toast = { show: true, message: '¡Configuración completada!', type: 'success' };
      step = 3;

    } catch (error) {
      console.error('Error during setup:', error);
      let msg = 'Error durante la configuración';
      if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta';
      else if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado';
      else if (error.code === 'auth/weak-password') msg = 'La contraseña es muy débil';
      else if (error.code === 'auth/invalid-email') msg = 'Correo electrónico inválido';
      else msg = error.message;
      toast = { show: true, message: msg, type: 'error' };
    }
    loading = false;
  }

  function goToLogin() {
    push('/login');
  }
</script>

<div class="setup-container">
  <div class="setup-card">
    {#if step === 1}
      <div class="setup-header">
        <img src="/logo.png" alt="Tienda La Cigarra" class="setup-logo" />
        <h1>La Cigarra</h1>
        <p class="subtitle">Configuración Inicial del Sistema</p>
      </div>

      <div class="setup-info">
        <div class="info-icon">🚀</div>
        <h2>¡Bienvenido!</h2>
        <p>Esta es la primera vez que ejecutas el sistema. Vamos a configurar el usuario administrador y los datos iniciales.</p>
      </div>

      <form on:submit|preventDefault={setup}>
        <div class="form-group">
          <label for="name">Tu nombre completo</label>
          <input id="name" type="text" bind:value={name} placeholder="Ej: María José" required />
        </div>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" bind:value={email} placeholder="admin@cinar.com" required />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input id="password" type="password" bind:value={password} placeholder="Mínimo 6 caracteres" required />
        </div>

        <Button type="submit" {loading} fullWidth={true}>
          Configurar Sistema
        </Button>
      </form>

    {:else if step === 3}
      <div class="setup-header">
        <h1>La Cigarra</h1>
      </div>

      <div class="success-container">
        <div class="success-icon">✅</div>
        <h2>¡Configuración Completa!</h2>
        <p>Se han creado exitosamente:</p>
        <ul>
          <li>Usuario administrador</li>
          <li>Roles del sistema</li>
          <li>Configuración de alertas</li>
          <li>7 categorías de productos</li>
          <li>12 productos de ejemplo</li>
        </ul>

        <Button fullWidth={true} on:click={goToLogin}>
          Ir al Inicio de Sesión
        </Button>
      </div>
    {/if}
  </div>
</div>

<Toast show={toast.show} message={toast.message} type={toast.type} on:close={() => toast.show = false} />

<style>
  .setup-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    padding: 1.5rem;
  }

  .setup-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }

  .setup-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .setup-logo {
    max-width: 200px;
    height: auto;
    margin-bottom: 1rem;
    border-radius: 12px;
  }

  .setup-header h1 {
    font-size: 2rem;
    color: #1e40af;
    margin: 0;
    letter-spacing: 2px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 0.9rem;
    margin-top: 0.35rem;
  }

  .setup-info {
    text-align: center;
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background: #eff6ff;
    border-radius: 12px;
  }

  .info-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

  .setup-info h2 {
    font-size: 1.2rem;
    color: #1e40af;
    margin: 0 0 0.5rem;
  }

  .setup-info p {
    color: #4b5563;
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.3rem;
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
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30,64,175,0.1);
  }

  .success-container {
    text-align: center;
    padding: 1rem 0;
  }

  .success-icon { font-size: 3rem; margin-bottom: 0.75rem; }

  .success-container h2 {
    color: #16a34a;
    font-size: 1.3rem;
    margin: 0 0 1rem;
  }

  .success-container p {
    color: #374151;
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
  }

  .success-container ul {
    text-align: left;
    list-style: none;
    padding: 0;
    margin: 0 0 1.5rem;
  }

  .success-container li {
    padding: 0.5rem 0.5rem 0.5rem 1.5rem;
    position: relative;
    color: #374151;
    font-size: 0.9rem;
  }

  .success-container li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #16a34a;
    font-weight: 700;
  }
</style>
