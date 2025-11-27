import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit, addDoc
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

function formatDate(ts) {
  try {
    if (!ts) return "";
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  } catch { return ""; }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // permanece na home/login se não logado
    return;
  }
  usuarioAtual = user;
  // buscar nome no documento users, se existir
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("nomeUsuario").textContent = d.nome || "Aluno";
    }
  } catch (e) { console.error(e); }

  // carregar todos os dados após login
  carregarSensores();
  carregarCursos();
  carregarAvisos();
  carregarAtividades();
  carregarRegistros();
  carregarProjeto();
});

// botão sair
const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "home.html";
  });
}

// ===== SENSORES =====
export async function carregarSensores() {
  try {
    const snap = await getDoc(doc(db, "sensores", "horta"));
    if (!snap.exists()) return;
    const dados = snap.data();
    if (document.getElementById("temp")) document.getElementById("temp").textContent = dados.temperatura != null ? Number(dados.temperatura).toFixed(1) + " °C" : "-- °C";
    if (document.getElementById("umidade")) document.getElementById("umidade").textContent = dados.umidade != null ? Number(dados.umidade).toFixed(1) + " %" : "-- %";
    if (document.getElementById("lumi")) document.getElementById("lumi").textContent = dados.luminosidade != null ? Math.round(dados.luminosidade) + " lux" : "-- lux";
    if (document.getElementById("ph")) document.getElementById("ph").textContent = dados.ph != null ? Number(dados.ph).toFixed(2) : "--";
  } catch (e) {
    console.error("Erro carregarSensores:", e);
  }
}

// ===== CURSOS (mantém) =====
export async function carregarCursos() {
  const lista = document.getElementById("listaCursos");
  if (!lista) return;
  lista.innerHTML = "<p class='muted'>Carregando cursos...</p>";
  try {
    const snap = await getDocs(collection(db, "cursos"));
    lista.innerHTML = "";
    if (snap.empty) { lista.innerHTML = "<p class='muted'>Nenhum curso disponível.</p>"; return; }
    snap.forEach(d => {
      const c = d.data();
      const div = document.createElement("div");
      div.className = "curso-item";
      div.innerHTML = `<h3>${c.titulo}</h3><p>${(c.descricao||"").replace(/\n/g,"<br>")}</p><small>Instrutor: ${c.instrutor||"-"} • ${c.duracao||"-"}</small>`;
      lista.appendChild(div);
    });
  } catch (e) { console.error("Erro carregarCursos:", e); lista.innerHTML = "<p class='muted'>Erro ao carregar cursos.</p>"; }
}

// ===== AVISOS =====
export async function carregarAvisos() {
  const container = document.getElementById("listaAvisos");
  if (!container) return;
  container.innerHTML = "<p class='muted'>Carregando avisos...</p>";
  try {
    const q = query(collection(db, "avisos"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    container.innerHTML = "";
    if (snap.empty) { container.innerHTML = "<p class='muted'>Sem avisos.</p>"; return; }
    snap.forEach(d => {
      const a = d.data();
      const el = document.createElement("div");
      el.className = "aviso";
      el.innerHTML = `<b>${a.titulo}</b><div class="meta">${formatDate(a.data)}</div><div>${(a.msg||"").replace(/\n/g,"<br>")}</div>`;
      container.appendChild(el);
    });
  } catch (e) { console.error("Erro carregarAvisos:", e); container.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>"; }
}

// ===== ATIVIDADES (nova função do estudante) =====
export async function carregarAtividades() {
  const lista = document.getElementById("listaAtividades");
  if (!lista) return;
  lista.innerHTML = "<p class='muted'>Carregando atividades...</p>";
  try {
    const snap = await getDocs(query(collection(db, "atividades"), orderBy("data", "desc")));
    lista.innerHTML = "";
    if (snap.empty) { lista.innerHTML = "<p class='muted'>Nenhuma atividade disponível.</p>"; return; }
    snap.forEach(d => {
      const a = d.data();
      const id = d.id;
      const bloco = document.createElement("div");
      bloco.className = "registro";
      bloco.innerHTML = `
        <h3 style="margin:0 0 6px 0;">${a.titulo || "Atividade"}</h3>
        <div class="meta">${formatDate(a.data)} • Prazo: ${a.prazo ? new Date(a.prazo).toLocaleDateString() : "-"}</div>
        <p style="margin:8px 0;">${(a.descricao||"").replace(/\n/g,"<br>")}</p>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn-primary" onclick="concluirAtividade('${id}')">✅ Marcar Concluída</button>
          <button class="btn-primary" onclick="abrirReflexaoPrompt('${id}')">✍️ Enviar Reflexão</button>
        </div>
        <div id="statusAtividade-${id}" style="margin-top:8px;"></div>
      `;
      lista.appendChild(bloco);
    });
  } catch (e) { console.error("Erro carregarAtividades:", e); lista.innerHTML = "<p class='muted'>Erro ao carregar atividades.</p>"; }
}

window.concluirAtividade = async function(atividadeId) {
  if (!usuarioAtual) { alert("Faça login para concluir atividades."); return; }
  try {
    await addDoc(collection(db, "atividades", atividadeId, "conclusoes"), { uid: usuarioAtual.uid, nome: usuarioAtual.email, data: new Date() });
    const el = document.getElementById(`statusAtividade-${atividadeId}`);
    if (el) el.textContent = "✅ Atividade marcada como concluída.";
  } catch (e) { console.error(e); alert("Erro ao marcar concluída."); }
}

window.abrirReflexaoPrompt = async function(atividadeId) {
  const texto = prompt("Escreva sua reflexão sobre a atividade:");
  if (!texto) return;
  if (!usuarioAtual) { alert("Faça login antes."); return; }
  try {
    await addDoc(collection(db, "atividades", atividadeId, "reflexoes"), { uid: usuarioAtual.uid, texto, data: new Date() });
    alert("Reflexão enviada. Obrigado!");
  } catch (e) { console.error(e); alert("Erro ao enviar reflexão."); }
}

// ===== REGISTROS RECENTES =====
export async function carregarRegistros() {
  const lista = document.getElementById("listaRegistros");
  if (!lista) return;
  lista.innerHTML = "<p class='muted'>Carregando registros...</p>";
  try {
    const q = query(collection(db, "users"), orderBy("criadoEm","desc"), limit(6));
    const snap = await getDocs(q);
    lista.innerHTML = "";
    if (snap.empty) { lista.innerHTML = "<p class='muted'>Nenhum registro encontrado.</p>"; return; }
    snap.forEach(d => {
      const u = d.data();
      const el = document.createElement("div");
      el.className = "registro";
      el.innerHTML = `<b>${u.nome || "—"}</b> <div class="meta">${u.tipo || "aluno"} • ${u.criadoEm ? new Date(u.criadoEm).toLocaleString() : ""}</div>`;
      lista.appendChild(el);
    });
  } catch (e) { console.error("Erro carregarRegistros:", e); lista.innerHTML = "<p class='muted'>Erro ao carregar registros.</p>"; }
}

// ===== PROJETO (mantém) =====
export async function carregarProjeto() {
  try {
    const snap = await getDoc(doc(db, "projeto", "info"));
    const infoProjeto = document.getElementById("infoProjeto");
    if (!infoProjeto) return;
    if (snap.exists()) {
      const p = snap.data();
      infoProjeto.innerHTML = `<h3>${p.titulo||"Projeto"}</h3><p>${(p.descricao||"").replace(/\n/g,"<br>")}</p>`;
    } else infoProjeto.innerHTML = '<p class="muted">Nenhum projeto criado.</p>';
  } catch (e) { console.error(e); }
}

// ===== REGISTRO DE TURMA =====
async function enviarRegistroTurma() {
  const representante = document.getElementById("representanteCheckbox").checked;
  const turma = document.getElementById("turmaInput").value.trim();
  const trabalho = document.getElementById("trabalhoTextarea").value.trim();
  const statusEl = document.getElementById("statusRegistro");
  statusEl.style.display = "none";
  if (!trabalho || !turma) {
    statusEl.textContent = "⚠️ Preencha turma e descreva o trabalho.";
    statusEl.className = "status-msg erro show";
    return;
  }
  if (!usuarioAtual) {
    alert("Faça login para enviar o registro.");
    return;
  }
  statusEl.textContent = "Enviando...";
  statusEl.className = "status-msg show";
  try {
    await addDoc(collection(db, "registros_turma"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      representante: representante,
      turma,
      trabalho,
      data: new Date()
    });
    statusEl.textContent = "✅ Registro enviado.";
    statusEl.className = "status-msg sucesso show";
    // limpar campos
    document.getElementById("representanteCheckbox").checked = false;
    document.getElementById("turmaInput").value = "";
    document.getElementById("trabalhoTextarea").value = "";
    // atualizar lista e último registro
    carregarRegistros();
    carregarUltimoRegistro();
  } catch (e) {
    console.error("Erro enviarRegistroTurma:", e);
    statusEl.textContent = "❌ Erro ao enviar.";
    statusEl.className = "status-msg erro show";
  }
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnEnviarRegistro") enviarRegistroTurma();
});

// ===== CARREGAR ÚLTIMO REGISTRO E SEU RESUMO =====
export async function carregarUltimoRegistro() {
  const container = document.getElementById("ultimaRegistroContainer");
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  if (!container) return;
  container.innerHTML = "<p class='muted'>Carregando último registro...</p>";
  areaAvaliacao.style.display = "none";
  try {
    const q = query(collection(db, "registros_turma"), orderBy("data", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      container.innerHTML = "<p class='muted'>Nenhum registro de turma encontrado.</p>";
      return;
    }
    const d = snap.docs[0];
    const val = d.data();
    const id = d.id;
    // buscar avaliações
    const avalSnap = await getDocs(collection(db, "registros_turma", id, "avaliacoes"));
    let media = null;
    if (!avalSnap.empty) {
      let soma = 0; let cnt = 0;
      avalSnap.forEach(a => { const ad = a.data(); if (ad.nota != null) { soma += Number(ad.nota); cnt++; } });
      if (cnt) media = (soma / cnt).toFixed(1);
    }
    container.innerHTML = `
      <div class="registro">
        <b>${val.turma} ${val.representante ? "(representante reportou)" : ""}</b>
        <div class="meta">${formatDate(val.data)} • Por: ${val.nome || "-"}</div>
        <div style="margin-top:8px;">${(val.trabalho||"").replace(/\n/g,"<br>")}</div>
        <div class="meta" style="margin-top:8px;">Avaliações: ${avalSnap.size} • Média: ${media !== null ? media : "-"}</div>
      </div>
    `;
    // mostrar área de avaliação
    areaAvaliacao.style.display = "block";
    // armazenar id atual para enviar avaliação
    areaAvaliacao.dataset.registroId = id;
  } catch (e) {
    console.error("Erro carregarUltimoRegistro:", e);
    container.innerHTML = "<p class='muted'>Erro ao carregar último registro.</p>";
  }
}

// ===== ENVIAR AVALIAÇÃO PARA O ÚLTIMO REGISTRO =====
async function enviarAvaliacaoUltimo() {
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  const registroId = areaAvaliacao ? areaAvaliacao.dataset.registroId : null;
  const nota = Number(document.getElementById("notaInput").value);
  const feedback = document.getElementById("feedbackUltimo").value.trim();
  const status = document.getElementById("statusAvaliacao");
  status.style.display = "none";
  if (!registroId) { alert("Nenhum registro disponível para avaliar."); return; }
  if (isNaN(nota) || nota < 0 || nota > 10) {
    status.textContent = "⚠️ Informe uma nota de 0 a 10.";
    status.className = "status-msg erro show";
    return;
  }
  if (!usuarioAtual) { alert("Faça login para avaliar."); return; }
  status.textContent = "Enviando avaliação...";
  status.className = "status-msg show";
  try {
    await addDoc(collection(db, "registros_turma", registroId, "avaliacoes"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      nota,
      feedback,
      data: new Date()
    });
    status.textContent = "✅ Avaliação enviada.";
    status.className = "status-msg sucesso show";
    document.getElementById("notaInput").value = "";
    document.getElementById("feedbackUltimo").value = "";
    // atualizar exibição do último registro
    carregarUltimoRegistro();
  } catch (e) {
    console.error("Erro enviarAvaliacaoUltimo:", e);
    status.textContent = "❌ Erro ao enviar avaliação.";
    status.className = "status-msg erro show";
  }
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnEnviarAvaliacao") enviarAvaliacaoUltimo();
});

// chamar ao iniciar/pós login
carregarUltimoRegistro();

// ===== NAVEGAÇÃO =====
window.mudarPagina = function(pagina) {
  document.querySelectorAll(".pagina").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(el => el.classList.remove("active"));
  const paginaEl = document.getElementById(pagina);
  if (paginaEl) paginaEl.classList.add("active");
  // ativar botão
  if (event && event.target) event.target.classList.add("active");
  // carregamentos pontuais
  if (pagina === "cursos") carregarCursos();
  if (pagina === "avisos") carregarAvisos();
  if (pagina === "atividades") carregarAtividades();
  if (pagina === "registros") carregarRegistros();
  if (pagina === "projeto") carregarProjeto();
}

// carregar dados iniciais (se estiver logado)
carregarCursos();
carregarProjeto();