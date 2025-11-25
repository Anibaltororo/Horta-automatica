
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, orderBy, query
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.appspot.com",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

// inicializa apenas se necessário
if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

const btnEnviar = document.getElementById("btnEnviar");
const turmaEl = document.getElementById("turma");
const feedbackEl = document.getElementById("feedback");
const funcaoEl = document.getElementById("funcao");
const listaEl = document.getElementById("lista");
const avisosList = document.getElementById("avisosList");
const statusMsg = document.getElementById("statusMsg");

if (btnEnviar) {
  btnEnviar.addEventListener("click", async () => {
    const turma = turmaEl.value.trim();
    const feedback = feedbackEl.value.trim();
    const funcao = funcaoEl.value.trim();
    if (!turma || !feedback) {
      statusMsg.textContent = "Informe turma e descrição.";
      return;
    }
    statusMsg.textContent = "Salvando...";
    try {
      await addDoc(collection(db, "feedbacks"), {
        turma, feedback, funcao, data: new Date()
      });
      turmaEl.value = "";
      feedbackEl.value = "";
      funcaoEl.value = "";
      statusMsg.textContent = "Registro salvo.";
      carregarRegistros();
    } catch (e) {
      console.error(e);
      statusMsg.textContent = "Erro ao salvar.";
    }
    setTimeout(()=> statusMsg.textContent="", 2500);
  });
}

function formatDate(ts){
  if(!ts) return "";
  try{
    if (typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts && ts.seconds && typeof ts.toMillis === "function") return new Date(ts.toMillis()).toLocaleString();
    return new Date(ts).toLocaleString();
  }catch{ return ""; }
}

export async function carregarRegistros(){
  if (!listaEl) return;
  listaEl.innerHTML = "<p class='muted'>Carregando registros...</p>";
  try{
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
        <b>${f.turma || "Turma não informada"}</b>
        <div class="meta">${formatDate(f.data)} • ${f.funcao || ""}</div>
        <div>${(f.feedback||"").replace(/\n/g,'<br>')}</div>
      `;
      listaEl.appendChild(item);
    });
  }catch(e){
    console.error(e);
    listaEl.innerHTML = "<p class='muted'>Erro ao carregar registros.</p>";
  }
}

export async function carregarAvisos(){
  if (!avisosList) return;
  avisosList.innerHTML = "<p class='muted'>Carregando avisos...</p>";
  try{
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
        <div style="margin-top:6px">${(a.msg||"").replace(/\n/g,'<br>')}</div>
      `;
      avisosList.appendChild(node);
    });
  }catch(e){
    console.error(e);
    avisosList.innerHTML = "<p class='muted'>Erro ao carregar avisos.</p>";
  }
}

// carregar ao abrir
carregarRegistros();
carregarAvisos();