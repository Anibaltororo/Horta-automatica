import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

// ===== CARREGAR CURSOS =====
async function carregarCursos() {
  const listaCursos = document.getElementById("listaCursos");
  if (!listaCursos) return;
  
  listaCursos.innerHTML = "<p class='muted'>Carregando cursos...</p>";
  
  try {
    const snap = await getDocs(collection(db, "cursos"));
    listaCursos.innerHTML = "";
    
    if (snap.empty) {
      listaCursos.innerHTML = "<p class='muted'>Nenhum curso disponível no momento.</p>";
      return;
    }

    snap.forEach(doc => {
      const curso = doc.data();
      const cursoId = doc.id;
      
      const div = document.createElement("div");
      div.className = "curso-item";
      div.style.cssText = `
        background: linear-gradient(135deg, #f9fdf8 0%, #f0fdf4 100%);
        padding: 20px;
        border-radius: 10px;
        border-left: 4px solid #2e8b57;
        margin-bottom: 16px;
        transition: all 0.3s;
      `;
      
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #1b5e20; font-size: 18px;">📚 ${curso.titulo || "Sem título"}</h3>
            <p style="margin: 6px 0; color: #666;"><strong>👨‍🏫 Instrutor:</strong> ${curso.instrutor || "Não especificado"}</p>
            <p style="margin: 6px 0; color: #666;"><strong>📝 Descrição:</strong> ${(curso.descricao || "").replace(/\n/g, "<br>")}</p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
              <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;">
                <strong style="color: #1b5e20;">⏱️ Duração</strong>
                <div style="color: #666;">${curso.duracao || "-"}</div>
              </div>
              <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;">
                <strong style="color: #1b5e20;">📊 Nível</strong>
                <div style="color: #666;">${curso.nivel || "-"}</div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn-primary" onclick="inscreverCurso('${cursoId}', '${curso.titulo}')" style="margin-top: 12px; width: 100%;">✅ Inscrever-se</button>
      `;
      
      listaCursos.appendChild(div);
    });
  } catch (e) {
    console.error("Erro ao carregar cursos:", e);
    listaCursos.innerHTML = "<p class='muted'>❌ Erro ao carregar cursos.</p>";
  }
}

// ===== INSCREVER EM CURSO =====
window.inscreverCurso = async function(cursoId, nomeCurso) {
  const user = auth.currentUser;
  if (!user) {
    alert("❌ Você precisa estar logado!");
    return;
  }

  try {
    // Aqui você pode guardar a inscrição no Firebase se desejar
    alert(`✅ Você se inscreveu em "${nomeCurso}"!`);
    console.log(`Aluno ${user.uid} inscrito no curso ${cursoId}`);
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao inscrever.");
  }
}

// ===== CARREGAR PROJETO =====
async function carregarProjeto() {
  try {
    const snap = await getDoc(doc(db, "projeto", "info"));
    const infoProjeto = document.getElementById("infoProjeto");
    
    if (!infoProjeto) return;
    
    if (snap.exists()) {
      const p = snap.data();
      infoProjeto.innerHTML = `
        <h3 style="color: #1b5e20; margin-top: 0; font-size: 24px;">${p.titulo || "Projeto da Horta"}</h3>
        
        <div style="margin: 20px 0; padding: 16px; background: #fff; border-radius: 8px; border-left: 4px solid #2e8b57;">
          <h4 style="color: #2e8b57; margin-top: 0;">📋 Descrição</h4>
          <p style="line-height: 1.6; color: #333;">${(p.descricao || "").replace(/\n/g, "<br>")}</p>
        </div>

        <div style="margin: 20px 0; padding: 16px; background: #fff; border-radius: 8px; border-left: 4px solid #1b5e20;">
          <h4 style="color: #1b5e20; margin-top: 0;">🎯 Objetivos</h4>
          <p style="line-height: 1.6; color: #333;">${(p.objetivos || "").replace(/\n/g, "<br>")}</p>
        </div>

        <div style="margin: 20px 0; padding: 16px; background: #fff; border-radius: 8px; border-left: 4px solid #059669;">
          <h4 style="color: #059669; margin-top: 0;">🌱 Atividades Principais</h4>
          <p style="line-height: 1.6; color: #333;">${(p.atividades || "").replace(/\n/g, "<br>")}</p>
        </div>
      `;
    } else {
      infoProjeto.innerHTML = '<p class="muted" style="text-align: center; padding: 40px;">📭 Nenhum projeto foi criado ainda pelo professor.</p>';
    }
  } catch (e) {
    console.error("Erro ao carregar projeto:", e);
  }
}

// ===== MUDAR DE PÁGINA =====
window.mudarPagina = function(pagina) {
  document.querySelectorAll(".pagina").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(el => el.classList.remove("active"));
  
  const paginaEl = document.getElementById(pagina);
  if (paginaEl) {
    paginaEl.classList.add("active");
  }
  
  if (event && event.target) {
    event.target.classList.add("active");
  }

  // Carregar dados quando mudar de página
  if (pagina === "cursos") carregarCursos();
  if (pagina === "projeto") carregarProjeto();
}

// Carregar tudo ao iniciar
carregarCursos();
carregarProjeto();