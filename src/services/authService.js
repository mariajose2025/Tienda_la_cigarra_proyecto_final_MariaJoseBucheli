import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updatePassword
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth as authStore } from '../stores/auth';

const ADMIN_EMAIL = 'admin@cinar.com';

export function initAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      authStore.clear();
      return;
    }

    const isAdminUser = firebaseUser.email === ADMIN_EMAIL;

    if (!firebaseUser.emailVerified && !isAdminUser) {
      authStore.setUser(null);
      authStore.setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      authStore.setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        ...userData
      });
    } catch (e) {
      authStore.setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
        name: firebaseUser.email,
        roleName: isAdminUser ? 'Administrador' : 'Vendedor'
      });
    }
  });
}

export async function login(email, password) {
  try {
    authStore.setLoading(true);
    const result = await signInWithEmailAndPassword(auth, email, password);
    const isAdminUser = email === ADMIN_EMAIL;

    if (!result.user.emailVerified && !isAdminUser) {
      const emailAddr = result.user.email;
      authStore.setUser(null);
      authStore.setLoading(false);
      signOut(auth).catch(() => {});
      return { success: true, emailNotVerified: true, email: emailAddr };
    }

    authStore.setLoading(false);
    return { success: true };
  } catch (error) {
    authStore.setLoading(false);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

async function checkCedulaExists(cedula) {
  if (!cedula) return false;
  const q = query(collection(db, 'users'), where('cedula', '==', cedula));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function register(email, password, userData) {
  if (userData.cedula) {
    const exists = await checkCedulaExists(userData.cedula);
    if (exists) {
      return { success: false, error: 'Esta cédula ya está registrada con otro usuario' };
    }
  }

  let user = null;

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    user = result.user;
  } catch (error) {
    authStore.clear();
    return { success: false, error: getErrorMessage(error.code) };
  }

  authStore.clear();
  signOut(auth).catch(() => {});

  try {
    await setDoc(doc(db, 'users', user.uid), {
      name: userData.name || '',
      cedula: userData.cedula || '',
      email: email,
      phone: userData.phone || '',
      birthDate: userData.birthDate || '',
      sex: userData.sex || '',
      age: userData.age || 0,
      photoURL: '',
      roleId: '',
      roleName: 'Vendedor',
      createdAt: new Date()
    });
  } catch (e) {
    console.error('Error guardando datos del usuario:', e);
  }

  sendEmailVerification(user).catch(() => {});

  return { success: true, emailSent: true, emailError: null };
}

export async function resendVerificationEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(cred.user);
    authStore.clear();
    signOut(auth).catch(() => {});
    return { success: true };
  } catch (error) {
    authStore.clear();
    signOut(auth).catch(() => {});
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function logout() {
  try {
    authStore.clear();
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function changeUserPassword(newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'No hay sesión activa' };
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/email-already-in-use': 'El correo ya está registrado',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email': 'Correo electrónico inválido',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'auth/invalid-credential': 'Credenciales inválidas',
    'auth/network-request-failed': 'Error de red',
  };
  return messages[code] || `Error: ${code}`;
}
