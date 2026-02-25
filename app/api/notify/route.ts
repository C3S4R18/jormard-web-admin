import * as admin from 'firebase-admin';
import { NextResponse } from 'next/server';

// Inicializamos Firebase de forma segura
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Esto arregla los saltos de línea de la llave privada
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  try {
    // Recibimos los datos desde tu panel de admin
    const { token, title, body } = await req.json();

    if (!token) return NextResponse.json({ error: 'Falta el token' }, { status: 400 });

    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };

    // Disparamos la notificación al celular
    await admin.messaging().send(message);
    
    return NextResponse.json({ success: true, message: "Notificación enviada" });
  } catch (error: any) {
    console.error("Error enviando push:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}