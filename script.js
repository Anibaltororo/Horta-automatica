// Importando as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuração do teu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.firebasestorage.app",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

// Inicializa o Firebase e o Firestore (banco de dados)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Importar os módulos direto da CDN (sem precisar de build)
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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exemplo: adicionar dado
async function salvarDado() {
  try {
    await addDoc(collection(db, "leituras"), {
      umidade: 45,
      temperatura: 23
    });
    console.log("Dado enviado!");
  } catch (e) {
    console.error("Erro ao salvar:", e);
  }
}

salvarDado();


salvarDado();
  console.log(`Dados enviados → T:${temperatura}°C | U:${umidade}% | L:${luminosidade}lux`);


// Função para mostrar as leituras mais recentes
async function mostrarLeituras() {
  const querySnapshot = await getDocs(collection(db, "leituras"));
  let dados = "";
  querySnapshot.forEach((doc) => {
    const leitura = doc.data();
    dados += `<li>🌡️ ${leitura.temperatura}°C | 💧 ${leitura.umidade}% | ☀️ ${leitura.luminosidade} lux</li>`;
  });
  document.getElementById("leituras").innerHTML = dados;
}

// Atualiza e mostra os dados a cada 10 segundos
setInterval(() => {
  atualizarDados();
  mostrarLeituras();
}, 10000);

mostrarLeituras(); // Mostra ao carregar a página
