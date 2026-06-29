import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAkPUwy3hzyTIUjUcCTSNgEPEyibiyaZ9c",
  authDomain: "cinarmecatos.firebaseapp.com",
  projectId: "cinarmecatos",
  storageBucket: "cinarmecatos.firebasestorage.app",
  messagingSenderId: "536488325040",
  appId: "1:536488325040:web:a06626e48cc5f0054a3075"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
