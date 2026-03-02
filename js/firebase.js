// 1. Importar as funções necessárias do SDK do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    addDoc, 
    serverTimestamp, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. A tua configuração do Firebase (Extraída do teu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyADGLXQ7iEGHOoib0UQecPuCenoVn-wmDM",
  authDomain: "ponte-matosinhos.firebaseapp.com",
  projectId: "ponte-matosinhos",
  storageBucket: "ponte-matosinhos.firebasestorage.app",
  messagingSenderId: "892774507326",
  appId: "1:892774507326:web:52ab47690e7fdc495bc26f"
};

// 3. Inicializar o Firebase e o Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Exportar tudo para que o app.js e o historico.js possam utilizar
export { 
    db, 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    addDoc, 
    serverTimestamp, 
    getDocs 
};