import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit, addDoc, updateDoc, increment, deleteDoc
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
let cursoAtualModal = null;

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
  
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const d = snap.data();
      document.getElementById("nomeUsuario").textContent = d.nome || "Aluno";
    }
  } catch (e) { 
    console.error("Erro ao buscar usuário:", e); 
  }

  carregarSensores();
  carregarCursos();
  carregarAvisos();
  carregarAtividades();
  carregarProjeto();
  carregarUltimoRegistro();
});

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
    if (!snap.exists()) return;
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

// ===== AVISOS COM REAÇÕES =====
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
      const id = d.id;
      const el = document.createElement("div");
      el.className = "aviso";
      el.innerHTML = `
        <strong style="color:#1b5e20;">📢 ${a.titulo || "Aviso"}</strong>
        <div class="meta">${formatDate(a.data)}</div>
        <div style="margin-top:8px; color:#333;">${(a.msg || "").replace(/\n/g, "<br>")}</div>
        
        <div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">
          <button class="btn-reacao" onclick="reagirAviso('${id}', '👍')">👍 <span id="count-${id}-👍">${a.reacoes && a.reacoes['👍'] ? a.reacoes['👍'] : 0}</span></button>
          <button class="btn-reacao" onclick="reagirAviso('${id}', '❤️')">❤️ <span id="count-${id}-❤️">${a.reacoes && a.reacoes['❤️'] ? a.reacoes['❤️'] : 0}</span></button>
          <button class="btn-reacao" onclick="reagirAviso('${id}', '🎉')">🎉 <span id="count-${id}-🎉">${a.reacoes && a.reacoes['🎉'] ? a.reacoes['🎉'] : 0}</span></button>
          <button class="btn-reacao" onclick="reagirAviso('${id}', '🤔')">🤔 <span id="count-${id}-🤔">${a.reacoes && a.reacoes['🤔'] ? a.reacoes['🤔'] : 0}</span></button>
        </div>
      `;
      container.appendChild(el);
    });
  } catch (e) { 
    console.error("Erro carregarAvisos:", e); 
    container.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>"; 
  }
}

// Função para reagir ao aviso (LIMITA A 1 POR EMOJI)
window.reagirAviso = async function(avisoId, reacao) {
  if (!usuarioAtual) {
    alert("Faça login para reagir.");
    return;
  }
  
  try {
    // Buscar reações do usuário neste aviso
    const reacaoSnap = await getDocs(collection(db, "avisos", avisoId, "reacoes"));
    let reacaoExistente = null;
    let docIdExistente = null;
    
    reacaoSnap.forEach(d => {
      const data = d.data();
      if (data.uid === usuarioAtual.uid && data.reacao === reacao) {
        reacaoExistente = d.id;
        docIdExistente = d.id;
      }
    });
    
    const avisoDocRef = doc(db, "avisos", avisoId);
    const avisoData = await getDoc(avisoDocRef);
    let reacoes = avisoData.data().reacoes || {};
    
    if (reacaoExistente) {
      // REMOVER reação (clicou novamente)
      await deleteDoc(doc(db, "avisos", avisoId, "reacoes", docIdExistente));
      reacoes[reacao] = Math.max(0, (reacoes[reacao] || 1) - 1);
    } else {
      // Adicionar nova reação
      await addDoc(collection(db, "avisos", avisoId, "reacoes"), {
        uid: usuarioAtual.uid,
        reacao,
        data: new Date()
      });
      reacoes[reacao] = (reacoes[reacao] || 0) + 1;
    }
    
    await updateDoc(avisoDocRef, { reacoes });
    carregarAvisos();
  } catch (e) {
    console.error("Erro ao reagir:", e);
  }
}

// ===== CURSOS COM INSCRIÇÃO E COMENTÁRIOS =====
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
    
    snap.forEach(async (d) => {
      const c = d.data();
      const cursoId = d.id;
      
      // Verificar inscrição
      let inscrito = false;
      if (usuarioAtual) {
        const inscricaoSnap = await getDocs(collection(db, "cursos", cursoId, "inscritos"));
        inscricaoSnap.forEach(insc => {
          if (insc.data().uid === usuarioAtual.uid) inscrito = true;
        });
      }
      
      // Contar comentários
      const comentariosSnap = await getDocs(collection(db, "cursos", cursoId, "comentarios"));
      
      const div = document.createElement("div");
      div.className = "curso-item";
      div.style.cssText = `
        background: linear-gradient(135deg, #f9fdf8 0%, #f0fdf4 100%);
        border-left: 4px solid #2e8b57;
        transition: all 0.3s;
      `;
      
      div.innerHTML = `
        <h3 style="margin:0 0 8px 0; color:#1b5e20;">📚 ${c.titulo || "Sem título"}</h3>
        <p style="margin:6px 0;"><strong>👨‍🏫 Instrutor:</strong> ${c.instrutor || "-"}</p>
        <p style="margin:6px 0;"><strong>📝 Descrição:</strong> ${(c.descricao || "").substring(0, 100)}...</p>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#999; margin-top:8px;">
          <span>⏱️ ${c.duracao || "-"}</span>
          <span>📊 ${c.nivel || "-"}</span>
          <span>💬 ${comentariosSnap.size} comentários</span>
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
          <button class="btn-primary" onclick="abrirModalCurso('${cursoId}', '${c.titulo || "Curso"}', '${(c.descricao || "").replace(/'/g, "&apos;")}')">
            ${inscrito ? '✅ Inscrição Ativa' : '📌 Ver Detalhes'}
          </button>
        </div>
      `;
      lista.appendChild(div);
    });
  } catch (e) { 
    console.error("Erro carregarCursos:", e); 
    lista.innerHTML = "<p class='muted'>Erro ao carregar cursos.</p>"; 
  }
}

// Funções do modal de curso
window.abrirModalCurso = async function(cursoId, titulo, descricao) {
  cursoAtualModal = cursoId;
  document.getElementById("tituloCursoModal").textContent = titulo;
  document.getElementById("descricaoCursoModal").textContent = descricao.replace(/\\n/g, "\n");
  
  // Verificar inscrição
  let inscrito = false;
  if (usuarioAtual) {
    const inscricaoSnap = await getDocs(collection(db, "cursos", cursoId, "inscritos"));
    inscricaoSnap.forEach(insc => {
      if (insc.data().uid === usuarioAtual.uid) inscrito = true;
    });
  }
  
  const btnInscricao = document.getElementById("btnInscricao");
  if (inscrito) {
    btnInscricao.textContent = "✅ Já inscrito";
    btnInscricao.disabled = true;
  } else {
    btnInscricao.textContent = "📌 Inscrever-se";
    btnInscricao.disabled = false;
  }
  
  carregarComentariosCurso(cursoId);
  document.getElementById("modalCurso").style.display = "flex";
}

window.fecharModalCurso = function() {
  document.getElementById("modalCurso").style.display = "none";
  cursoAtualModal = null;
}

window.inscreverCurso = async function() {
  if (!usuarioAtual) { alert("Faça login para se inscrever."); return; }
  if (!cursoAtualModal) return;
  
  try {
    await addDoc(collection(db, "cursos", cursoAtualModal, "inscritos"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      data: new Date()
    });
    
    alert("✅ Inscrito com sucesso no curso!");
    document.getElementById("btnInscricao").textContent = "✅ Já inscrito";
    document.getElementById("btnInscricao").disabled = true;
    carregarCursos();
  } catch (e) {
    console.error(e);
    alert("Erro ao inscrever.");
  }
}

// Comentários do curso
async function carregarComentariosCurso(cursoId) {
  const lista = document.getElementById("listaComentariosCurso");
  lista.innerHTML = "<p class='muted'>Carregando comentários...</p>";
  
  try {
    const q = query(collection(db, "cursos", cursoId, "comentarios"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    lista.innerHTML = "";
    
    if (snap.empty) {
      lista.innerHTML = "<p class='muted'>Nenhum comentário ainda.</p>";
      return;
    }
    
    snap.forEach(d => {
      const com = d.data();
      const docId = d.id;
      const ehMeu = usuarioAtual && com.uid === usuarioAtual.uid;
      
      const el = document.createElement("div");
      el.style.cssText = `
        background: #fff;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 8px;
        border-left: 3px solid #2e8b57;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      `;
      
      el.innerHTML = `
        <div style="flex:1;">
          <strong style="color:#1b5e20; font-size:13px;">${com.nome || "Anônimo"}</strong>
          <div style="font-size:11px; color:#999; margin-top:2px;">${formatDate(com.data)}</div>
          <p style="margin:6px 0; color:#555; font-size:13px;">${com.texto}</p>
        </div>
        ${ehMeu ? `<button onclick="deletarComentario('${cursoAtualModal}', '${docId}')" style="background:#fee2e2; color:#c33; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px; margin-left:8px;">🗑️ Delete</button>` : ""}
      `;
      lista.appendChild(el);
    });
  } catch (e) {
    console.error("Erro ao carregar comentários:", e);
    lista.innerHTML = "<p class='muted'>Erro ao carregar.</p>";
  }
}

// Deletar comentário próprio
window.deletarComentario = async function(cursoId, comentarioId) {
  if (!confirm("Deletar este comentário?")) return;
  
  try {
    await deleteDoc(doc(db, "cursos", cursoId, "comentarios", comentarioId));
    carregarComentariosCurso(cursoId);
  } catch (e) {
    console.error(e);
    alert("Erro ao deletar comentário.");
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

window.concluirAtividade = async function(atividadeId) {
  if (!usuarioAtual) { alert("Faça login."); return; }
  try {
    await addDoc(collection(db, "atividades", atividadeId, "conclusoes"), { 
      uid: usuarioAtual.uid, 
      nome: usuarioAtual.email,
      data: new Date() 
    });
    const el = document.getElementById(`statusAtividade-${atividadeId}`);
    if (el) el.innerHTML = "<div class='status-msg sucesso show'>✅ Concluída!</div>";
  } catch (e) { console.error(e); alert("Erro."); }
}

window.abrirReflexaoPrompt = async function(atividadeId) {
  const texto = prompt("Escreva sua reflexão:");
  if (!texto || !usuarioAtual) return;
  try {
    await addDoc(collection(db, "atividades", atividadeId, "reflexoes"), { 
      uid: usuarioAtual.uid, 
      nome: usuarioAtual.email,
      texto, 
      data: new Date() 
    });
    alert("✅ Reflexão enviada!");
  } catch (e) { console.error(e); alert("Erro."); }
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
      infoProjeto.innerHTML = '<p class="muted">📭 Nenhum projeto criado.</p>';
    }
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
    statusEl.textContent = "⚠️ Preencha todos os campos.";
    statusEl.className = "status-msg erro show";
    statusEl.style.display = "block";
    return;
  }
  if (!usuarioAtual) { alert("Faça login."); return; }
  statusEl.textContent = "Enviando...";
  statusEl.className = "status-msg show";
  statusEl.style.display = "block";
  
  try {
    await addDoc(collection(db, "registros_turma"), {
      uid: usuarioAtual.uid,
      nome: usuarioAtual.displayName || usuarioAtual.email,
      representante,
      turma,
      trabalho,
      data: new Date()
    });
    statusEl.textContent = "✅ Enviado!";
    statusEl.className = "status-msg sucesso show";
    document.getElementById("representanteCheckbox").checked = false;
    document.getElementById("turmaInput").value = "";
    document.getElementById("trabalhoTextarea").value = "";
    setTimeout(() => carregarUltimoRegistro(), 1000);
  } catch (e) {
    console.error(e);
    statusEl.textContent = "❌ Erro.";
    statusEl.className = "status-msg erro show";
  }
}

// ===== ÚLTIMO REGISTRO =====
async function carregarUltimoRegistro() {
  const container = document.getElementById("ultimaRegistroContainer");
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  const jaAvaliou = document.getElementById("jaavalidou");
  
  if (!container || !areaAvaliacao || !jaAvaliou) return;
  container.innerHTML = "<p class='muted'>Carregando...</p>";
  areaAvaliacao.style.display = "none";
  jaAvaliou.style.display = "none";
  if (!usuarioAtual) return;
  
  try {
    const q = query(collection(db, "registros_turma"), orderBy("data", "desc"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) { container.innerHTML = "<p class='muted'>Nenhum registro.</p>"; return; }
    
    const d = snap.docs[0];
    const val = d.data();
    const id = d.id;
    const avalSnap = await getDocs(collection(db, "registros_turma", id, "avaliacoes"));
    let jaAvaliouEste = false;
    let media = null;
    
    avalSnap.forEach(a => { const ad = a.data(); if (ad.uid === usuarioAtual.uid) jaAvaliouEste = true; });
    if (!avalSnap.empty) {
      let soma = 0; let cnt = 0;
      avalSnap.forEach(a => { const ad = a.data(); if (ad.nota != null) { soma += Number(ad.nota); cnt++; } });
      if (cnt) media = (soma / cnt).toFixed(1);
    }
    
    container.innerHTML = `
      <div class="registro">
        <strong style="color:#1b5e20; font-size:16px;">Turma: ${val.turma}</strong>
        <div class="meta">📅 ${formatDate(val.data)} • ${val.nome}</div>
        <div style="margin-top:12px; color:#555; line-height:1.6;">${(val.trabalho || "").replace(/\n/g, "<br>")}</div>
        <div class="meta" style="margin-top:12px; background:#f0fdf4; padding:8px; border-radius:6px;">📊 Avaliações: ${avalSnap.size} • ⭐ Média: ${media || "-"}</div>
      </div>
    `;
    
    if (jaAvaliouEste) { jaAvaliou.style.display = "block"; } 
    else { areaAvaliacao.style.display = "block"; areaAvaliacao.dataset.registroId = id; }
  } catch (e) { console.error(e); container.innerHTML = "<p class='muted'>Erro.</p>"; }
}

async function enviarAvaliacaoUltimo() {
  const areaAvaliacao = document.getElementById("areaAvaliacao");
  const registroId = areaAvaliacao ? areaAvaliacao.dataset.registroId : null;
  const nota = Number(document.getElementById("notaInput").value);
  const feedback = document.getElementById("feedbackUltimo").value.trim();
  const status = document.getElementById("statusAvaliacao");
  status.style.display = "none";
  
  if (!registroId || isNaN(nota) || nota < 0 || nota > 10 || !feedback || !usuarioAtual) {
    status.textContent = "⚠️ Preecha todos os campos corretamente.";
    status.className = "status-msg erro show";
    status.style.display = "block";
    return;
  }
  
  status.textContent = "Enviando...";
  status.className = "status-msg show";
  status.style.display = "block";
  
  try {
    await addDoc(collection(db, "registros_turma", registroId, "avaliacoes"), { uid: usuarioAtual.uid, nome: usuarioAtual.email, nota, feedback, data: new Date() });
    status.textContent = "✅ Avaliação enviada!";
    status.className = "status-msg sucesso show";
    document.getElementById("notaInput").value = "";
    document.getElementById("feedbackUltimo").value = "";
    setTimeout(() => carregarUltimoRegistro(), 1000);
  } catch (e) { console.error(e); status.textContent = "❌ Erro."; status.className = "status-msg erro show"; }
}

document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btnEnviarRegistro") enviarRegistroTurma();
  if (e.target && e.target.id === "btnEnviarAvaliacao") enviarAvaliacaoUltimo();
});

// ===== NAVEGAÇÃO =====
window.mudarPagina = function(pagina) {
  document.querySelectorAll(".pagina").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(el => el.classList.remove("active"));
  const paginaEl = document.getElementById(pagina);
  if (paginaEl) paginaEl.classList.add("active");
  if (event && event.target) event.target.classList.add("active");
  
  if (pagina === "dashboard") carregarSensores();
  if (pagina === "cursos") carregarCursos();
  if (pagina === "avisos") carregarAvisos();
  if (pagina === "atividades") carregarAtividades();
  if (pagina === "registros") carregarUltimoRegistro();
  if (pagina === "projeto") carregarProjeto();
}

window.addEventListener("load", () => {
  if (usuarioAtual) {
    carregarSensores();
    carregarCursos();
    carregarProjeto();
  }
});