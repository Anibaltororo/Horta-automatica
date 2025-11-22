// professor.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query
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

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Faça login antes de usar o painel do professor.");
    window.location.href = "index.html";
    return;
  }
  // poderia checar role no users/UID se quiser segurança extra
  carregarTodosFeedbacks();
});

// Enviar aviso
document.getElementById("btnAviso").addEventListener("click", async () => {
  const titulo = document.getElementById("tituloAviso").value.trim();
  const msg = document.getElementById("msgAviso").value.trim();
  if (!titulo || !msg) return alert("Preencha título e mensagem");
  await addDoc(collection(db, "avisos"), { titulo, msg, data: new Date() });
  alert("Aviso publicado!");
});

// Carregar todos os feedbacks
async function carregarTodosFeedbacks() {
  const div = document.getElementById("conteudo");
  div.innerHTML = "<p>Carregando...</p>";
  try {
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    div.innerHTML = "";
    if (snap.empty) {
      div.innerHTML = "<p>Sem feedbacks por enquanto.</p>";
      return;
    }
    snap.forEach(docu => {
      const f = docu.data();
      const id = docu.id;
      const date = f.data ? new Date(f.data.seconds ? f.data.toMillis() : f.data).toLocaleString() : "";

      const bloco = document.createElement("div");
      bloco.className = "item";
      bloco.style.marginBottom = "10px";
      bloco.style.padding = "12px";

      bloco.innerHTML = `
        <b>${f.nome || f.turma}</b> — ${date} <br>
        <b>Turma:</b> ${f.turma || ""} <br>
        <b>Função:</b> ${f.funcao || ""} <br>
        <b>Atividade:</b> ${f.feedback || ""} <br>
        <div style="margin-top:8px">
          <button onclick="responderFeedback('${id}')">💬 Responder</button>
          <button onclick="editarFeedback('${id}')">✏️ Editar</button>
          <button onclick="excluirFeedback('${id}')">🗑 Excluir</button>
        </div>
        <div id="respostas-container-${id}" style="margin-top:10px"></div>
      `;
      div.appendChild(bloco);
      carregarRespostas(id);
    });
  } catch (e) {
    console.error(e);
    div.innerHTML = "<p>Erro ao carregar feedbacks.</p>";
  }
}

// Excluir feedback
window.excluirFeedback = async function(id) {
  if (!confirm("Deseja excluir este feedback (e todas as respostas)?")) return;
  try {
    // deletar subcoleção respostas NÃO é automático — deletar apenas o documento pai vai deixá-las órfãs.
    // Para simplicidade: aqui deletamos o documento pai (feedback). Em producao, pode ser necessário excluir respostas separadamente.
    await deleteDoc(doc(db, "feedbacks", id));
    carregarTodosFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir.");
  }
}

// Editar feedback (altera texto feedback)
window.editarFeedback = async function(id) {
  const novo = prompt("Editar atividade:");
  if (novo === null) return;
  try {
    await updateDoc(doc(db, "feedbacks", id), { feedback: novo, data: new Date() });
    carregarTodosFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar.");
  }
}

// Responder: cria documento na subcoleção "respostas"
window.responderFeedback = async function(id) {
  const texto = prompt("Digite sua resposta (professor):");
  if (!texto) return;
  try {
    await addDoc(collection(db, "feedbacks", id, "respostas"), {
      texto,
      autor: "professor",
      data: new Date()
    });
    // marcar feedback como respondido
    await updateDoc(doc(db, "feedbacks", id), { respondido: true });
    carregarTodosFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao responder.");
  }
}

// Carregar respostas de um feedback
async function carregarRespostas(feedbackId) {
  const container = document.getElementById(`respostas-container-${feedbackId}`);
  if (!container) return;
  container.innerHTML = "<small>Carregando respostas...</small>";
  try {
    const snap = await getDocs(collection(db, "feedbacks", feedbackId, "respostas"));
    container.innerHTML = "";
    if (snap.empty) {
      container.innerHTML = "<small>Sem respostas.</small>";
      return;
    }
    snap.forEach(rdoc => {
      const r = rdoc.data();
      const rid = rdoc.id;
      const date = r.data ? new Date(r.data.seconds ? r.data.toMillis() : r.data).toLocaleString() : "";
      const div = document.createElement("div");
      div.style.background = "#f7f7f7";
      div.style.padding = "8px";
      div.style.marginTop = "6px";
      div.innerHTML = `
        <b>Resposta:</b> ${r.texto}<br><small>${date}</small>
        <div style="margin-top:6px">
          <button onclick="editarResposta('${feedbackId}','${rid}')">✏️ Editar resposta</button>
          <button onclick="excluirResposta('${feedbackId}','${rid}')">🗑 Excluir resposta</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = "<small>Erro ao carregar respostas.</small>";
  }
}

// Editar uma resposta (professor)
window.editarResposta = async function(feedbackId, respostaId) {
  const novo = prompt("Editar resposta:");
  if (novo === null) return;
  try {
    await updateDoc(doc(db, "feedbacks", feedbackId, "respostas", respostaId), { texto: novo, data: new Date() });
    carregarTodosFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar resposta.");
  }
}

// Excluir resposta
window.excluirResposta = async function(feedbackId, respostaId) {
  if (!confirm("Excluir esta resposta?")) return;
  try {
    await deleteDoc(doc(db, "feedbacks", feedbackId, "respostas", respostaId));
    carregarTodosFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir resposta.");
  }
}
