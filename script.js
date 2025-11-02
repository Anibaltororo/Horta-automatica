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

// Função para simular dados da horta (sensor)
async function atualizarDados() {
  const temp = (20 + Math.random() * 10).toFixed(1);
  const umid = (40 + Math.random() * 30).toFixed(0);
  const luz = (300 + Math.random() * 200).toFixed(0);

  await addDoc(collection(db, "leituras"), {
    temperatura: Number(temp),
    umidade: Number(umid),
    luminosidade: Number(luz),
    data: new Date()
  });

  console.log(`Dados enviados → T:${temp}°C | U:${umid}% | L:${luz}lux`);
}

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
