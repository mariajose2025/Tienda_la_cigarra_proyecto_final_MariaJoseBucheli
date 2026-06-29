import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth as authStore } from '../stores/auth';

const googleProvider = new GoogleAuthProvider();

export function initAuthListener() {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        authStore.setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          ...userData
        });
      } else {
        authStore.setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          name: firebaseUser.email,
          roleName: 'Vendedor'
        });
      }
    } else {
      authStore.clear();
    }
  });
}

export async function loginWithGoogle() {
  try {
    authStore.setLoading(true);
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName || '',
        email: result.user.email,
        phone: '',
        cedula: '',
        birthDate: '',
        sex: '',
        age: 0,
        photoURL: result.user.photoURL || '',
        roleId: '',
        roleName: 'Vendedor',
        createdAt: new Date()
      });
    }
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Google sign-in error:', error);
    const msg = getErrorMessage(error.code);
    authStore.setError(msg);
    return { success: false, error: msg };
  }
}

export async function login(email, password) {
  try {
    authStore.setLoading(true);
    const result = await signInWithEmailAndPassword(auth, email, password);

    if (!result.user.emailVerified) {
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('No se pudo enviar verificación:', e);
      }
      return { success: true, user: result.user, emailNotVerified: true };
    }

    return { success: true, user: result.user };
  } catch (error) {
    authStore.setError(getErrorMessage(error.code));
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function register(email, password, userData) {
  try {
    authStore.setLoading(true);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', result.user.uid), {
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
    try {
      await sendEmailVerification(result.user);
    } catch (e) {
      console.warn('Error enviando verificación:', e);
    }
    return { success: true, user: result.user };
  } catch (error) {
    authStore.setError(getErrorMessage(error.code));
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function resendVerificationEmail() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
    await sendEmailVerification(user);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error.code) };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    authStore.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function changeUserPassword(newPassword) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');
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
    'auth/popup-closed-by-user': 'Se cerró la ventana de Google',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente. Permite popups para este sitio.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método de inicio de sesión',
    'auth/operation-not-allowed': 'El inicio de sesión con Google no está habilitado. Actívalo en la consola de Firebase.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado. Agrégalo en Firebase Console > Authentication > Settings'
  };
  return messages[code] || `Error de autenticación (${code})`;
}
