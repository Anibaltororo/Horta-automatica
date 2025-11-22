import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrd7l_TwnRddpcK0eMDVeiYX9ynxbQsJ8",
  authDomain: "horta-automatica.firebaseapp.com",
  projectId: "horta-automatica",
  storageBucket: "horta-automatica.firebasestorage.app",
  messagingSenderId: "177154489173",
  appId: "1:177154489173:web:8e223df0bc0715525c4ddc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function gerarDados() {
  return {
    temperatura: (20 + Math.random() * 10).toFixed(1),
    umidade: (40 + Math.random() * 30).toFixed(0),
    luminosidade: (300 + Math.random() * 200).toFixed(0)
  };
}

async function atualizarDados() {
  const dados = gerarDados();

  document.getElementById("temperatura").textContent = dados.temperatura + " °C";
  document.getElementById("umidade").textContent = dados.umidade + " %";
  document.getElementById("luminosidade").textContent = dados.luminosidade + " lx";

  try {
    await addDoc(collection(db, "leituras"), dados);
    console.log("Dados salvos:", dados);
  } catch (erro) {
    console.error("Erro ao enviar dados:", erro);
  }
}

setInterval(atualizarDados, 3000);
atualizarDados();
