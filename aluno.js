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
    window.location.href = "home.html";
    return;
  }
  usuarioAtual = user;
  
  // Buscar nome do usuário
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("nomeUsuario").textContent = d.nome || "Aluno";
    }
  } catch (e) { 
    console.error("Erro ao buscar usuário:", e); 
  }

  // Carregar todos os dados
  carregarSensores();
  carregarCursos();
  carregarAvisos();
  carregarAtividades();
  carregarRegistros();
  carregarProjeto();
  carregarUltimoRegistro();
});

// Botão sair
const btnSair = document.getElementById("btnSair");
if (btnSair) {
  btnSair.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "home.html";
  });
}

// ===== SENSORES =====
async function carregarSensores() {
  try {
    const snap = await getDoc(doc(db, "sensores", "horta"));
    if (!snap.exists()) {
      console.log("Documento sensores não encontrado");
      return;
    }
    const dados = snap.data();
    
    const tempEl = document.getElementById("temp");
    const umidadeEl = document.getElementById("umidade");
    const lumiEl = document.getElementById("lumi");
    const phEl = document.getElementById("ph");
    
    if (tempEl) tempEl.textContent = dados.temperatura != null ? Number(dados.temperatura).toFixed(1) + " °C" : "-- °C";
    if (umidadeEl) umidadeEl.textContent = dados.umidade != null ? Number(dados.umidade).toFixed(1) + " %" : "-- %";
    if (lumiEl) lumiEl.textContent = dados.luminosidade != null ? Math.round(dados.luminosidade) + " lux" : "-- lux";
    if (phEl) phEl.textContent = dados.ph != null ? Number(dados.ph).toFixed(2) : "--";
  } catch (e) {
    console.error("Erro carregarSensores:", e);
  }
}

// ===== CURSOS =====
async function carregarCursos() {
  const lista = document.getElementById("listaCursos");
  if (!lista) return;
  
  lista.innerHTML = "<p class='muted'>Carregando cursos...</p>";
  try {
    const snap = await getDocs(collection(db, "cursos"));
    lista.innerHTML = "";
    
    if (snap.empty) { 
      lista.innerHTML = "<p class='muted'>Nenhum curso disponível.</p>"; 
      return; 
    }
    
    snap.forEach(d => {
      const c = d.data();
      const div = document.createElement("div");
      div.className = "curso-item";
      div.innerHTML = `
        <h3 style="margin:0 0 8px 0; color:#1b5e20;">📚 ${c.titulo || "Sem título"}</h3>
        <p style="margin:6px 0;"><strong>Instrutor:</strong> ${c.instrutor || "-"}</p>
        <p style="margin:6px 0;"><strong>Descrição:</strong> ${(c.descricao || "").replace(/\n/g, "<br>")}</p>
        <small>⏱️ ${c.duracao || "-"} • 📊 ${c.nivel || "-"}</small>
      `;
      lista.appendChild(div);
    });
  } catch (e) { 
    console.error("Erro carregarCursos:", e); 
    lista.innerHTML = "<p class='muted'>Erro ao carregar cursos.</p>"; 
  }
}

// ===== AVISOS =====
async function carregarAvisos() {
  const container = document.getElementById("listaAvisos");
  if (!container) return;
  
  container.innerHTML = "<p class='muted'>Carregando avisos...</p>";
  try {
    const q = query(collection(db, "avisos"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    container.innerHTML = "";
    
    if (snap.empty) { 
      container.innerHTML = "<p class='muted'>Sem avisos.</p>"; 
      return; 
    }
    
    snap.forEach(d => {
      const a = d.data();
      const el = document.createElement("div");
      el.className = "aviso";
      el.innerHTML = `
        <strong style="color:#1b5e20;">📢 ${a.titulo || "Aviso"}</strong>
        <div class="meta">${formatDate(a.data)}</div>
        <div style="margin-top:8px; color:#333;">${(a.msg || "").replace(/\n/g, "<br>")}</div>
      `;
      container.appendChild(el);
    });
  } catch (e) { 
    console.error("Erro carregarAvisos:", e); 
    container.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>"; 
  }
}

// ===== ATIVIDADES =====
async function carregarAtividades() {
  const lista = document.getElementById("listaAtividades");
  if (!lista) return;
  
  lista.innerHTML = "<p class='muted'>Carregando atividades...</p>";
  try {
    const snap = await getDocs(query(collection(db, "atividades"), orderBy("data", "desc")));
    lista.innerHTML = "";
    
    if (snap.empty) { 
      lista.innerHTML = "<p class='muted'>Nenhuma atividade disponível.</p>"; 
      return; 
    }
    
    snap.forEach(d => {
      const a = d.data();
      const id = d.id;
      const bloco = document.createElement("div");
      bloco.className = "registro";
      bloco.innerHTML = `
        <h3 style="margin:0 0 8px 0; color:#1b5e20;">📝 ${a.titulo || "Atividade"}</h3>
        <div class="meta">📅 ${formatDate(a.data)} • ⏰ Prazo: ${a.prazo ? new Date(a.prazo).toLocaleDateString() : "-"}</div>
        <p style="margin:8px 0; color:#555;">${(a.descricao || "").replace(/\n/g, "<br>")}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn-primary" onclick="concluirAtividade('${id}')">✅ Marcar Concluída</button>
          <button class="btn-primary" onclick="abrirReflexaoPrompt('${id}')">✍️ Enviar Reflexão</button>
        </div>
        <div id="statusAtividade-${id}" style="margin-top:8px;"></div>
      `;
      lista.appendChild(bloco);
    });
  } catch (e) { 
    console.error("Erro carregarAtividades:", e); 
    lista.innerHTML = "<p class='muted'>Erro ao carregar atividades.</p>"; 
  }
}

// Função global: concluir atividade
window.concluirAtividade = async function(atividadeId) {
  if (!usuarioAtual) { 
    alert("Faça login para concluir atividades."); 
    return; 
  }
  try {
    await addDoc(collection(db, "atividades", atividadeId, "conclusoes"), { 
      uid: usuarioAtual.uid, 
      nome: usuarioAtual.email,
      data: new Date() 
    });
    const el = document.getElementById(`statusAtividade-${atividadeId}`);
    if (el) {
      el.innerHTML = "<div class='status-msg sucesso show'>✅ Atividade marcada como concluída!</div>";
    }
  } catch (e) { 
    console.error("Erro ao marcar concluída:", e); 
    alert("Erro ao marcar concluída."); 
  }
}

// Função global: abrir prompt de reflexão
window.abrirReflexaoPrompt = async function(atividadeId) {
  const texto = prompt("Escreva sua reflexão sobre a atividade:");
  if (!texto) return;
  
  if (!usuarioAtual) { 
    alert("Faça login antes."); 
    return; 
  }
  
  try {
    await addDoc(collection(db, "atividades", atividadeId, "reflexoes"), { 
      uid: usuarioAtual.uid, 
      nome: usuarioAtual.email,
      texto, 
      data: new Date() 
    });
    alert("✅ Reflexão enviada com sucesso!");
  } catch (e) { 
    console.error("Erro ao enviar reflexão:", e); 
    alert("Erro ao enviar reflexão."); 
  }
}

// ===== REGISTROS RECENTES (usuários) =====
async function carregarRegistros() {
  const lista = document.getElementById("listaRegistros");
  if (!lista) return;
  
  lista.innerHTML = "<p class='muted'>Carregando registros...</p>";
  try {
    const q = query(collection(db, "users"), orderBy("criadoEm", "desc"), limit(6));
    const snap = await getDocs(q);
    lista.innerHTML = "";
    
    if (snap.empty) { 
      lista.innerHTML = "<p class='muted'>Nenhum registro encontrado.</p>"; 
      return; 
    }
    
    snap.forEach(d => {
      const u = d.data();
      const el = document.createElement("div");
      el.className = "registro";
      el.innerHTML = `
        <strong style="color:#1b5e20;">${u.nome || "—"}</strong>
        <div class="meta">👤 ${u.tipo || "aluno"} • ${u.criadoEm ? new Date(u.criadoEm).toLocaleString() : ""}</div>
      `;
      lista.appendChild(el);
    });
  } catch (e) { 
    console.error("Erro carregarRegistros:", e); 
    lista.innerHTML = "<p class='muted'>Erro ao carregar registros.</p>"; 
  }
}

// ===== PROJETO =====
async function carregarProjeto() {
  try {
    const snap = await getDoc(doc(db, "projeto", "info"));
    const infoProjeto = document.getElementById("infoProjeto");
    if (!infoProjeto) return;
    
    if (snap.exists()) {
      const p = snap.data();
      infoProjeto.innerHTML = `
        <h3 style="color:#1b5e20; margin-top:0;">${p.titulo || "Projeto"}</h3>
        <div style="margin:16px 0; padding:12px; background:#f0fdf4; border-radius:8px;">
          <strong style="color:#1b5e20;">📋 Descrição:</strong>
          <p style="margin:8px 0; color:#555;">${(p.descricao || "").replace(/\n/g, "<br>")}</p>
        </div>
        <div style="margin:16px 0; padding:12px; background:#f0fdf4; border-radius:8px;">
          <strong style="color:#1b5e20;">🎯 Objetivos:</strong>
          <p style="margin:8px 0; color:#555;">${(p.objetivos || "").replace(/\n/g, "<br>")}</p>
        </div>
        <div style="margin:16px 0; padding:12px; background:#f0fdf4; border-radius:8px;">
          <strong style="color:#1b5e20;">🌱 Atividades:</strong>
          <p style="margin:8px 0; color:#555;">${(p.atividades || "").replace(/\n/g, "<br>")}</p>
        </div>
      `;
    } else {
      infoProjeto.innerHTML = '<p class="muted" style="text-align:center;">📭 Nenhum projeto criado.</p>';
    }
  } catch (e) { 
    console.error("Erro ao carregar projeto:", e); 
  }
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
    statusEl.style.display = "block";
    return;
  }
  
  if (!usuarioAtual) {
    alert("Faça login para enviar o registro.");
    return;
  }
  
  statusEl.textContent = "Enviando...";
  statusEl.className = "status-msg show";
  statusEl.style.display = "block";
  
  try {
    await addDoc(collection(db, "registros_turma"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      representante: representante,
      turma,
      trabalho,
      data: new Date()
    });
    
    statusEl.textContent = "✅ Registro enviado com sucesso!";
    statusEl.className = "status-msg sucesso show";
    statusEl.style.display = "block";
    
    // Limpar campos
    document.getElementById("representanteCheckbox").checked = false;
    document.getElementById("turmaInput").value = "";
    document.getElementById("trabalhoTextarea").value = "";
    
    // Recarregar
    setTimeout(() => {
      carregarRegistros();
      carregarUltimoRegistro();
    }, 1000);
  } catch (e) {
    console.error("Erro enviarRegistroTurma:", e);
    statusEl.textContent = "❌ Erro ao enviar: " + e.message;
    statusEl.className = "status-msg erro show";
    statusEl.style.display = "block";
  }
}

// ===== CARREGAR ÚLTIMO REGISTRO =====
async function carregarUltimoRegistro() {
  const container = document.getElementById("ultimaRegistroContainer");
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  
  if (!container || !areaAvaliacao) return;
  
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
    
    // Buscar avaliações
    const avalSnap = await getDocs(collection(db, "registros_turma", id, "avaliacoes"));
    let media = null;
    
    if (!avalSnap.empty) {
      let soma = 0;
      let cnt = 0;
      avalSnap.forEach(a => { 
        const ad = a.data(); 
        if (ad.nota != null) { 
          soma += Number(ad.nota); 
          cnt++; 
        } 
      });
      if (cnt) media = (soma / cnt).toFixed(1);
    }
    
    container.innerHTML = `
      <div class="registro">
        <strong style="color:#1b5e20; font-size:16px;">Turma: ${val.turma} ${val.representante ? "(representante reportou)" : ""}</strong>
        <div class="meta">📅 ${formatDate(val.data)} • Por: ${val.nome || "-"}</div>
        <div style="margin-top:12px; color:#555; line-height:1.6;">${(val.trabalho || "").replace(/\n/g, "<br>")}</div>
        <div class="meta" style="margin-top:12px; background:#f0fdf4; padding:8px; border-radius:6px;">
          📊 Avaliações: ${avalSnap.size} • ⭐ Média: ${media !== null ? media : "-"}
        </div>
      </div>
    `;
    
    // Mostrar área de avaliação
    areaAvaliacao.style.display = "block";
    areaAvaliacao.dataset.registroId = id;
  } catch (e) {
    console.error("Erro carregarUltimoRegistro:", e);
    container.innerHTML = "<p class='muted'>Erro ao carregar último registro.</p>";
  }
}

// ===== ENVIAR AVALIAÇÃO =====
async function enviarAvaliacaoUltimo() {
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  const registroId = areaAvaliacao ? areaAvaliacao.dataset.registroId : null;
  const nota = Number(document.getElementById("notaInput").value);
  const feedback = document.getElementById("feedbackUltimo").value.trim();
  const status = document.getElementById("statusAvaliacao");
  
  status.style.display = "none";
  
  if (!registroId) { 
    alert("Nenhum registro disponível para avaliar."); 
    return; 
  }
  
  if (isNaN(nota) || nota < 0 || nota > 10) {
    status.textContent = "⚠️ Informe uma nota de 0 a 10.";
    status.className = "status-msg erro show";
    status.style.display = "block";
    return;
  }
  
  if (!feedback) {
    status.textContent = "⚠️ Escreva um feedback.";
    status.className = "status-msg erro show";
    status.style.display = "block";
    return;
  }
  
  if (!usuarioAtual) { 
    alert("Faça login para avaliar."); 
    return; 
  }
  
  status.textContent = "Enviando avaliação...";
  status.className = "status-msg show";
  status.style.display = "block";
  
  try {
    await addDoc(collection(db, "registros_turma", registroId, "avaliacoes"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      nota,
      feedback,
      data: new Date()
    });
    
    status.textContent = "✅ Avaliação enviada com sucesso!";
    status.className = "status-msg sucesso show";
    status.style.display = "block";
    
    document.getElementById("notaInput").value = "";
    document.getElementById("feedbackUltimo").value = "";
    
    // Recarregar
    setTimeout(() => {
      carregarUltimoRegistro();
    }, 1000);
  } catch (e) {
    console.error("Erro enviarAvaliacaoUltimo:", e);
    status.textContent = "❌ Erro ao enviar avaliação: " + e.message;
    status.className = "status-msg erro show";
    status.style.display = "block";
  }
}

// ===== NAVEGAÇÃO =====
window.mudarPagina = function(pagina) {
  document.querySelectorAll(".pagina").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(el => el.classList.remove("active"));
  
  const paginaEl = document.getElementById(pagina);
  if (paginaEl) paginaEl.classList.add("active");
  
  if (event && event.target) event.target.classList.add("active");
  
  // Carregar dados ao mudar de aba
  if (pagina === "dashboard") carregarSensores();
  if (pagina === "cursos") carregarCursos();
  if (pagina === "avisos") carregarAvisos();
  if (pagina === "atividades") carregarAtividades();
  if (pagina === "registros") {
    carregarRegistros();
    carregarUltimoRegistro();
  }
  if (pagina === "projeto") carregarProjeto();
}

// ===== EVENT LISTENERS =====
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnEnviarRegistro") {
    e.preventDefault();
    enviarRegistroTurma();
  }
  if (e.target && e.target.id === "btnEnviarAvaliacao") {
    e.preventDefault();
    enviarAvaliacaoUltimo();
  }
});

// Carregar dados iniciais após autenticação
window.addEventListener("load", () => {
  if (usuarioAtual) {
    carregarSensores();
    carregarCursos();
    carregarProjeto();
  }
});