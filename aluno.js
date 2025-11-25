import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, getDoc, orderBy, query
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
    document.getElementById("nomeUsuario").textContent = usuarioAtual.nome || "Usuário";
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
    dashboard: "Dashboard",
    avisos: "Avisos do Professor",
    cursos: "Cursos de Plantagem",
    projeto: "Sobre o Projeto",
    graficos: "Gráficos e Estatísticas",
    feedback: "Meus Feedbacks"
  };
  document.getElementById("tituloPagina").textContent = titulos[pagina] || "Horta";

  if (pagina === "avisos") carregarAvisos();
  if (pagina === "cursos") carregarCursos();
  if (pagina === "projeto") carregarProjeto();
  if (pagina === "graficos") carregarGraficos();
  if (pagina === "feedback") carregarMinhasFeedbacks();
}

const btnEnviar = document.getElementById("btnEnviar");
const feedbackEl = document.getElementById("feedback");
const funcaoEl = document.getElementById("funcao");
const listaEl = document.getElementById("lista");
const statusMsg = document.getElementById("statusMsg");

if (btnEnviar) {
  btnEnviar.addEventListener("click", async () => {
    const feedback = feedbackEl.value.trim();
    const funcao = funcaoEl.value.trim();
    if (!feedback) {
      statusMsg.textContent = "Descreva a atividade.";
      return;
    }
    statusMsg.textContent = "Salvando...";
    try {
      await addDoc(collection(db, "feedbacks"), {
        turma: usuarioAtual?.turma || "Sem turma",
        aluno: usuarioAtual?.nome || "Anônimo",
        feedback,
        funcao,
        data: new Date(),
        respondido: false
      });
      feedbackEl.value = "";
      funcaoEl.value = "";
      statusMsg.textContent = "Registro salvo!";
      carregarRegistros();
    } catch (e) {
      console.error(e);
      statusMsg.textContent = "Erro ao salvar.";
    }
    setTimeout(() => statusMsg.textContent = "", 2500);
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

async function carregarRegistros() {
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

async function carregarAvisos() {
  const avisosList = document.getElementById("avisosList");
  if (!avisosList) return;
  avisosList.innerHTML = "<p class='muted'>Carregando avisos...</p>";
  try {
    const q = query(collection(db, "avisos"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      avisosList.innerHTML = "<p class='muted'>Sem avisos.</p>";
      return;
    }
    avisosList.innerHTML = "";
    snap.forEach(d => {
      const a = d.data();
      const node = document.createElement("div");
      node.className = "aviso";
      node.innerHTML = `
        <div class="titulo">${a.titulo || "Aviso"}</div>
        <div class="muted">${formatDate(a.data)}</div>
        <div style="margin-top:6px">${(a.msg || "").replace(/\n/g, "<br>")}</div>
      `;
      avisosList.appendChild(node);
    });
  } catch (e) {
    console.error(e);
    avisosList.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>";
  }
}

async function carregarCursos() {
  const cursosList = document.getElementById("listaCursos");
  if (!cursosList) return;
  cursosList.innerHTML = "<p class='muted'>Carregando cursos...</p>";
  try {
    const q = query(collection(db, "cursos"), orderBy("ordem", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      cursosList.innerHTML = "<p class='muted'>Sem cursos cadastrados.</p>";
      return;
    }
    cursosList.innerHTML = "";
    snap.forEach(d => {
      const c = d.data();
      const node = document.createElement("div");
      node.className = "curso-item";
      node.innerHTML = `
        <h3>${c.titulo || "Curso"}</h3>
        <p><strong>Instrutor:</strong> ${c.instrutor || "-"}</p>
        <p>${(c.descricao || "").replace(/\n/g, "<br>")}</p>
        <p><strong>Duração:</strong> ${c.duracao || "-"}</p>
        <p><strong>Nível:</strong> ${c.nivel || "-"}</p>
      `;
      cursosList.appendChild(node);
    });
  } catch (e) {
    console.error(e);
    cursosList.innerHTML = "<p class='muted'>Erro ao carregar cursos.</p>";
  }
}

async function carregarProjeto() {
  const infoProjeto = document.getElementById("infoProjeto");
  if (!infoProjeto) return;
  infoProjeto.innerHTML = "<p class='muted'>Carregando...</p>";
  try {
    const snap = await getDoc(doc(db, "projeto", "info"));
    if (snap.exists()) {
      const p = snap.data();
      infoProjeto.innerHTML = `
        <h3>${p.titulo || "Projeto Horta"}</h3>
        <p>${(p.descricao || "").replace(/\n/g, "<br>")}</p>
        <h4>Objetivos:</h4>
        <p>${(p.objetivos || "").replace(/\n/g, "<br>")}</p>
        <h4>Atividades Principais:</h4>
        <p>${(p.atividades || "").replace(/\n/g, "<br>")}</p>
      `;
    } else {
      infoProjeto.innerHTML = "<p>Informações do projeto não carregadas.</p>";
    }
  } catch (e) {
    console.error(e);
    infoProjeto.innerHTML = "<p class='muted'>Erro ao carregar informações.</p>";
  }
}

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
        data: { labels, datasets: [{ label: "Temperatura (°C)", data: temp.slice(-7), borderColor: "#f59e0b", tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartUmidade) chartUmidade.destroy();
      chartUmidade = new Chart(document.getElementById("chartUmidade"), {
        type: "line",
        data: { labels, datasets: [{ label: "Umidade (%)", data: umidade.slice(-7), borderColor: "#3b82f6", tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartLumi) chartLumi.destroy();
      chartLumi = new Chart(document.getElementById("chartLumi"), {
        type: "line",
        data: { labels, datasets: [{ label: "Luminosidade (lux)", data: luminosidade.slice(-7), borderColor: "#fbbf24", tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });

      if (chartPH) chartPH.destroy();
      chartPH = new Chart(document.getElementById("chartPH"), {
        type: "line",
        data: { labels, datasets: [{ label: "pH", data: ph.slice(-7), borderColor: "#8b5cf6", tension: 0.4 }] },
        options: { responsive: true, plugins: { legend: { display: true } } }
      });
    }
  } catch (e) {
    console.error("Erro ao carregar gráficos:", e);
  }
}

async function carregarMinhasFeedbacks() {
  const minhasFeedbacks = document.getElementById("minhasFeedbacks");
  if (!minhasFeedbacks) return;
  minhasFeedbacks.innerHTML = "<p class='muted'>Carregando...</p>";
  try {
    const q = query(collection(db, "feedbacks"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    minhasFeedbacks.innerHTML = "";
    if (snap.empty) {
      minhasFeedbacks.innerHTML = "<p class='muted'>Você não enviou feedbacks ainda.</p>";
      return;
    }
    snap.forEach(d => {
      const f = d.data();
      const id = d.id;
      const item = document.createElement("div");
      item.className = "feedback-item";
      item.innerHTML = `
        <b>${f.feedback}</b>
        <div class="meta">${formatDate(f.data)} • Função: ${f.funcao || "-"}</div>
        ${f.respondido ? '<div style="color:#16a34a;margin-top:8px;font-weight:600;">✓ Professor respondeu</div>' : '<div style="color:#f59e0b;margin-top:8px;">⏳ Aguardando resposta</div>'}
        <div id="respostas-${id}" style="margin-top:10px;"></div>
      `;
      minhasFeedbacks.appendChild(item);
      carregarRespostasAluno(id);
    });
  } catch (e) {
    console.error(e);
    minhasFeedbacks.innerHTML = "<p class='muted'>Erro ao carregar feedbacks.</p>";
  }
}

async function carregarRespostasAluno(feedbackId) {
  const container = document.getElementById(`respostas-${feedbackId}`);
  if (!container) return;
  try {
    const snap = await getDocs(collection(db, "feedbacks", feedbackId, "respostas"));
    if (snap.empty) return;
    snap.forEach(d => {
      const r = d.data();
      const div = document.createElement("div");
      div.className = "resposta-aluno";
      div.innerHTML = `
        <div style="background:#f0f9ff;padding:10px;border-radius:6px;border-left:4px solid #3b82f6;">
          <small style="color:#1e40af;font-weight:600;">Professor respondeu</small>
          <div style="margin-top:6px;">${(r.texto || "").replace(/\n/g, "<br>")}</div>
          <small style="color:#6b7280;margin-top:4px;display:block;">${formatDate(r.data)}</small>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
  }
}

carregarRegistros();
carregarSensores();
setInterval(carregarSensores, 5000); // Atualizar a cada 5s