import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Carga una imagen de producto a Firebase Storage.
 * @param {File} file El archivo de imagen a cargar.
 * @param {string} productId ID opcional o identificador para nombrar el archivo.
 * @returns {Promise<string>} La URL de descarga pública de la imagen cargada.
 */
export async function uploadProductImage(file, productId = 'temp') {
  if (!file) throw new Error('No se proporcionó ningún archivo');
  
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `products/${productId}_${Date.now()}.${fileExtension}`;
  const storageRef = ref(storage, fileName);
  
  // Timeout de 8 segundos para evitar que la interfaz se congele si la carga falla o cuelga
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Tiempo de espera agotado en la subida. Verifica que Firebase Storage esté activado en tu consola Firebase y que las reglas permitan escribir.')), 8000)
  );
  
  try {
    // Competencia de promesas
    const snapshot = await Promise.race([
      uploadBytes(storageRef, file),
      timeoutPromise
    ]);
    
    // Obtener la URL de descarga pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error al subir imagen a Firebase Storage:', error);
    
    // Personalizar el mensaje según códigos comunes de Firebase Storage
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permiso denegado: Las reglas de Firebase Storage no permiten la subida de archivos. Activa el acceso de lectura/escritura público o autenticado.');
    } else if (error.code === 'storage/project-not-found') {
      throw new Error('Proyecto no encontrado: El bucket de Firebase Storage no está creado o configurado.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Límite excedido: Se ha superado la cuota de Firebase Storage gratis.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Error desconocido al subir el archivo. Revisa la consola del navegador.');
    }
    
    throw error;
  }
}

/**
 * Elimina una imagen de producto de Firebase Storage usando su URL.
 * @param {string} url La URL de descarga de la imagen a eliminar.
 * @returns {Promise<boolean>} Verdadero si se eliminó con éxito.
 */
export async function deleteProductImage(url) {
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com')) {
    return false;
  }
  
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    return true;
  } catch (e) {
    console.error('Error al eliminar imagen de Storage:', e);
    return false;
  }
}
