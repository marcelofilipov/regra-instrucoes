import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { lerEnderecosDosEmuladores } from './emuladores'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app: FirebaseApp = initializeApp(config)
export const db: Firestore = getFirestore(app)
export const auth: Auth = getAuth(app)

// Em desenvolvimento, aponta para os emuladores.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const { host, portaDoFirestore, portaDoAuth } = lerEnderecosDosEmuladores(import.meta.env)
  connectFirestoreEmulator(db, host, portaDoFirestore)
  connectAuthEmulator(auth, `http://${host}:${portaDoAuth}`, { disableWarnings: true })
}
