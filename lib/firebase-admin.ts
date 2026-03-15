import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.trim()
    .replace(/^"|"$/g, "")   // quita comillas envolventes si existen
    .replace(/\\n/g, "\n");  // convierte \n a saltos reales

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltan variables de entorno de Firebase Admin");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}