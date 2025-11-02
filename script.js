// Importar os módulos do Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.firebasestorage.app",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

// Inicializar Firebase e banco de dados Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para gerar e salvar dados simulados
async function atualizarDados() {
  const temperatura = (20 + Math.random() * 10).toFixed(1);
  const umidade = (40 + Math.random() * 30).toFixed(0);
  const luminosidade = (300 + Math.random() * 200).toFixed(0);

  // Exibir na tela
  document.getElementById("temperatura").textContent = `${temperatura} °C`;
  document.getElementById("umidade").textContent = `${umidade} %`;
  document.getElementById("luminosidade").textContent = `${luminosidade} lx`;

  // Enviar pro Firestore
  try {
    await addDoc(collection(db, "leituras"), {
      temperatura: parseFloat(temperatura),
      umidade: parseFloat(umidade),
      luminosidade: parseFloat(luminosidade),
      data: new Date().toISOString()
    });
    console.log("✅ Dado enviado para o Firebase!");
  } catch (e) {
    console.error("❌ Erro ao salvar:", e);
  }
}

// Atualizar a cada 5 segundos
setInterval(atualizarDados, 5000);
