// Importar Firebase direto da CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuração
const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.firebasestorage.app",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para gerar dados simulados
function gerarDados() {
  return {
    temperatura: (20 + Math.random() * 10).toFixed(1),
    umidade: (40 + Math.random() * 30).toFixed(0),
    luminosidade: (300 + Math.random() * 200).toFixed(0)
  };
}

// Atualizar interface + salvar no Firebase
async function atualizarDados() {
  const dados = gerarDados();

  // Atualizar interface
  document.getElementById("temperatura").textContent = dados.temperatura + " °C";
  document.getElementById("umidade").textContent = dados.umidade + " %";
  document.getElementById("luminosidade").textContent = dados.luminosidade + " lx";

  try {
    await addDoc(collection(db, "leituras"), dados);
    console.log("Dados salvos no Firestore:", dados);
  } catch (erro) {
    console.error("Erro ao enviar dados:", erro);
  }
}

// Atualizar a cada 3 segundos
setInterval(atualizarDados, 3000);

// Atualizar imediatamente ao abrir o site
atualizarDados();
