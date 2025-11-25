import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.appspot.com",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

if (!getApps().length) initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const emailEl = document.getElementById("email");
const senhaEl = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const btnRegistro = document.getElementById("btnRegistro");
const erroEl = document.getElementById("erro");

if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    const email = emailEl.value.trim();
    const senha = senhaEl.value.trim();
    erroEl.textContent = "";
    if (!email || !senha) {
      erroEl.textContent = "Informe email e senha.";
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // redireciona automaticamente via onAuthStateChanged
    } catch (e) {
      erroEl.textContent = "Erro: " + (e.message || "falha no login");
    }
  });
}

if (btnRegistro) {
  btnRegistro.addEventListener("click", async () => {
    const email = emailEl.value.trim();
    const senha = senhaEl.value.trim();
    erroEl.textContent = "";
    if (!email || !senha) {
      erroEl.textContent = "Informe email e senha.";
      return;
    }
    try {
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = res.user.uid;
      // usuário escolhe função após registro
      const funcao = prompt("Você é:\n1 = Professor\n2 = Aluno\nDigite 1 ou 2:");
      if (funcao === "1") {
        await setDoc(doc(db, "users", uid), { email, funcao: "professor" });
      } else if (funcao === "2") {
        await setDoc(doc(db, "users", uid), { email, funcao: "aluno" });
      } else {
        erroEl.textContent = "Função inválida.";
        return;
      }
      erroEl.textContent = "Registrado com sucesso. Faça login.";
      emailEl.value = "";
      senhaEl.value = "";
    } catch (e) {
      erroEl.textContent = "Erro: " + (e.message || "falha no registro");
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const funcao = snap.exists() ? snap.data().funcao : null;
      if (funcao === "professor") {
        window.location.href = "professor.html";
      } else if (funcao === "aluno") {
        window.location.href = "aluno.html";
      }
    } catch (e) {
      console.error(e);
    }
  }
});

// exportar para usar em outras páginas
export { auth, db };