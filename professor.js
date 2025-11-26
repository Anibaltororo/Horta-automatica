import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, getDoc, setDoc
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

let usuarioAtual = null;
let chartTemp = null, chartUmidade = null, chartLumi = null, chartPH = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    usuarioAtual = snap.data();
    document.getElementById("nomeUsuario").textContent = usuarioAtual.nome || "Professor";
  }
});

const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

window.mudarPagina = function(pagina) {
  document.querySelectorAll(".pagina").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(el => el.classList.remove("active"));
  document.getElementById(pagina).classList.add("active");
  event.target.classList.add("active");

  const titulos = {
    dashboard: "📊 Dashboard",
    avisos: "📢 Publicar Avisos",
    feedbacks: "💬 Feedbacks dos Alunos",
    cursos: "📚 Gerenciar Cursos",
    projeto: "🌿 Informações do Projeto",
    graficos: "📈 Gráficos e Estatísticas"
  };
  document.getElementById("tituloPagina").textContent = titulos[pagina] || "Horta";

  if (pagina === "avisos") carregarAvisos();
  if (pagina === "feedbacks") carregarFeedbacks();
  if (pagina === "cursos") carregarCursos();
  if (pagina === "projeto") carregarProjeto();
  if (pagina === "graficos") carregarGraficos();
}

function formatDate(ts) {
  if (!ts) return "";
  try {
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts && ts.seconds && typeof ts.toMillis === "function") return new Date(ts.toMillis()).toLocaleString();
    return new Date(ts).toLocaleString();
  } catch { return ""; }
}

// ===== SENSORES =====
async function carregarSensores() {
  try {
    const snap = await getDoc(doc(db, "sensores", "horta"));
    if (snap.exists()) {
      const dados = snap.data();
      document.getElementById("temp").textContent = dados.temperatura ? dados.temperatura.toFixed(1) + " °C" : "-- °C";
      document.getElementById("umidade").textContent = dados.umidade ? dados.umidade.toFixed(1) + " %" : "-- %";
      document.getElementById("lumi").textContent = dados.luminosidade ? dados.luminosidade.toFixed(0) + " lux" : "-- lux";
      document.getElementById("ph").textContent = dados.ph ? dados.ph.toFixed(2) : "-- ";
    }
  } catch (e) {
    console.error("Erro ao carregar sensores:", e);
  }
}

// ===== REGISTROS =====
async function carregarRegistros() {
  const listaEl = document.getElementById("lista");
  if (!listaEl) return;
  listaEl.innerHTML = "<p class='muted'>Carregando registros...</p>";
  try {
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      listaEl.innerHTML = "<p class='muted'>Sem registros ainda.</p>";
      return;
    }
    listaEl.innerHTML = "";
    snap.forEach(d => {
      const f = d.data();
      const item = document.createElement("div");
      item.className = "registro";
      item.innerHTML = `
        <b>${f.turma || "Turma não informada"}</b> - ${f.aluno || "Aluno"}
        <div class="meta">${formatDate(f.data)} • ${f.funcao || ""}</div>
        <div>${(f.feedback || "").replace(/\n/g, "<br>")}</div>
        ${f.respondido ? '<div style="color:#16a34a;font-size:12px;margin-top:6px;">✓ Respondido</div>' : ''}
      `;
      listaEl.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    listaEl.innerHTML = "<p class='muted'>Erro ao carregar registros.</p>";
  }
}

// ===== AVISOS =====
const btnAviso = document.getElementById("btnAviso");
const tituloAvisoEl = document.getElementById("tituloAviso");
const msgAvisoEl = document.getElementById("msgAviso");
const statusAvisoEl = document.getElementById("statusAviso");

if (btnAviso) {
  btnAviso.addEventListener("click", async () => {
    const titulo = tituloAvisoEl.value.trim();
    const msg = msgAvisoEl.value.trim();
    statusAvisoEl.textContent = "";
    if (!titulo || !msg) {
      statusAvisoEl.textContent = "⚠️ Preencha título e mensagem.";
      return;
    }
    statusAvisoEl.textContent = "Publicando...";
    try {
      await addDoc(collection(db, "avisos"), { titulo, msg, data: new Date() });
      tituloAvisoEl.value = "";
      msgAvisoEl.value = "";
      statusAvisoEl.textContent = "✓ Aviso publicado!";
      setTimeout(() => statusAvisoEl.textContent = "", 2500);
      carregarAvisos();
    } catch (e) {
      console.error(e);
      statusAvisoEl.textContent = "❌ Erro ao publicar.";
    }
  });
}

async function carregarAvisos() {
  const listaAvisosEl = document.getElementById("listaAvisos");
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

// ===== FEEDBACKS =====
async function carregarFeedbacks() {
  const listaFeedbacksEl = document.getElementById("listaFeedbacks");
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
        <b>${f.turma || "Sem turma"}</b> - ${f.aluno || "Aluno"}
        <div class="muted" style="font-size:12px;margin:4px 0;">${formatDate(f.data)} • ${f.funcao || ""}</div>
        <div style="margin:8px 0;"><strong>Atividade:</strong> ${(f.feedback || "").replace(/\n/g, "<br>")}</div>
        <div class="btn-group">
          <button class="btn-reply" onclick="responderFeedback('${id}')">💬 Responder</button>
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

// ===== CURSOS =====
const btnAdicionarCurso = document.getElementById("btnAdicionarCurso");
const statusCurso = document.getElementById("statusCurso");

if (btnAdicionarCurso) {
  btnAdicionarCurso.addEventListener("click", async () => {
    const titulo = document.getElementById("tituloCurso").value.trim();
    const instrutor = document.getElementById("instrutorCurso").value.trim();
    const descricao = document.getElementById("descCurso").value.trim();
    const duracao = document.getElementById("duracaoCurso").value.trim();
    const nivel = document.getElementById("nivelCurso").value.trim();

    statusCurso.textContent = "";
    if (!titulo || !instrutor || !descricao) {
      statusCurso.textContent = "⚠️ Preencha título, instrutor e descrição.";
      return;
    }

    statusCurso.textContent = "Adicionando...";
    try {
      await addDoc(collection(db, "cursos"), { titulo, instrutor, descricao, duracao, nivel, criadoEm: new Date() });
      document.getElementById("tituloCurso").value = "";
      document.getElementById("instrutorCurso").value = "";
      document.getElementById("descCurso").value = "";
      document.getElementById("duracaoCurso").value = "";
      document.getElementById("nivelCurso").value = "";
      statusCurso.textContent = "✓ Curso adicionado!";
      setTimeout(() => statusCurso.textContent = "", 2500);
      carregarCursos();
    } catch (e) {
      console.error(e);
      statusCurso.textContent = "❌ Erro ao adicionar.";
    }
  });
}

async function carregarCursos() {
  const listaCursos = document.getElementById("listaCursos");
  if (!listaCursos) return;
  listaCursos.innerHTML = "<p class='muted'>Carregando cursos...</p>";
  try {
    const snap = await getDocs(collection(db, "cursos"));
    listaCursos.innerHTML = "";
    if (snap.empty) {
      listaCursos.innerHTML = "<p class='muted'>Sem cursos cadastrados.</p>";
      return;
    }
    snap.forEach(d => {
      const c = d.data();
      const id = d.id;
      const node = document.createElement("div");
      node.className = "curso-item";
      node.innerHTML = `
        <h3>${c.titulo}</h3>
        <p><strong>Instrutor:</strong> ${c.instrutor}</p>
        <p><strong>Descrição:</strong> ${(c.descricao || "").replace(/\n/g, "<br>")}</p>
        <p><strong>Duração:</strong> ${c.duracao || "-"}</p>
        <p><strong>Nível:</strong> ${c.nivel || "-"}</p>
        <div class="btn-group">
          <button class="btn-delete" onclick="excluirCurso('${id}')">🗑️ Excluir</button>
        </div>
      `;
      listaCursos.appendChild(node);
    });
  } catch (e) {
    console.error(e);
    listaCursos.innerHTML = "<p class='muted'>Erro ao carregar cursos.</p>";
  }
}

window.excluirCurso = async function(id) {
  if (!confirm("Excluir este curso?")) return;
  try {
    await deleteDoc(doc(db, "cursos", id));
    carregarCursos();
  } catch (e) {
    console.error(e);
    alert("Erro ao excluir.");
  }
}

// ===== PROJETO =====
const btnSalvarProjeto = document.getElementById("btnSalvarProjeto");
const statusProjeto = document.getElementById("statusProjeto");

if (btnSalvarProjeto) {
  btnSalvarProjeto.addEventListener("click", async () => {
    const titulo = document.getElementById("tituloProjeto").value.trim();
    const descricao = document.getElementById("descricaoProjeto").value.trim();
    const objetivos = document.getElementById("objetivosProjeto").value.trim();
    const atividades = document.getElementById("atividadesProjeto").value.trim();

    statusProjeto.textContent = "";
    if (!titulo || !descricao) {
      statusProjeto.textContent = "⚠️ Preencha título e descrição.";
      return;
    }

    statusProjeto.textContent = "Salvando...";
    try {
      await setDoc(doc(db, "projeto", "info"), { titulo, descricao, objetivos, atividades });
      statusProjeto.textContent = "✓ Projeto salvo!";
      setTimeout(() => statusProjeto.textContent = "", 2500);
      carregarProjeto();
    } catch (e) {
      console.error(e);
      statusProjeto.textContent = "❌ Erro ao salvar.";
    }
  });
}

async function carregarProjeto() {
  try {
    const snap = await getDoc(doc(db, "projeto", "info"));
    if (snap.exists()) {
      const p = snap.data();
      document.getElementById("tituloProjeto").value = p.titulo || "";
      document.getElementById("descricaoProjeto").value = p.descricao || "";
      document.getElementById("objetivosProjeto").value = p.objetivos || "";
      document.getElementById("atividadesProjeto").value = p.atividades || "";

      const preview = document.getElementById("previewProjeto");
      preview.innerHTML = `
        <h3 style="color:#1b5e20;margin-top:0;">${p.titulo}</h3>
        <p>${(p.descricao || "").replace(/\n/g, "<br>")}</p>
        <h4 style="color:#2e8b57;margin-top:16px;">Objetivos:</h4>
        <p>${(p.objetivos || "").replace(/\n/g, "<br>")}</p>
        <h4 style="color:#2e8b57;margin-top:16px;">Atividades:</h4>
        <p>${(p.atividades || "").replace(/\n/g, "<br>")}</p>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

// ===== GRÁFICOS =====
async function carregarGraficos() {
  try {
    const snap = await getDoc(doc(db, "historico", "dados"));
    if (snap.exists()) {
      const historico = snap.data();
      const temp = historico.temperatura || [];
      const umidade = historico.umidade || [];
      const luminosidade = historico.luminosidade || [];
      const ph = historico.ph || [];
      const labels = Array(7).fill(0).map((_, i) => `Dia ${i + 1}`);

      if (chartTemp) chartTemp.destroy();
      chartTemp = new Chart(document.getElementById("chartTemp"), {
        type: "line",
        data: { labels, datasets: [{ label: "Temperatura (°C)", data: temp.slice(-7), borderColor: "#f59e0b", backgroundColor: "rgba(245, 158, 11, 0.1)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartUmidade) chartUmidade.destroy();
      chartUmidade = new Chart(document.getElementById("chartUmidade"), {
        type: "line",
        data: { labels, datasets: [{ label: "Umidade (%)", data: umidade.slice(-7), borderColor: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.1)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartLumi) chartLumi.destroy();
      chartLumi = new Chart(document.getElementById("chartLumi"), {
        type: "line",
        data: { labels, datasets: [{ label: "Luminosidade (lux)", data: luminosidade.slice(-7), borderColor: "#fbbf24", backgroundColor: "rgba(251, 191, 36, 0.1)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartPH) chartPH.destroy();
      chartPH = new Chart(document.getElementById("chartPH"), {
        type: "line",
        data: { labels, datasets: [{ label: "pH", data: ph.slice(-7), borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.1)", tension: 0.4, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });
    }
  } catch (e) {
    console.error("Erro ao carregar gráficos:", e);
  }
}

carregarRegistros();
carregarSensores();
setInterval(carregarSensores, 5000);