// aluno.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.appspot.com",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// segurança: só permite ações quando auth estiver pronto
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Você precisa estar logado para usar a área do aluno.");
    window.location.href = "index.html"; // volta ao login
    return;
  }
  currentUser = user;
  carregarMeusRegistros();
});

// Enviar registro
document.getElementById("btnEnviar").addEventListener("click", async () => {
  const turma = document.getElementById("turma").value.trim();
  const feedback = document.getElementById("feedback").value.trim();
  const funcao = document.getElementById("funcao").value.trim();

  if (!turma || !feedback) {
    alert("Preencha turma e feedback.");
    return;
  }

  try {
    await addDoc(collection(db, "feedbacks"), {
      uid: currentUser.uid,
      nome: currentUser.email || currentUser.displayName || "Aluno",
      turma,
      feedback,
      funcao,
      data: new Date(),
      respondido: false
    });
    document.getElementById("turma").value = "";
    document.getElementById("feedback").value = "";
    document.getElementById("funcao").value = "";
    carregarMeusRegistros();
    alert("Registro enviado!");
  } catch (e) {
    console.error("Erro ao enviar:", e);
    alert("Erro ao enviar registro.");
  }
});

// Carregar registros do aluno (por uid)
async function carregarMeusRegistros() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "<p>Carregando...</p>";

  try {
    const q = query(collection(db, "feedbacks"), where("uid", "==", currentUser.uid), orderBy("data", "desc"));
    const snap = await getDocs(q);
    lista.innerHTML = "";

    if (snap.empty) {
      lista.innerHTML = "<p>Você ainda não enviou registros.</p>";
      return;
    }

    snap.forEach(docu => {
      const d = docu.data();
      const id = docu.id;

      // formato de data
      const date = d.data ? new Date(d.data.seconds ? d.data.toMillis() : d.data).toLocaleString() : "";

      const bloco = document.createElement("div");
      bloco.className = "registro";
      bloco.style.padding = "12px";
      bloco.style.marginBottom = "8px";

      bloco.innerHTML = `
        <b>${d.turma}</b> — ${date} <br>
        <b>Função:</b> ${d.funcao} <br>
        <b>Atividade:</b> ${d.feedback} <br>
        <small>Respondido: ${d.respondido ? "Sim" : "Não"}</small>
        <div style="margin-top:8px">
          <button onclick="editarRegistro('${id}')">✏️ Editar</button>
          <button onclick="excluirRegistro('${id}')" style="margin-left:8px">🗑 Excluir</button>
        </div>
        <div id="respostas-${id}" style="margin-top:8px"></div>
      `;

      lista.appendChild(bloco);
      carregarRespostasVisuais(id);
    });
  } catch (e) {
    console.error(e);
    lista.innerHTML = "<p>Erro ao carregar.</p>";
  }
}

// Excluir próprio registro
window.excluirRegistro = async function(id) {
  if (!confirm("Excluir este registro?")) return;
  try {
    await deleteDoc(doc(db, "feedbacks", id));
    carregarMeusRegistros();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir.");
  }
}

// Editar próprio registro (apenas campos texto)
window.editarRegistro = async function(id) {
  const novo = prompt("Edite sua atividade:");
  if (novo === null) return;
  try {
    await updateDoc(doc(db, "feedbacks", id), { feedback: novo, data: new Date() });
    carregarMeusRegistros();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar.");
  }
}

// Carregar respostas (subcoleção) e mostrar para o aluno
import { getDocs as getSubDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
async function carregarRespostasVisuais(feedbackId) {
  const container = document.getElementById(`respostas-${feedbackId}`);
  if (!container) return;
  container.innerHTML = "<small>Carregando respostas...</small>";

  try {
    const snap = await getDocs(collection(db, "feedbacks", feedbackId, "respostas"));
    container.innerHTML = "";
    if (snap.empty) {
      container.innerHTML = "<small>Sem respostas ainda.</small>";
      return;
    }
    snap.forEach(rdoc => {
      const r = rdoc.data();
      const date = r.data ? new Date(r.data.seconds ? r.data.toMillis() : r.data).toLocaleString() : "";
      const div = document.createElement("div");
      div.style.background = "#f7f7f7";
      div.style.padding = "8px";
      div.style.marginTop = "6px";
      div.innerHTML = `<b>Resposta do professor</b> — ${date}<br>${r.texto}`;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = "<small>Erro ao carregar respostas.</small>";
  }
}
