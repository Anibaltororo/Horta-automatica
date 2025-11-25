import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// EMAILS APROVADOS DE PROFESSOR
const EMAILS_PROFESSOR_APROVADOS = [
  "professor@horta.com",
  "prof@school.com"
];

const emailLoginEl = document.getElementById("emailLogin");
const senhaLoginEl = document.getElementById("senhaLogin");
const btnLogin = document.getElementById("btnLogin");
const erroLoginEl = document.getElementById("erroLogin");

const tipoUsuarioEl = document.getElementById("tipoUsuario");
const nomeRegistroEl = document.getElementById("nomeRegistro");
const turmaRegistroEl = document.getElementById("turmaRegistro");
const emailRegistroEl = document.getElementById("emailRegistro");
const senhaRegistroEl = document.getElementById("senhaRegistro");
const confirmarSenhaRegistroEl = document.getElementById("confirmarSenhaRegistro");
const btnRegistro = document.getElementById("btnRegistro");
const erroRegistroEl = document.getElementById("erroRegistro");

// Mostrar/ocultar campo turma
tipoUsuarioEl.addEventListener("change", () => {
  if (tipoUsuarioEl.value === "aluno") {
    turmaRegistroEl.style.display = "block";
  } else {
    turmaRegistroEl.style.display = "none";
  }
});

// LOGIN
if (btnLogin) {
  btnLogin.addEventListener("click", async () => {
    const email = emailLoginEl.value.trim();
    const senha = senhaLoginEl.value.trim();
    erroLoginEl.textContent = "";
    if (!email || !senha) {
      erroLoginEl.textContent = "Informe email e senha.";
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) {
      erroLoginEl.textContent = "Email ou senha incorretos.";
    }
  });
}

// REGISTRO
if (btnRegistro) {
  btnRegistro.addEventListener("click", async () => {
    const tipo = tipoUsuarioEl.value;
    const nome = nomeRegistroEl.value.trim();
    const turma = turmaRegistroEl.value.trim();
    const email = emailRegistroEl.value.trim();
    const senha = senhaRegistroEl.value.trim();
    const confirmarSenha = confirmarSenhaRegistroEl.value.trim();

    erroRegistroEl.textContent = "";

    if (!tipo || !nome || !email || !senha) {
      erroRegistroEl.textContent = "Preencha todos os campos obrigatórios.";
      return;
    }

    if (tipo === "aluno" && !turma) {
      erroRegistroEl.textContent = "Informe a turma.";
      return;
    }

    if (senha !== confirmarSenha) {
      erroRegistroEl.textContent = "As senhas não coincidem.";
      return;
    }

    // Validar email de professor
    if (tipo === "professor" && !EMAILS_PROFESSOR_APROVADOS.includes(email)) {
      erroRegistroEl.textContent = "Este email não está autorizado para professor.";
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = res.user.uid;

      await setDoc(doc(db, "users", uid), {
        email,
        nome,
        funcao: tipo,
        turma: tipo === "aluno" ? turma : "",
        criadoEm: new Date()
      });

      erroRegistroEl.textContent = "";
      erroRegistroEl.style.color = "#16a34a";
      erroRegistroEl.textContent = "Registrado com sucesso! Faça login.";
      setTimeout(() => {
        emailLoginEl.value = email;
        senhaLoginEl.value = "";
        mudarTabLogin("login");
        erroRegistroEl.textContent = "";
      }, 2000);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        erroRegistroEl.textContent = "Este email já está registrado.";
      } else {
        erroRegistroEl.textContent = "Erro ao registrar: " + (e.message || "tente novamente");
      }
    }
  });
}

window.mudarTabLogin = function(aba) {
  document.querySelectorAll(".tab-login").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-login-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(aba).classList.add("active");
  event.target.classList.add("active");
}

// REDIRECIONAR APÓS LOGIN
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

export { auth, db };