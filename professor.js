import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.appspot.com",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

const btnAviso = document.getElementById("btnAviso");
const tituloAvisoEl = document.getElementById("tituloAviso");
const msgAvisoEl = document.getElementById("msgAviso");
const listaAvisosEl = document.getElementById("listaAvisos");
const listaFeedbacksEl = document.getElementById("listaFeedbacks");
const statusAvisoEl = document.getElementById("statusAviso");
const btnSair = document.getElementById("btnSair");

if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

function formatDate(ts) {
  if (!ts) return "";
  try {
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts && ts.seconds && typeof ts.toMillis === "function") return new Date(ts.toMillis()).toLocaleString();
    return new Date(ts).toLocaleString();
  } catch { return ""; }
}

window.mudarAba = function(aba) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(aba).classList.add("active");
  event.target.classList.add("active");
  
  if (aba === "avisos") carregarAvisos();
  if (aba === "feedbacks") carregarFeedbacks();
}

// AVISOS
if (btnAviso) {
  btnAviso.addEventListener("click", async () => {
    const titulo = tituloAvisoEl.value.trim();
    const msg = msgAvisoEl.value.trim();
    statusAvisoEl.textContent = "";
    if (!titulo || !msg) {
      statusAvisoEl.textContent = "Preencha título e mensagem.";
      return;
    }
    statusAvisoEl.textContent = "Publicando...";
    try {
      await addDoc(collection(db, "avisos"), { titulo, msg, data: new Date() });
      tituloAvisoEl.value = "";
      msgAvisoEl.value = "";
      statusAvisoEl.textContent = "Aviso publicado!";
      setTimeout(() => statusAvisoEl.textContent = "", 2500);
      carregarAvisos();
    } catch (e) {
      console.error(e);
      statusAvisoEl.textContent = "Erro ao publicar.";
    }
  });
}

async function carregarAvisos() {
  if (!listaAvisosEl) return;
  listaAvisosEl.innerHTML = "<p class='muted'>Carregando...</p>";
  try {
    const q = query(collection(db, "avisos"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    listaAvisosEl.innerHTML = "";
    if (snap.empty) {
      listaAvisosEl.innerHTML = "<p class='muted'>Sem avisos publicados.</p>";
      return;
    }
    snap.forEach(d => {
      const a = d.data();
      const id = d.id;
      const item = document.createElement("div");
      item.className = "feedback-item";
      item.innerHTML = `
        <b>${a.titulo}</b>
        <div class="muted" style="font-size:12px;margin:4px 0;">${formatDate(a.data)}</div>
        <div style="margin:8px 0;">${(a.msg || "").replace(/\n/g, "<br>")}</div>
        <div class="btn-group">
          <button class="btn-edit" onclick="editarAviso('${id}')">✏️ Editar</button>
          <button class="btn-delete" onclick="excluirAviso('${id}')">🗑️ Excluir</button>
        </div>
      `;
      listaAvisosEl.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    listaAvisosEl.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>";
  }
}

window.editarAviso = async function(id) {
  const novoTitulo = prompt("Novo título:");
  if (!novoTitulo) return;
  const novaMsg = prompt("Nova mensagem:");
  if (!novaMsg) return;
  try {
    await updateDoc(doc(db, "avisos", id), { titulo: novoTitulo, msg: novaMsg, data: new Date() });
    carregarAvisos();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar.");
  }
}

window.excluirAviso = async function(id) {
  if (!confirm("Excluir este aviso?")) return;
  try {
    await deleteDoc(doc(db, "avisos", id));
    carregarAvisos();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir.");
  }
}

// FEEDBACKS
async function carregarFeedbacks() {
  if (!listaFeedbacksEl) return;
  listaFeedbacksEl.innerHTML = "<p class='muted'>Carregando...</p>";
  try {
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    listaFeedbacksEl.innerHTML = "";
    if (snap.empty) {
      listaFeedbacksEl.innerHTML = "<p class='muted'>Sem feedbacks.</p>";
      return;
    }
    snap.forEach(d => {
      const f = d.data();
      const id = d.id;
      const item = document.createElement("div");
      item.className = "feedback-item";
      item.innerHTML = `
        <b>${f.turma || "Sem turma"}</b>
        <div class="muted" style="font-size:12px;margin:4px 0;">${formatDate(f.data)} • Função: ${f.funcao || "-"}</div>
        <div style="margin:8px 0;"><strong>Atividade:</strong> ${(f.feedback || "").replace(/\n/g, "<br>")}</div>
        <div class="btn-group">
          <button class="btn-reply" onclick="responderFeedback('${id}')">💬 Responder</button>
          <button class="btn-edit" onclick="editarFeedback('${id}')">✏️ Editar</button>
          <button class="btn-delete" onclick="excluirFeedback('${id}')">🗑️ Excluir</button>
        </div>
        <div id="respostas-${id}" style="margin-top:10px;"></div>
      `;
      listaFeedbacksEl.appendChild(item);
      carregarRespostas(id);
    });
  } catch (e) {
    console.error(e);
    listaFeedbacksEl.innerHTML = "<p class='muted'>Erro ao carregar feedbacks.</p>";
  }
}

async function carregarRespostas(feedbackId) {
  const container = document.getElementById(`respostas-${feedbackId}`);
  if (!container) return;
  try {
    const snap = await getDocs(query(collection(db, "feedbacks", feedbackId, "respostas"), orderBy("data", "asc")));
    if (snap.empty) return;
    snap.forEach(d => {
      const r = d.data();
      const rid = d.id;
      const div = document.createElement("div");
      div.className = "resposta-item";
      div.innerHTML = `
        <small>${r.autor || "professor"} - ${formatDate(r.data)}</small>
        <div style="margin:6px 0;">${(r.texto || "").replace(/\n/g, "<br>")}</div>
        <div class="btn-group">
          <button class="btn-edit" style="padding:4px 8px;font-size:11px;" onclick="editarResposta('${feedbackId}','${rid}')">✏️ Editar</button>
          <button class="btn-delete" style="padding:4px 8px;font-size:11px;" onclick="excluirResposta('${feedbackId}','${rid}')">🗑️ Excluir</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
  }
}

window.responderFeedback = async function(id) {
  const texto = prompt("Sua resposta:");
  if (!texto) return;
  try {
    await addDoc(collection(db, "feedbacks", id, "respostas"), { texto, autor: "professor", data: new Date() });
    await updateDoc(doc(db, "feedbacks", id), { respondido: true });
    carregarFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao responder.");
  }
}

window.editarFeedback = async function(id) {
  const novo = prompt("Editar feedback:");
  if (!novo) return;
  try {
    await updateDoc(doc(db, "feedbacks", id), { feedback: novo, data: new Date() });
    carregarFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar.");
  }
}

window.excluirFeedback = async function(id) {
  if (!confirm("Excluir feedback?")) return;
  try {
    await deleteDoc(doc(db, "feedbacks", id));
    carregarFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir.");
  }
}

window.editarResposta = async function(feedbackId, respostaId) {
  const novo = prompt("Editar resposta:");
  if (!novo) return;
  try {
    await updateDoc(doc(db, "feedbacks", feedbackId, "respostas", respostaId), { texto: novo, data: new Date() });
    carregarFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao editar resposta.");
  }
}

window.excluirResposta = async function(feedbackId, respostaId) {
  if (!confirm("Excluir resposta?")) return;
  try {
    await deleteDoc(doc(db, "feedbacks", feedbackId, "respostas", respostaId));
    carregarFeedbacks();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir resposta.");
  }
}

carregarAvisos();
carregarFeedbacks();