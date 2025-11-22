import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.firebasestorage.app",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            alert("Erro: usuário sem role no Firestore.");
            return;
        }

        const role = snap.data().role;

        if (role === "professor") {
            window.location.href = "painel.html"; 
        } else if (role === "aluno") {
            window.location.href = "aluno.html"; 
        } else {
            alert("Erro: role desconhecido.");
        }

    } catch (error) {
        console.error("Login falhou:", error);
        alert("Email ou senha incorretos.");
    }
});
